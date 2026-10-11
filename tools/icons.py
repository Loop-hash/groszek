"""Generuje ikony aplikacji i ekran startowy z pikselowego Groszka."""
import os
import sys
from PIL import Image

PEA = [
    '........................',
    '.............###........',
    '............#ooo#.......',
    '...........##oo#........',
    '...........#.##.........',
    '...........#............',
    '.........######.........',
    '.......##oooooo##.......',
    '......#oooooooooo#......',
    '.....#oooooooooooo#.....',
    '.....#oooooooooooo#.....',
    '....#oooo#oooo#oooo#....',
    '....#oooo#oooo#oooo#....',
    '....#oooooooooooooo#....',
    '....#oooooooooooooo#....',
    '....#oooo#oooo#ooo##....',
    '....#ooooo####ooo#o#....',
    '.....#oooooooooo#o#.....',
    '.....#ooooooooo#o##.....',
    '......#ooooooo#o##......',
    '.......##oooo#o##.......',
    '.........######.........',
    '.........#....#.........',
    '........##....##........',
]
INK = (20, 20, 20, 255)
PAPER = (250, 250, 247, 255)


def sprite(scale, transparent_bg=True):
    w, h = len(PEA[0]), len(PEA)
    img = Image.new('RGBA', (w * scale, h * scale), (0, 0, 0, 0) if transparent_bg else PAPER)
    px = img.load()
    for y, row in enumerate(PEA):
        for x, ch in enumerate(row):
            col = INK if ch == '#' else PAPER if ch == 'o' else None
            if col is None:
                continue
            for dy in range(scale):
                for dx in range(scale):
                    px[x * scale + dx, y * scale + dy] = col
    return img


def canvas(size, fraction, round_mask=False):
    img = Image.new('RGBA', (size, size), PAPER)
    scale = max(1, int(size * fraction / 24))
    s = sprite(scale)
    off = ((size - s.width) // 2, (size - s.height) // 2)
    img.alpha_composite(s, off)
    if round_mask:
        mask = Image.new('L', (size, size), 0)
        from PIL import ImageDraw
        ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
        out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        out.paste(img, (0, 0), mask)
        return out
    return img


def main(res):
    dens = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
    for d, f in dens.items():
        folder = os.path.join(res, 'mipmap-' + d)
        os.makedirs(folder, exist_ok=True)
        legacy = int(48 * f)
        canvas(legacy, 0.75).save(os.path.join(folder, 'ic_launcher.png'))
        canvas(legacy, 0.7, round_mask=True).save(os.path.join(folder, 'ic_launcher_round.png'))
        fg = int(108 * f)
        img = Image.new('RGBA', (fg, fg), (0, 0, 0, 0))
        s = sprite(max(1, int(fg * 0.5 / 24)))
        img.alpha_composite(s, ((fg - s.width) // 2, (fg - s.height) // 2))
        img.save(os.path.join(folder, 'ic_launcher_foreground.png'))
    # ekrany startowe: zachowaj rozmiary plików z szablonu
    for name in os.listdir(res):
        if not name.startswith('drawable'):
            continue
        path = os.path.join(res, name, 'splash.png')
        if not os.path.exists(path):
            continue
        w, h = Image.open(path).size
        img = Image.new('RGBA', (w, h), PAPER)
        s = sprite(max(1, int(min(w, h) * 0.32 / 24)))
        img.alpha_composite(s, ((w - s.width) // 2, (h - s.height) // 2))
        img.convert('RGB').save(path)
    with open(os.path.join(res, 'values', 'ic_launcher_background.xml'), 'w') as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
                '    <color name="ic_launcher_background">#FAFAF7</color>\n</resources>\n')


if __name__ == '__main__':
    main(sys.argv[1])
