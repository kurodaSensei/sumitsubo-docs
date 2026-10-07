// Splices the English fenced code blocks into a translated draft that marks
// their positions with <<<N>>>, and fills in SRCHASH.
//
//   node scripts/splice-translation.mjs <english.md> <draft.md> <out.md>
//
// `npm run check` requires every <pre> and every <code> to be byte-identical
// across locales. Retyping a dozen code blocks per page is how a stray
// character gets in; this makes them identical by construction instead of by
// care. The draft writes <<<0>>>, <<<1>>>… where each block goes, in order.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const [, , enPath, draftPath, outPath] = process.argv;
const en = readFileSync(enPath, 'utf8');
const body = en.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/)[1].trim();
const blocks = body.match(/```[\s\S]*?```/g) ?? [];

let draft = readFileSync(draftPath, 'utf8');
const wanted = [...draft.matchAll(/<<<(\d+)>>>/g)].map((m) => Number(m[1]));
if (wanted.length !== blocks.length) {
  console.error(`sync: draft has ${wanted.length} markers, source has ${blocks.length} code blocks`);
  process.exit(1);
}
draft = draft.replace(/<<<(\d+)>>>/g, (_m, n) => blocks[Number(n)]);
draft = draft.replace('SRCHASH', createHash('sha256').update(body).digest('hex').slice(0, 16));
writeFileSync(outPath, draft);
console.log(`  ${outPath}: ${blocks.length} bloques empalmados literalmente`);
