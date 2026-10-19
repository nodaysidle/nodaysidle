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
  // Start lights: all five on, then out left to right, once (as on the site).
  const lights = [0, 1, 2, 3, 4]
    .map((i) => `<circle class="light" style="animation-delay:${(0.9 + i * 0.22).toFixed(2)}s" cx="${75 + i * 34}" cy="138" r="12"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 520" width="1200" height="520" role="img" aria-label="${xml(`${lines.join(' ')} ${sub.join(' ')}`)}">
<style>${fonts}
.mark{font:800 28px Saira,'Arial Narrow',sans-serif;fill:${COLORS.ink};letter-spacing:.5px}
.head{font:800 122px/1 Saira,'Arial Narrow',sans-serif;fill:${COLORS.ink}}
.sub{font:400 23px Plex,system-ui,sans-serif;fill:${COLORS.ink2}}
.light{fill:${COLORS.red};animation:out 60ms linear forwards}
@keyframes out{to{fill:${COLORS.off}}}
@media (prefers-reduced-motion:reduce){.light{animation:none;fill:${COLORS.off}}}
</style>
<rect width="1200" height="520" rx="22" fill="${COLORS.bg}"/>
<text class="mark" x="64" y="84">${xml(profile.name)}</text>
${lights}
<text class="head" x="60" y="290">${xml(lines[0])}</text>
<text class="head" x="60" y="400">${xml(lines[1])}</text>
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
.name{font:600 25px Saira,'Arial Narrow',sans-serif;fill:${COLORS.ink}}
.meta{font:400 14px PlexMono,ui-monospace,monospace;fill:${COLORS.label}}
</style>
<!-- Greyscale like the site's resting state (filter: grayscale(1) brightness(.85)). -->
<filter id="rest"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope=".85"/><feFuncG type="linear" slope=".85"/><feFuncB type="linear" slope=".85"/></feComponentTransfer></filter>
<rect width="200" height="228" rx="20" fill="${COLORS.bg}"/>
<image href="data:image/${type};base64,${icon}" x="46" y="22" width="108" height="108" filter="url(#rest)"/>
<text class="name" x="100" y="170" text-anchor="middle">${xml(name)}</text>
<text class="meta" x="100" y="199" text-anchor="middle">${xml(appMeta(app))}</text>
</svg>
`;
}

// ---- README ----------------------------------------------------------------------

const appPage = (app) => `${profile.site}/apps/${app.id}/`;
const runsOn = (app) => (app.kind === 'web' ? 'Web' : platformNames([app]).join(' · '));

function readme(apps) {
  const headline = `Lights out. ${numberWord(apps.length)} apps shipped.`;
  const tiles = apps
    .map((app) => `<a href="${appPage(app)}"><img src="assets/apps/${app.id}.svg" width="128" alt="${xml(`${app.name}, ${appMeta(app)}`)}"></a>`)
    .join('\n');
  const rows = apps
    .map((app) => {
      const links = [`[Get it](${appPage(app)})`, app.repo && `[Source](${app.repo})`].filter(Boolean).join(' · ');
      return `| **${app.name}** | ${app.pitch} | ${runsOn(app)} | ${links} |`;
    })
    .join('\n');
  return `<!--
  Generated by scripts/build.mjs from data/profile.json and the apps on
  ${profile.site}. Do not edit by hand: change the site's data/apps.json.
-->

<a href="${profile.site}"><img src="assets/hero.svg" width="100%" alt="${xml(headline)}"></a>

<p>
${tiles}
</p>

| App | What it does | Runs on | |
|---|---|---|---|
${rows}

<sub><code>${profile.site.replace('https://', '')}</code> · <a href="${profile.github}">GitHub</a> · <a href="mailto:${profile.email}">${profile.email}</a></sub>
`;
}

// ---- Build -----------------------------------------------------------------------

const apps = visibleApps(await loadApps());
if (!apps.length) throw new Error('No released apps: refusing to write an empty profile.');

await rm(join(ROOT, 'assets/apps'), { recursive: true, force: true });
await mkdir(join(ROOT, 'assets/apps'), { recursive: true });
for (const app of apps) await writeFile(join(ROOT, 'assets/apps', `${app.id}.svg`), await tileSvg(app));
await writeFile(join(ROOT, 'assets/hero.svg'), await heroSvg(apps));
await writeFile(join(ROOT, 'README.md'), readme(apps));
console.log(`README: ${apps.length} apps (${apps.map((a) => a.id).join(', ')})`);
