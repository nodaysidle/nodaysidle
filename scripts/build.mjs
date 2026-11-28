#!/usr/bin/env node
// Deterministic profile README builder (v2).
//
// Every number in README.md is generated at build time. Nothing on the page is
// hand-typed, so nothing can go stale or lie. Sources, in order of authority:
//
//   1. The GitHub REST API  - public repository count, latest release of every repo
//   2. The apps site data   - launch dates for web apps, last-resort fallback
//   3. data/apps.json       - the app registry: the only human-maintained facts
//   4. data/privacy.json   - one verified privacy line per app id
//   5. data/profile.json   - profile-level constants (site, GitHub, email)
//
// Anything that cannot be verified is rendered as UNKNOWN. Never guessed, never
// silently dropped.
//
//   node scripts/build.mjs
//   NOW=2026-12-01T06:00:00Z node scripts/build.mjs                       # frozen clock
//   RELEASES_FILE=fixture.json APPS_FILE=site-apps.json node scripts/build.mjs  # fully offline

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFonts, writeAssets, OUTLINE_STATS } from './svg.mjs';
import { cell, link, themedImage, repoIndexBlock } from './markdown.mjs';
import { dayKey, dayNumber, isoDate } from './dates.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const profile = JSON.parse(await readFile(join(ROOT, 'data/profile.json'), 'utf8'));
const registry = JSON.parse(await readFile(join(ROOT, 'data/apps.json'), 'utf8'));
const privacy = JSON.parse(await readFile(join(ROOT, 'data/privacy.json'), 'utf8'));
const now = process.env.NOW ? new Date(process.env.NOW) : new Date();

const CLASSES = ['LOCAL', 'KEYS', 'PUBLIC'];
const warnings = [];
const warn = (message) => warnings.push(message);

// ---- Registry validation -----------------------------------------------------------

const apps = registry.apps;
if (!Array.isArray(apps) || apps.length === 0) throw new Error('data/apps.json: no apps, refusing to build.');
const ids = apps.map((app) => app.id);
if (new Set(ids).size !== ids.length) throw new Error('data/apps.json: duplicate app ids.');
for (const app of apps) {
  if (!CLASSES.includes(app.privacyClass)) throw new Error(`data/apps.json: ${app.id}: unknown privacyClass "${app.privacyClass}".`);
  if (!['web', 'download'].includes(app.kind)) throw new Error(`data/apps.json: ${app.id}: unknown kind "${app.kind}".`);
  if (typeof app.telemetry !== 'boolean') throw new Error(`data/apps.json: ${app.id}: telemetry must be true or false.`);
}
const flagships = apps.filter((app) => app.flagship);
if (flagships.length > 1) throw new Error('data/apps.json: at most one app may be the flagship.');
if (flagships.length === 0) warn('data/apps.json: no flagship app is set.');

// ---- Network sources ----------------------------------------------------------------

const ghHeaders = { Accept: 'application/vnd.github+json' };
if (process.env.GITHUB_TOKEN) ghHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function gh(path) {
  try {
    const res = await fetch(`https://api.github.com${path}`, { headers: ghHeaders });
    if (res.status === 404) return { status: 404, data: null };
    if (!res.ok) {
      warn(`GitHub API ${path}: HTTP ${res.status}`);
      return { status: res.status, data: null };
    }
    return { status: 200, data: await res.json() };
  } catch (error) {
    warn(`GitHub API ${path}: ${error.message}`);
    return { status: 0, data: null };
  }
}

async function latestRelease(repo) {
  if (process.env.RELEASES_FILE) {
    const fixture = JSON.parse(await readFile(process.env.RELEASES_FILE, 'utf8'));
    return fixture.latest?.[repo] ?? null;
  }
  const { data } = await gh(`/repos/${repo}/releases/latest`);
  if (!data || !data.tag_name) return null;
  return { tag: data.tag_name, at: data.published_at, url: data.html_url };
}

async function publicRepoCount() {
  if (process.env.RELEASES_FILE) {
    const fixture = JSON.parse(await readFile(process.env.RELEASES_FILE, 'utf8'));
    return fixture.repos ?? 'UNKNOWN';
  }
  const { data } = await gh(`/users/${profile.github.split('/').pop()}`);
  return data ? data.public_repos : 'UNKNOWN';
}

const INDEX_ATTEMPTS = 3;

async function repoIndex() {
  if (process.env.RELEASES_FILE) {
    const fixture = JSON.parse(await readFile(process.env.RELEASES_FILE, 'utf8'));
    return fixture.index ?? null;
  }
  const login = profile.github.split('/').pop();
  const attempt = async () => {
    const repos = [];
    for (let page = 1; page <= 10; page += 1) {
      const { data } = await gh(`/users/${login}/repos?type=owner&per_page=100&page=${page}`);
      if (!Array.isArray(data)) return null;
      for (const r of data) {
        repos.push({ name: r.name, url: r.html_url, description: r.description, language: r.language, fork: r.fork, archived: r.archived });
      }
      if (data.length < 100) return repos;
    }
    warn('repo index: more than 1000 repositories; the index is UNKNOWN.');
    return null;
  };
  for (let tries = 1; tries <= INDEX_ATTEMPTS; tries += 1) {
    const repos = await attempt();
    if (repos) return repos;
    if (tries < INDEX_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, 2000 * tries));
  }
  return null;
}

