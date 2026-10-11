"""Wspólne pomocniki do plików z przepisami."""


def R(id, name, country, icon, portions, time, needs, meal, ings, steps, tip=None):
    icon = dict(zip(("dish", "badge"), icon)) if isinstance(icon, (tuple, list)) else {"dish": icon}
    return dict(id=id, name=name, country=country, icon=icon, portions=portions, time=time,
                needs=needs, meal=meal, ings=ings, steps=steps, tip=tip)


def kraj(country):
    """D(id, nazwa, ikonka, porcje, czas, sprzęt, posiłki, składniki, kroki, rada=None) dla jednego kraju."""
    def D(id, name, icon, portions, time, needs, meal, ings, steps, tip=None):
        return R(id, name, country, icon, portions, time, needs, meal, ings, steps, tip)
    return D


P = ["palnik"]          # jeden palnik wystarczy
O = ["piekarnik"]       # piekarnik albo air fryer
G = ["opiekacz|palnik"]  # grill kontaktowy albo patelnia
OBIAD = ["obiad"]
OK = ["obiad", "kolacja"]
SN = ["sniadanie"]
SNK = ["sniadanie", "kolacja"]
KOL = ["kolacja"]
