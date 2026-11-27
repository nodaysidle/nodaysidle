// SVG layer for the profile (PR 2). All SVGs are self-contained: every glyph is
// outlined to a path at build time with opentype.js, no <text>, no scripts, no
// external references. Colors are exactly the TRD tokens; 8 px grid, radius 0,
// no gradients, no glows. Signal green appears only on verified-live markers.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import opentype from 'opentype.js';
import { isoDate } from './dates.mjs';

export const TOKENS = {
  bg: '#0B0C0E',
  surface: '#131519',
  hairline: '#23262B',
  text: '#E7E4DD',
  secondary: '#9AA0A8',
  muted: '#6B7076',
  signal: '#B5E853',
  LOCAL: '#B5E853',
  KEYS: '#E0B458',
  PUBLIC: '#7FA8C9',
};

const GRID = 8;
const round2 = (n) => Math.round(n * 100) / 100;

let SANS = null; // IBM Plex Sans 500, labels
let MONO = null; // IBM Plex Mono 400, data

export async function loadFonts(root) {
  const sans = await readFile(join(root, 'assets/fonts/ibm-plex-sans-500.woff'));
  const mono = await readFile(join(root, 'assets/fonts/ibm-plex-mono-400.woff'));
  SANS = opentype.parse(sans.buffer.slice(sans.byteOffset, sans.byteOffset + sans.byteLength));
  MONO = opentype.parse(mono.buffer.slice(mono.byteOffset, mono.byteOffset + mono.byteLength));
}

// Width of a string at a given size, including tracking (em fraction of size).
function textWidth(font, text, size, tracking = 0) {
  let w = 0;
  for (const ch of text) w += font.getAdvanceWidth(ch, size) + tracking * size;
  return w - (text.length ? tracking * size : 0);
}

// Per-string outline stats, exported so builds can audit fragment counts.
export const OUTLINE_STATS = [];

// Path data for one glyph, or null if opentype.js produced nothing usable.
function glyphPath(font, ch, x, y, size) {
  const d = font.getPath(ch, x, y, size).toPathData(2);
  return d && !d.includes('NaN') ? d : null;
}

// Outline a string to a single <path>. Baseline at y, left edge at x.
// Coordinates are rounded to 2 decimals before each glyph: opentype.js's
// toPathData can emit NaN for certain long floating-point inputs. A glyph that
// still fails is retried once with integer-rounded inputs, and if it still
// fails the build throws: a glyph is never dropped silently.
function outline(font, text, x, y, size, fill, tracking = 0) {
  let cursor = round2(x);
  const baseY = round2(y);
  const parts = [];
  const expected = [...text].filter((ch) => ch !== ' ').length; // spaces have no outline
  for (const ch of text) {
    let d = ch === ' ' ? '' : glyphPath(font, ch, cursor, baseY, size);
    if (!d && ch !== ' ') d = glyphPath(font, ch, Math.round(cursor), Math.round(baseY), Math.round(size));
    if (!d && ch !== ' ') {
      throw new Error(`scripts/svg.mjs: glyph ${JSON.stringify(ch)} (U+${ch.codePointAt(0).toString(16)}) of "${text}" at x=${cursor}, y=${baseY}, size=${size} produced no path; refusing to drop it.`);
    }
    if (d) parts.push(d);
    cursor = round2(cursor + font.getAdvanceWidth(ch, size) + tracking * size);
  }
  const drawn = parts.length;
  if (drawn !== expected) {
    throw new Error(`scripts/svg.mjs: drew ${drawn} glyph fragments for ${expected} non-space characters of "${text}"; refusing to drop glyphs.`);
  }
  OUTLINE_STATS.push({ text, drawn, expected });
  return `<path fill="${fill}" d="${parts.join(' ')}"/>`;
}

