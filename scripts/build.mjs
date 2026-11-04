#!/usr/bin/env node
// Builds README.md and the SVGs in assets/ from the apps listed on
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
const privacy = JSON.parse(await readFile(join(ROOT, 'data/privacy.json'), 'utf8'));
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
const dayKey = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Ljubljana' }).format(new Date(iso));
const dayNumber = (key) => Date.parse(`${key}T00:00:00Z`) / 86_400_000;
const shippedDay = (app) => dayNumber(dayKey(shippedDate(app)));
const releaseDates = (apps) =>
  apps.map(shippedDate).sort((a, b) => dayNumber(dayKey(a)) - dayNumber(dayKey(b)));
const appMeta = (app) => `${app.kind === 'web' ? 'web' : app.version} · ${shortDate(shippedDate(app))}`;

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

const COLORS = { ink: '#f2f2f2', label: '#9a9a9a', off: '#2a2a2a', red: '#e10600' };

async function heroSvg(apps) {
  const fonts = [
    await fontFace('Saira', 'saira-condensed-800.woff2', 800),
    await fontFace('PlexMono', 'ibm-plex-mono-400.woff2', 400),
  ].join('');
  const headline = `Lights out. ${numberWord(apps.length)} apps shipped.`.toUpperCase();
  const lights = [0, 1, 2, 3, 4]
    .map((i) => {
      const cx = 1010 + i * 36;
      return `<circle cx="${cx}" cy="58" r="13" fill="#1c1c1c"/>` +
        `<circle class="light" style="animation-delay:${(0.9 + i * 0.22).toFixed(2)}s" cx="${cx}" cy="58" r="10"/>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 190" width="1200" height="190" role="img" aria-label="${xml(headline)}">
<style>${fonts}
.head{font:800 92px/1 Saira,"Arial Narrow",sans-serif;fill:${COLORS.ink}}
.mark{font:400 24px PlexMono,ui-monospace,monospace;fill:${COLORS.label}}
.light{fill:${COLORS.red};animation:out 60ms linear forwards}
@keyframes out{to{fill:${COLORS.off}}}
@media (prefers-reduced-motion:reduce){.light{animation:none;fill:${COLORS.off}}}
</style>
<rect x="0" y="0" width="1200" height="190" rx="14" fill="#070707"/>
<rect x="0" y="24" width="10" height="142" fill="${COLORS.red}"/>
<rect x="988" y="36" width="186" height="44" rx="8" fill="#121212" stroke="#282828" stroke-width="1.2"/>
${lights}
<text class="mark" x="44" y="66">${xml(profile.name)}</text>
<text class="head" x="40" y="156">${xml(headline)}</text>
</svg>
`;
}

const TYRES = { W: '#f5c518', L: '#e6e6e6', M: '#d0342c', C: '#2fa84f' };

async function rowSvg(app, position, leaderDay) {
  const fonts = [
    await fontFace('Saira', 'saira-condensed-600.woff2', 600),
    await fontFace('PlexMono', 'ibm-plex-mono-400.woff2', 400),
  ].join('');
  const icon = (await loadAsset(app.icon)).toString('base64');
  const type = app.icon.endsWith('.png') ? 'png' : 'webp';
  const name = (app.shortName ?? app.name).toUpperCase();
  const behind = leaderDay - shippedDay(app);
  const gap = position === 1 ? 'LEADER' : `+${behind}d`;
  const letters = app.kind === 'web' ? ['W'] : platformNames([app]).map((p) => p[0].toUpperCase());
  const tyres = letters
    .map((letter, i) => {
      const cx = 640 - (letters.length - 1 - i) * 42;
      return `<circle cx="${cx}" cy="38" r="17" fill="none" stroke="${TYRES[letter]}" stroke-width="5"/>` +
        `<text class="tyre" x="${cx}" y="44" text-anchor="middle">${letter}</text>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 76" width="860" height="76" role="img" aria-label="${xml(`Position ${position}: ${app.name}, ${appMeta(app)}`)}">
<style>${fonts}
.pos,.name{font:600 32px Saira,"Arial Narrow",sans-serif;fill:${COLORS.ink}}
.name{letter-spacing:.5px}
.meta{font:400 17px PlexMono,ui-monospace,monospace;fill:${COLORS.label}}
.tyre{font:400 16px PlexMono,ui-monospace,monospace;fill:${COLORS.ink}}
.gap{font:400 19px PlexMono,ui-monospace,monospace;fill:#f5c518}
.go{font:400 19px PlexMono,ui-monospace,monospace;fill:#4493f8}
</style>
<rect x="0" y="0" width="860" height="72" rx="8" fill="${position === 1 ? '#2a0d0c' : '#0b0b0b'}" stroke="#262626"/>
<text class="pos" x="42" y="47" text-anchor="end">${position}</text>
<image href="data:image/${type};base64,${icon}" x="56" y="12" width="48" height="48"/>
<text class="name" x="118" y="35">${xml(name)}</text>
<text class="meta" x="118" y="58">${xml(appMeta(app))}</text>
${tyres}
<text class="gap" x="762" y="44" text-anchor="end">${gap}</text>
<text class="go" x="842" y="44" text-anchor="end">${app.kind === 'web' ? 'Try it' : 'Get it'}</text>
</svg>
`;
}

async function calendarSvg(apps) {
  const fonts = await fontFace('PlexMono', 'ibm-plex-mono-400.woff2', 400);
  const days = apps.map(shippedDay);
  const first = Math.min(...days);
  const span = Math.max(...days) - first + 1;
  const counts = Array(span).fill(0);
  for (const day of days) counts[day - first] += 1;
  if (counts.reduce((sum, n) => sum + n, 0) !== apps.length) throw new Error('Calendar lost a release.');
  const cellColor = (releases) => {
    if (releases === 0) return '#1a1a1a';
    return releases === 1 ? COLORS.red : '#ff7a70';
  };
  const pitch = 860 / span;
  const size = pitch - 3;
  const cells = counts
    .map((n, i) => `<rect x="${(i * pitch).toFixed(2)}" y="0" width="${size.toFixed(2)}" height="${size.toFixed(2)}" rx="3" fill="${cellColor(n)}"/>`)
    .join('');
  const dated = releaseDates(apps);
  const height = Math.ceil(size) + 30;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 ${height}" width="860" height="${height}" role="img" aria-label="${xml(`${apps.length} releases over ${span} days`)}">
<style>${fonts}
.t{font:400 16px PlexMono,ui-monospace,monospace;fill:#8d96a0}
</style>
<rect x="0" y="0" width="860" height="${height}" fill="#050505"/>
${cells}
<text class="t" x="0" y="${height - 6}">${shortDate(dated[0])}</text>
<text class="t" x="430" y="${height - 6}" text-anchor="middle">Brighter means several apps that day</text>
<text class="t" x="857" y="${height - 6}" text-anchor="end">${shortDate(dated.at(-1))}</text>
</svg>
`;
}

async function flowSvg() {
  const fonts = await fontFace('PlexMono', 'ibm-plex-mono-400.woff2', 400);
  const box = (x, y, width, text, hot) =>
    `<rect x="${x}" y="${y}" width="${width}" height="54" rx="6" fill="${hot ? '#2a0d0c' : '#0b0b0b'}" stroke="${hot ? COLORS.red : '#333'}"/>` +
    `<text x="${x + width / 2}" y="${y + 34}" text-anchor="middle">${text}</text>`;
  const docs = ['PRD.md', 'ARD.md', 'TRD.md', 'TASKS.md', 'AGENTS.md'];
  const arrow = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#666" stroke-width="2" marker-end="url(#a)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 230" width="860" height="230" role="img" aria-label="One idea goes into Cascade, which writes PRD, ARD, TRD, TASKS and AGENTS markdown files. Agents build from them, and the app is released.">
<style>${fonts}
text{font:400 20px PlexMono,ui-monospace,monospace;fill:${COLORS.ink}}
</style>
<defs><marker id="a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#666"/></marker></defs>
<rect x="0" y="0" width="860" height="230" fill="#050505"/>
${box(180, 0, 220, 'One idea')}${arrow(402, 27, 456, 27)}${box(460, 0, 220, 'Cascade', true)}
${arrow(430, 56, 430, 84)}
${docs.map((doc, i) => box(i * 174, 88, 164, doc)).join('')}
${arrow(430, 144, 430, 172)}
${box(180, 176, 220, 'Agents build')}${arrow(402, 203, 456, 203)}${box(460, 176, 220, 'Release')}
</svg>
`;
}

// ---- README ----------------------------------------------------------------------

const appPage = (app) => `${profile.site}/apps/${app.id}/`;
const rowLink = (app) => profile.live[app.id] ?? appPage(app);
const cell = (s) => s.replace(/\|/g, '\\|');

function readme(apps) {
  const { hero } = profile;
  const days = releaseDates(apps);
  const tower = apps
    .map((app) => `<a href="${rowLink(app)}"><img src="assets/apps/${app.id}.svg" width="100%" alt="${xml(`${app.name}, ${appMeta(app)}`)}"></a>`)
    .join('\n');
  const tryNow = profile.tryNow.map(({ name, url }) => `[${name}](${url})`).join(' · ');
  const rows = apps
    .map((app) => {
      const repo = app.repo ? ` · [Code](${app.repo})` : '';
      if (!privacy[app.id]) console.warn(`No privacy line for ${app.id}: add one to data/privacy.json.`);
      return `| [${app.name}](${appPage(app)})${repo} | ${cell(app.pitch)} | ${cell(privacy[app.id] ?? 'See the repo.')} |`;
    })
    .join('\n');
  const footer = `<sub><code>${profile.site.replace('https://', '')}</code> · <a href="${profile.github}">GitHub</a> · <a href="mailto:${profile.email}">${profile.email}</a></sub>`;

  return `<!--
  Generated by scripts/build.mjs from data/profile.json, data/privacy.json, and the apps on
  ${profile.site}.
-->

<a href="${hero.url}"><img src="assets/hero.svg" width="100%" alt="${xml(`Lights out. ${numberWord(apps.length)} apps shipped.`)}"></a>
<a href="${hero.url}"><img src="${hero.footage}" width="100%" alt="${xml(hero.alt)}"></a>

**Running above: ${hero.app}.** [${hero.cta}](${hero.url})

${tower}

<sub>W web · L Linux · M macOS · C Chrome · Gap is days behind the newest release</sub>

**Try one now:** ${tryNow}

### ${numberWord(apps.length)} apps between ${shortDate(days[0])} and ${shortDate(days.at(-1))}

<img src="assets/calendar.svg" width="100%" alt="${xml(`Calendar of ${apps.length} releases from ${shortDate(days[0])} to ${shortDate(days.at(-1))}`)}">

### How an app gets built

<img src="assets/flow.svg" width="100%" alt="One idea goes into Cascade, which writes PRD, ARD, TRD, TASKS and AGENTS markdown files. Agents build from them, and the app is released.">

[Cascade](https://github.com/nodaysidle/nodaysidle-cascade-v3) turns one idea into five contracts that a coding agent can build from.

### What each app does, and what leaves your machine

Some apps need a cloud service to work. This table says which ones, and what they send.

| App | What it does | Privacy |
| :--- | :--- | :--- |
${rows}

${footer}
`;
}

// ---- Build -----------------------------------------------------------------------

const apps = visibleApps(await loadApps());
if (!apps.length) throw new Error('No released apps: refusing to write an empty profile.');

await rm(join(ROOT, 'assets/apps'), { recursive: true, force: true });
await mkdir(join(ROOT, 'assets/apps'), { recursive: true });
const leaderDay = Math.max(...apps.map(shippedDay));
for (const [i, app] of apps.entries()) {
  await writeFile(join(ROOT, 'assets/apps', `${app.id}.svg`), await rowSvg(app, i + 1, leaderDay));
}
await writeFile(join(ROOT, 'assets/hero.svg'), await heroSvg(apps));
await writeFile(join(ROOT, 'assets/calendar.svg'), await calendarSvg(apps));
await writeFile(join(ROOT, 'assets/flow.svg'), await flowSvg());
await writeFile(join(ROOT, 'README.md'), readme(apps));
console.log(`README: ${apps.length} apps (${apps.map((a) => a.id).join(', ')})`);
