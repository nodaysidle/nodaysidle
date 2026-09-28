# GitHub Profile README System

A data-driven personal landing page designed for your GitHub profile (`github.com/<username>`), featuring dark & light mode support, deterministic generation from structured JSON, and automated daily refresh via GitHub Actions.

---

## 📁 Architecture Overview

```
GitHub-README/
├── .github/
│   └── workflows/
│       └── daily-refresh.yml      # Automated daily cron build & git commit workflow
├── assets/
│   ├── hero-dark.svg              # Dark-mode responsive vector banner
│   ├── hero-light.svg             # Light-mode responsive vector banner
│   ├── stats-card-dark.svg        # Dark-mode metrics card
│   └── stats-card-light.svg       # Light-mode metrics card
├── data/
│   └── profile.json               # Single source of truth (edit this to update everything)
├── scripts/
│   ├── generate.js                # Compiles profile.json + templates into README.md
│   └── generate-graphics.js       # Generates SVG hero banners & stats cards from profile.json
├── templates/
│   └── README.template.md         # Base markdown template with theme-aware image tags
├── package.json                   # Zero third-party npm dependencies
├── README.md                      # Production output ready to drop onto your GitHub profile
└── USAGE.md                       # Setup and usage guide
```

---

## ⚡ Quick Start

### 1. Update Content in One Place
Open [`data/profile.json`](./data/profile.json). All copy, status, projects, tags, links, and metrics are defined here.

### 2. Build the README & Graphics
Run:
```bash
npm run build
```
This runs:
1. `node scripts/generate-graphics.js` — rebuilds dark & light SVG assets.
2. `node scripts/generate.js` — compiles `README.md` and updates the timestamp.

### 3. Local Live Watch Mode
While tweaking copy or layout, run:
```bash
npm run watch
```
Any change saved to `data/profile.json` or `templates/README.template.md` will instantly recompile `README.md`.

---

## 🌓 Dark and Light Mode Support

GitHub Flavored Markdown renders theme-aware assets using the HTML `<picture>` tag:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/hero-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/hero-light.svg">
  <img alt="NODAYSIDLE" src="assets/hero-dark.svg" width="100%">
</picture>
```

- **Dark Mode**: Deep obsidian `#080a0d` canvas, lime `#c8ff00` and cyan `#00e5ff` accents, glassmorphic status pills, and ambient glow.
- **Light Mode**: Architectural off-white `#ffffff` / `#f8fafc` canvas, crisp slate `#0f172a` typography, and emerald `#16a34a` highlights.

---

## 🤖 Automated Daily Refresh

The GitHub Actions workflow [`.github/workflows/daily-refresh.yml`](./.github/workflows/daily-refresh.yml):
- Runs automatically every day at `04:00 UTC` via cron schedule.
- Runs whenever you push changes to `data/**`, `templates/**`, or `scripts/**`.
- Can be triggered manually on demand via the **Actions** tab ("Run workflow").
- Checks for diffs, commits the changes with `[skip ci]`, and pushes cleanly.

---

## 🚀 Dropping onto Your GitHub Profile

To make this your active GitHub profile:
1. Create or open the repository named after your GitHub handle: `https://github.com/nodaysidle/nodaysidle`.
2. Push or copy these files (`README.md`, `assets/`, `data/`, `scripts/`, `templates/`, `.github/`).
3. GitHub will immediately display the generated `README.md` as your personal profile landing page.
