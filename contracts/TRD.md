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

README.md is assembled top to bottom: comment header, drum image
(`assets/drum.svg`), flagship section with loupe (`assets/flagship.svg`), ledger
table, selected-work cards grid (`assets/cards/<id>.svg`), method strip
(`assets/method.svg`), privacy matrix, detail table, footer. Ledger columns: App,
Version, Released, Gap (days), Platform, Demo, Class. The App cell carries the
dormant tag; the Version cell links to the release when the source is the API;
the Demo cell is LIVE, UNKNOWN (HTTP n), or a dash. Cells escape pipes.

## Design tokens

| Token | Hex | Use |
|---|---|---|
| Background | #0B0C0E | Page band |
| Surface | #131519 | Panels |
| Hairline | #23262B | 1px rules |
| Text primary | #E7E4DD | Headings, values |
| Text secondary | #9AA0A8 | Labels |
| Text muted | #6B7076 | Metadata |
| Signal | #B5E853 | Stylus (today) and verified-live markers |
| LOCAL | #B5E853 | Class tick |
| KEYS | #E0B458 | Class tick |
| PUBLIC | #7FA8C9 | Class tick |
| Grid | #15181B | Chart paper, one square per day |
| Dormant | #E05A47 | 60-day line, dormant zone, dormant labels |

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

- `assets/drum.svg`: generated strip-chart recorder (840 px base canvas width;
  replaces retired `assets/header.svg` and `assets/status.svg`). Chart window is
  `max(70, ceil((maxGap + 4) / 10) * 10)` days; minimum label size 13 px. Channel
  names drop the studio-name prefix, since the wordmark sits directly above.
- `assets/flagship.svg`: generated flagship loupe (840 px base canvas width), a
  magnified strip of the flagship app's own channel with window `max(14, gap + 2)`
  days; minimum label size 13 px.
- `assets/cards/<id>.svg`: generated selected-work grid cards (560 x 232 px).
- `assets/method.svg`: generated contract chain strip (1200 x 168 px).

All SVGs are self-contained: text outlined to paths at build, no `<text>`, no
scripts, no external references, camo-proxy safe.

## CI

Node 22, `npm ci`, `node scripts/build.mjs`, `GITHUB_TOKEN` from secrets.
Commit step stages
`README.md assets/drum.svg assets/flagship.svg assets/method.svg assets/cards/`,
commits on diff with `[skip ci]`, rebases on main before push. The push trigger
covers `data/**`, `scripts/**`, `package.json`, `package-lock.json`,
`assets/fonts/**`.
