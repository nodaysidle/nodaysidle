# ARD: NODAYSIDLE Profile Redesign

## Components

```
data/apps.json      registry, human-maintained facts only
data/privacy.json   one verified privacy line per app id
data/profile.json   site URL, GitHub link, contact address
scripts/build.mjs   deterministic generator: fetch, compute, write README.md and SVGs
scripts/svg.mjs     SVG renderer (drum, flagship loupe, cards, method; opentype.js)
scripts/dates.mjs   shared Europe/Ljubljana day-key arithmetic for build and SVGs
.github/workflows/  daily rebuild, commit only on change, fail on degraded build
contracts/          this Cascade chain (IDEA, PRD, ARD, TRD, TASKS, AGENTS.md)
assets/             generated SVGs (drum, flagship, method, cards) and bundled fonts
```

## Data flow

```
registry ──┐
privacy ───┤
profile ───┼──> scripts/build.mjs ──────────> README.md
GitHub API ┤     ├── scripts/dates.mjs
site apps ─┘     └── scripts/svg.mjs ───────> assets/drum.svg
                                              assets/flagship.svg
                                              assets/method.svg
                                              assets/cards/<id>.svg
                                              (all committed by CI)
```

- The build fetches: the public user object (repo count), the latest release of
  every registry repo, the apps site's `data/apps.json` (web launch dates, fallback
  versions), and a HEAD/GET probe per demo URL.
- Environment overrides: `NOW` (freeze the clock), `APPS_FILE` (offline site data),
  `RELEASES_FILE` (offline releases and repo count from a fixture), `GITHUB_TOKEN`
  (rate limit), `ALLOW_UNKNOWN` (degraded preview).
- Output is `README.md` plus the generated SVG assets (`assets/drum.svg`,
  `assets/flagship.svg`, `assets/method.svg`, `assets/cards/<id>.svg`). The build
  writes them even on refusal, so the failure is inspectable, but exits non-zero
  so CI commits nothing.

## State model per app

```
source: github  -> version from Releases API, links to the release
        site    -> version from the apps site data, no release link, warning logged
        UNKNOWN -> no verifiable source, rendered as UNKNOWN
demo:   LIVE | UNKNOWN (HTTP n) | - (no demo)
gap:    days since release; null -> UNKNOWN; > 60 -> dormant tag
```

## Failure and recovery

- Registry validation errors (duplicate ids, unknown class, unknown kind, missing
  telemetry flag, two flagships) crash the build before any fetch.
- Network failures never crash the build; they produce UNKNOWN plus a warning.
- A total source failure (all versions UNKNOWN, or repo count UNKNOWN) makes the
  build unpublishable: exit 1, no commit, page still written for inspection.

## CI contract

- Schedule: daily 04:00 UTC, plus 15:35 and 16:35 UTC (after the 17:30 Ljubljana
  launch slot in summer and winter time), plus push on data, script, package, or
  font changes.
- The job passes `secrets.GITHUB_TOKEN` to the build for API rate limits.
- Commit only when the generated README or SVG assets differ; never commit when
  the build failed.
