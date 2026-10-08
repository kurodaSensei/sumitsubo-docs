#!/usr/bin/env node
// Vendors the Sumitsubo framework's docs into content/.
//
//   npm run sync                clone the default branch, transform, write, commit the diff
//   npm run sync -- --ref <sha>  pin the content to one upstream commit
//   npm run sync -- -n           dry run: report what would change, write nothing
//
// The build never runs this. content/ is committed, so `nuxt generate` is
// hermetic -- no network, works offline, cannot break because GitHub is down.
// The committed content IS the pin; _meta.json records the SHA for provenance.
//
// ponytail: shells out to `git clone --depth 1` instead of fetching and
// untarring a tarball. git is already a hard requirement here and it hands us
// the SHA for free. Swap to codeload + tar only if a runner without git shows up.

import { marked } from 'marked';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'content');
const PUB = join(ROOT, 'server', 'assets', 'pages');
// Locales with a translated content tree at content/<locale>/. English is the
// source and lives at the root of content/, so it is not listed here.
const TRANSLATIONS = ['es'];
const REPO = 'https://github.com/kurodaSensei/sumitsubo.git';
const EXPECTED = { skills: 34, commands: 10, plugins: 6 };
const dryRun = process.argv.includes('-n') || process.argv.includes('--dry-run');

// Without --ref this clones the default branch tip, so a run made to regenerate
// after a renderer change also drags in whatever landed upstream meanwhile.
// That happened once and put an unrelated content update in a fix commit.
const refArg = process.argv.indexOf('--ref');
const ref = refArg !== -1 ? process.argv[refArg + 1] : null;
if (refArg !== -1 && !ref) die('--ref needs a commit sha or branch name');

const die = (msg) => { console.error(`sync: ${msg}`); process.exit(1); };
const ls = (dir) => (existsSync(dir) ? readdirSync(dir, { withFileTypes: true }) : []);
const dirs = (dir) => ls(dir).filter((d) => d.isDirectory()).map((d) => d.name).sort();
const files = (dir, ext) => ls(dir).filter((d) => d.isFile() && d.name.endsWith(ext)).map((d) => d.name).sort();

// --- frontmatter -------------------------------------------------------------
// Only what these files actually use: a leading --- block of `key: value`,
// values possibly quoted. Not a YAML parser and does not pretend to be one.
function parse(raw, where) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) die(`${where}: no frontmatter block`);
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z-]+):\s*(.*)$/);
    if (!kv) continue;
    const v = kv[2].trim();

    // A double-quoted value is JSON, by construction: `esc` below writes it
    // with JSON.stringify and the translation sources are hand-written in the
    // same shape. Reading it with anything less drops the escapes -- stripping
    // the outer quotes with a regex left the backslash of every \" inside the
    // value, and five Spanish skill descriptions reached production reading
    // `\"feature\"`, in the lede on the page as well as in og:description.
    // The English sources are plain unquoted scalars, which is why the bug was
    // one-sided and survived the code-parity check: a description is prose, not
    // a code span.
    if (v.startsWith('"')) {
      try { meta[kv[1]] = JSON.parse(v); }
      catch { die(`${where}: ${kv[1]} is not a valid double-quoted value: ${v}`); }
    } else {
      meta[kv[1]] = v.replace(/^'(.*)'$/, '$1');
    }
  }
  return { meta, body: m[2].trim() };
}

// Numbers and booleans stay unquoted so `references > 0` works in a template
// instead of silently comparing strings.
const esc = (v) => (typeof v === 'number' || typeof v === 'boolean' ? String(v) : JSON.stringify(String(v ?? '')));

// Markdown is rendered HERE, in Node, not in the browser. The renderer is a
// devDependency that the Nuxt build never imports, so it costs the client
// bundle nothing -- the page only injects a string.
//
// No sanitiser: this content is vendored from the user's own framework repo by
// the clone above, so it is first-party. Point REPO at something you do not
// control and that stops being true.
marked.use({ gfm: true, breaks: false });

/** Heading text -> fragment id. Collisions are resolved, never allowed. */
function slugify(text, taken) {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
  let id = base, n = 2;
  while (taken.has(id)) id = `${base}-${n++}`;
  taken.add(id);
  return id;
}

