# IDEA: NODAYSIDLE Profile Redesign, Deterministic Studio

## One paragraph

The GitHub profile page (the `nodaysidle/nodaysidle` README) becomes an instrument
panel, not a poster. Every number on the page is generated at build time from the
GitHub Releases API and a single app registry, so the page can never go stale or
make an unverified claim. Color, once the SVG phase lands, means verification and
nothing else. The page reads as a report: a status strip, a release ledger, one
flagship, one method strip, and a privacy matrix.

## Why

- The current page is hand-designed around a racing metaphor that no longer matches
  the studio's positioning: deterministic, privacy-first software for Linux.
- The current data flow copies versions from the apps site, which is already stale:
  the site says Kureksistant v0.2.1 while GitHub Releases has v0.2.5, and the same
  for the browser. Copying from a copy guarantees drift.
- The studio's rule is that nothing is done until it is verified live. The profile
  page should obey the same rule it advertises.

## Goals

1. Every displayed number is traceable to the GitHub API or the registry.
2. The page regenerates at least once per day, unattended.
3. Unverifiable values render as UNKNOWN, never guessed, never hidden.
4. One flagship app above the fold: Kureksistant.
5. Honest history: dormant apps stay listed and tagged, not deleted.

## Non-goals

- No racing metaphor, no hero footage, no looping GIFs.
- No client-side scripts: GitHub sanitizes them away anyway.
- No hand-maintained versions, counts, or dates anywhere in the output.
- Not a portfolio site: nodaysidle-apps.vercel.app already is one.
