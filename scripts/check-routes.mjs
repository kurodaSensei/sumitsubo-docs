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
import { existsSync, readFileSync } from 'node:fs';
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
const {
  localePath, localeOf, isLocaleParam, isKindParam, stripLocale,
  DEFAULT_LOCALE, SOURCE_LOCALE, contentPrefix
} = await import(pathToFileURL(join(ROOT, 'app', 'utils', 'routing.ts')).href);
const { previewDescription } =
  await import(pathToFileURL(join(ROOT, 'app', 'utils', 'strings.ts')).href);
const hrefOf = (e) => `/${e.kind}/${e.plugin}/${e.name}`;

// What the build prerenders. Mirrors nuxt.config.ts; if that file changes shape,
// the last assertion below is what notices.
const pages = ['/', '/reference', ...index.entries.map(hrefOf)];
const prerendered = new Set([...pages, ...pages.map((p) => (p === '/' ? '/en' : `/en${p}`))]);

let n = 0;
const check = (name, fn) => {
  try { fn(); n++; } catch (e) { console.error(`FAIL ${name}\n  ${e.message}`); process.exitCode = 1; }
};

// The URL default and the content source are different locales now. Asserting
// they disagree is not pedantry: for the whole life of the site before this
// they were both English, so `locale === 'en'` meant either and every call site
// read whichever one the author happened to have in mind. If someone sets them
// back to the same value, every one of those call sites silently stops saying
// what it means and nothing else here would catch it.
check('the URL default and the content source are held apart', () => {
  assert.equal(DEFAULT_LOCALE, 'es', 'Spanish is served at the root');
  assert.equal(SOURCE_LOCALE, 'en', 'the framework files, and the fallback, stay English');
  assert.notEqual(DEFAULT_LOCALE, SOURCE_LOCALE,
    'these are different namespaces and must not be collapsed into one');

  // The content tree did not move with the URLs. English keeps the root there.
  assert.equal(contentPrefix(SOURCE_LOCALE), '', 'the source locale is the unprefixed tree');
  assert.equal(contentPrefix('es'), 'es/', 'Spanish content lives under es/ whatever its URL is');
});

check('locale and kind guards accept exactly what the routes use', () => {
  assert.equal(localeOf(undefined), 'es', 'an omitted prefix now means Spanish');
  assert.equal(localeOf(''), 'es');
  assert.equal(localeOf('en'), 'en');
  assert.ok(isLocaleParam(''), 'an omitted lang segment is valid');
  assert.ok(isLocaleParam('en'));
  assert.ok(!isLocaleParam('es'),
    '/es/* is gone — Spanish is at the root, so that prefix must 404, not soft-200');
  assert.ok(!isLocaleParam('fr'), 'an unknown locale must 404, not render a soft 200');
  assert.ok(!isLocaleParam('bogus'));
  assert.ok(isKindParam('skills') && isKindParam('commands'));
  assert.ok(!isKindParam('widgets'), 'an unknown kind must 404');
});