function fitText(font, text, size, maxWidth, tracking = 0) {
  if (textWidth(font, text, size, tracking) <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && textWidth(font, `${t}…`, size, tracking) > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function svg(width, height, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">\n<rect width="${width}" height="${height}" fill="${TOKENS.bg}"/>\n${body}\n</svg>\n`;
}

const hairlineH = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${TOKENS.hairline}"/>`;

// ---- assets/header.svg: wordmark band, static content ------------------------------

export function headerSvg(profile) {
  const W = 1200;
  const M = 48;
  const wordmark = profile.name;
  // Pick the largest size on the 8 px grid whose wordmark fits 62% of the band.
  let size = 128;
  while (size > GRID && textWidth(SANS, wordmark, size, 0.12) > (W - 2 * M) * 0.62) size -= GRID;
  const yWord = 48 + size * 0.78;
  const tagline = profile.tagline;
  const yTag = round2(yWord + 40);
  const body = [
    outline(SANS, wordmark, M, round2(yWord), size, TOKENS.text, 0.12),
    outline(SANS, tagline, M, yTag, 20, TOKENS.secondary),
    hairlineH(0, 175, W),
  ].join('\n');
  return svg(W, 176, body);
}

// ---- assets/status.svg: generated counters ------------------------------------------

export function statusSvg({ repos, appsShipped, lastReleaseAgo, telemetryEndpoints }) {
  const W = 1200;
  const H = 112;
  const cols = [
    [String(repos), 'PUBLIC REPOSITORIES'],
    [String(appsShipped), 'APPS SHIPPED'],
    [String(lastReleaseAgo), 'LAST RELEASE'],
    [String(telemetryEndpoints), 'TELEMETRY ENDPOINTS'],
  ];
  const colW = W / cols.length;
  const parts = [hairlineH(0, 0, W), hairlineH(0, H - 1, W)];
  cols.forEach(([value, label], i) => {
    const x = i * colW + 48;
    parts.push(outline(MONO, value, x, 58, 32, TOKENS.text));
    parts.push(outline(SANS, label, x, 86, 12, TOKENS.secondary, 0.08));
    if (i > 0) parts.push(`<rect x="${round2(i * colW)}" y="24" width="1" height="64" fill="${TOKENS.hairline}"/>`);
  });
  return svg(W, H, parts.join('\n'));
}

// ---- assets/flagship.svg: Kureksistant terminal panel, live data injected -----------

export function flagshipSvg(row) {
  const W = 1200;
  const H = 208;
  const M = 48;
  const when = row.releasedAt ? ` (${isoDate(row.releasedAt)}, ${row.gap} day${row.gap === 1 ? '' : 's'} ago)` : '';
  const classColor = TOKENS[row.app.privacyClass] ?? TOKENS.muted;
  const legend = row.app.privacyClass === 'KEYS' ? 'cloud calls with your own keys, never ours'
    : row.app.privacyClass === 'LOCAL' ? 'stays on your machine'
    : 'public data only';
  const parts = [
    `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="${TOKENS.surface}" stroke="${TOKENS.hairline}" stroke-width="1"/>`,
    outline(MONO, '$', M, 56, 16, TOKENS.muted),
    outline(MONO, ' systemctl --user status kurek-daemon', M + MONO.getAdvanceWidth('$', 16), 56, 16, TOKENS.text),
    `<circle cx="${M + 5}" cy="${88 - 5}" r="5" fill="${TOKENS.text}"/>`,
    outline(MONO, ' kurek-daemon.service — active (running)', M + 20, 88, 16, TOKENS.text),
    outline(MONO, `  release: ${row.version}${when}`, M, 120, 16, TOKENS.secondary),
    `<rect x="${M}" y="${140}" width="10" height="10" fill="${classColor}"/>`,
    outline(MONO, `  class: ${row.app.privacyClass}`, M + 22, 149, 14, TOKENS.text),
    outline(SANS, legend, M + 22 + textWidth(MONO, `  class: ${row.app.privacyClass}`, 14) + 16, 149, 12, TOKENS.muted),
  ];
  return svg(W, H, parts.join('\n'));
}

// ---- assets/cards/<id>.svg: selected work cards --------------------------------------

export function cardSvg(row) {
  const W = 560;
  const H = 232;
  const P = 24;
  const maxText = W - 2 * P;
  const classColor = TOKENS[row.app.privacyClass] ?? TOKENS.muted;
  const released = row.releasedAt ? isoDate(row.releasedAt) : 'UNKNOWN';
  const parts = [
    `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="${TOKENS.surface}" stroke="${TOKENS.hairline}" stroke-width="1"/>`,
    outline(SANS, fitText(SANS, row.app.name, 20, maxText), P, 56, 20, TOKENS.text),
    outline(SANS, fitText(SANS, row.app.description, 14, maxText), P, 84, 14, TOKENS.secondary),
    hairlineH(P, 112, maxText),
    outline(SANS, row.app.platform.toUpperCase(), P, 144, 12, TOKENS.secondary, 0.08),
    `<rect x="${round2(P + textWidth(SANS, row.app.platform.toUpperCase(), 12, 0.08) + 16)}" y="136" width="8" height="8" fill="${classColor}"/>`,
    outline(SANS, row.app.privacyClass, round2(P + textWidth(SANS, row.app.platform.toUpperCase(), 12, 0.08) + 32), 144, 12, classColor, 0.08),
    outline(MONO, `${row.version} · ${released}`, P, 192, 12, TOKENS.muted),
  ];
  if (row.demo === 'LIVE') {
    const label = 'LIVE';
    const lw = textWidth(SANS, label, 12, 0.08);
    parts.push(`<rect x="${round2(W - P - lw - 24)}" y="184" width="8" height="8" fill="${TOKENS.signal}"/>`);
    parts.push(outline(SANS, label, round2(W - P - lw - 8), 192, 12, TOKENS.signal, 0.08));
  }
  return svg(W, H, parts.join('\n'));
}

// ---- assets/method.svg: contract chain, static content -------------------------------

export function methodSvg() {
  const W = 1200;
  const H = 168;
  const M = 48;
  const gap = 16;
  const boards = [
    ['01', 'IDEA'], ['02', 'PRD'], ['03', 'ARD'], ['04', 'TRD'], ['05', 'TASKS'], ['+', 'AGENTS.md'],
  ];
  const bw = (W - 2 * M - (boards.length - 1) * gap) / boards.length;
  const parts = [];
  boards.forEach(([num, name], i) => {
    const x = round2(M + i * (bw + gap));
    parts.push(`<rect x="${x + 0.5}" y="24.5" width="${round2(bw - 1)}" height="119" fill="${TOKENS.surface}" stroke="${TOKENS.hairline}" stroke-width="1"/>`);
    parts.push(outline(MONO, num, x + 16, 64, 12, TOKENS.muted));
    parts.push(outline(SANS, fitText(SANS, name, 16, bw - 32), x + 16, 104, 16, num === '+' ? TOKENS.secondary : TOKENS.text));
  });
  return svg(W, H, parts.join('\n'));
}

// ---- write all assets ------------------------------------------------------------------

export const CARD_IDS = ['browser-linux', 'scratch-pad', 'sonora', 'f1-telemetry-pro', 'ai-rules-builder', 'cascade'];

export async function writeAssets(root, ctx) {
  const { rows, repos, appsShipped, lastReleaseAgo, telemetryEndpoints, profile } = ctx;
  await mkdir(join(root, 'assets/cards'), { recursive: true });
  const flagship = rows.find(({ app }) => app.flagship);
  const files = new Map([
    ['assets/header.svg', headerSvg(profile)],
    ['assets/status.svg', statusSvg({ repos, appsShipped, lastReleaseAgo, telemetryEndpoints })],
    ['assets/method.svg', methodSvg()],
  ]);
  if (flagship) files.set('assets/flagship.svg', flagshipSvg(flagship));
  for (const id of CARD_IDS) {
    const row = rows.find((r) => r.app.id === id);
    if (row) files.set(`assets/cards/${id}.svg`, cardSvg(row));
  }
  for (const [path, content] of files) {
    if (content.includes('NaN')) throw new Error(`scripts/svg.mjs: NaN coordinate in ${path}; refusing to write a broken SVG.`);
    await writeFile(join(root, path), content);
  }
  return [...files.keys()];
}
