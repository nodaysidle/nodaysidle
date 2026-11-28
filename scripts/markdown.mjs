// Markdown and HTML fragments for README.md. Kept apart from build.mjs so the
// self-check can exercise them without a network.
//
// Registry text is human-maintained; repository descriptions come from the
// GitHub API and are treated as untrusted: escapeText neutralises every
// character that GitHub Markdown or its HTML sanitizer would interpret.

export const cell = (s) => String(s).replace(/\|/g, '\\|');
export const link = (text, url) => `[${cell(text)}](${url})`;

export const escapeText = (s) =>
  String(s)
    .replace(/[\r\n]+/g, ' ')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/([\\`*_[\]()#!|~])/g, '\\$1')
    .trim();

const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The dark asset is the <img> fallback: it carries its own background, so it
// stays legible on clients that ignore <source>.
export function themedImage(base, alt) {
  return [
    '<picture>',
    `  <source media="(prefers-color-scheme: light)" srcset="assets/${base}-light.svg">`,
    `  <img src="assets/${base}.svg" width="100%" alt="${attr(alt)}">`,
    '</picture>',
  ].join('\n');
}

const byName = (a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase(), 'en') || a.name.localeCompare(b.name, 'en');

// index: array of { name, url, description, language, fork, archived }, or null
// when the GitHub API could not be read.
export function repoIndexBlock(index, publicRepos) {
  if (!Array.isArray(index)) {
    return 'Repository index: UNKNOWN (the GitHub API could not be read at build time).';
  }
  const own = index.filter((r) => !r.fork).sort(byName);
  const forks = index.filter((r) => r.fork).sort(byName);
  const summary = `${own.length} own repositories and ${forks.length} forks, listed from the GitHub API at build time`;
  const head = '| Repository | Language | Description |';
  const rule = '| :--- | :--- | :--- |';
  const body = own.map((r) => {
    const name = `[${escapeText(r.name)}](${r.url})${r.archived ? ' · archived' : ''}`;
    const language = r.language ? escapeText(r.language) : '-';
    const description = r.description ? escapeText(r.description) : '-';
    return `| ${name} | ${language} | ${description} |`;
  });
  const forkLine = forks.length
    ? `\n\nForks: ${forks.map((r) => `[${escapeText(r.name)}](${r.url})`).join(' · ')}`
    : '';
  const mismatch = publicRepos !== 'UNKNOWN' && index.length !== publicRepos
    ? `\n\nThe index lists ${index.length} repositories; the profile reports ${publicRepos}.`
    : '';
  return `<details>\n<summary>${summary}</summary>\n\n${[head, rule, ...body].join('\n')}${forkLine}${mismatch}\n\n</details>`;
}
