# Profile README

`README.md` is generated. Do not edit it by hand: change the registry and rebuild.

## How it works

Every number on the page is generated at build time. Nothing is hand-typed, so nothing
can go stale. Sources, in order of authority:

1. The GitHub REST API: public repository count, latest release of every repo.
2. The apps site's `data/apps.json`: launch dates for web apps, last-resort fallback.
3. `data/apps.json` in this repo: the app registry, the only human-maintained facts.
4. `data/privacy.json`: one verified privacy line per app id.
5. `data/profile.json`: site URL, GitHub link, contact address.

Anything that cannot be verified renders as UNKNOWN. It is never guessed and never
silently dropped. A release older than 60 days is tagged dormant, not deleted.

## The registry

`data/apps.json` holds one entry per shipped app. Human-maintained fields only:

| Field | Meaning |
|---|---|
| `id` | App id, matching the site's page slug |
| `name` | Display name |
| `repo` | `owner/repo`, used for the Releases API and code links |
| `kind` | `download` or `web` |
| `demo` | Live demo URL, or null |
| `description` | One line, shown in the detail table |
| `platform` | Short platform line for the ledger |
| `privacyClass` | `LOCAL`, `KEYS`, or `PUBLIC`, matching the repo README |
| `telemetry` | False unless the app has a telemetry endpoint |
| `flagship` | Optional, at most one app |
| `order` | Tie-break for equal release dates |

Everything else (versions, dates, gaps, repo count, LIVE/UNKNOWN) is derived.

## Build

```bash
npm run build
```

`npm test` runs the SVG self-check (empty data, UNKNOWN gaps, a widened chart window).

Offline, or to preview a date:

```bash
NOW=2026-12-01T06:00:00Z npm run build
```

Fully offline, with the releases and repo count served from a fixture (shape:
`{ "repos": 71, "latest": { "owner/repo": { "tag", "at", "url" } | null } }`):

```bash
RELEASES_FILE=fixture.json APPS_FILE=../nodaysidle-apps/data/apps.json npm run build
```

The build refuses to publish when every version is UNKNOWN or the repository count
failed: sources are down, so CI fails and commits nothing. Use `ALLOW_UNKNOWN=1`
for a degraded local preview.

## Automation

`.github/workflows/daily-refresh.yml` rebuilds daily at 04:00 UTC and just after the
17:30 Europe/Ljubljana launch slot, and on pushes that change the data or the script.
It commits only when the output changed, and never when the build refused.

## Contracts

The `contracts/` folder holds the Cascade chain for this redesign: IDEA, PRD, ARD,
TRD, TASKS and AGENTS.md. Agents implement the remaining pull requests from there.
