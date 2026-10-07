#!/usr/bin/env node
// Renders the social card for each locale.
//
//   node scripts/build-og.mjs
//
// The card is a real page rendered by the headless Chromium Playwright already
// caches, so it uses the site's own woff2 faces and its own `oklch()` tokens —
// no hand-converted hex to drift, no new dependency, and the source is HTML
// anyone can open and look at.
//
// 1200x630 because that is what every platform crops to. The composition is
// the site's own: two modules sharing a column, the front one carrying the one
// chamfer, depth by tone and not by shadow.

import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = join(homedir(),
  'Library/Caches/ms-playwright/chromium_headless_shell-1148/chrome-mac/headless_shell');

const die = (m) => { console.error(`build-og: ${m}`); process.exit(1); };
if (!existsSync(CHROME)) {
  die(`no headless Chromium at ${CHROME}\n` +
      `     It ships with Playwright. Install it, or point CHROME at any Chrome binary.`);
}

const index = JSON.parse(readFileSync(join(ROOT, 'content', 'index.json'), 'utf8'));
const { plugins, commands, skills } = index.counts;

// The manifesto is the one line of that register on the whole site
// (DESIGN.md §1) and the card is the one other place it belongs.
const CARDS = {
  en: { line: 'It marks the true line before any cut is made.',
        meta: `${plugins} plugins · ${commands} commands · ${skills} skills` },
  es: { line: 'Marca la línea antes de cortar.',
        meta: `${plugins} plugins · ${commands} comandos · ${skills} skills` }
};

const page = ({ line, meta }) => `<!doctype html><meta charset="utf-8"><style>
  @font-face { font-family: 'Bricolage'; font-weight: 600 700; font-stretch: 85% 90%;
    src: url('file://${ROOT}/public/fonts/bricolage-grotesque-latin.woff2') format('woff2') }
  @font-face { font-family: 'Martian'; font-weight: 400 600; font-stretch: 75% 100%;
    src: url('file://${ROOT}/public/fonts/martian-mono-latin.woff2') format('woff2') }
  :root {
    --surface: oklch(0.19 0.015 55); --raised: oklch(0.235 0.016 55);
    --raised-2: oklch(0.28 0.017 55); --text: oklch(0.93 0.015 80);
    --muted: oklch(0.72 0.018 75); --accent: oklch(0.70 0.11 135);
    --seam: oklch(0.52 0.08 135);
  }
  * { margin: 0; box-sizing: border-box }
  body { width: 1200px; height: 630px; background: var(--surface); overflow: hidden;
         position: relative; font-synthesis-weight: none; -webkit-font-smoothing: antialiased }

  /* The interlock, built the way the site builds it: the back module sits
     left and low, the front module overlaps it on the shared column and
     carries the one chamfer, and the seam is drawn OVER both at the column
     line — on the site it is z-index 1 for exactly this reason. Drawn
     under, it vanishes behind the front module and reads as a stray tick. */
  .back { position: absolute; left: 72px; top: 150px; width: 428px; bottom: 96px;
          background: var(--raised); padding: 48px 56px;
          display: flex; flex-direction: column; justify-content: flex-end }
  .front { position: absolute; left: 440px; top: 96px; right: 72px; bottom: 150px;
           /* Left padding clears the seam: the module starts at 440 and the
              seam lands at 500, so anything under ~100px puts the text on top
              of the line. */
           background: var(--raised-2); padding: 56px 64px 56px 104px;
           clip-path: polygon(0 0, calc(100% - 48px) 0, 100% 48px, 100% 100%, 0 100%);
           display: flex; flex-direction: column; justify-content: space-between }
  .seam { position: absolute; left: ${Math.round(1200 * 5 / 12)}px; top: 96px; bottom: 96px;
          width: 3px; background: var(--seam); z-index: 1 }

  .line { font-family: Bricolage, sans-serif; font-weight: 700; font-stretch: 85%;
          /* Sized for the LONGER of the two manifestos. English runs three
             lines where Spanish runs two, and the card has to hold both
             without the meta line colliding with it. */
          font-size: 60px; line-height: 1.06; letter-spacing: -0.02em; color: var(--text);
          text-wrap: balance }
  .meta { font-family: Martian, monospace; font-weight: 500; font-size: 18px;
          letter-spacing: 0.07em; text-transform: uppercase; color: var(--muted);
          white-space: nowrap }

  .wordmark { display: flex; align-items: center; gap: 18px }
  .wordmark svg { width: 38px; height: 38px; display: block; flex: none }
  .wordmark b { font-family: Martian, monospace; font-weight: 600; font-size: 23px;
                letter-spacing: 0.09em; color: var(--text) }
  .wordmark span { font-family: Martian, monospace; font-size: 20px; color: var(--muted) }
</style>
<div class="back">
  <div class="wordmark">
    <svg viewBox="0 0 64 64"><rect x="7" y="21" width="24" height="37" fill="oklch(0.52 0.08 135)"/>
      <path d="M24 6 H43 L58 21 V45 H24 Z" fill="oklch(0.70 0.11 135)"/></svg>
    <b>SUMITSUBO</b><span lang="ja">墨壺</span>
  </div>
</div>
<div class="seam"></div>
<div class="front"><p class="line">${line}</p><p class="meta">${meta}</p></div>`;

mkdirSync(join(ROOT, 'public', 'og'), { recursive: true });
for (const [loc, card] of Object.entries(CARDS)) {
  const html = join(ROOT, 'design', 'mark', `og-${loc}.html`);
  const out = join(ROOT, 'public', 'og', `${loc}.png`);
  writeFileSync(html, page(card));
  execFileSync(CHROME, ['--headless', '--disable-gpu', '--hide-scrollbars',
    '--force-device-scale-factor=1', `--screenshot=${out}`,
    '--window-size=1200,630', `file://${html}`], { stdio: ['ignore', 'ignore', 'pipe'] });
  if (!existsSync(out)) die(`${loc}: Chromium wrote nothing`);
  console.log(`  public/og/${loc}.png`);
}
