// Shared day arithmetic: Europe/Ljubljana day keys, the same rule as the apps
// site and the ledger. Used by build.mjs and svg.mjs so SVG dates always match
// the Markdown ledger.

export const dayKey = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Ljubljana' }).format(new Date(iso));
export const dayNumber = (key) => Date.parse(`${key}T00:00:00Z`) / 86_400_000;
export const isoDate = (iso) => dayKey(iso);
