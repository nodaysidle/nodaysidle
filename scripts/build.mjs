#!/usr/bin/env node
// Builds README.md, assets/hero.svg and assets/apps/*.svg from the apps listed on
// nodaysidle-apps.vercel.app. The site's data/apps.json is the single source of
// truth: an app appears here only once its showFrom time has passed, exactly like
// the site, so nothing about an unreleased app is ever written to this repo.
//
//   node scripts/build.mjs
//   APPS_FILE=../nodaysidle-apps/data/apps.json ASSETS_DIR=../nodaysidle-apps/public \
//     NOW=2026-10-21T17:31:00+02:00 node scripts/build.mjs   # offline / preview a date

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const profile = JSON.parse(await readFile(join(ROOT, 'data/profile.json'), 'utf8'));
const tracksData = JSON.parse(await readFile(join(ROOT, 'data/tracks.json'), 'utf8'));
const now = process.env.NOW ? new Date(process.env.NOW) : new Date();

// ---- Sources -------------------------------------------------------------------

async function loadApps() {
  if (process.env.APPS_FILE) return JSON.parse(await readFile(process.env.APPS_FILE, 'utf8')).apps;
  const res = await fetch(profile.apps);
  if (!res.ok) throw new Error(`apps.json: HTTP ${res.status}`);
  return (await res.json()).apps;
}

async function loadAsset(path) {
  if (process.env.ASSETS_DIR) return readFile(join(process.env.ASSETS_DIR, path));
  const res = await fetch(`${profile.assets}${path}`);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// Same rule and order as the site (nodaysidle-apps lib/data.mjs visibleApps).
function visibleApps(apps) {
  return apps
    .map((app, order) => ({ app, order, at: Date.parse(app.showFrom) }))
    .filter(({ at }) => at <= now.getTime())
    .sort((a, b) => b.at - a.at || a.order - b.order)
    .map(({ app }) => app);
}

// ---- Wording, mirrored from the site's lib/render.mjs ----------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
const numberWord = (n) => WORDS[n] ?? String(n);

function shortDate(iso) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'numeric', timeZone: 'Europe/Ljubljana',
  }).formatToParts(new Date(iso));
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return `${String(get('day')).padStart(2, '0')} ${MONTHS[get('month') - 1]}`;
}

const shippedDate = (app) => (app.kind === 'web' ? app.showFrom : app.released);
const appMeta = (app) => `${app.kind === 'web' ? 'web' : app.version} · ${shortDate(shippedDate(app))}`;
const listJoin = (items) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;

const PLATFORM_GROUPS = [
  ['macOS', (p) => p.startsWith('macOS')],
  ['Linux', (p) => p.startsWith('Linux')],
  ['Chrome', (p) => p.startsWith('Chrome')],
];

function platformNames(apps) {
  const platforms = apps.flatMap((a) => a.platforms ?? []);
  const names = PLATFORM_GROUPS.filter(([, match]) => platforms.some(match)).map(([name]) => name);
  if (apps.some((a) => a.kind === 'web')) names.push('the web');
  return names;
}

// ---- SVG -------------------------------------------------------------------------

const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function fontFace(family, file, weight) {
  const data = (await readFile(join(ROOT, 'assets/fonts', file))).toString('base64');
  return `@font-face{font-family:${family};font-weight:${weight};src:url(data:font/woff2;base64,${data}) format('woff2')}`;
}

const COLORS = { bg: '#050505', ink: '#f2f2f2', ink2: '#c4c4c4', label: '#9a9a9a', off: '#2a2a2a', red: '#e10600' };

