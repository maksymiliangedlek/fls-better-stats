# Ogniwo Bielany Stats

A single-deployment Next.js app that scrapes [FLS Kraków](https://rozgrywki.krakow.liga-fls.pl)
and serves **Ogniwo Bielany**-only stats: player profiles, form series, leaderboards, and
head-to-head comparisons. The scraper is a TypeScript port of the original `main.py`.

The frontend (React UI) is intentionally deferred — this repo currently ships the **data layer
and API**. The response shapes below are designed to be chart-ready.

## Stack

- **Next.js 15** (App Router, TypeScript) — API Route Handlers + future UI in one Vercel app
- **Scraper** in `lib/fls/` — ports `main.py` (buildId, Apollo resolver, player/team parsers)
- **Stats engine** in `lib/stats/` — form, leaderboards, team record, H2H compare
- **Cache** in `lib/cache/` — Upstash Redis in prod, filesystem `.cache/` locally (auto-selected)
- **Vercel Cron** — chunked sync (`vercel.json` → `/api/cron/sync`)

## How the data flows

```
FLS  ──scrape──▶  lib/fls  ──parse──▶  Ogniwo-filtered profiles
                                          │
                                     lib/cache (Redis / .cache)
                                          │
                              lib/stats derives cool stats
                                          │
                                   /api/* route handlers ──▶ frontend
```

### Roster discovery (fast, Ogniwo-only)

There is **no** server-side team filter on the all-time player list (~14.5k players / 726 pages).
Instead we discover the roster via BFS over Ogniwo's **season roster** endpoints:

- a season roster (`.../zespoly/ogniwo-bielany/zawodnicy.json`) reveals player slugs
- each player's games reveal the seasons Ogniwo played
- iterate to a fixpoint

Result: full roster (~36 players, 8 seasons) discovered in ~30s instead of hours.

## Local development

```bash
npm install

# Populate the local .cache/ (no Redis needed) — takes ~30s
npm run sync-local

# Start the dev server
npm run dev
# → http://localhost:3000

# Quick scraper checks
npm run fetch-player mariusz-bednarczyk       # live
npm run fetch-player -- --fixture             # offline, from fixtures/
```

## Deploying to Vercel

1. Import the repo into Vercel.
2. Add an **Upstash Redis** integration (Marketplace) — it sets
   `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
3. (Optional) set `CRON_SECRET` and `SYNC_SECRET` env vars to protect the sync endpoints.
4. Deploy. The cron in `vercel.json` runs `/api/cron/sync` every 15 min:
   - first run **discovers** the roster and caches all profiles
   - later runs refresh player profiles in chunks (`PLAYERS_PER_SYNC`)
5. Kick off the first sync immediately with `POST /api/sync` (or wait for cron).

## Configuration

`lib/fls/config.ts`:

| Constant | Default | Meaning |
|---|---|---|
| `TEAM_NAME` / `TEAM_SLUG` | `Ogniwo Bielany` / `ogniwo-bielany` | Target team |
| `CURRENT_LEAGUE` / `CURRENT_SEASON` | `liga-c` / `wiosna-2026` | Seed competition for discovery + team page |
| `PLAYERS_PER_SYNC` | `4` | Profiles refreshed per cron run |
| `STALE_AFTER_MS` | 24h | When `meta.stale` flips to `true` |

## API reference

Every successful `GET` returns `{ data, meta }` where
`meta = { fetchedAt: number | null, stale: boolean }`.

### `GET /api/team`

```jsonc
{
  "data": {
    "team": { "name", "slug", "crest", "image", "league", "season" },
    "record": {
      "played", "wins", "draws", "losses",
      "goalsFor", "goalsAgainst", "goalDifference", "points",
      "formGuide": ["W","L","W", ...]   // oldest -> newest
    },
    "rosterSize": 36,
    "topScorers": [ /* LeaderboardEntry[5] */ ],
    "recentMatches": [ /* TeamMatch[5] */ ]
  },
  "meta": { "fetchedAt": 0, "stale": false }
}
```

### `GET /api/team/matches`

```jsonc
{ "data": { "matches": [ /* TeamMatch[] */ ] }, "meta": {} }
// TeamMatch: { date, result, scoreHome, scoreAway, home, away, pitch, status }
```

### `GET /api/players?scope=all|current&sort=<key>`

`scope` = `all` (career, default) or `current` (current season only).
`sort` = `goals` | `assists` | `goalContributions` | `mvp` | `games` | `goalsPerGame` | `assistsPerGame`.

```jsonc
{
  "data": {
    "scope": "all",
    "sort": "goals",
    "players": [
      {
        "slug", "name", "avatar",
        "games", "goals", "assists", "goalContributions",
        "mvp", "yellowCards", "redCards",
        "goalsPerGame", "assistsPerGame"
      }
    ]
  },
  "meta": {}
}
```

### `GET /api/players/[slug]`

```jsonc
{
  "data": {
    "profile": {
      "slug",
      "summary": {
        "name", "dateOfBirth", "games", "goals", "assists", "mvp",
        "yellowCards", "redCards", "avatar",
        "goalsPerGame", "assistsPerGame", "goalContributions"
      },
      "seasons": [ { "season","team","games","goals","assists","mvp","yellowCards","redCards" } ],
      "games":   [ { "date","league","season","result","home","away","pitch","events":["Gol", ...] } ]
    },
    "stats": {
      "form":            [ { "date","opponent","goals","assists","ga","isHome","result" } ], // oldest->newest
      "rollingForm5":    [ { "date","avgGa" } ],
      "rollingForm10":   [ { "date","avgGa" } ],
      "cumulativeGoals": [ { "date","goals","assists" } ],
      "seasonSplits":    [ { "season","goals","assists","games" } ]
    }
  },
  "meta": {}
}
```

### `GET /api/compare?a=<slug>&b=<slug>`

```jsonc
{
  "data": {
    "players": [ { "slug","name","avatar" }, { "slug","name","avatar" } ],
    "totals": {
      // each value is a [playerA, playerB] tuple
      "games", "goals", "assists", "goalContributions", "mvp",
      "yellowCards", "redCards",
      "goalsPerGame", "assistsPerGame", "goalContributionsPerGame"
    },
    "radar": {
      "axes":   ["Gole/mecz","Asysty/mecz","G+A/mecz","MVP rate","Dyscyplina","Mecze"],
      "values": [ [aNorm, bNorm], ... ]   // normalized 0-100 per axis
    },
    "seasonOverlap": [ { "season", "a": SeasonStats, "b": SeasonStats } ],
    "sharedMatches": [ { "date","opponent","result","aEvents":[...],"bEvents":[...] } ]
  },
  "meta": {}
}
```

### Sync endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/sync` | `Authorization: Bearer $SYNC_SECRET` (if set) | Full re-discovery + cache all profiles |
| `GET` | `/api/cron/sync` | `Authorization: Bearer $CRON_SECRET` (if set) | One chunked step (discovery, then player refresh) |

## Project layout

```
app/
  api/                     # route handlers (team, players, compare, sync, cron)
  page.tsx                 # placeholder until the React UI phase
lib/
  fls/                     # scraper: client, resolver, players, teams, discovery, config, events
  stats/                   # form, leaderboards, aggregates, compare
  cache/                   # kv (Redis/FS), keys, read, sync
  types/                   # player, team, compare
scripts/
  fetch-player.ts          # CLI: fetch+parse one player
  sync-local.ts            # CLI: full sync into .cache/
fixtures/                  # committed sample responses for offline dev
main.py                    # original Python scraper (reference)
```