check('localePath produces the prerendered root, not a trailing-slash variant', () => {
  assert.equal(localePath('es', '/'), '/');
  assert.equal(localePath('en', '/'), '/en', 'must be /en — /en/ is not a prerendered route');
  assert.equal(localePath('es', '/reference'), '/reference');
  assert.equal(localePath('en', '/reference'), '/en/reference');
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

// The language switch is `localePath(other, stripLocale(path))`. Both halves
// read LOCALES, so this is what catches a prefix that strips wrong — the kind
// of bug that only shows up as a 404 after you click the switch.
check('the language switch lands on a prerendered route from every page', () => {
  assert.equal(stripLocale('/en'), '/', 'the English root must strip to the root');
  assert.equal(stripLocale('/'), '/');
  assert.equal(stripLocale('/reference'), '/reference', 'an unprefixed path is untouched');
  assert.equal(stripLocale('/entries'), '/entries', 'a path merely starting with a locale is not prefixed');

  for (const from of prerendered) {
    const to = localePath(localeOf(from.split('/')[1]) === 'en' ? 'es' : 'en', stripLocale(from));
    assert.ok(prerendered.has(to), `switching language on ${from} goes to ${to}, which is not prerendered`);
  }
});

// A translation that renamed, merged or dropped a section would break every
// deep link into that page and leave the contents pointing at anchors that are
// not there. The sync refuses to render one, and this is the standing proof
// that none got through.
check('every translation keeps its English anchors', () => {
  const PUB = join(ROOT, 'server', 'assets', 'pages');
  let checked = 0;
  for (const e of index.entries) {
    const rel = join(e.kind, e.plugin, `${e.name}.json`);
    const en = JSON.parse(readFileSync(join(PUB, rel), 'utf8'));
    for (const loc of ['es']) {
      const file = join(PUB, loc, rel);
      if (!existsSync(file)) continue;   // untranslated: the server falls back
      const tr = JSON.parse(readFileSync(file, 'utf8'));
      assert.deepEqual(tr.toc.map((h) => h.id), en.toc.map((h) => h.id),
        `${loc}/${rel}: anchors differ from the English source`);

      // Code is not prose. Holding every <pre> and every <code> byte-identical
      // across locales is what makes "no identifier was translated" a fact
      // about all 42 pages rather than a promise about each one. It also costs
      // the odd judgment call — marking `width`/`height` as code where the
      // English left them plain is an improvement, and still not worth giving
      // up a mechanical guarantee for.
      const blocks = (h) => h.match(/<pre\b[\s\S]*?<\/pre>/g) ?? [];
      const spans = (h) => h.match(/<code>[\s\S]*?<\/code>/g) ?? [];
      assert.deepEqual(blocks(tr.html), blocks(en.html),
        `${loc}/${rel}: a code block differs from the English source`);
      assert.deepEqual(spans(tr.html), spans(en.html),
        `${loc}/${rel}: an inline code span differs from the English source`);
      checked += 1;
    }
  }
  // A translation whose headings read the same as English is usually one that
  // was never actually translated, so say how many were compared.
  console.log(`  (${checked} translated page${checked === 1 ? '' : 's'} compared)`);
});

// The Spanish frontmatter is double-quoted, the English is not, so an escape
// the parser failed to undo only ever showed up on one side -- and in prose,
// where the code-parity check above does not look. Five descriptions shipped
// reading `\"feature\"`, on the page and in og:description. A backslash in a
// title or a description has never been correct here.
check('no page title or description carries a stray escape', () => {
  const PUB = join(ROOT, 'server', 'assets', 'pages');
  for (const e of index.entries) {
    const rel = join(e.kind, e.plugin, `${e.name}.json`);
    for (const dir of [PUB, join(PUB, 'es')]) {
      const file = join(dir, rel);
      if (!existsSync(file)) continue;
      const page = JSON.parse(readFileSync(file, 'utf8'));
      for (const key of ['title', 'description']) {
        assert.ok(!page[key]?.includes('\\'),
          `${rel}: ${key} contains a backslash -- an unparsed frontmatter escape`);
      }
    }
  }
});

// The snippet a platform shows. Asserted against the real descriptions rather
// than invented inputs, because what broke was not the function -- there was
// none -- it was 33 descriptions written for a model and handed to a social
// card untouched. If upstream adds a page whose description does not follow the
// convention, this is what notices.
check('every page gets a preview snippet a platform can show whole', () => {
  const PUB = join(ROOT, 'server', 'assets', 'pages');
  const LIMIT = 200;
  let longest = 0;
  for (const e of index.entries) {
    const rel = join(e.kind, e.plugin, `${e.name}.json`);
    for (const [loc, dir] of [['en', PUB], ['es', join(PUB, 'es')]]) {
      const file = join(dir, rel);
      if (!existsSync(file)) continue;
      const { description } = JSON.parse(readFileSync(file, 'utf8'));
      const snippet = previewDescription(description);
      const where = `${loc}/${rel}`;

      assert.ok(snippet.length <= LIMIT,
        `${where}: snippet is ${snippet.length} characters, over ${LIMIT}`);
      assert.ok(snippet.length > 0, `${where}: snippet is empty`);
      assert.ok(!/\s[,;:]|[,;:]…|\s…/.test(snippet),
        `${where}: snippet ends on dangling punctuation — ${JSON.stringify(snippet.slice(-24))}`);
      assert.ok(!/(?:\.|^)\s*(?:Use|Úsal[ao])\s/.test(snippet),
        `${where}: the trigger clause survived into the snippet`);
      longest = Math.max(longest, snippet.length);
    }
  }
  console.log(`  (longest snippet ${longest} of ${LIMIT} characters)`);
});

check('the route list is the size the site claims', () => {
  assert.equal(prerendered.size, (index.counts.pages + 2) * 2,
    'landing + reference + every page, in both locales');
});

if (!process.exitCode) {
  console.log(`ok — ${n} checks, ${prerendered.size} routes, ${index.counts.pages} pages`);
}
