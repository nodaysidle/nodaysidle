// SVG layer for the profile. All SVGs are self-contained: every glyph is
// outlined to a path at build time with opentype.js, no <text>, no scripts, no
// external references. Colors are exactly the TRD tokens; no gradients, no
// glows, no rounded rectangles. Signal green marks today's stylus and
// verified-live demos only. The only motion is the stylus and live-ring pulse.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import opentype from 'opentype.js';
import { isoDate, dayNumber } from './dates.mjs';

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
  grid: '#15181B', // chart paper, one square per day
  dormant: '#E05A47', // the 60-day line and anything past it
};

const GRID = 8;
const round2 = (n) => Math.round(n * 100) / 100;

let SANS = null; // IBM Plex Sans 500, labels
let MONO = null; // IBM Plex Mono 400, data
let DISPLAY = null; // Barlow Semi Condensed 600, wordmark and channel names

export async function loadFonts(root) {
  const load = async (file) => {
    const buf = await readFile(join(root, 'assets/fonts', file));
    return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  };
  SANS = await load('ibm-plex-sans-500.woff');
  MONO = await load('ibm-plex-mono-400.woff');
  DISPLAY = await load('barlow-semi-condensed-600.ttf');
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

// ---- assets/drum.svg: strip-chart recorder ("The Idle Drum") -------------------------

const DRUM_STYLE = [
  '<style>',
  '.sty{animation:sty 2.4s ease-in-out infinite}@keyframes sty{50%{opacity:.35}}',
  '.live{animation:live 3s ease-out infinite;transform-box:fill-box;transform-origin:center}@keyframes live{0%{opacity:.9;transform:scale(.6)}100%{opacity:0;transform:scale(1.6)}}',
  '@media (prefers-reduced-motion:reduce){.sty,.live{animation:none}}',
  '</style>',
].join('\n');

const outlineRight = (font, text, rightX, y, size, fill, tracking = 0) =>
  outline(font, text, round2(rightX - textWidth(font, text, size, tracking)), y, size, fill, tracking);

const outlineCenter = (font, text, centerX, y, size, fill, tracking = 0) =>
  outline(font, text, round2(centerX - textWidth(font, text, size, tracking) / 2), y, size, fill, tracking);

function sprocketStrip(width, y) {
  const segs = [];
  const sy = round2(y);
  for (let x = 9; x + 6 <= width; x += 24) segs.push(`M${x} ${sy}h6v6h-6z`);
  return `<path fill="#050607" d="${segs.join('')}"/>`;
}

const dateAtGap = (baseDay, d) => new Date((baseDay - d) * 86_400_000).toISOString().slice(0, 10);

export function drumSvg({ profile, repos, appsShipped, lastReleaseAgo, telemetryEndpoints, rows = [], buildDate }) {
  const W = 840;
  const X0 = 184;
  const X1 = 816;
  const TOP = 206;
  const Y00 = TOP + 72;
  const YT = Y00 + 96;
  const Y_SEP = YT + 36;
  const YC0 = Y_SEP + 60;
  const PITCH = 34;

  const gaps = rows.map((r) => r.gap).filter((g) => g !== null && Number.isFinite(g));
  const maxGap = gaps.length ? Math.max(0, ...gaps) : 0;
  const windowDays = Math.max(70, Math.ceil((maxGap + 4) / 10) * 10);
  const pxPerDay = (X1 - X0) / windowDays;
  const dayX = (d) => round2(X0 + d * pxPerDay);

  const lastChannelY = rows.length ? YC0 + (rows.length - 1) * PITCH : Y_SEP + 24;
  const yLegend = lastChannelY + 44;
  const chartBottom = yLegend - 20;
  const H = yLegend + 36;

  const parts = [DRUM_STYLE, sprocketStrip(W, 6)];

  // Masthead
  parts.push(outline(DISPLAY, profile.name, 24, 76, 56, TOKENS.text, 0.08));
  parts.push(outline(SANS, fitText(SANS, profile.tagline, 15, W - 48), 24, 102, 15, TOKENS.secondary));
  parts.push(outlineRight(MONO, `LOG ${buildDate}`, X1, 50, 13, TOKENS.secondary));
  parts.push(outlineRight(MONO, `1 d = ${pxPerDay.toFixed(1)} px · ${windowDays} d`, X1, 70, 13, TOKENS.secondary));

  // Counters
  const counters = [
    [String(repos), 'PUBLIC REPOS'],
    [String(appsShipped), 'APPS SHIPPED'],
    [String(lastReleaseAgo), 'LAST RELEASE'],
    [String(telemetryEndpoints), 'TELEMETRY ENDPOINTS'],
  ];
  counters.forEach(([value, label], i) => {
    const x = 24 + i * 198;
    parts.push(outline(MONO, fitText(MONO, value, 28, 190), x, 148, 28, TOKENS.text));
    parts.push(outline(SANS, label, x, 170, 13, TOKENS.secondary, 0.06));
  });

  // Chart field: dormant tint, day grid, 60-day boundary, axis labels
  const x60 = dayX(60);
  parts.push(
    `<rect x="${x60}" y="${TOP}" width="${round2(X1 - x60)}" height="${round2(chartBottom - TOP)}" fill="${TOKENS.dormant}" fill-opacity="0.08"/>`,
  );

  const minorGrid = [];
  const majorGrid = [];
  for (let d = 0; d <= windowDays; d += 1) {
    const seg = `M${dayX(d)} ${TOP}V${chartBottom}`;
    if (d % 10 === 0) majorGrid.push(seg);
    else minorGrid.push(seg);
  }
  parts.push(`<path fill="none" stroke="${TOKENS.grid}" stroke-width="1" d="${minorGrid.join('')}"/>`);
  parts.push(`<path fill="none" stroke="${TOKENS.hairline}" stroke-width="1" d="${majorGrid.join('')}"/>`);
  parts.push(`<path fill="none" stroke="${TOKENS.dormant}" stroke-width="2" d="M${x60} ${TOP}V${chartBottom}"/>`);
  parts.push(outline(SANS, 'DORMANT', round2(x60 + 8), TOP + 20, 13, TOKENS.dormant, 0.08));

  const tickStep = windowDays > 100 ? 20 : 10;
  parts.push(outlineCenter(MONO, 'NOW', dayX(0), TOP - 8, 13, TOKENS.signal));
  for (let d = tickStep; d <= windowDays; d += tickStep) {
    const label = `${d} d`;
    const cx = dayX(d);
    if (d === windowDays && cx + textWidth(MONO, label, 13) / 2 > X1 + 12) continue;
    parts.push(outlineCenter(MONO, label, cx, TOP - 8, 13, d === 60 ? TOKENS.dormant : TOKENS.secondary));
  }

  // CH-00: studio trace
  parts.push(outline(MONO, 'CH-00 STUDIO', 24, Y00 - 2, 14, TOKENS.text));
  parts.push(outline(SANS, 'every release', 24, Y00 + 16, 13, TOKENS.secondary));

  const gapCounts = new Map();
  for (const row of rows) {
    if (row.gap === null || !Number.isFinite(row.gap)) continue;
    gapCounts.set(row.gap, (gapCounts.get(row.gap) ?? 0) + 1);
  }
  const distinctGaps = [...gapCounts.keys()].sort((a, b) => a - b);

  const trace = [`M${X0} ${Y00}`];
  for (const g of distinctGaps) {
    const x = dayX(g);
    const n = gapCounts.get(g);
    const peakY = round2(Math.max(TOP, Y00 - (36 + 12 * (n - 1))));
    trace.push(
      `L${round2(Math.max(X0, x - 2))} ${Y00}`,
      `L${x} ${peakY}`,
      `L${round2(Math.min(X1, x + 2))} ${Y00 + 14}`,
      `L${round2(Math.min(X1, x + 4))} ${Y00}`,
    );
  }
  trace.push(`L${X1} ${Y00}`);
  parts.push(`<path fill="none" stroke="${TOKENS.text}" stroke-width="1.5" stroke-linejoin="round" d="${trace.join('')}"/>`);

  // Longest flat stretch between consecutive distinct release days
  let bestFlat = null;
  for (let i = 0; i < distinctGaps.length - 1; i += 1) {
    const a = distinctGaps[i];
    const b = distinctGaps[i + 1];
    const span = b - a - 1;
    if (!bestFlat || span > bestFlat.span) bestFlat = { a, b, span };
  }
  const baseDay = dayNumber(buildDate);
  if (bestFlat && bestFlat.span >= 7 && Number.isFinite(baseDay)) {
    const bx0 = dayX(bestFlat.a + 1);
    const bx1 = dayX(bestFlat.b - 1);
    const by = Y00 + 32;
    parts.push(
      `<path fill="none" stroke="${TOKENS.secondary}" stroke-width="1" d="M${bx0} ${by - 4}V${by + 4}M${bx0} ${by}H${bx1}M${bx1} ${by - 4}V${by + 4}"/>`,
    );
    const flatLabel = `${bestFlat.span} days flat · ${dateAtGap(baseDay, bestFlat.b - 1)} → ${dateAtGap(baseDay, bestFlat.a + 1)}`;
    const fw = textWidth(MONO, flatLabel, 13);
    const fx = round2(Math.min(Math.max((bx0 + bx1) / 2 - fw / 2, X0), X1 - fw));
    parts.push(outline(MONO, flatLabel, fx, Y00 + 52, 13, TOKENS.secondary));
  }
  parts.push(`<circle class="sty" cx="${X0}" cy="${Y00}" r="5" fill="${TOKENS.signal}"/>`);

  // CH-T: telemetry
  parts.push(outline(MONO, 'CH-T TELEMETRY', 24, YT - 2, 14, TOKENS.text));
  parts.push(outline(SANS, 'sum of registry flags', 24, YT + 16, 13, TOKENS.secondary));
  const telColor = telemetryEndpoints === 0 ? TOKENS.LOCAL : TOKENS.dormant;
  parts.push(`<path fill="none" stroke="${telColor}" stroke-width="1.5" d="M${X0} ${YT}H${X1}"/>`);
  parts.push(outline(MONO, `${telemetryEndpoints} endpoints`, X0 + 8, YT - 8, 13, telColor));

  // Section divider and caption
  parts.push(hairlineH(24, Y_SEP, W - 48));
  parts.push(outline(SANS, 'ONE CHANNEL PER APP · NEWEST RELEASE FIRST', 24, Y_SEP + 24, 13, TOKENS.secondary, 0.06));

  // Per-app channels
  rows.forEach((row, i) => {
    const y = YC0 + i * PITCH;
    const nameColor = row.dormant ? TOKENS.secondary : TOKENS.text;
    // The wordmark sits right above, so the studio prefix is dropped in the rail.
    const name = row.app.name.replace(`${profile.name} `, '');
    parts.push(outline(DISPLAY, fitText(DISPLAY, name, 19, 148), 24, y + 5, 19, nameColor));
    const c = TOKENS[row.app.privacyClass] ?? TOKENS.muted;
    if (row.gap === null || !Number.isFinite(row.gap)) {
      parts.push(`<path fill="none" stroke="${TOKENS.muted}" stroke-width="1.5" stroke-dasharray="4 6" d="M${X0} ${y}H${X1}"/>`);
      parts.push(outline(MONO, `${row.version} · UNKNOWN`, X0 + 8, y - 8, 13, TOKENS.muted));
      return;
    }
    const pipX = dayX(row.gap);
    parts.push(`<path fill="none" stroke="${c}" stroke-width="2" d="M${X0} ${y}H${pipX}"/>`);
    parts.push(`<path fill="none" stroke="${c}" stroke-width="3" d="M${pipX} ${y - 14}V${y + 4}"/>`);
    if (row.demo === 'LIVE') {
      parts.push(`<circle class="live" cx="${pipX}" cy="${y - 5}" r="7" fill="none" stroke="${TOKENS.signal}" stroke-width="1.5"/>`);
    }
    let label = `${row.version} · ${row.gap} d`;
    if (row.demo === 'LIVE') label += ' · LIVE';
    else if (row.demo !== null && row.demo !== undefined) label += ' · demo UNKNOWN';
    const labelColor = row.dormant ? TOKENS.dormant : TOKENS.secondary;
    const lw = textWidth(MONO, label, 13);
    const pad = row.demo === 'LIVE' ? 16 : 8; // clear of the pulsing ring
    if (pipX + pad + lw <= X1) {
      parts.push(outline(MONO, label, round2(pipX + pad), y + 4, 13, labelColor));
    } else {
      parts.push(outlineRight(MONO, label, round2(pipX - 8), y - 8, 13, labelColor));
    }
  });

  // Legend
  const legendItems = [
    { kind: 'box', color: TOKENS.LOCAL, full: 'LOCAL stays on your machine', short: 'LOCAL' },
    { kind: 'box', color: TOKENS.KEYS, full: 'KEYS your own keys', short: 'KEYS' },
    { kind: 'box', color: TOKENS.PUBLIC, full: 'PUBLIC public data', short: 'PUBLIC' },
    { kind: 'ring', color: TOKENS.signal, full: 'LIVE demo answered', short: 'LIVE' },
  ];
  const SWATCH = 8;
  const SWATCH_GAP = 8;
  const ITEM_GAP = 20;
  const fullW = legendItems.reduce(
    (sum, item, idx) => sum + SWATCH + SWATCH_GAP + textWidth(SANS, item.full, 13) + (idx > 0 ? ITEM_GAP : 0),
    0,
  );
  const compact = X0 + fullW > X1;
  let lx = X0;
  for (const item of legendItems) {
    const text = compact ? item.short : item.full;
    if (item.kind === 'box') {
      parts.push(`<rect x="${round2(lx)}" y="${round2(yLegend - 8)}" width="8" height="8" fill="${item.color}"/>`);
    } else {
      parts.push(`<circle cx="${round2(lx + 4)}" cy="${round2(yLegend - 4)}" r="4" fill="none" stroke="${item.color}" stroke-width="1.5"/>`);
    }
    parts.push(outline(SANS, text, round2(lx + SWATCH + SWATCH_GAP), yLegend, 13, TOKENS.secondary));
    lx = round2(lx + SWATCH + SWATCH_GAP + textWidth(SANS, text, 13) + ITEM_GAP);
  }

  parts.push(sprocketStrip(W, H - 12));
  return svg(W, H, parts.join('\n'));
}

// ---- assets/flagship.svg: flagship channel loupe, live data injected ----------------

export function flagshipSvg(row) {
  const W = 840;
  const H = 216;
  const X0 = 72;
  const X1 = 792;
  const Y = 160;
  const hasGap = Number.isFinite(row.gap);
  const gap = hasGap ? Math.max(0, row.gap) : null;
  const windowDays = Math.max(14, (gap ?? 0) + 2);
  const pxPerDay = (X1 - X0) / windowDays;
  const dayX = (d) => round2(X0 + d * pxPerDay);
  const classColor = TOKENS[row.app.privacyClass] ?? TOKENS.muted;
  const legend = row.app.privacyClass === 'KEYS' ? 'cloud calls with your own keys, never ours'
    : row.app.privacyClass === 'LOCAL' ? 'stays on your machine'
    : 'public data only';

  const winLabel = `${windowDays} d WINDOW`;
  const appName = fitText(DISPLAY, String(row.app.name).toUpperCase(), 34, 480, 0.04);
  const version = String(row.version ?? 'UNKNOWN');
  const classLabel = `class ${row.app.privacyClass}`;
  const releasedLabel = `released ${row.releasedAt ? isoDate(row.releasedAt) : 'UNKNOWN'}`;
  const legendX = round2(44 + textWidth(MONO, classLabel, 14) + 16);

  const parts = [
    '<style>\n.sty{animation:sty 2.4s ease-in-out infinite}@keyframes sty{50%{opacity:.35}}\n@media (prefers-reduced-motion:reduce){.sty{animation:none}}\n</style>',
    `<rect x="0.5" y="0.5" width="${round2(W - 1)}" height="${round2(H - 1)}" fill="${TOKENS.surface}" stroke="${TOKENS.hairline}" stroke-width="1"/>`,
    outline(MONO, 'CH-01 LOUPE', 24, 40, 13, TOKENS.muted),
    outline(MONO, winLabel, round2(816 - textWidth(MONO, winLabel, 13)), 40, 13, TOKENS.secondary),
    outline(DISPLAY, appName, 24, 82, 34, TOKENS.text, 0.04),
    outline(MONO, version, round2(816 - textWidth(MONO, version, 20)), 82, 20, TOKENS.text),
    `<rect x="24" y="98" width="10" height="10" fill="${classColor}"/>`,
    outline(MONO, classLabel, 44, 108, 14, TOKENS.text),
    outline(SANS, legend, legendX, 108, 13, TOKENS.muted),
    outline(MONO, releasedLabel, round2(816 - textWidth(MONO, releasedLabel, 13)), 108, 13, TOKENS.secondary),
  ];

  // Emit all day ticks in one <path>; step by 5 days once the window exceeds 60 d.
  const tickStep = windowDays > 60 ? 5 : 1;
  const ticks = [];
  for (let d = 0; d <= windowDays; d += tickStep) {
    ticks.push(`M${dayX(d)} ${round2(Y - 6)}V${round2(Y + 6)}`);
  }
  parts.push(`<path d="${ticks.join(' ')}" fill="none" stroke="${TOKENS.hairline}" stroke-width="1"/>`);

  if (!hasGap) {
    const unknownLabel = 'UNKNOWN';
    const unknownX = round2((X0 + X1) / 2 - textWidth(MONO, unknownLabel, 14) / 2);
    parts.push(`<line x1="${round2(X0)}" y1="${round2(Y)}" x2="${round2(X1)}" y2="${round2(Y)}" stroke="${TOKENS.muted}" stroke-width="1.5" stroke-dasharray="4 6"/>`);
    parts.push(outline(MONO, unknownLabel, unknownX, round2(Y - 14), 14, TOKENS.muted));
  } else {
    const pipX = dayX(gap);
    parts.push(`<line x1="${round2(X0)}" y1="${round2(Y)}" x2="${round2(X1)}" y2="${round2(Y)}" stroke="${TOKENS.hairline}" stroke-width="1"/>`);
    parts.push(`<line x1="${round2(X0)}" y1="${round2(Y)}" x2="${pipX}" y2="${round2(Y)}" stroke="${classColor}" stroke-width="3"/>`);
    parts.push(`<line x1="${pipX}" y1="${round2(Y - 22)}" x2="${pipX}" y2="${round2(Y + 8)}" stroke="${classColor}" stroke-width="4"/>`);
  }

  parts.push(`<circle class="sty" cx="${round2(X0)}" cy="${round2(Y)}" r="6" fill="${TOKENS.signal}"/>`);

  const labelY = round2(Y + 34);
  const nowLabel = 'NOW';
  const nowW = textWidth(MONO, nowLabel, 13);
  const nowX = round2(X0 - nowW / 2);
  const nowRight = nowX + nowW;
  parts.push(outline(MONO, nowLabel, nowX, labelY, 13, TOKENS.signal));

  let pipLabelRight = null;
  if (hasGap) {
    const pipX = dayX(gap);
    const pipLabel = `${gap} d idle`;
    const pipW = textWidth(MONO, pipLabel, 13);
    const minPipX = Math.max(24, nowRight + 12);
    const maxPipX = 816 - pipW;
    const pipLabelX = round2(Math.min(maxPipX, Math.max(minPipX, pipX - pipW / 2)));
    pipLabelRight = pipLabelX + pipW;
    parts.push(outline(MONO, pipLabel, pipLabelX, labelY, 13, row.dormant ? TOKENS.dormant : TOKENS.secondary));
  }

  const endLabel = `${windowDays} d`;
  const endX = round2(X1 - textWidth(MONO, endLabel, 13));
  if (pipLabelRight === null || endX - pipLabelRight >= 12) {
    parts.push(outline(MONO, endLabel, endX, labelY, 13, TOKENS.muted));
  }

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
  const { rows } = ctx;
  await mkdir(join(root, 'assets/cards'), { recursive: true });
  const flagship = rows.find(({ app }) => app.flagship);
  const files = new Map([
    ['assets/drum.svg', drumSvg(ctx)],
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