/** Strip the inline markup marked leaves inside a heading, and decode it. */
function headingText(inner) {
  return inner
    .replace(/<[^>]+>/g, '')
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .trim();
}

/**
 * Post-process the rendered HTML: scroll regions, the security gate, and the
 * heading ids the table of contents links to.
 *
 * All of it has to happen here rather than in the component, because the body
 * is injected with `v-html` and the SFC never sees these elements as nodes.
 */
function postProcess(html, where, reuseIds) {
  let n = 0;
  // Tables are the densest thing in this content (up to 6 columns) and were
  // overflowing the viewport on every detail page — 1.92x at 320px on the worst
  // one. DESIGN.md §10 asks for a focusable, named scroll region.
  let wrapped = html.replace(/<table>([\s\S]*?)<\/table>/g, (m) => {
    n += 1;
    return `<div class="table-scroll" tabindex="0" role="region" aria-label="Table ${n}, scrollable">${m}</div>`;
  });

  // Code blocks scroll horizontally too, and a scroll container that cannot be
  // focused is unreachable by keyboard. 117 of these across the 42 pages.
  let p = 0;
  wrapped = wrapped.replace(/<pre>/g, () => {
    p += 1;
    return `<pre tabindex="0" role="region" aria-label="Code block ${p}, scrollable">`;
  });

  // A `<script>` baked into prerendered HTML executes on load, and marked lets
  // raw HTML through untouched. The upstream repo is public and accepts pull
  // requests, so "it is first-party" is a policy, not a control. The sync is
  // manual and dev-time, which makes a loud failure the right boundary.
  //
  // Code regions are excluded before matching: inside <pre> and <code> the
  // content is already entity-escaped and inert, and this documentation is full
  // of JavaScript that looks like markup (`export const onOrderCreated = …`
  // matches an event-handler pattern and is not one).
  const inert = wrapped
    .replace(/<pre\b[\s\S]*?<\/pre>/gi, '')
    .replace(/<code\b[\s\S]*?<\/code>/gi, '');
  const dangerous = /<\s*(script|iframe|object|embed|form|link|meta|style)\b|\son[a-z]+\s*=|(href|src)\s*=\s*["']?\s*javascript:/i;
  const hit = inert.match(dangerous);
  if (hit) {
    die(`${where}: rendered HTML contains active markup, which would be injected with v-html.\n` +
        `     Found: ${JSON.stringify(hit[0])}\n` +
        `     Sanitise it upstream, or add a sanitiser here if raw HTML is genuinely wanted.`);
  }

  // GFM renders the `- [ ]` checklists in these SKILL.md bodies as real
  // `<input type="checkbox">` with no label, which Lighthouse's `label` audit
  // scores 0 — 162 of them across 26 of the 42 pages, every one announced to a
  // screen reader as an unnamed checkbox.
  //
  // They are replaced rather than labelled. All 162 are `disabled` and all are
  // unchecked, so the control carries no state a reader could learn anything
  // from and no interaction it could offer; the item's own text is the whole
  // content. A decorative square says that much without pretending to be a
  // form control. Re-check this if upstream ever ships a `- [x]`: a mixed list
  // DOES carry state, and would need the state conveyed, not hidden.
  wrapped = wrapped.replace(
    /<input\b[^>]*type="checkbox"[^>]*>/g,
    '<span class="task-box" aria-hidden="true"></span>'
  );

  // Fragment targets for the table of contents, and the contents themselves.
  // Only h2: these pages run up to 14 of them and adding the h3s would make the
  // list longer than the viewport it has to fit beside.
  // ponytail: flat h2 list; nest the h3s when a page shows up where the h2
  // titles alone are not enough to find a section.
  //
  // These ids already exist on the page — the <main> landmark the skip link
  // targets, the reference filter input, and the heading that names the table
  // of contents. A content heading that slugified to any of them would be
  // shadowed in getElementById and its link would silently jump elsewhere.
  const taken = new Set(['main', 'q', 'toc-title']);
  const toc = [];
  let h = 0;
  wrapped = wrapped.replace(/<h2>([\s\S]*?)<\/h2>/g, (_m, inner) => {
    const text = headingText(inner);
    // A translated page reuses the English ids rather than slugifying its own.
    // An id is an identifier, not prose: keeping it means a deep link shared
    // between locales still lands, and `/es/...#principles` under a heading
    // reading "Principios" is correct. It also makes the count a real
    // invariant — see the guard in emitLocale.
    const id = reuseIds ? reuseIds[h] : slugify(text, taken);
    h += 1;
    toc.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  if (reuseIds && h !== reuseIds.length) {
    die(`${where}: the translation has ${h} h2 headings, the English source has ` +
        `${reuseIds.length}.\n` +
        `     Headings are what the contents and every deep link are built from, so a\n` +
        `     translation that merges, splits or drops a section cannot be rendered.`);
  }

  return { html: wrapped, toc };
}

/** The body's own `# Title` duplicates the page heading, so lift it out. */
function splitHeading(body) {
  const m = body.match(/^#\s+(.+?)\s*$/m);
  if (!m || body.indexOf(m[0]) > 2) return { heading: '', rest: body };
  return { heading: m[1].trim(), rest: body.slice(m[0].length).trim() };
}

// Every output is planned here and nothing touches disk until the guards below
// have passed. Writing as we went meant a framework layout change wrote a
// partial tree and *then* died on the count check, leaving content/ in a state
// the next build would happily consume. The plan doubles as the keep-set for
// the orphan sweep: a page deleted upstream used to linger here forever,
// because nothing ever removed what the run did not produce.
const planned = new Map();

function writeAbs(full, text) {
  planned.set(full, text);
  const prev = existsSync(full) ? readFileSync(full, 'utf8') : null;
  return prev === text ? 'same' : prev === null ? 'added' : 'changed';
}

/**
 * Every file currently under a managed tree, as absolute paths.
 *
 * `content/<locale>/` is excluded: those are the hand-written translations, the
 * one thing under content/ the sync reads rather than writes. Without this they
 * are absent from the plan, so the orphan sweep below treats every one of them
 * as garbage and deletes it — which it did, on the first translation that
 * existed, before this guard.
 */
const OWNED_ELSEWHERE = TRANSLATIONS.map((l) => join(OUT, l));

const tree = (dir) =>
  (existsSync(dir) ? readdirSync(dir, { recursive: true, withFileTypes: true }) : [])
    .filter((d) => d.isFile() && d.name !== '.gitkeep')
    .map((d) => join(d.parentPath, d.name))
    .filter((f) => !OWNED_ELSEWHERE.some((dir) => f.startsWith(dir + '/')));

function flush() {
  // Orphans go first: a sync that renamed a page should not leave both names
  // on disk for even one step.
  const orphans = [...tree(OUT), ...tree(PUB)].filter((f) => !planned.has(f));
  for (const f of orphans) {
    console.log(`  removed ${relative(ROOT, f)}`);
    if (!dryRun) rmSync(f);
  }

  if (dryRun) return orphans.length;
  for (const [full, text] of planned) {
    if (existsSync(full) && readFileSync(full, 'utf8') === text) continue;
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, text);
  }
  return orphans.length;
}

const write = (path, text) => writeAbs(join(OUT, path), text);

/**
 * Spanish (and any future locale's) plugin descriptions for the landing cards.
 * Read once; absent file means nothing is translated yet, which is not an error.
 */
const pluginDict = Object.fromEntries(TRANSLATIONS.map((loc) => {
  const f = join(OUT, loc, 'plugins.json');
  return [loc, existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {}];
}));

function pluginTranslations(name, english) {
  const hash = sourceHash(english);
  const out = {};
  for (const loc of TRANSLATIONS) {
    const t = pluginDict[loc][name];
    if (!t) { translations.pluginsMissing += 1; continue; }
    if (t['source-hash'] !== hash) { translations.stale.push(`${loc}/plugins.json: ${name}`); continue; }
    out[loc] = t.description;
    translations.pluginsDone += 1;
  }
  return Object.keys(out).length ? { translations: out } : {};
}

/** What a translation was made from, so the sync can tell when it drifts. */
const sourceHash = (body) => createHash('sha256').update(body).digest('hex').slice(0, 16);

/** Translations seen this run, for the report at the end. */
// `done` is per locale, because the note the reference index shows is derived
// from it: a claim about how much is translated must come from the count, not
// from a sentence somebody remembers to update.
const translations = { done: {}, stale: [], missing: 0, pluginsDone: 0, pluginsMissing: 0 };

/**
 * Render one locale's copy of a page.
 *
 * English is the source: it slugifies its own heading ids and passes them here,
 * so every locale's anchors are the same strings.
 */
function emitLocale(locale, path, meta, body, ids) {
  const { heading, rest } = splitHeading(body);
  const { html, toc } = postProcess(marked.parse(rest), `${locale}/${path}`, ids);
  return writeAbs(
    join(PUB, locale, path.replace(/\.md$/, '.json')),
    JSON.stringify({ ...meta, heading, toc, html })
  );
}

function emit(path, meta, body) {
  const fm = Object.entries(meta).map(([k, v]) => `${k}: ${esc(v)}`).join('\n');

  // 33 of the 42 bodies open with their own `# Title`, which rendered as a
  // second <h1> under the page heading — two competing titles per page. Lift it
  // out and let the page use it as its heading; `title` stays the slug, which
  // is what the index and the breadcrumb identify the page by.
  const { heading, rest } = splitHeading(body)

  const { html, toc } = postProcess(marked.parse(rest), path);
  const page = writeAbs(
    join(PUB, path.replace(/\.md$/, '.json')),
    JSON.stringify({ ...meta, heading, toc, html })
  );
  // The .md keeps the body intact — it is the reviewable mirror of upstream,
  // not the render input.
  const md = write(path, `---\n${fm}\n---\n\n${body}\n`);

  // --- translations ---------------------------------------------------------
  // A translation lives at content/<locale>/<same path>, is written by hand (or
  // by a model, reviewed as a diff) and is never generated from upstream. The
  // sync only renders it and reports on it.
  //
  // `source-hash` in its frontmatter records the English body it was made from.
  // When upstream moves, the hashes disagree and the page is stale: it is still
  // served — throwing away a good translation over an upstream typo helps
  // nobody — but it says so, and it is listed here.
  const hash = sourceHash(body);
  let pages = [page, md];

  for (const locale of TRANSLATIONS) {
    const src = join(OUT, locale, path);
    if (!existsSync(src)) { translations.missing += 1; continue; }

    const t = parse(readFileSync(src, 'utf8'), `${locale}/${path}`);
    const stale = t.meta['source-hash'] !== hash;
    if (stale) translations.stale.push(`${locale}/${path}`);
    else translations.done[locale] = (translations.done[locale] ?? 0) + 1;

    pages.push(emitLocale(locale, path, {
      ...meta,
      title: t.meta.title ?? meta.title,
      description: t.meta.description ?? meta.description,
      stale
    }, t.body, toc.map((x) => x.id)));
  }

  return pages.every((r) => r === 'same') ? 'same'
    : pages.some((r) => r === 'added') ? 'added' : 'changed';
}

// --- clone -------------------------------------------------------------------
const tmp = mkdtempSync(join(tmpdir(), 'sumitsubo-'));
let sha;
try {
  if (ref) {
    // A commit is not fetchable by name from a shallow clone, so fetch it
    // directly. Note the constraint this carries: `git fetch origin <sha>`
    // needs the *full* 40-character sha. An abbreviated one fails with
    // "couldn't find remote ref", which says nothing useful, so catch it here.
    if (/^[0-9a-f]{4,39}$/i.test(ref)) {
      die(`--ref ${ref} looks like an abbreviated sha.\n` +
          `     git can only fetch a single commit by its full 40-character sha.\n` +
          `     Use the full sha, or a branch name.`);
    }
    execFileSync('git', ['init', '--quiet', tmp]);
    execFileSync('git', ['-C', tmp, 'remote', 'add', 'origin', REPO]);
    execFileSync('git', ['-C', tmp, 'fetch', '--depth', '1', '--quiet', 'origin', ref], { stdio: ['ignore', 'ignore', 'pipe'] });
    execFileSync('git', ['-C', tmp, 'checkout', '--quiet', 'FETCH_HEAD']);
  } else {
    execFileSync('git', ['clone', '--depth', '1', '--quiet', REPO, tmp], { stdio: ['ignore', 'ignore', 'pipe'] });
  }
  sha = execFileSync('git', ['-C', tmp, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
} catch (e) {
  rmSync(tmp, { recursive: true, force: true });
  die(`could not clone ${REPO}\n${e.stderr?.toString().trim() ?? e.message}`);
}

const tally = { added: 0, changed: 0, same: 0 };
const bump = (r) => { tally[r]++; };
// The framework's released version. It used to be typed into three components
// by hand and was two releases stale: the site said v0.4.0 while upstream was
// at v0.5.1. Same class of bug as the translation note that was wrong the day
// after it was written — so it comes from the manifest, like the counts do.
let version;
let nSkills = 0, nCommands = 0;
const entries = [];
const plugins = [];

try {
  const pluginDirs = dirs(join(tmp, 'plugins'));
  if (!pluginDirs.length) die('no plugins/ directory in the framework clone');

  for (const plugin of pluginDirs) {
    const base = join(tmp, 'plugins', plugin);

    // skills: plugins/<plugin>/skills/<skill>/SKILL.md (+ inlined references/)
    for (const skill of dirs(join(base, 'skills'))) {
      const src = join(base, 'skills', skill, 'SKILL.md');
      if (!existsSync(src)) continue;
      const { meta, body } = parse(readFileSync(src, 'utf8'), `${plugin}/${skill}`);

      // references/ become collapsible sections on the parent page rather than
      // routes of their own -- they are supporting tables, not destinations.
      const refDir = join(base, 'skills', skill, 'references');
      const refs = files(refDir, '.md').map((f) => {
        const raw = readFileSync(join(refDir, f), 'utf8');
        const inner = raw.startsWith('---') ? parse(raw, `${plugin}/${skill}/${f}`).body : raw.trim();
        const title = (inner.match(/^#\s+(.+)$/m)?.[1] ?? f.replace(/\.md$/, '')).trim();
        // Demote headings by one level so the inlined doc nests under its <h2>.
        return `\n\n## ${title}\n\n${inner.replace(/^#\s+.+$/m, '').replace(/^(#{1,5})\s/gm, '#$1 ').trim()}`;
      });

      bump(emit(join('skills', plugin, `${skill}.md`), {
        title: meta.name ?? skill,
        description: meta.description ?? '',
        plugin, kind: 'skill',
        references: refs.length,
        source: `plugins/${plugin}/skills/${skill}/SKILL.md`
      }, body + refs.join('')));
      entries.push({ kind: 'skills', plugin, name: skill, title: meta.name ?? skill });
      nSkills++;
    }

    // commands: plugins/<plugin>/commands/<name>.md
    for (const file of files(join(base, 'commands'), '.md')) {
      const name = file.replace(/\.md$/, '');
      const { meta, body } = parse(readFileSync(join(base, 'commands', file), 'utf8'), `${plugin}/${name}`);
      bump(emit(join('commands', plugin, `${name}.md`), {
        title: `/${plugin}:${name}`,
        description: meta.description ?? '',
        plugin, kind: 'command',
        argumentHint: meta['argument-hint'] ?? '',
        source: `plugins/${plugin}/commands/${file}`
      }, body));
      entries.push({ kind: 'commands', plugin, name, title: `/${plugin}:${name}` });
      nCommands++;
    }
  }
  // Plugin names and descriptions come from the framework's own marketplace
  // manifest rather than being retyped here. Owned plugins are the ones with a
  // local `source`; the rest are companions referenced from upstream.
  const manifest = JSON.parse(readFileSync(join(tmp, '.claude-plugin', 'marketplace.json'), 'utf8'));
  version = manifest.metadata?.version;
  if (!/^\d+\.\d+\.\d+/.test(version ?? '')) {
    die(`marketplace.json has no usable metadata.version (got ${JSON.stringify(version)})`);
  }
  for (const p of manifest.plugins ?? []) {
    if (typeof p.source !== 'string' || !p.source.startsWith('./plugins/')) continue;
    const commands = entries.filter((e) => e.kind === 'commands' && e.plugin === p.name).length;
    plugins.push({
      name: p.name,
      description: p.description ?? '',
      // Translations live in content/<locale>/plugins.json, hand-written and
      // hashed against the English they were made from, exactly like a page.
      // A plugin with no entry, or a stale one, keeps English on the card and
      // the card declares `lang`.
      ...pluginTranslations(p.name, p.description ?? ''),
      commands,
      skills: entries.filter((e) => e.kind === 'skills' && e.plugin === p.name).length,
      // Derived, not declared: the two plugins that ship commands are the ones
      // every project uses; the stack packs are skills-only and you pick one.
      tier: commands > 0 ? 'core' : 'stack'
    });
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// A miscount means the framework layout moved under us. Fail loudly rather than
// quietly publishing a site that is missing pages.
if (nSkills !== EXPECTED.skills || nCommands !== EXPECTED.commands || plugins.length !== EXPECTED.plugins) {
  die(`expected ${EXPECTED.plugins} plugins, ${EXPECTED.skills} skills and ${EXPECTED.commands} commands, ` +
      `found ${plugins.length}, ${nSkills} and ${nCommands}.\n` +
      `     If the framework really changed, update EXPECTED in this file in the same commit.`);
}

// The lists (landing figure, plugin cards, reference index) need metadata only.
// Loading the 42 bodies to render a list would put ~290 KB of markdown in the
// CLIENT bundle against a 170 KB gzip budget. Bodies belong in prerendered
// HTML; this index is what the lists import.
// Deliberately no `description`: the skill descriptions are the framework's
// trigger prose, 300+ characters each, and carrying all 42 cost 22.5 KB for
// text no list renders. The detail page reads it from its own frontmatter.
const index = {
  repo: REPO,
  sha,
  version,
  plugins,
  counts: {
    plugins: plugins.length,
    skills: nSkills,
    commands: nCommands,
    pages: nSkills + nCommands,
    // Per locale, so the reference index can say what is actually true rather
    // than carrying a sentence that goes stale the moment a page is added
    // upstream or translated here.
    translated: Object.fromEntries(TRANSLATIONS.map((l) => [l, translations.done[l] ?? 0]))
  },
  entries: entries.sort((a, b) => a.kind.localeCompare(b.kind) || a.plugin.localeCompare(b.plugin) || a.name.localeCompare(b.name))
};
const indexJson = JSON.stringify(index);
const kb = indexJson.length / 1024;
// Check before writing, so a failure cannot leave an oversized file on disk.
if (kb > 20) die(`content/index.json would be ${kb.toFixed(1)} KB — it ships to the client, keep it metadata-only`);

const meta = { repo: REPO, sha, skills: nSkills, commands: nCommands, pages: nSkills + nCommands };
writeAbs(join(OUT, 'index.json'), indexJson + '\n');
writeAbs(join(OUT, '_meta.json'), JSON.stringify(meta, null, 2) + '\n');

// Every guard has passed. Only now does anything reach disk.
const removed = flush();

console.log(`  index.json ${kb.toFixed(1)} KB`);
console.log(`${dryRun ? 'would sync' : 'synced'} ${meta.pages} pages from ${sha.slice(0, 7)}`);
console.log(`  ${nSkills} skills · ${nCommands} commands`);
console.log(`  ${tally.added} added · ${tally.changed} changed · ${tally.same} unchanged · ${removed} removed`);

// Translations are the one thing here a person has to act on, so they get their
// own lines rather than a number folded into the tally above.
const wanted = meta.pages * TRANSLATIONS.length;
const doneTotal = Object.values(translations.done).reduce((a, b) => a + b, 0);
console.log(`  translations: ${doneTotal}/${wanted} pages current · ` +
            `${translations.pluginsDone}/${plugins.length * TRANSLATIONS.length} plugin cards · ` +
            `${translations.stale.length} stale · ${translations.missing + translations.pluginsMissing} missing`);
for (const f of translations.stale) console.log(`    stale  content/${f}`);
if (translations.stale.length) {
  console.log('  A stale page is still served, marked as behind its source.');
  console.log('  Re-translate it and update `source-hash` in its frontmatter.');
}
if (dryRun && (tally.added || tally.changed)) console.log('  (dry run — nothing written)');
