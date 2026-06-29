import requests
import json
import re

BASE_URL = "https://rozgrywki.krakow.liga-fls.pl"

def get_build_id():
    """Pobiera aktualny Next.js build ID ze strony głównej."""
    r = requests.get(BASE_URL, headers={"Accept-Language": "pl"})
    match = re.search(r'"buildId":"([^"]+)"', r.text)
    if not match:
        raise RuntimeError("Nie znaleziono buildId — struktura strony mogła się zmienić")
    return match.group(1)

def get_player_stats(player_slug: str, build_id: str) -> dict:
    url = (
        f"{BASE_URL}/_next/data/{build_id}/en/menu-ligowe/"
        f"tabela-wszech-czasow/zawodnicy/{player_slug}.json"
        f"?playerSlug={player_slug}"
    )
    r = requests.get(url, headers={"Accept": "*/*", "Referer": BASE_URL})
    r.raise_for_status()
    return r.json()

def get_team_stats(league_slug: str, season_slug: str, team_slug: str, build_id: str) -> dict:
    url = (
        f"{BASE_URL}/_next/data/{build_id}/en/league-menu/"
        f"{league_slug}/{season_slug}/teams/{team_slug}.json"
        f"?leagueSlug={league_slug}&seasonSlug={season_slug}&teamSlug={team_slug}"
    )
    r = requests.get(url, headers={"Accept": "*/*", "Referer": BASE_URL})
    r.raise_for_status()
    return r.json()


if __name__ == "__main__":
    build_id = get_build_id()
    print(f"Build ID: {build_id}")

    data = get_player_stats("mariusz-bednarczyk", build_id)
    with open('data.json', 'w') as f:
        json.dump(data, f)
    print(json.dumps(data, indent=2, ensure_ascii=False))