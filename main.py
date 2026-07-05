"""
FLS Better Stats — parser danych z rozgrywki.krakow.liga-fls.pl
Użycie:
    python fls_stats.py mariusz-bednarczyk
    python fls_stats.py mariusz-bednarczyk --json
"""

import requests
import json
import re
import sys
from datetime import datetime

BASE_URL = "https://rozgrywki.krakow.liga-fls.pl"

# EventType ID → nazwa (na podstawie obserwacji)
EVENT_TYPE_NAMES = {
    "1": "Gol",
    "2": "Asysta",
    "3": "Żółta kartka",
    "4": "Czerwona kartka",
}


# ─── API ──────────────────────────────────────────────────────────────────────

def get_build_id() -> str:
    r = requests.get(BASE_URL, headers={"Accept-Language": "pl"}, timeout=10)
    match = re.search(r'"buildId":"([^"]+)"', r.text)
    if not match:
        raise RuntimeError("Nie znaleziono buildId — strona mogła się zmienić")
    return match.group(1)


def fetch_player(slug: str, build_id: str) -> dict:
    url = (
        f"{BASE_URL}/_next/data/{build_id}/en/menu-ligowe/"
        f"tabela-wszech-czasow/zawodnicy/{slug}.json"
        f"?playerSlug={slug}"
    )
    r = requests.get(url, headers={"Accept": "*/*", "Referer": BASE_URL}, timeout=10)
    r.raise_for_status()
    return r.json()


# ─── Apollo cache resolver ────────────────────────────────────────────────────

def resolve(apollo: dict, ref_or_obj):
    """Rozwiń __ref do pełnego obiektu z Apollo cache."""
    if isinstance(ref_or_obj, dict) and "__ref" in ref_or_obj:
        return apollo.get(ref_or_obj["__ref"], {})
    return ref_or_obj


# ─── Parser ───────────────────────────────────────────────────────────────────

def parse_player(data: dict) -> dict:
    apollo = data["pageProps"]["__APOLLO_STATE__"]

    # Znajdź gracza
    player_key = next(k for k in apollo if k.startswith("Player:"))
    p = apollo[player_key]

    # Statystyki ogółem
    summary = {
        "imie_nazwisko": f"{p['first_name']} {p['last_name']}",
        "data_urodzenia": p.get("date_of_birth"),
        "mecze": p.get("gamesPlayed", 0),
        "gole": p.get("goalsScored", 0),
        "asysty": p.get("assists", 0),
        "mvp": p.get("mvp", 0),
        "zolte_kartki": p.get("yellowCards", 0),
        "czerwone_kartki": p.get("redCards", 0),
        "avatar": p.get("avatar", {}).get("url") if p.get("avatar") else None,
    }

    # Statystyki per sezon (all_competition_players)
    seasons = []
    for cp_ref in p.get("all_competition_players", []):
        cp = resolve(apollo, cp_ref)
        comp = resolve(apollo, cp.get("competition", {}))
        seasons.append({
            "sezon": comp.get("name", "?"),
            "druzyna": cp.get("teamName", "?"),
            "mecze": cp.get("gamesPlayed", 0),
            "gole": cp.get("goalsScored", 0),
            "asysty": cp.get("assists", 0),
            "mvp": cp.get("mvp", 0),
            "zolte_kartki": cp.get("yellowCards", 0),
            "czerwone_kartki": cp.get("redCards", 0),
        })

    # Historia meczów (all_player_games)
    games = []
    for gp in p.get("all_player_games", []):
        game = resolve(apollo, gp.get("game", {}))
        events = [resolve(apollo, e) for e in gp.get("events", [])]

        event_names = []
        for ev in events:
            et_id = resolve(apollo, ev.get("event_type", {})).get("id", "?")
            event_names.append(EVENT_TYPE_NAMES.get(et_id, f"Event#{et_id}"))

        home = game.get("home_team", {}).get("competition_team", {}).get("team", {})
        away = game.get("away_team", {}).get("competition_team", {}).get("team", {})
        league = game.get("round", {}).get("competition", {}).get("league", {}).get("slug", "?")
        season = game.get("round", {}).get("competition", {}).get("season", {}).get("slug", "?")

        games.append({
            "data": game.get("game_date", "?")[:10],
            "liga": league,
            "sezon": season,
            "wynik": game.get("result", "?"),
            "gospodarz": home.get("name", "?"),
            "gosc": away.get("name", "?"),
            "boisko": game.get("pitch", {}).get("name", "?"),
            "eventy": event_names,
        })

    # Posortuj mecze od najnowszego
    games.sort(key=lambda g: g["data"], reverse=True)

    return {"summary": summary, "seasons": seasons, "games": games}


# ─── Wyświetlanie ─────────────────────────────────────────────────────────────

def print_stats(stats: dict):
    s = stats["summary"]
    print("=" * 55)
    print(f"  {s['imie_nazwisko']}")
    if s["data_urodzenia"]:
        dob = datetime.strptime(s["data_urodzenia"], "%Y-%m-%d")
        wiek = (datetime.now() - dob).days // 365
        print(f"  Wiek: {wiek} lat ({s['data_urodzenia']})")
    print("=" * 55)
    print(f"  Mecze:           {s['mecze']:>4}")
    print(f"  Gole:            {s['gole']:>4}  ({s['gole']/s['mecze']:.2f}/mecz)" if s['mecze'] else f"  Gole:            {s['gole']:>4}")
    print(f"  Asysty:          {s['asysty']:>4}")
    print(f"  G+A:             {s['gole'] + s['asysty']:>4}")
    print(f"  MVP:             {s['mvp']:>4}")
    print(f"  Żółte kartki:    {s['zolte_kartki']:>4}")
    print(f"  Czerwone kartki: {s['czerwone_kartki']:>4}")
    print()

    print("─── Statystyki per sezon ─────────────────────────────")
    print(f"  {'Sezon':<30} {'Dr':<18} {'M':>3} {'G':>3} {'A':>3} {'MVP':>3}")
    print("  " + "-" * 53)
    for row in sorted(stats["seasons"], key=lambda x: x["sezon"]):
        print(f"  {row['sezon']:<30} {row['druzyna']:<18} {row['mecze']:>3} {row['gole']:>3} {row['asysty']:>3} {row['mvp']:>3}")
    print()

    print("─── Ostatnie 10 meczów ───────────────────────────────")
    for g in stats["games"][:10]:
        eventy = ", ".join(g["eventy"]) if g["eventy"] else "—"
        print(f"  {g['data']}  {g['gospodarz']} vs {g['gosc']}")
        print(f"           Wynik: {g['wynik']} | Liga: {g['liga']} | Eventy: {eventy}")
    print()


# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    slug = sys.argv[1] if len(sys.argv) > 1 else "mariusz-bednarczyk"
    as_json = "--json" in sys.argv

    print(f"Pobieranie danych dla: {slug}...")
    build_id = get_build_id()
    raw = fetch_player(slug, build_id)
    stats = parse_player(raw)

    if as_json:
        print(json.dumps(stats, indent=2, ensure_ascii=False))
    else:
        print_stats(stats)