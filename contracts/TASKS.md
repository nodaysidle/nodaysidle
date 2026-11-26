# TASKS: NODAYSIDLE Profile Redesign

Each pull request is independently verifiable against the PRD acceptance criteria.
A task is done only when its verification step passes live; otherwise it is UNKNOWN.

## PR 1: Deterministic core (this pull request)

- [x] Registry `data/apps.json`: 11 apps, human fields only, one flagship.
- [x] `scripts/build.mjs` v2: GitHub Releases primary, site fallback, UNKNOWN
      policy, gap computation, dormant tags, demo probes, refusal guard.
- [x] Workflow: `GITHUB_TOKEN` passed, stages `README.md` only, fails on refusal.
- [x] `USAGE.md` documents sources, overrides, and the refusal rule.
- [x] Contracts (this chain) committed under `contracts/`.
- Verification: local run against live API on 2026-11-26 produced correct values
  (71 repos, browser v0.4.0, Kureksistant v0.2.5); offline run degrades to
  UNKNOWN; offline without `ALLOW_UNKNOWN` exits 1; two frozen-clock builds are
  byte-identical; the committed README was regenerated through the script from
  the same verified API responses. GitHub rendering: UNKNOWN until this pull
  request is opened and the Actions run passes.

## PR 2: Generated SVG layer

- [ ] `assets/header.svg`: wordmark band with the studio line, hand-built once,
      fonts outlined to paths.
- [ ] `assets/status.svg`: status strip as a generated SVG; the Markdown strip
      is replaced by the image.
- [ ] `assets/flagship.svg`: Kureksistant terminal panel; build injects version,
      date, gap; KEYS class tick with legend.
- [ ] `assets/cards/<id>.svg`: selected work grid, 6 to 8 cards, strict card
      anatomy (name, one-line description, platform, class tick, generated
      version and date, hairline border, sharp corners).
- [ ] `assets/method.svg`: five numbered boards 01 to 05 plus AGENTS.md.
- [ ] Build gains an SVG generation step using the TRD tokens; fonts outlined via
      opentype.js; no external references.
- Verification: pixel-compare rendered SVGs at two widths; check light and dark
  GitHub rendering; confirm every number in the SVGs comes from the same pipeline
  as the tables.

## PR 3: Retire the old design

- [ ] Delete `assets/hero.svg`, `assets/hero-footage.gif`, `assets/calendar.svg`,
      `assets/flow.svg`, `assets/apps/` tower rows and their fonts.
- [ ] Remove the `hero`, `live`, and `tryNow` keys from any leftover profile data
      if still present.
- [ ] Remove the retired Saira Condensed font files; keep only what PR 2 uses.
- [ ] Delete the stale `nds/profile-lead-apps` branch after confirming nothing
      on it is wanted.
- Verification: repository contains no unreferenced assets; README renders with
  zero broken images; `grep` finds no reference to retired files.

## Standing verification for every PR

- Build runs clean from a fresh clone: `npm install` is not required (no deps).
- `NOW`-frozen build is byte-identical across two runs except the build date.
- The Actions run on the branch passes and commits nothing on refusal.
- The rendered page is checked at 1280 px and in GitHub mobile before merge.
