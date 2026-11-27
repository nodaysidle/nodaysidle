#!/usr/bin/env node
// Self-check for the SVG layer: edge cases the daily data rarely hits must still
// produce a valid, NaN-free image, and the flat-stretch label must be exact.
//   node scripts/selfcheck.mjs

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFonts, drumSvg, flagshipSvg, OUTLINE_STATS } from './svg.mjs';

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
const ok = (svg) => {
  assert.ok(svg.startsWith('<svg') && svg.trimEnd().endsWith('</svg>'));
  assert.ok(!svg.includes('NaN') && !svg.includes('undefined') && !svg.includes('<text'));
};

const cases = [
  [],                                                      // no rows at all
  [row('A', null), row('B', null)],                        // every gap UNKNOWN: pen lifts
  [row('A', 0), row('B', 0), row('C', 0)],                 // three releases today
  [row('A', 5), row('B', 33)],                             // 27 flat days between them
  [row('A', 5), row('B', 130)],                            // window widens past 70 days
  [row('A', 2, { demo: 'LIVE' }), row('B', 69, { demo: 'UNKNOWN (HTTP 503)' })],
];
for (const rows of cases) {
  ok(drumSvg(ctx(rows)));
  ok(drumSvg(ctx(rows, { repos: 'UNKNOWN', lastReleaseAgo: 'UNKNOWN', telemetryEndpoints: 1 })));
  for (const r of rows) ok(flagshipSvg(r));
}

// Gaps 5 and 33 leave days 6..32 flat: 27 days, dated in Europe/Ljubljana day keys.
const labels = OUTLINE_STATS.map((s) => s.text);
assert.ok(labels.includes('27 days flat · 2026-10-26 → 2026-11-21'), 'flat-stretch label');
assert.ok(labels.includes('v1.0.0 · 69 d · demo UNKNOWN'), 'failed demo stays visible as UNKNOWN');
assert.ok(labels.includes('UNKNOWN · UNKNOWN'), 'unknown gap is labelled, not dropped');

console.log(`selfcheck: ${cases.length} cases ok`);
