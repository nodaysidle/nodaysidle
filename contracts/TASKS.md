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

- [x] `assets/header.svg`: wordmark band with the studio line, hand-built once,
      fonts outlined to paths.
- [x] `assets/status.svg`: status strip as a generated SVG; the Markdown strip
      is replaced by the image.
- [x] `assets/flagship.svg`: Kureksistant terminal panel; build injects version,
      date, gap; KEYS class tick with legend.
- [x] `assets/cards/<id>.svg`: selected work grid, 6 to 8 cards, strict card
      anatomy (name, one-line description, platform, class tick, generated
      version and date, hairline border, sharp corners).
- [x] `assets/method.svg`: five numbered boards 01 to 05 plus AGENTS.md.
- [x] Build gains an SVG generation step using the TRD tokens; fonts outlined via
      opentype.js; no external references.
- Verification: pixel-compare rendered SVGs at two widths; check light and dark
  GitHub rendering; confirm every number in the SVGs comes from the same pipeline
  as the tables.

## PR 3: Retire the old design

- [x] Delete `assets/hero.svg`, `assets/hero-footage.gif`, `assets/calendar.svg`,
      `assets/flow.svg`, `assets/apps/` tower rows and their fonts.
- [x] Remove the `hero`, `live`, and `tryNow` keys from any leftover profile data
      if still present.
- [x] Remove the retired Saira Condensed font files; keep only what PR 2 uses.
- [x] Delete the stale `nds/profile-lead-apps` branch after confirming nothing
      on it is wanted.
- Verification: repository contains no unreferenced assets; README renders with
  zero broken images; `grep` finds no reference to retired files.

## PR 4: The Idle Drum

- [x] `assets/drum.svg`: generated 840 px strip-chart recorder replacing
      `assets/header.svg` and `assets/status.svg` (masthead with wordmark, studio
      line, build-date and scale log stamp; four counters; day-grid chart with
      window `max(70, ceil((maxGap + 4) / 10) * 10)`, 60-day dormant line, CH-00
      release trace with longest-flat bracket, CH-T telemetry channel, per-app
      channels with class colors, live-demo rings, and dashed UNKNOWN pen lifts,
      plus legend).
- [x] `assets/flagship.svg`: 840 px flagship loupe (window `max(14, gap + 2)`
      days) showing name, version, release date, privacy class, and legend.
- [x] README wiring: `scripts/build.mjs` opens with `assets/drum.svg`, removes
      `header.svg` and `status.svg` references, and updates the flagship alt text.
- [x] Workflow staging: `.github/workflows/daily-refresh.yml` stages
      `README.md assets/drum.svg assets/flagship.svg assets/method.svg assets/cards/`
      and drops `assets/header.svg` and `assets/status.svg`.
- [x] Contracts: update `contracts/` (`PRD.md`, `TRD.md`, `ARD.md`, `TASKS.md`,
      `AGENTS.md`) to match The Idle Drum.
- Verification: `npm test` (SVG edge cases: no rows, UNKNOWN gaps, widened
  window) passes; two `NOW`-frozen builds are byte-identical; rendered drum checked
  at 830 px and 360 px wide; live check at 1280 px and in GitHub mobile before
  merge.
- Result (2026-11-27): merged as pull request #7. `npm test` passed; two frozen
  builds were byte-identical; the drum was rendered and inspected at 830 px and
  360 px. The owner checked the branch page on GitHub on desktop and on the
  phone and confirmed it before the merge. The Actions run on `main` passed and
  found no changes to commit.

## PR 5: Light and dark, fewer sections

- [x] `scripts/svg.mjs`: `PALETTES.dark` (the existing tokens) and
      `PALETTES.light`; drum and loupe written in both; README uses `<picture>`
      with the dark file as the fallback `<img>`.
- [x] Retire the selected-work cards (they repeated the ledger) and
      `assets/method.svg` (six labelled boxes); the method becomes a linked
      Markdown chain to `contracts/`.
- [x] Merge the privacy matrix and the detail table into one class-grouped table
      with generated class counts; drop the Class column from the ledger.
- [x] Repository index: every public repository from the GitHub API in a
      collapsed `<details>`, descriptions escaped as untrusted text, UNKNOWN when
      the API fails.
- [x] Footer links as Markdown (GitHub's autolinker added an empty anchor to the
      HTML mailto link); prose paragraphs on single lines.
- [x] Workflow staging: the commit step stages the four generated SVGs instead
      of the retired `method.svg` and `cards/`. Schedule, permissions and push
      behaviour unchanged.
- [x] Review fixes: drum labels never cross the 60-day line or the chart edge
      (placement rule in TRD, asserted over a gap sweep); steady live-demo ring
      under the pulse; repository index retried 3 times, then the build refuses;
      "1 fork" pluralisation and plainer index summary; unused `levele` privacy
      line removed; workflow stages `'assets/*.svg'`; ledger dates use U+2011.
- Verification: `npm test` checks both palettes, palette purity, hostile
  repository descriptions and the index's UNKNOWN and count-mismatch states. The
  dark SVGs matched PR 4's output byte for byte before the label fixes, which
  change the drum on purpose. GitHub's
  Markdown API render checked in light and dark. Live check at 1280 px and in
  GitHub mobile: UNKNOWN until the branch is pushed and the owner checks it.

## Standing verification for every PR

- Build runs clean from a fresh clone after `npm ci` (`opentype.js` for font
  outlining).
- `NOW`-frozen build is byte-identical across two runs except the build date.
- The Actions run on the branch passes and commits nothing on refusal.
- The rendered page is checked at 1280 px and in GitHub mobile before merge.
