#!/usr/bin/env node
// Asserts that the URLs the pages link to are the URLs the build prerenders.
//
//   npm run check
//
// This exists because those two come from different code. Links are built by
// `localePath()` and `hrefOf()` in app/; the prerender list is built by its own
// string templates in nuxt.config.ts. If they ever disagree the site serves
// 404s everywhere while `nuxt generate --failOnError` still passes green,
// because every route it was *told* about rendered fine.
//
// ponytail: plain asserts, no test framework. One runnable check is the point;
// a runner would be more setup than the thing it runs.

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const index = JSON.parse(readFileSync(join(ROOT, 'content', 'index.json'), 'utf8'));

// The real helpers, imported from source rather than re-implemented here: a
// copy would keep passing while the originals were broken, which is the
// opposite of useful.
//
// Imported as .ts directly — Node strips the types itself. An earlier version
// of this file tried to strip them with regexes and mangled
// `(LOCALES as readonly string[])` into a syntax error. Hand-rolling a
// TypeScript parser to run five assertions is not a trade worth making.
const { localePath, localeOf, isLocaleParam, isKindParam } =
  await import(pathToFileURL(join(ROOT, 'app', 'utils', 'routing.ts')).href);
const hrefOf = (e) => `/${e.kind}/${e.plugin}/${e.name}`;

// What the build prerenders. Mirrors nuxt.config.ts; if that file changes shape,
// the last assertion below is what notices.
const pages = ['/', '/reference', ...index.entries.map(hrefOf)];
const prerendered = new Set([...pages, ...pages.map((p) => (p === '/' ? '/es' : `/es${p}`))]);

let n = 0;
const check = (name, fn) => {
  try { fn(); n++; } catch (e) { console.error(`FAIL ${name}\n  ${e.message}`); process.exitCode = 1; }
};

check('locale and kind guards accept exactly what the routes use', () => {
  assert.equal(localeOf(undefined), 'en', 'an omitted prefix means English');
  assert.equal(localeOf('es'), 'es');
  assert.equal(localeOf(''), 'en');
  assert.ok(isLocaleParam(''), 'an omitted lang segment is valid');
  assert.ok(isLocaleParam('es'));
  assert.ok(!isLocaleParam('fr'), 'an unknown locale must 404, not render a soft 200');
  assert.ok(!isLocaleParam('bogus'));
  assert.ok(isKindParam('skills') && isKindParam('commands'));
  assert.ok(!isKindParam('widgets'), 'an unknown kind must 404');
});

check('localePath produces the prerendered root, not a trailing-slash variant', () => {
  assert.equal(localePath('en', '/'), '/');
  assert.equal(localePath('es', '/'), '/es', 'must be /es — /es/ is not a prerendered route');
  assert.equal(localePath('en', '/reference'), '/reference');
  assert.equal(localePath('es', '/reference'), '/es/reference');
});

check('every link the reference index renders is a route the build emits', () => {
  for (const e of index.entries) {
    for (const loc of ['en', 'es']) {
      const href = localePath(loc, hrefOf(e));
      assert.ok(prerendered.has(href), `${href} is linked but never prerendered`);
    }
  }
});

check('the counts on screen match the content index', () => {
  const skills = index.entries.filter((e) => e.kind === 'skills').length;
  const commands = index.entries.filter((e) => e.kind === 'commands').length;
  assert.equal(skills, index.counts.skills);
  assert.equal(commands, index.counts.commands);
  assert.equal(index.counts.pages, skills + commands);
  assert.equal(index.plugins.length, index.counts.plugins);
  assert.equal(index.plugins.reduce((s, p) => s + p.skills, 0), skills,
    'per-plugin skill counts must sum to the total');
});

check('the route list is the size the site claims', () => {
  assert.equal(prerendered.size, (index.counts.pages + 2) * 2,
    'landing + reference + every page, in both locales');
});

if (!process.exitCode) {
  console.log(`ok — ${n} checks, ${prerendered.size} routes, ${index.counts.pages} pages`);
}
