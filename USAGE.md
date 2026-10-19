# Profile README

`README.md` and the images in `assets/` are generated. Don't edit them by hand.

## Where the content comes from

The apps come from the official site, [nodaysidle-apps.vercel.app](https://nodaysidle-apps.vercel.app):
its `data/apps.json` in [nodaysidle/nodaysidle-apps](https://github.com/nodaysidle/nodaysidle-apps).
To add or change an app, change it there. This repo picks it up on the next build.

An app appears only once its `showFrom` time has passed, in the same order as on the
site, so an unreleased app never shows up here early. The headline count
("Six apps shipped.") and the platform line follow the same rules as the site.

`data/profile.json` holds the few profile-level values: the site URL, the data and
asset sources, the GitHub link and the contact address.

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
| `assets/hero.svg` | "Lights out" header: five start lights that go out once, the headline and the intro line |
| `assets/apps/<id>.svg` | One tile per released app: greyscale icon, name, version and date |
| `README.md` | Hero, tiles linking to each app's page, and a table with pitch, platforms and links |

The images embed the site's fonts (Saira Condensed, IBM Plex; licences in
`assets/fonts/`) and icons, so they render the same on GitHub in light and dark mode.

## Automation

`.github/workflows/daily-refresh.yml` rebuilds daily at 04:00 UTC and again just after
the 17:30 Europe/Ljubljana launch slot, and on pushes that change the data, script or
fonts. It commits only when the output changed.
