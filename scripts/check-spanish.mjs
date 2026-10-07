#!/usr/bin/env node
// Guards the register of the Spanish translations.
//
//   node scripts/check-spanish.mjs
//
// The structural checks in check-routes.mjs prove a translation did not break
// anchors or touch code. They say nothing about how it reads. This catches the
// one register error the project cannot ship: voseo. The site is written in
// Latin-American neutral Spanish, `tú` form, and a reader who gets "tenés" on
// one page and "tienes" on the next is reading two different documents.
//
// ponytail: a word list, not a parser. Voseo is recognisable by a small closed
// set of present-tense and imperative forms; a grammar for it would be far more
// machinery than the problem needs.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ES = join(ROOT, 'content', 'es');

// Present-tense vos forms and vos imperatives that have no other reading in
// this kind of prose. Deliberately excludes forms that collide with the
// first-person preterite (`subí`, `escribí`, `corregí`), which are correct
// Spanish and would make this cry wolf.
const VOSEO = [...new Set([
  'tenés', 'querés', 'podés', 'sabés', 'hacés', 'decís', 'venís', 'sos',
  'debés', 'ponés', 'volvés', 'elegís', 'seguís', 'preferís',
  'mirá', 'dejá', 'agregá', 'ajustá', 'fijate', 'acordate', 'tomá', 'pasá',
  'usá', 'probá', 'revisá', 'ejecutá', 'escribí', 'leé', 'andá', 'vos',
])];
// `escribí` and `leé` above are ambiguous; only flag them as imperatives,
// which in this prose always open a sentence or a list item.
const AMBIGUOUS = new Set(['escribí', 'leé']);

const files = existsSync(ES)
  ? readdirSync(ES, { recursive: true }).filter((f) => f.endsWith('.md'))
  : [];

let hits = 0;
for (const f of files) {
  const text = readFileSync(join(ES, f), 'utf8')
    // Code is English and is checked elsewhere; a Spanish rule must not read it.
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ');

  for (const word of VOSEO) {
    // Not `\b`: JavaScript word boundaries only know [A-Za-z0-9_], so `á` reads
    // as a non-word character and `\bpasá\b` matches inside `pasándole`. Every
    // voseo form here ends in an accented vowel, so `\b` was wrong for all of
    // them — it reported the first page it was run against, falsely. Unicode
    // letter lookarounds are the boundary that actually applies to Spanish.
    const re = AMBIGUOUS.has(word)
      ? new RegExp(`(^|\\n)[-*\\d.\\s]*${word}(?![\\p{L}])`, 'giu')
      : new RegExp(`(?<![\\p{L}])${word}(?![\\p{L}])`, 'giu');
    const found = text.match(re);
    if (found) {
      console.error(`  voseo in content/es/${f}: ${[...new Set(found.map((s) => s.trim()))].join(', ')}`);
      hits += found.length;
    }
  }
}

if (hits) {
  console.error(`check-spanish: ${hits} voseo form${hits === 1 ? '' : 's'} — the site is tú-form Latin-American neutral`);
  process.exit(1);
}
console.log(`ok — ${files.length} Spanish page${files.length === 1 ? '' : 's'}, no voseo`);