async function siteApps() {
  if (process.env.APPS_FILE) {
    return new Map(JSON.parse(await readFile(process.env.APPS_FILE, 'utf8')).apps.map((app) => [app.id, app]));
  }
  try {
    const res = await fetch(profile.appsSource);
    if (!res.ok) {
      warn(`apps source: HTTP ${res.status}`);
      return new Map();
    }
    return new Map((await res.json()).apps.map((app) => [app.id, app]));
  } catch (error) {
    warn(`apps source: ${error.message}`);
    return new Map();
  }
}

async function demoCheck(url) {
  if (!url) return null;
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow' });
      if (res.status === 405 || res.status === 501) continue;
      return res.ok ? 'LIVE' : `UNKNOWN (HTTP ${res.status})`;
    } catch (error) {
      warn(`demo ${url}: ${error.message}`);
    }
  }
  return 'UNKNOWN';
}

// ---- Date arithmetic (Europe/Ljubljana day keys, same rule as the apps site) --------

const today = dayNumber(dayKey(now.toISOString()));
const gapDays = (iso) => today - dayNumber(dayKey(iso));

// ---- Assemble one ledger row per app --------------------------------------------------

async function buildRow(app, site) {
  const siteApp = site.get(app.id);
  let version = 'UNKNOWN';
  let releasedAt = null;
  let releaseUrl = null;
  let source = 'UNKNOWN';

  if (app.kind === 'web') {
    version = 'web';
    releasedAt = siteApp?.showFrom ?? null;
    source = releasedAt ? 'site' : 'UNKNOWN';
  } else {
    const release = await latestRelease(app.repo);
    if (release) {
      version = release.tag;
      releasedAt = release.at;
      releaseUrl = release.url;
      source = 'github';
    } else if (siteApp?.released && siteApp?.version) {
      version = siteApp.version;
      releasedAt = siteApp.released;
      source = 'site';
      warn(`${app.id}: no GitHub release found, using site data (${siteApp.version}).`);
    }
  }

  const gap = releasedAt ? gapDays(releasedAt) : null;
  const demo = await demoCheck(app.demo);
  const dormant = gap !== null && gap > 60;
  const page = `${profile.site}/apps/${app.id}/`;
  if (!privacy[app.id]) warn(`No privacy line for ${app.id}: add one to data/privacy.json.`);

  return {
    app,
    version,
    releasedAt,
    releaseUrl,
    source,
    gap,
    dormant,
    demo,
    page,
    privacyLine: privacy[app.id] ?? 'See the repo.',
  };
}

const site = await siteApps();
const rows = [];
for (const app of apps) rows.push(await buildRow(app, site));
rows.sort((a, b) => (b.releasedAt ? Date.parse(b.releasedAt) : 0) - (a.releasedAt ? Date.parse(a.releasedAt) : 0) || a.app.order - b.app.order);

const repos = await publicRepoCount();
const index = await repoIndex();
if (index === null) warn(`repo index: GitHub API unavailable after ${INDEX_ATTEMPTS} attempts, the index renders as UNKNOWN.`);
else if (repos !== 'UNKNOWN' && index.length !== repos) warn(`repo index lists ${index.length} repositories, the profile reports ${repos}.`);
const telemetryEndpoints = apps.reduce((sum, app) => sum + (app.telemetry ? 1 : 0), 0);
const newest = rows.find((row) => row.gap !== null);
const dayWord = (n) => `${n} day${Number(n) === 1 ? '' : 's'}`;
const lastReleaseAgo = newest ? `${dayWord(newest.gap)} ago` : 'UNKNOWN';
const buildDate = isoDate(now.toISOString());

// ---- SVG assets: outlined text, TRD tokens, one file per palette ---------------------------

await loadFonts(ROOT);
const svgFiles = await writeAssets(ROOT, {
  rows,
  repos,
  appsShipped: apps.length,
  lastReleaseAgo,
  telemetryEndpoints,
  profile,
  buildDate,
});
if (process.env.SVG_STATS) console.error(JSON.stringify(OUTLINE_STATS));

// ---- README ----------------------------------------------------------------------------

// Dates in the ledger use U+2011 so a narrow table never breaks one across lines.
const NB_HYPHEN = '\u2011';
const CLASS_ORDER = Object.fromEntries(CLASSES.map((cls, i) => [cls, i]));

function ledgerTable() {
  const head = '| App | Version | Released | Gap (days) | Platform | Demo |';
  const rule = '| :--- | :--- | :--- | ---: | :--- | :--- |';
  const body = rows.map((row) => {
    const name = link(row.app.name, row.page) + (row.dormant ? ' · dormant' : '');
    const version = row.source === 'github' && row.releaseUrl ? link(row.version, row.releaseUrl) : row.version;
    const released = row.releasedAt ? isoDate(row.releasedAt).replace(/-/g, NB_HYPHEN) : 'UNKNOWN';
    const gap = row.gap === null ? 'UNKNOWN' : String(row.gap);
    const demo = row.demo === 'LIVE' ? link('LIVE', row.app.demo) : (row.demo ?? '-');
    return `| ${name} | ${version} | ${released} | ${gap} | ${cell(row.app.platform)} | ${demo} |`;
  });
  return [head, rule, ...body].join('\n');
}

