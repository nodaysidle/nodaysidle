# Profile README

`README.md` and the images in `assets/` are generated. Don't edit them by hand.

## Where the content comes from

The apps come from the official site, [nodaysidle-apps.vercel.app](https://nodaysidle-apps.vercel.app):
its `data/apps.json` in [nodaysidle/nodaysidle-apps](https://github.com/nodaysidle/nodaysidle-apps).
To add or change an app, change it there. This repo picks it up on the next build.

An app appears only once its `showFrom` time has passed, in the same order as on the
site, so an unreleased app never shows up here early. The headline count
("Ten apps shipped.") and the platform line follow the same rules as the site.

`data/profile.json` holds the few profile-level values: the site URL, the data and
asset sources, the GitHub link and the contact address.

`data/privacy.json` holds one verified privacy line per app id. A new app without a line shows "See the repo." and the build prints a warning, so add its line before launch.

To change the hero, update `hero` in `data/profile.json` and replace `assets/hero-footage.gif`.

## Build

```bash
npm run build
```

Offline, or to preview a future date:

```bash
APPS_FILE=../nodaysidle-apps/data/apps.json ASSETS_DIR=../nodaysidle-apps/public \
  NOW=2026-10-21T17:31:00+02:00 node scripts/build.mjs
```

## Output

| File | What it is |
|---|---|
| `assets/hero.svg` | "Lights out" band: five start lights that go out once, and the headline |
| `assets/apps/<id>.svg` | One timing tower row per released app: position, icon, name, version, platforms and gap |
| `assets/calendar.svg` | Ship calendar across the release dates |
| `assets/flow.svg` | One idea to five contracts to release |
| `README.md` | Hero, tower, calendar, flow, and a table of what each app does and sends |

The images embed the site's fonts (Saira Condensed, IBM Plex; licences in
`assets/fonts/`) and icons, so they render the same on GitHub in light and dark mode.

## Automation

`.github/workflows/daily-refresh.yml` rebuilds daily at 04:00 UTC and again just after
the 17:30 Europe/Ljubljana launch slot, and on pushes that change the data, script or
fonts. It commits only when the output changed.
