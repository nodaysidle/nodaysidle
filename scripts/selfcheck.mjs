#!/usr/bin/env node
// Self-check for the SVG and Markdown layers: edge cases the daily data rarely
// hits must still produce a valid, NaN-free image in every palette, each image
// may use only its own palette, the flat-stretch label must be exact, and
// untrusted repository text must not reach the page as Markdown or HTML.
//   node scripts/selfcheck.mjs

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFonts, drumSvg, flagshipSvg, PALETTES, OUTLINE_STATS } from './svg.mjs';
import { escapeText, repoIndexBlock, themedImage } from './markdown.mjs';

await loadFonts(join(dirname(fileURLToPath(import.meta.url)), '..'));

const row = (name, gap, extra = {}) => ({
  app: { id: name, name, privacyClass: 'LOCAL', platform: 'Linux' },
  version: gap === null ? 'UNKNOWN' : 'v1.0.0',
  releasedAt: gap === null ? null : '2026-11-01T00:00:00Z',
  gap,
  dormant: gap !== null && gap > 60,
  demo: null,
  ...extra,
});
const ctx = (rows, extra = {}) => ({
  profile: { name: 'NODAYSIDLE', tagline: 'Tagline.' },
  repos: 71, appsShipped: rows.length, lastReleaseAgo: '2 days ago', telemetryEndpoints: 0,
  rows, buildDate: '2026-11-27', ...extra,
});
const ok = (svg, t) => {
  assert.ok(svg.startsWith('<svg') && svg.trimEnd().endsWith('</svg>'));
  assert.ok(!svg.includes('NaN') && !svg.includes('undefined') && !svg.includes('<text'));
  const allowed = new Set(Object.values(t).map((hex) => hex.toUpperCase()));
  for (const hex of svg.match(/#[0-9A-Fa-f]{6}\b/g) ?? []) assert.ok(allowed.has(hex.toUpperCase()), `colour ${hex} is not in the palette`);
};

// Draw a drum and assert that no label in the chart body crosses the 60-day line
// or leaves the chart on the right. Dates move daily, so this runs over sweeps.
const seenLabels = new Set();
const drumClear = (c, t) => {
  for (const s of OUTLINE_STATS) seenLabels.add(s.text);
  OUTLINE_STATS.length = 0;
  const svg = drumSvg(c, t);
  ok(svg, t);
  const line = svg.match(new RegExp(`stroke="${t.dormant}" stroke-width="2" d="M([\\d.]+) ([\\d.]+)V([\\d.]+)"`));
  assert.ok(line, 'dormant line present');
  const [x60, top, bottom] = line.slice(1).map(Number);
  for (const s of OUTLINE_STATS) {
    if (s.y <= top || s.y - 10 >= bottom) continue;
    const crosses = s.x < x60 + 4 && s.x + s.width > x60 - 4;
    assert.ok(!crosses, `label "${s.text}" (x ${s.x}..${s.x + s.width}) crosses the 60-day line at ${x60}`);
    assert.ok(s.x + s.width <= 816, `label "${s.text}" runs past the chart edge`);
  }
  return svg;
};

const cases = [
  [],                                                      // no rows at all
  [row('A', null), row('B', null)],                        // every gap UNKNOWN: pen lifts
  [row('A', 0), row('B', 0), row('C', 0)],                 // three releases today
  [row('A', 5), row('B', 33)],                             // 27 flat days between them
  [row('A', 5), row('B', 130)],                            // window widens past 70 days
  [row('A', 2, { demo: 'LIVE' }), row('B', 69, { demo: 'UNKNOWN (HTTP 503)' })],
];
for (const t of Object.values(PALETTES)) {
  for (const rows of cases) {
    drumClear(ctx(rows), t);
    drumClear(ctx(rows, { repos: 'UNKNOWN', lastReleaseAgo: 'UNKNOWN', telemetryEndpoints: 1 }), t);
    for (const r of rows) ok(flagshipSvg(r, t), t);
  }
}

// Collision sweep: every day from 40 to 80 (around the line) and every 20 days
// up to 400, alone, next to a dormant app, with a live demo, with a failed demo,
// and with an UNKNOWN neighbour. Layout does not depend on the palette.
const sweepGaps = [];
for (let g = 0; g <= 400; g += 1) if ((g >= 40 && g <= 80) || g % 20 === 0) sweepGaps.push(g);
let sweeps = 0;
for (const t of [PALETTES.dark]) {
  for (const g of sweepGaps) {
    const sets = [
      [row('A', g)],
      [row('A', g), row('B', 67)],
      [row('A', g, { version: 'v10.10.10', demo: 'LIVE' }), row('B', 50)],
      [row('A', g, { demo: 'UNKNOWN (HTTP 503)' }), row('B', null)],
    ];
    for (const rows of sets) { drumClear(ctx(rows), t); sweeps += 1; }
  }
}

// The live-demo ring has a steady circle besides the pulse, so it never fades out.
const liveSvg = drumSvg(ctx([row('A', 35, { demo: 'LIVE' })]), PALETTES.dark);
assert.equal((liveSvg.match(/<circle cx="[\d.]+" cy="[\d.]+" r="7"/g) ?? []).length, 1, 'steady live ring');
assert.equal((liveSvg.match(/<circle class="live"/g) ?? []).length, 1, 'pulsing live ring');
assert.deepEqual(Object.keys(PALETTES.light).sort(), Object.keys(PALETTES.dark).sort(), 'palettes define the same tokens');

// Gaps 5 and 33 leave days 6..32 flat: 27 days, dated in Europe/Ljubljana day keys.
for (const s of OUTLINE_STATS) seenLabels.add(s.text);
const labels = [...seenLabels];
assert.ok(labels.includes('27 days flat · 2026-10-26 → 2026-11-21'), 'flat-stretch label');
assert.ok(labels.includes('v1.0.0 · 69 d · demo UNKNOWN'), 'failed demo stays visible as UNKNOWN');
assert.ok(labels.includes('UNKNOWN · UNKNOWN'), 'unknown gap is labelled, not dropped');

// Markdown layer.
const hostile = '<img src=x onerror=alert(1)> [click](javascript:alert(1)) | **bold** `code`\nline';
const escaped = escapeText(hostile);
assert.ok(!/[<>\n]/.test(escaped), 'no raw angle brackets or newlines');
assert.ok(!/(^|[^\\])[[\]|*`]/.test(escaped), 'Markdown control characters are escaped');

assert.match(repoIndexBlock(null, 71), /^Repository index: UNKNOWN/, 'unreadable index renders as UNKNOWN');
const index = [
  { name: 'zeta', url: 'https://github.com/o/zeta', description: hostile, language: null, fork: false, archived: true },
  { name: 'Alpha', url: 'https://github.com/o/Alpha', description: null, language: 'Rust', fork: false, archived: false },
  { name: 'upstream', url: 'https://github.com/o/upstream', description: 'x', language: 'Go', fork: true, archived: false },
];
const block = repoIndexBlock(index, 3);
assert.ok(block.indexOf('[Alpha]') < block.indexOf('[zeta]'), 'own repositories sorted by name');
assert.ok(block.includes('All 3 public repositories: 2 own, 1 fork</summary>'), 'counts come from the index, singular fork');
assert.ok(repoIndexBlock(index.slice(0, 1), 1).includes('All 1 public repository: 1 own, 0 forks'), 'singular repository, plural zero');
assert.ok(block.includes('[zeta](https://github.com/o/zeta) · archived | - |'), 'archived tag and missing language');
assert.ok(block.includes('Forks: [upstream]'), 'forks listed separately');
assert.ok(!block.includes('<img'), 'hostile description neutralised');
assert.ok(!block.includes('profile reports'), 'no mismatch note when counts agree');
assert.ok(repoIndexBlock(index, 4).includes('The index lists 3 repositories; the profile reports 4.'), 'count mismatch is stated');

const pic = themedImage('drum', 'a "quoted" <alt>');
assert.ok(pic.includes('srcset="assets/drum-light.svg"') && pic.includes('src="assets/drum.svg"'), 'picture variants');
assert.ok(pic.includes('alt="a &quot;quoted&quot; &lt;alt&gt;"'), 'alt text escaped');

console.log(`selfcheck: ${cases.length} cases × ${Object.keys(PALETTES).length} palettes, ${sweeps} collision sweeps ok, markdown ok`);
