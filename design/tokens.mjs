#!/usr/bin/env node
// Generates the token tables in design/claude-design-brief.md from DESIGN.md.
// DESIGN.md is the single source of truth; the brief's tables are derived.
//
//   node design/tokens.mjs           rewrite the brief's generated blocks
//   node design/tokens.mjs --check   exit 1 if the brief is out of sync
//   node design/tokens.mjs --test    self-check the colour conversion
//
// ponytail: regex table parsing, not a markdown AST. Fine while the tables stay
// pipe-delimited; swap in a real parser if DESIGN.md ever grows nested tables.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESIGN = join(ROOT, 'DESIGN.md');
const BRIEF = join(ROOT, 'design', 'claude-design-brief.md');

// Editorial annotations for the OKLCH table. Everything else is derived.
const LABELS = {
  '--color-seam': '**seam** (signature joint)',
  '--color-divider': '**divider** (rows, header, footer)',
  '--color-border': 'border (controls, data)',
};

// --- colour -----------------------------------------------------------------

function oklch(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const inGamut = lin.every((v) => v >= -0.0005 && v <= 1.0005);
  const hex = lin
    .map((v) => {
      v = Math.min(1, Math.max(0, v));
      v = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
      return Math.round(v * 255).toString(16).padStart(2, '0');
    })
    .join('');
  return { hex: `#${hex.toUpperCase()}`, inGamut };
}

const parseOklch = (s) => {
  const m = s.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/i);
  return m ? [+m[1], +m[2], +m[3]] : null;
};

// --- parse DESIGN.md --------------------------------------------------------

const cells = (line) =>
  line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim().replace(/^`|`$/g, ''));

function parseDesign(md) {
  const rows = md.split('\n').filter((l) => l.trim().startsWith('|')).map(cells);

  // primitives: | --walnut-900 | oklch(...) |
  const primitives = new Map(
    rows.filter((c) => c.length === 2 && /^--[a-z]+-\d+$/.test(c[0]) && parseOklch(c[1])).map((c) => [c[0], c[1]]),
  );

  // roles: | --color-x | <dark> | <light> |, where both values are real colours.
  // The both-resolve test is what separates the roles table from the prose
  // tables that also key on --color-* (e.g. the line-token job table).
  const isColour = (v) => primitives.has(v) || !!parseOklch(v);
  const roles = rows
    .filter((c) => c.length === 3 && c[0].startsWith('--color-') && isColour(c[1]) && isColour(c[2]))
    .map((c) => ({ token: c[0], dark: c[1], light: c[2] }));

  if (!primitives.size) throw new Error('No primitives found in DESIGN.md');
  if (!roles.length) throw new Error('No --color-* roles found in DESIGN.md');
  return { primitives, roles };
}

function resolve(value, primitives, where) {
  const raw = primitives.get(value) ?? value;
  const parsed = parseOklch(raw);
  if (!parsed) throw new Error(`${where}: cannot resolve "${value}" to an OKLCH colour`);
  // Emit DESIGN.md's literal string, not a re-rendering of the parsed numbers:
  // round-tripping through Number drops trailing zeros (0.70 -> 0.7) and the
  // brief would then differ from its own source for no reason.
  return { css: raw.match(/oklch\([^)]*\)/i)[0], ...oklch(...parsed) };
}

// --- emit -------------------------------------------------------------------

function build(md) {
  const { primitives, roles } = parseDesign(md);
  const rows = roles.map((r) => ({
    name: r.token.replace('--color-', ''),
    label: LABELS[r.token] ?? r.token.replace('--color-', ''),
    dark: resolve(r.dark, primitives, `${r.token} (dark)`),
    light: resolve(r.light, primitives, `${r.token} (light)`),
  }));

  const problems = [];
  for (const r of rows) {
    for (const theme of ['dark', 'light']) {
      if (!r[theme].inGamut) problems.push(`${r.name} (${theme}) is outside the sRGB gamut: ${r[theme].css}`);
    }
  }
  // Two roles resolving to the same colour in one theme is the defect class that
  // produced the invisible 1.00:1 dividers. Catch it here, not in a prototype.
  for (const theme of ['dark', 'light']) {
    const seen = new Map();
    for (const r of rows) {
      const k = r[theme].hex;
      if (seen.has(k)) problems.push(`${theme}: ${r.name} and ${seen.get(k)} are the same colour (${k})`);
      else seen.set(k, r.name);
    }
  }

  const oklchTable = [
    '| Role | Dark (default) | Light |',
    '|---|---|---|',
    ...rows.map((r) => `| ${r.label} | \`${r.dark.css}\` | \`${r.light.css}\` |`),
  ].join('\n');

  const hexTable = [
    '| Role | Dark hex | Light hex |',
    '|---|---|---|',
    ...rows.map((r) => `| ${r.name} | \`${r.dark.hex}\` | \`${r.light.hex}\` |`),
  ].join('\n');

  return { oklchTable, hexTable, problems, count: rows.length };
}

function splice(brief, name, body) {
  const begin = `<!-- tokens:${name} -->`;
  const end = `<!-- /tokens:${name} -->`;
  const re = new RegExp(`${begin}\\n[\\s\\S]*?\\n${end}`);
  if (!re.test(brief)) throw new Error(`Missing ${begin} … ${end} markers in ${BRIEF}`);
  return brief.replace(re, `${begin}\n${body}\n${end}`);
}

// --- self-check -------------------------------------------------------------

function test() {
  const assert = (cond, msg) => { if (!cond) throw new Error(`FAIL: ${msg}`); };
  assert(oklch(0.70, 0.11, 135).hex === '#80AE67', 'accent dark converts to #80AE67');
  assert(oklch(0.19, 0.015, 55).hex === '#19120D', 'surface dark converts to #19120D');
  assert(oklch(0.70, 0.11, 135).inGamut, 'accent dark is in gamut');
  assert(!oklch(0.4, 0.14, 135).inGamut, 'the old light focus is flagged out of gamut');
  assert(parseOklch('`oklch(0.52 0.08 135)`')[1] === 0.08, 'parses chroma');
  const { problems, count } = build(readFileSync(DESIGN, 'utf8'));
  assert(count >= 13, `parsed ${count} roles from DESIGN.md`);
  assert(problems.length === 0, `DESIGN.md is clean, got: ${problems.join('; ')}`);
  console.log(`ok — conversion, parsing, and ${count} roles from DESIGN.md all check out`);
}

// --- main -------------------------------------------------------------------

const mode = process.argv[2];
if (mode === '--test') {
  test();
} else {
  const { oklchTable, hexTable, problems, count } = build(readFileSync(DESIGN, 'utf8'));
  if (problems.length) {
    console.error('DESIGN.md has token defects:\n- ' + problems.join('\n- '));
    process.exit(1);
  }
  const before = readFileSync(BRIEF, 'utf8');
  const after = splice(splice(before, 'oklch', oklchTable), 'hex', hexTable);
  if (mode === '--check') {
    if (after !== before) {
      console.error(`${BRIEF} is out of sync with DESIGN.md. Run: node design/tokens.mjs`);
      process.exit(1);
    }
    console.log(`in sync — ${count} roles`);
  } else {
    if (after === before) console.log(`already up to date — ${count} roles`);
    else { writeFileSync(BRIEF, after); console.log(`updated ${count} roles in design/claude-design-brief.md`); }
  }
}
