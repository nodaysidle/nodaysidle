// SVG layer for the profile. All SVGs are self-contained: every glyph is
// outlined to a path at build time with opentype.js, no <text>, no scripts, no
// external references. Colors are exactly the TRD tokens of one palette; no
// gradients, no glows, no rounded rectangles. Signal marks today's stylus and
// verified-live demos only. The only motion is the stylus and live-ring pulse.
// Each asset is written once per palette: GitHub serves SVGs through <img>, so
// the README picks the variant with <picture> and prefers-color-scheme.

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import opentype from 'opentype.js';
import { isoDate, dayNumber } from './dates.mjs';

export const PALETTES = {
  dark: {
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
    sprocket: '#050607',
  },
  light: {
    bg: '#FFFFFF',
    surface: '#F6F8FA',
    hairline: '#D1D9E0',
    text: '#1F2328',
    secondary: '#59636E',
    muted: '#656D76',
    signal: '#4A7F12',
    LOCAL: '#4A7F12',
    KEYS: '#9A6700',
    PUBLIC: '#2F6A9A',
    grid: '#EFF2F5',
    dormant: '#CF222E',
    sprocket: '#D1D9E0',
  },
};

const GRID = 8;
const LINE_CLEAR = 4; // minimum gap between a chart label and the 60-day line
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
  OUTLINE_STATS.push({ text, drawn, expected, x: round2(x), y: baseY, width: round2(textWidth(font, text, size, tracking)) });
  return `<path fill="${fill}" d="${parts.join(' ')}"/>`;
}

