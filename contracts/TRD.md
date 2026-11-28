# TRD: NODAYSIDLE Profile Redesign

## Registry schema (`data/apps.json`)

```json
{
  "apps": [
    {
      "id": "kurek",
      "name": "Kureksistant",
      "repo": "nodaysidle/kureksistant",
      "kind": "download",
      "demo": null,
      "description": "A voice-first AI assistant daemon for Arch Linux and Hyprland.",
      "platform": "Linux",
      "privacyClass": "KEYS",
      "telemetry": false,
      "flagship": true,
      "order": 1
    }
  ]
}
```

Constraints enforced at load time: unique `id`; `privacyClass` in
`LOCAL | KEYS | PUBLIC`; `kind` in `download | web`; `telemetry` boolean; at most
one `flagship`. `demo` is a URL or null. `order` breaks ties between equal release
dates.

## External interfaces

| Endpoint | Use | Failure handling |
|---|---|---|
| `GET /users/{owner}` | `public_repos` count | warn, strip reads UNKNOWN, build unpublishable |
| `GET /repos/{repo}/releases/latest` | version, date, release URL | 404 -> site fallback; error -> UNKNOWN |
| Apps site `data/apps.json` | web launch dates, fallback versions | warn, web rows UNKNOWN |
| Demo URL HEAD, then GET | LIVE / UNKNOWN | both fail -> UNKNOWN |

Day arithmetic uses Europe/Ljubljana day keys (`Intl.DateTimeFormat('en-CA')`),
matching the apps site. Gaps are whole days between day keys, not milliseconds.

## Output grammar

README.md is assembled top to bottom: comment header, drum `<picture>`,
flagship section with loupe `<picture>`, ledger table, privacy table, method
chain, repository index in `<details>`, footer. Each `<picture>` has one
`<source media="(prefers-color-scheme: light)">` for the light file and an
`<img width="100%">` for the dark file. Ledger columns: App, Version, Released,
Gap (days, right-aligned), Platform, Demo. The App cell carries the dormant tag;
the Version cell links to the release when the source is the API; the Demo cell
is LIVE (linked to the demo), UNKNOWN (HTTP n), or a dash. Privacy columns:
Class, App (with code link), What it does, What leaves your machine. Cells
escape pipes. Repository names and descriptions from the API go through
`escapeText` in `scripts/markdown.mjs`. Prose paragraphs are single lines, so
GitHub's README renderer and its comment-style `gfm` renderer agree. The footer
uses Markdown links: an HTML anchor around an address gets a second, empty
anchor from GitHub's autolinker.

## Design tokens

Two palettes with the same tokens (`PALETTES` in `scripts/svg.mjs`). The light
palette keeps every label at a contrast of at least 4.5:1 on its white
background and on the #F6F8FA panel surface.

| Token | Dark | Light | Use |
|---|---|---|---|
| Background | #0B0C0E | #FFFFFF | Page band |
| Surface | #131519 | #F6F8FA | Panels |
| Hairline | #23262B | #D1D9E0 | 1px rules |
| Text primary | #E7E4DD | #1F2328 | Headings, values |
| Text secondary | #9AA0A8 | #59636E | Labels |
| Text muted | #6B7076 | #656D76 | Metadata |
| Signal | #B5E853 | #4A7F12 | Stylus (today) and verified-live markers |
| LOCAL | #B5E853 | #4A7F12 | Class tick |
| KEYS | #E0B458 | #9A6700 | Class tick |
| PUBLIC | #7FA8C9 | #2F6A9A | Class tick |
| Grid | #15181B | #EFF2F5 | Chart paper, one square per day |
| Dormant | #E05A47 | #CF222E | 60-day line, dormant zone, dormant labels |
| Sprocket | #050607 | #D1D9E0 | Drum sprocket holes |

Type: IBM Plex Sans 500 for labels, IBM Plex Mono 400 for data, Barlow Semi
Condensed 600 for the wordmark and channel names (`assets/fonts/barlow-semi-condensed-600.ttf`,
SIL OFL). All text is outlined to paths at build (`opentype.js`), 8 px spacing
grid. Minimum label size in the drum and loupe is 13 px. Radius 0 on every
rectangle; circles are allowed only for the stylus and the live-demo ring. Two
subtle CSS animations inside the SVG are allowed (the stylus pulse and the live
ring), both disabled under `prefers-reduced-motion`. Signal color is used for the
stylus (today) and verified-live markers only; never as fill decoration. No
gradients, no glows, no rounded rectangles, no iconography inside cards, no accent
colors beyond the tokens.

## Assets

Every asset below is written twice: `<name>.svg` in the dark palette and
`<name>-light.svg` in the light palette.

- `assets/drum.svg`: generated strip-chart recorder (840 px base canvas width;
  replaces retired `assets/header.svg` and `assets/status.svg`). Chart window is
  `max(70, ceil((maxGap + 4) / 10) * 10)` days; minimum label size 13 px. Channel
  names drop the studio-name prefix, since the wordmark sits directly above.
- `assets/flagship.svg`: generated flagship loupe (840 px base canvas width), a
  magnified strip of the flagship app's own channel with window `max(14, gap + 2)`
  days; minimum label size 13 px.

Retired in PR 5: `assets/cards/<id>.svg` (the selected-work grid repeated the
ledger) and `assets/method.svg` (replaced by linked Markdown).

All SVGs are self-contained: text outlined to paths at build, no `<text>`, no
scripts, no external references, camo-proxy safe.

## CI

Node 22, `npm ci`, `node scripts/build.mjs`, `GITHUB_TOKEN` from secrets.
Commit step stages
`README.md assets/drum.svg assets/drum-light.svg assets/flagship.svg assets/flagship-light.svg`,
commits on diff with `[skip ci]`, rebases on main before push. The push trigger
covers `data/**`, `scripts/**`, `package.json`, `package-lock.json`,
`assets/fonts/**`.
