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

## Output grammar (PR 1, Markdown only)

README.md is assembled top to bottom: comment header, wordmark heading, tagline,
status strip as inline code, flagship terminal block, ledger table, method strip,
privacy matrix, detail table, footer. Ledger columns: App, Version, Released,
Gap (days), Platform, Demo, Class. The App cell carries the dormant tag; the
Version cell links to the release when the source is the API; the Demo cell is
LIVE, UNKNOWN (HTTP n), or a dash. Cells escape pipes.

## Design tokens (SVG phase, PR 2)

| Token | Hex | Use |
|---|---|---|
| Background | #0B0C0E | Page band |
| Surface | #131519 | Panels |
| Hairline | #23262B | 1px rules |
| Text primary | #E7E4DD | Headings, values |
| Text secondary | #9AA0A8 | Labels |
| Text muted | #6B7076 | Metadata |
| Signal | #B5E853 | Verified-live markers only |
| LOCAL | #B5E853 | Class tick |
| KEYS | #E0B458 | Class tick |
| PUBLIC | #7FA8C9 | Class tick |

Type: IBM Plex Sans 500 for labels, IBM Plex Mono 400/500 for data, outlined to
paths at build (opentype.js), 8 px spacing grid, radius 0, no gradients, no glows.
The signal color appears only on verified-live markers; never as fill decoration.

## Assets (PR 2)

`assets/header.svg` (wordmark band, hand-built once), `assets/status.svg`
(generated counters), `assets/flagship.svg` (Kureksistant terminal panel, version
injected at build), `assets/cards/<id>.svg` (selected work grid, generated),
`assets/method.svg` (contract chain strip, hand-built once). All self-contained:
fonts embedded, no external references, camo-proxy safe.

## CI

Node 22, `node scripts/build.mjs`, `GITHUB_TOKEN` from secrets. Commit step stages
`README.md` only, commits on diff with `[skip ci]`, rebases on main before push.
The push trigger covers `data/**`, `scripts/**`, `package.json`.