function fitText(font, text, size, maxWidth, tracking = 0) {
  if (textWidth(font, text, size, tracking) <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && textWidth(font, `${t}…`, size, tracking) > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}


function svg(t, width, height, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">\n<rect width="${width}" height="${height}" fill="${t.bg}"/>\n${body}\n</svg>\n`;
}

const hairlineH = (t, x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${t.hairline}"/>`;

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

function sprocketStrip(t, width, y) {
  const segs = [];
  const sy = round2(y);
  for (let x = 9; x + 6 <= width; x += 24) segs.push(`M${x} ${sy}h6v6h-6z`);
  return `<path fill="${t.sprocket}" d="${segs.join('')}"/>`;
}

const dateAtGap = (baseDay, d) => new Date((baseDay - d) * 86_400_000).toISOString().slice(0, 10);

export function drumSvg({ profile, repos, appsShipped, lastReleaseAgo, telemetryEndpoints, rows = [], buildDate }, t) {
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
  const baseWindow = Math.max(70, Math.ceil((maxGap + 4) / 10) * 10);

  // A chart label must stay inside the chart and must not cross the 60-day line.
  // Each channel label goes right of its pip, else above the line to its left.
  // When the full label fits nowhere, the window widens in 10-day steps; when no
  // window fits it either, the label drops the version (the ledger carries it),
  // then the demo state, keeping the gap.
  const channelLabels = rows.map((row) => {
    if (row.gap === null || !Number.isFinite(row.gap)) return null;
    const demo = row.demo === 'LIVE' ? ' · LIVE'
      : row.demo !== null && row.demo !== undefined ? ' · demo UNKNOWN' : '';
    const texts = [`${row.version} · ${row.gap} d${demo}`, `${row.gap} d${demo}`, `${row.gap} d`];
    const pad = row.demo === 'LIVE' ? 16 : 8; // clear of the ring
    return [...new Set(texts)].map((text) => ({ text, width: textWidth(MONO, text, 13), pad }));
  });
  const scale = (days) => {
    const px = (X1 - X0) / days;
    const at = (d) => round2(X0 + d * px);
    const x60 = at(60);
    const clear = (x, w) => x >= X0 && x + w <= X1 && (x + w <= x60 - LINE_CLEAR || x >= x60 + LINE_CLEAR);
    const place = (candidates, w) => candidates.find((c) => clear(c.x, w)) ?? null;
    const placeChannel = (row, variants) => {
      const pipX = at(row.gap);
      for (const label of variants) {
        const spot = place([
          { x: round2(pipX + label.pad), dy: 4 },
          { x: Math.floor((pipX - label.pad - label.width) * 100) / 100, dy: -8 },
        ], label.width);
        if (spot) return { ...spot, text: label.text };
      }
      return null;
    };
    return { days, px, at, x60, place, placeChannel };
  };
  const fitsAll = (sc, fullOnly) =>
    rows.every((row, i) => !channelLabels[i] || sc.placeChannel(row, fullOnly ? channelLabels[i].slice(0, 1) : channelLabels[i]));
  let sc = scale(baseWindow);
  for (let days = baseWindow; days <= baseWindow + 300 && !fitsAll(sc, true); days += 10) sc = scale(days + 10);
  if (!fitsAll(sc, true)) sc = scale(baseWindow);
  const windowDays = sc.days;
  const pxPerDay = sc.px;
  const dayX = sc.at;

  const lastChannelY = rows.length ? YC0 + (rows.length - 1) * PITCH : Y_SEP + 24;
  const yLegend = lastChannelY + 44;
  const chartBottom = yLegend - 20;
  const H = yLegend + 36;

  const parts = [DRUM_STYLE, sprocketStrip(t, W, 6)];

  // Masthead
  parts.push(outline(DISPLAY, profile.name, 24, 76, 56, t.text, 0.08));
  parts.push(outline(SANS, fitText(SANS, profile.tagline, 15, W - 48), 24, 102, 15, t.secondary));
  parts.push(outlineRight(MONO, `LOG ${buildDate}`, X1, 50, 13, t.secondary));
  parts.push(outlineRight(MONO, `1 d = ${pxPerDay.toFixed(1)} px · ${windowDays} d`, X1, 70, 13, t.secondary));

  // Counters
  const counters = [
    [String(repos), 'PUBLIC REPOS'],
    [String(appsShipped), 'APPS SHIPPED'],
    [String(lastReleaseAgo), 'LAST RELEASE'],
    [String(telemetryEndpoints), 'TELEMETRY ENDPOINTS'],
  ];
  counters.forEach(([value, label], i) => {
    const x = 24 + i * 198;
    parts.push(outline(MONO, fitText(MONO, value, 28, 190), x, 148, 28, t.text));
    parts.push(outline(SANS, label, x, 170, 13, t.secondary, 0.06));
  });

  // Chart field: dormant tint, day grid, 60-day boundary, axis labels
  const { x60 } = sc;
  const outlineClear = (text, y, fill) => {
    const w = textWidth(MONO, text, 13);
    const spot = sc.place([{ x: X0 + 8 }, { x: round2(x60 + 8) }], w) ?? { x: X0 + 8 };
    return outline(MONO, text, spot.x, y, 13, fill);
  };
  parts.push(
    `<rect x="${x60}" y="${TOP}" width="${round2(X1 - x60)}" height="${round2(chartBottom - TOP)}" fill="${t.dormant}" fill-opacity="0.08"/>`,
  );

  const minorGrid = [];
  const majorGrid = [];
  for (let d = 0; d <= windowDays; d += 1) {
    const seg = `M${dayX(d)} ${TOP}V${chartBottom}`;
    if (d % 10 === 0) majorGrid.push(seg);
    else minorGrid.push(seg);
  }
  parts.push(`<path fill="none" stroke="${t.grid}" stroke-width="1" d="${minorGrid.join('')}"/>`);
  parts.push(`<path fill="none" stroke="${t.hairline}" stroke-width="1" d="${majorGrid.join('')}"/>`);
  parts.push(`<path fill="none" stroke="${t.dormant}" stroke-width="2" d="M${x60} ${TOP}V${chartBottom}"/>`);
  parts.push(outline(SANS, 'DORMANT', round2(x60 + 8), TOP + 20, 13, t.dormant, 0.08));

  const tickStep = windowDays > 100 ? 20 : 10;
  parts.push(outlineCenter(MONO, 'NOW', dayX(0), TOP - 8, 13, t.signal));
  for (let d = tickStep; d <= windowDays; d += tickStep) {
    const label = `${d} d`;
    const cx = dayX(d);
    if (d === windowDays && cx + textWidth(MONO, label, 13) / 2 > X1 + 12) continue;
    parts.push(outlineCenter(MONO, label, cx, TOP - 8, 13, d === 60 ? t.dormant : t.secondary));
  }

  // CH-00: studio trace
  parts.push(outline(MONO, 'CH-00 STUDIO', 24, Y00 - 2, 14, t.text));
  parts.push(outline(SANS, 'every release', 24, Y00 + 16, 13, t.secondary));

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
  parts.push(`<path fill="none" stroke="${t.text}" stroke-width="1.5" stroke-linejoin="round" d="${trace.join('')}"/>`);

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
      `<path fill="none" stroke="${t.secondary}" stroke-width="1" d="M${bx0} ${by - 4}V${by + 4}M${bx0} ${by}H${bx1}M${bx1} ${by - 4}V${by + 4}"/>`,
    );
    const flatLabel = `${bestFlat.span} days flat · ${dateAtGap(baseDay, bestFlat.b - 1)} → ${dateAtGap(baseDay, bestFlat.a + 1)}`;
    const fw = textWidth(MONO, flatLabel, 13);
    const centred = round2(Math.min(Math.max((bx0 + bx1) / 2 - fw / 2, X0), X1 - fw));
    const spot = sc.place([{ x: centred }, { x: Math.floor((x60 - LINE_CLEAR - fw) * 100) / 100 }, { x: round2(x60 + LINE_CLEAR) }], fw);
    parts.push(outline(MONO, flatLabel, spot ? spot.x : centred, Y00 + 52, 13, t.secondary));
  }
  parts.push(`<circle class="sty" cx="${X0}" cy="${Y00}" r="5" fill="${t.signal}"/>`);

  // CH-T: telemetry
  parts.push(outline(MONO, 'CH-T TELEMETRY', 24, YT - 2, 14, t.text));
  parts.push(outline(SANS, 'sum of registry flags', 24, YT + 16, 13, t.secondary));
  const telColor = telemetryEndpoints === 0 ? t.LOCAL : t.dormant;
  parts.push(`<path fill="none" stroke="${telColor}" stroke-width="1.5" d="M${X0} ${YT}H${X1}"/>`);
  parts.push(outlineClear(`${telemetryEndpoints} endpoints`, YT - 8, telColor));

  // Section divider and caption
  parts.push(hairlineH(t, 24, Y_SEP, W - 48));
  const captions = ['ONE CHANNEL PER APP · NEWEST RELEASE FIRST', 'ONE CHANNEL PER APP'];
  const caption = captions.find((c) => 24 + textWidth(SANS, c, 13, 0.06) <= x60 - LINE_CLEAR) ?? captions[1];
  parts.push(outline(SANS, caption, 24, Y_SEP + 24, 13, t.secondary, 0.06));

  // Per-app channels
  rows.forEach((row, i) => {
    const y = YC0 + i * PITCH;
    const nameColor = row.dormant ? t.secondary : t.text;
    // The wordmark sits right above, so the studio prefix is dropped in the rail.
    const name = row.app.name.replace(`${profile.name} `, '');
    parts.push(outline(DISPLAY, fitText(DISPLAY, name, 19, 148), 24, y + 5, 19, nameColor));
    const c = t[row.app.privacyClass] ?? t.muted;
    if (row.gap === null || !Number.isFinite(row.gap)) {
      parts.push(`<path fill="none" stroke="${t.muted}" stroke-width="1.5" stroke-dasharray="4 6" d="M${X0} ${y}H${X1}"/>`);
      parts.push(outlineClear(`${row.version} · UNKNOWN`, y - 8, t.muted));
      return;
    }
    const pipX = dayX(row.gap);
    parts.push(`<path fill="none" stroke="${c}" stroke-width="2" d="M${X0} ${y}H${pipX}"/>`);
    parts.push(`<path fill="none" stroke="${c}" stroke-width="3" d="M${pipX} ${y - 14}V${y + 4}"/>`);
    if (row.demo === 'LIVE') {
      // A steady ring, plus a pulse that fades out: the marker never disappears.
      const ring = `cx="${pipX}" cy="${y - 5}" r="7" fill="none" stroke="${t.signal}" stroke-width="1.5"`;
      parts.push(`<circle ${ring}/>`, `<circle class="live" ${ring}/>`);
    }
    const labelColor = row.dormant ? t.dormant : t.secondary;
    const full = channelLabels[i][0];
    const spot = sc.placeChannel(row, channelLabels[i]) ?? { x: round2(pipX + full.pad), dy: 4, text: full.text };
    parts.push(outline(MONO, spot.text, spot.x, y + spot.dy, 13, labelColor));
  });

  // Legend
  const legendItems = [
    { kind: 'box', color: t.LOCAL, full: 'LOCAL stays on your machine', short: 'LOCAL' },
    { kind: 'box', color: t.KEYS, full: 'KEYS your own keys', short: 'KEYS' },
    { kind: 'box', color: t.PUBLIC, full: 'PUBLIC public data', short: 'PUBLIC' },
    { kind: 'ring', color: t.signal, full: 'LIVE demo answered', short: 'LIVE' },
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
    parts.push(outline(SANS, text, round2(lx + SWATCH + SWATCH_GAP), yLegend, 13, t.secondary));
    lx = round2(lx + SWATCH + SWATCH_GAP + textWidth(SANS, text, 13) + ITEM_GAP);
  }

  parts.push(sprocketStrip(t, W, H - 12));
  return svg(t, W, H, parts.join('\n'));
}