function privacyTable() {
  const ordered = rows.slice().sort((a, b) => CLASS_ORDER[a.app.privacyClass] - CLASS_ORDER[b.app.privacyClass]);
  const head = '| Class | App | What it does | What leaves your machine |';
  const rule = '| :--- | :--- | :--- | :--- |';
  const body = ordered.map((row) => {
    const name = `${link(row.app.name, row.page)}<br><sub>${link('Code', `https://github.com/${row.app.repo}`)}</sub>`;
    return `| ${row.app.privacyClass} | ${name} | ${cell(row.app.description)} | ${cell(row.privacyLine)} |`;
  });
  return [head, rule, ...body].join('\n');
}

function classCounts() {
  const count = (cls) => rows.filter((row) => row.app.privacyClass === cls).length;
  return `**LOCAL** stays on your machine (${count('LOCAL')}) · **KEYS** cloud calls with your own keys (${count('KEYS')}) · **PUBLIC** public data only (${count('PUBLIC')})`;
}

function flagshipBlock() {
  const row = rows.find(({ app }) => app.flagship);
  if (!row) return '';
  const repoUrl = `https://github.com/${row.app.repo}`;
  const when = row.releasedAt ? `${isoDate(row.releasedAt)}, ${dayWord(row.gap)} ago` : 'UNKNOWN';
  const alt = `${row.app.name} ${row.version}, released ${when}, class ${row.app.privacyClass}`;
  return `## Flagship: ${row.app.name}

${themedImage('flagship', alt)}

${row.app.description}

${link('Repository', repoUrl)} · ${link('App page', row.page)}`;
}

const contractLink = (label, file) => `[\`${label}\`](contracts/${file}.md)`;
const CONTRACTS = [['01 IDEA', 'IDEA'], ['02 PRD', 'PRD'], ['03 ARD', 'ARD'], ['04 TRD', 'TRD'], ['05 TASKS', 'TASKS']];
const contractChain = `${CONTRACTS.map(([label, file]) => contractLink(label, file)).join(' → ')} + ${contractLink('AGENTS.md', 'AGENTS')}`;

const drumAlt = `${profile.name} — ${profile.tagline} ${repos} public repositories · ${apps.length} apps shipped · last release ${lastReleaseAgo} · ${telemetryEndpoints} telemetry endpoints. A strip chart of the days since each app's last release; the release ledger below carries the same numbers.`;

const readme = `<!--
  Generated by scripts/build.mjs from data/apps.json, data/privacy.json, data/profile.json,
  the GitHub REST API, and the apps site. Do not edit by hand: change the registry.
  Every number on this page is generated. Anything unverifiable is UNKNOWN.
-->

${themedImage('drum', drumAlt)}

${flagshipBlock()}

## Release ledger

Every shipped app, newest release first. The gap is days since the last release; web apps count from their launch. Over 60 days reads as dormant, not deleted.

${ledgerTable()}

## What leaves your machine

Each app appears once, in the class its repository README states.

${classCounts()}

${privacyTable()}

## How software is built here

${contractChain}

One idea becomes five agent-ready contracts. Coding agents build from them. Nothing is called done until it runs live. ${link('Cascade', 'https://github.com/nodaysidle/nodaysidle-cascade-v3')} writes the contracts; the links above are the ones this page was built from.

## Repositories

${repoIndexBlock(index, repos)}

---

<sub>${link(profile.site.replace('https://', ''), profile.site)} · ${link('GitHub', profile.github)} · ${link(profile.email, `mailto:${profile.email}`)} · rebuilt daily by CI · last build ${buildDate}</sub>
`;

await writeFile(join(ROOT, 'README.md'), readme);

console.log(`README: ${apps.length} apps, public repos ${repos}, last release ${lastReleaseAgo}, build ${buildDate}`);
console.log(`SVG: wrote ${svgFiles.length} assets (${svgFiles.join(', ')})`);
for (const message of warnings) console.warn(`WARNING: ${message}`);
if (warnings.length) console.warn(`${warnings.length} warning(s). Every unverified value renders as UNKNOWN.`);

// Refuse to publish a broken page: if every version is UNKNOWN, the repository
// count could not be fetched, or the repository index failed every attempt, the
// sources are down. CI fails the job and commits nothing, so the last good page
// stays live. Local previews can opt out with ALLOW_UNKNOWN=1.
const unresolved = rows.filter((row) => row.source === 'UNKNOWN').length;
if (!process.env.ALLOW_UNKNOWN && (unresolved === rows.length || repos === 'UNKNOWN' || index === null)) {
  console.error('REFUSING: critical sources unavailable; the build is not publishable.');
  process.exitCode = 1;
}
