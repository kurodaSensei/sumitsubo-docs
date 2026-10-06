#!/usr/bin/env node
// Vendors the Sumitsubo framework's docs into content/.
//
//   npm run sync        clone, transform, write content/, then commit the diff
//   npm run sync -- -n  dry run: report what would change, write nothing
//
// The build never runs this. content/ is committed, so `nuxt generate` is
// hermetic -- no network, works offline, cannot break because GitHub is down.
// The committed content IS the pin; _meta.json records the SHA for provenance.
//
// ponytail: shells out to `git clone --depth 1` instead of fetching and
// untarring a tarball. git is already a hard requirement here and it hands us
// the SHA for free. Swap to codeload + tar only if a runner without git shows up.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'content');
const REPO = 'https://github.com/kurodaSensei/sumitsubo.git';
const EXPECTED = { skills: 33, commands: 9, plugins: 6 };
const dryRun = process.argv.includes('-n') || process.argv.includes('--dry-run');

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
    if (kv) meta[kv[1]] = kv[2].trim().replace(/^["'](.*)["']$/, '$1');
  }
  return { meta, body: m[2].trim() };
}

// Numbers and booleans stay unquoted so `references > 0` works in a template
// instead of silently comparing strings.
const esc = (v) => (typeof v === 'number' || typeof v === 'boolean' ? String(v) : JSON.stringify(String(v ?? '')));

function emit(path, meta, body) {
  const fm = Object.entries(meta).map(([k, v]) => `${k}: ${esc(v)}`).join('\n');
  const text = `---\n${fm}\n---\n\n${body}\n`;
  const full = join(OUT, path);
  const prev = existsSync(full) ? readFileSync(full, 'utf8') : null;
  if (prev === text) return 'same';
  if (!dryRun) { mkdirSync(dirname(full), { recursive: true }); writeFileSync(full, text); }
  return prev === null ? 'added' : 'changed';
}

// --- clone -------------------------------------------------------------------
const tmp = mkdtempSync(join(tmpdir(), 'sumitsubo-'));
let sha;
try {
  execFileSync('git', ['clone', '--depth', '1', '--quiet', REPO, tmp], { stdio: ['ignore', 'ignore', 'pipe'] });
  sha = execFileSync('git', ['-C', tmp, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
} catch (e) {
  rmSync(tmp, { recursive: true, force: true });
  die(`could not clone ${REPO}\n${e.stderr?.toString().trim() ?? e.message}`);
}

const tally = { added: 0, changed: 0, same: 0 };
const bump = (r) => { tally[r]++; };
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
  for (const p of manifest.plugins ?? []) {
    if (typeof p.source !== 'string' || !p.source.startsWith('./plugins/')) continue;
    const commands = entries.filter((e) => e.kind === 'commands' && e.plugin === p.name).length;
    plugins.push({
      name: p.name,
      description: p.description ?? '',
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
  plugins,
  counts: { plugins: plugins.length, skills: nSkills, commands: nCommands, pages: nSkills + nCommands },
  entries: entries.sort((a, b) => a.kind.localeCompare(b.kind) || a.plugin.localeCompare(b.plugin) || a.name.localeCompare(b.name))
};
const indexJson = JSON.stringify(index);
const kb = indexJson.length / 1024;
// Check before writing, so a failure cannot leave an oversized file on disk.
if (kb > 20) die(`content/index.json would be ${kb.toFixed(1)} KB — it ships to the client, keep it metadata-only`);
if (!dryRun) {
  writeFileSync(join(OUT, 'index.json'), indexJson + '\n');
  console.log(`  index.json ${kb.toFixed(1)} KB`);
}

const meta = { repo: REPO, sha, skills: nSkills, commands: nCommands, pages: nSkills + nCommands };
if (!dryRun) writeFileSync(join(OUT, '_meta.json'), JSON.stringify(meta, null, 2) + '\n');

console.log(`${dryRun ? 'would sync' : 'synced'} ${meta.pages} pages from ${sha.slice(0, 7)}`);
console.log(`  ${nSkills} skills · ${nCommands} commands`);
console.log(`  ${tally.added} added · ${tally.changed} changed · ${tally.same} unchanged`);
if (dryRun && (tally.added || tally.changed)) console.log('  (dry run — nothing written)');