// ---- assets/flagship.svg: flagship channel loupe, live data injected ----------------

export function flagshipSvg(row, t) {
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
  const classColor = t[row.app.privacyClass] ?? t.muted;
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
    `<rect x="0.5" y="0.5" width="${round2(W - 1)}" height="${round2(H - 1)}" fill="${t.surface}" stroke="${t.hairline}" stroke-width="1"/>`,
    outline(MONO, 'CH-01 LOUPE', 24, 40, 13, t.muted),
    outline(MONO, winLabel, round2(816 - textWidth(MONO, winLabel, 13)), 40, 13, t.secondary),
    outline(DISPLAY, appName, 24, 82, 34, t.text, 0.04),
    outline(MONO, version, round2(816 - textWidth(MONO, version, 20)), 82, 20, t.text),
    `<rect x="24" y="98" width="10" height="10" fill="${classColor}"/>`,
    outline(MONO, classLabel, 44, 108, 14, t.text),
    outline(SANS, legend, legendX, 108, 13, t.muted),
    outline(MONO, releasedLabel, round2(816 - textWidth(MONO, releasedLabel, 13)), 108, 13, t.secondary),
  ];

  // Emit all day ticks in one <path>; step by 5 days once the window exceeds 60 d.
  const tickStep = windowDays > 60 ? 5 : 1;
  const ticks = [];
  for (let d = 0; d <= windowDays; d += tickStep) {
    ticks.push(`M${dayX(d)} ${round2(Y - 6)}V${round2(Y + 6)}`);
  }
  parts.push(`<path d="${ticks.join(' ')}" fill="none" stroke="${t.hairline}" stroke-width="1"/>`);

  if (!hasGap) {
    const unknownLabel = 'UNKNOWN';
    const unknownX = round2((X0 + X1) / 2 - textWidth(MONO, unknownLabel, 14) / 2);
    parts.push(`<line x1="${round2(X0)}" y1="${round2(Y)}" x2="${round2(X1)}" y2="${round2(Y)}" stroke="${t.muted}" stroke-width="1.5" stroke-dasharray="4 6"/>`);
    parts.push(outline(MONO, unknownLabel, unknownX, round2(Y - 14), 14, t.muted));
  } else {
    const pipX = dayX(gap);
    parts.push(`<line x1="${round2(X0)}" y1="${round2(Y)}" x2="${round2(X1)}" y2="${round2(Y)}" stroke="${t.hairline}" stroke-width="1"/>`);
    parts.push(`<line x1="${round2(X0)}" y1="${round2(Y)}" x2="${pipX}" y2="${round2(Y)}" stroke="${classColor}" stroke-width="3"/>`);
    parts.push(`<line x1="${pipX}" y1="${round2(Y - 22)}" x2="${pipX}" y2="${round2(Y + 8)}" stroke="${classColor}" stroke-width="4"/>`);
  }

  parts.push(`<circle class="sty" cx="${round2(X0)}" cy="${round2(Y)}" r="6" fill="${t.signal}"/>`);

  const labelY = round2(Y + 34);
  const nowLabel = 'NOW';
  const nowW = textWidth(MONO, nowLabel, 13);
  const nowX = round2(X0 - nowW / 2);
  const nowRight = nowX + nowW;
  parts.push(outline(MONO, nowLabel, nowX, labelY, 13, t.signal));

  let pipLabelRight = null;
  if (hasGap) {
    const pipX = dayX(gap);
    const pipLabel = `${gap} d idle`;
    const pipW = textWidth(MONO, pipLabel, 13);
    const minPipX = Math.max(24, nowRight + 12);
    const maxPipX = 816 - pipW;
    const pipLabelX = round2(Math.min(maxPipX, Math.max(minPipX, pipX - pipW / 2)));
    pipLabelRight = pipLabelX + pipW;
    parts.push(outline(MONO, pipLabel, pipLabelX, labelY, 13, row.dormant ? t.dormant : t.secondary));
  }

  const endLabel = `${windowDays} d`;
  const endX = round2(X1 - textWidth(MONO, endLabel, 13));
  if (pipLabelRight === null || endX - pipLabelRight >= 12) {
    parts.push(outline(MONO, endLabel, endX, labelY, 13, t.muted));
  }

  return svg(t, W, H, parts.join('\n'));
}

// ---- write all assets ------------------------------------------------------------------

const variantPath = (base, theme) => `assets/${base}${theme === 'dark' ? '' : `-${theme}`}.svg`;

export async function writeAssets(root, ctx) {
  const flagship = ctx.rows.find(({ app }) => app.flagship);
  const files = new Map();
  for (const [theme, t] of Object.entries(PALETTES)) {
    files.set(variantPath('drum', theme), drumSvg(ctx, t));
    if (flagship) files.set(variantPath('flagship', theme), flagshipSvg(flagship, t));
  }
  for (const [path, content] of files) {
    if (content.includes('NaN')) throw new Error(`scripts/svg.mjs: NaN coordinate in ${path}; refusing to write a broken SVG.`);
    await writeFile(join(root, path), content);
  }
  return [...files.keys()];
}