async function heroSvg(apps) {
  const fonts = [
    await fontFace('Saira', 'saira-condensed-800.woff2', 800),
    await fontFace('Plex', 'ibm-plex-sans-400.woff2', 400),
  ].join('');
  const lines = ['Lights out.', `${numberWord(apps.length)} apps shipped.`].map((s) => s.toUpperCase());
  const sub = [
    `Native apps for ${listJoin(platformNames(apps))}. Built by one studio,`,
    'released on a schedule, one after another.',
  ];
  // Start lights: authentic F1 starting gantry housing with 5 lights
  const lights = [0, 1, 2, 3, 4]
    .map((i) => {
      const cx = 80 + i * 36;
      return `<circle cx="${cx}" cy="139" r="13" fill="#1c1c1c"/>` +
        `<circle class="light" style="animation-delay:${(0.9 + i * 0.22).toFixed(2)}s" cx="${cx}" cy="139" r="10"/>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 520" width="1200" height="520" role="img" aria-label="${xml(`${lines.join(' ')} ${sub.join(' ')}`)}">
<style>${fonts}
.hero-card{fill:#070707;stroke:#222222;stroke-width:1.5}
.gantry{fill:#121212;stroke:#282828;stroke-width:1.2}
.mark{font:800 24px Saira,-apple-system,BlinkMacSystemFont,"Segoe UI","Arial Narrow",sans-serif;fill:${COLORS.ink};letter-spacing:1.5px}
.head{font:800 116px/1 Saira,-apple-system,BlinkMacSystemFont,"Segoe UI","Arial Narrow",sans-serif;fill:${COLORS.ink};letter-spacing:-1px}
.sub{font:400 23px Plex,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;fill:${COLORS.ink2}}
.light{fill:${COLORS.red};animation:out 60ms linear forwards}
@keyframes out{to{fill:${COLORS.off}}}
@media (prefers-reduced-motion:reduce){.light{animation:none;fill:${COLORS.off}}}
</style>
<rect class="hero-card" x="1" y="1" width="1198" height="518" rx="22"/>
<text class="mark" x="64" y="82">${xml(profile.name)}</text>
<rect class="gantry" x="60" y="117" width="186" height="44" rx="8"/>
${lights}
<text class="head" x="60" y="286">${xml(lines[0])}</text>
<text class="head" x="60" y="396">${xml(lines[1])}</text>
<text class="sub" x="64" y="452">${xml(sub[0])}</text>
<text class="sub" x="64" y="484">${xml(sub[1])}</text>
</svg>
`;
}

async function tileSvg(app) {
  const fonts = [
    await fontFace('Saira', 'saira-condensed-600.woff2', 600),
    await fontFace('PlexMono', 'ibm-plex-mono-400.woff2', 400),
  ].join('');
  const icon = (await loadAsset(app.icon)).toString('base64');
  const type = app.icon.endsWith('.png') ? 'png' : 'webp';
  const name = (app.shortName ?? app.name).toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 228" width="200" height="228" role="img" aria-label="${xml(`${app.name}, ${appMeta(app)}`)}">
<style>${fonts}
.card{fill:#0b0b0b;stroke:#262626;stroke-width:1.2}
.name{font:600 24px Saira,-apple-system,BlinkMacSystemFont,"Segoe UI","Arial Narrow",sans-serif;fill:${COLORS.ink};letter-spacing:.5px}
.meta{font:400 13px PlexMono,ui-monospace,monospace;fill:${COLORS.label};letter-spacing:.3px}
</style>
<rect class="card" x="1" y="1" width="198" height="226" rx="18"/>
<image href="data:image/${type};base64,${icon}" x="46" y="24" width="108" height="108"/>
<text class="name" x="100" y="170" text-anchor="middle">${xml(name)}</text>
<text class="meta" x="100" y="198" text-anchor="middle">${xml(appMeta(app))}</text>
</svg>
`;
}

// ---- README ----------------------------------------------------------------------

const appPage = (app) => `${profile.site}/apps/${app.id}/`;
const runsOn = (app) => (app.kind === 'web' ? 'Web' : platformNames([app]).join(' · '));

function readme(apps, tracksData) {
  const headline = `Lights out. ${numberWord(apps.length)} apps shipped.`;

  const cols = 5;
  const rows = [];
  for (let i = 0; i < apps.length; i += cols) {
    const chunk = apps.slice(i, i + cols);
    const cells = chunk.map((app) => 
      `    <td align="center" width="20%">
      <a href="${appPage(app)}">
        <img src="assets/apps/${app.id}.svg" width="100%" alt="${xml(`${app.name}, ${appMeta(app)}`)}">
      </a>
    </td>`
    ).join('\n');
    rows.push(`  <tr>\n${cells}\n  </tr>`);
  }
  const appGrid = `<table width="100%">\n${rows.join('\n')}\n</table>`;

  const metaStory = `### Architecture & Engineering Principles

**NODAYSIDLE** is an independent software studio building zero-bloat native systems, high-speed web apps, and deterministic agent compilers. Everything is local-first, memory-safe, and shipped with zero telemetry.

- **Lights-Out Shipping:** Apps released on a relentless cadence, fully realized and self-contained. No phantom roadmaps, no waitlists.
- **Native Systems Craft:** High-performance Linux (Rust, Wayland, wgpu, WebKitGTK), macOS (Swift 6, SwiftUI, TextKit 2, Metal), and sub-second voice assistant daemons.
- **Deterministic Spec-to-Agent Pipeline:** Ideas are compiled through [Cascade V3](https://github.com/nodaysidle/nodaysidle-cascade-v3) into five immutable markdown contracts (\`PRD.md\`, \`ARD.md\`, \`TRD.md\`, \`TASKS.md\`, \`AGENTS.md\`), governed by [AI Rules Builder](https://github.com/nodaysidle/markdown-helper) and refined via [Prompt Optimizer](https://github.com/nodaysidle/nodaysidle-prompt-optimizer).
- **System One Cognitive Gating:** \`TypeSafe Jev\` acts as a fast preflight boundary across apps to prevent context drift, heal platform boundaries, and triage memory before invoking LLMs.
- **Zero-Persistence Privacy:** Memory-only or user-supplied API keys, local SQLite/IndexedDB state, and zero telemetry.`;

  const trackSections = (tracksData?.tracks ?? []).map((track) => {
    const rows = track.apps
      .map((app) => {
        const links = [
          app.url && `[App](${app.url})`,
          app.repo && `[Code](${app.repo})`
        ].filter(Boolean).join(' · ');
        const platformBadges = (app.runsOn ?? 'Web').split(' · ').map((p) => `\`${p}\``).join(' ');
        return `| **${app.name}** | ${app.pitch} | ${platformBadges} | ${links} |`;
      })
      .join('\n');

    return `### ${track.title}

| Application | Purpose | Platform | Links |
| :--- | :--- | :--- | :--- |
${rows}`;
  }).join('\n\n');

  const footer = `<sub><code>${profile.site.replace('https://', '')}</code> · <a href="${profile.github}">GitHub</a> · <a href="mailto:${profile.email}">${profile.email}</a></sub>`;

  return `<!--
  Generated by scripts/build.mjs from data/profile.json, data/tracks.json, and the apps on
  ${profile.site}.
-->

<a href="${profile.site}"><img src="assets/hero.svg" width="100%" alt="${xml(headline)}"></a>

${appGrid}

${metaStory}

${trackSections}

${footer}
`;
}

// ---- Build -----------------------------------------------------------------------

const apps = visibleApps(await loadApps());
if (!apps.length) throw new Error('No released apps: refusing to write an empty profile.');

await rm(join(ROOT, 'assets/apps'), { recursive: true, force: true });
await mkdir(join(ROOT, 'assets/apps'), { recursive: true });
for (const app of apps) await writeFile(join(ROOT, 'assets/apps', `${app.id}.svg`), await tileSvg(app));
await writeFile(join(ROOT, 'assets/hero.svg'), await heroSvg(apps));
await writeFile(join(ROOT, 'README.md'), readme(apps, tracksData));
console.log(`README: ${apps.length} apps (${apps.map((a) => a.id).join(', ')})`);
