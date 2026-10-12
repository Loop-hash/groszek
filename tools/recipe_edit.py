"""Zmienia składniki i kroki przepisów prosto w plikach źródłowych (tools/recipes/*.py, recipes_src.py).

Używane przez poprawki z tools/audit.py. Szuka wywołania D("id", ...) przez ast i podmienia
tylko listę składników, listę kroków albo radę, resztę pliku zostawia bez zmian.
"""
import ast
import glob
import os

HERE = os.path.dirname(os.path.abspath(__file__))
FILES = [os.path.join(HERE, "recipes_src.py")] + sorted(glob.glob(os.path.join(HERE, "recipes", "*.py")))


def _calls(src):
    tree = ast.parse(src)
    out = {}
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call) or len(node.args) < 9:
            continue
        a0 = node.args[0]
        if not (isinstance(a0, ast.Constant) and isinstance(a0.value, str) and "-" in a0.value):
            continue
        # R(id, nazwa, kraj, ...) ma kraj jako trzeci argument, D(id, nazwa, ikonka, ...) nie
        shift = 1 if isinstance(node.args[2], ast.Constant) and isinstance(node.args[2].value, str) else 0
        out[a0.value] = (node, 7 + shift)
    return out


def _offsets(src):
    starts = [0]
    for line in src.splitlines(keepends=True):
        starts.append(starts[-1] + len(line))
    return lambda ln, col: starts[ln - 1] + len(src.splitlines(keepends=True)[ln - 1][:col].encode("utf-8").decode("utf-8"))


def _pos(src, node):
    lines = src.splitlines(keepends=True)
    def off(ln, col):
        # col_offset w ast to bajty UTF-8
        before = sum(len(x) for x in lines[:ln - 1])
        return before + len(lines[ln - 1].encode("utf-8")[:col].decode("utf-8"))
    return off(node.lineno, node.col_offset), off(node.end_lineno, node.end_col_offset)


def fmt_ings(ings, indent=8):
    parts = []
    for t in ings:
        parts.append("(" + ", ".join(repr(x) if not isinstance(x, str) else '"' + x + '"' for x in t) + ")")
    lines = []
    cur = ""
    for p in parts:
        piece = (", " if cur else "") + p
        if cur and len(cur) + len(piece) > 128:
            lines.append(cur + ",")
            cur = p
        else:
            cur += piece
    lines.append(cur)
    return "[\n" + "\n".join(" " * indent + l for l in lines) + "]"


def _q(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def fmt_steps(steps, indent=9):
    return "[" + (",\n" + " " * indent).join(_q(s) for s in steps) + "]"


def read(rid):
    """(ścieżka, składniki, kroki, rada) przepisu, po wyliczeniu stałych (CIASTO + [...])"""
    import importlib.util
    for path in FILES:
        src = open(path, encoding="utf-8").read()
        if rid not in _calls(src):
            continue
        spec = importlib.util.spec_from_file_location("czytaj_" + os.path.basename(path)[:-3], path)
        m = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(m)
        r = next(x for x in m.RECIPES if x["id"] == rid)
        return path, [tuple(t) for t in r["ings"]], list(r["steps"]), r.get("tip")
    raise KeyError(rid)


def apply(edits):
    """edits: {id: {"ings": [...], "steps": [...], "tip": "..."}} - podane pola zastępują stare"""
    left = dict(edits)
    for path in FILES:
        src = open(path, encoding="utf-8").read()
        calls = _calls(src)
        repl = []
        for rid in [r for r in left if r in calls]:
            node, i = calls[rid]
            e = left.pop(rid)
            if "ings" in e:
                a, b = _pos(src, node.args[i])
                repl.append((a, b, fmt_ings(e["ings"])))
            if "steps" in e:
                a, b = _pos(src, node.args[i + 1])
                repl.append((a, b, fmt_steps(e["steps"])))
            if "tip" in e:
                if len(node.args) > i + 2:
                    a, b = _pos(src, node.args[i + 2])
                    repl.append((a, b, _q(e["tip"]) if e["tip"] else "None"))
                else:
                    _, b = _pos(src, node.args[i + 1])
                    repl.append((b, b, ",\n        " + _q(e["tip"])))
        if not repl:
            continue
        for a, b, text in sorted(repl, reverse=True):
            src = src[:a] + text + src[b:]
        ast.parse(src)
        open(path, "w", encoding="utf-8").write(src)
    if left:
        raise KeyError("nie znalazłem: " + ", ".join(left))
