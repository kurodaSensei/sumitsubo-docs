<script setup lang="ts">
import { isKindParam, isLocaleParam } from '~/utils/routing'

definePageMeta({
  validate: (route) => isLocaleParam(route.params.lang) && isKindParam(route.params.kind)
})

const route = useRoute()
const { t, path, locale } = useChrome()

// The 42 reference pages are English in both locales by design (PRODUCT.md);
// declaring that is better than pretending otherwise.
const foreign = computed(() => (locale.value === 'en' ? undefined : 'en'))

interface Page {
  title: string
  /** The body's own `# Title`, lifted out by the sync script. Empty for commands. */
  heading: string
  description: string
  plugin: string
  kind: string
  references: number
  source: string
  /** One entry per `h2`, with the fragment id the sync script put on it. */
  toc: { id: string, text: string }[]
  html: string
}

// Content comes from a server route, not an import. Importing it put one JS
// chunk per page through the bundler and esbuild rejected the generated
// module; fetching it from public/ fails during prerender, because SSR's
// internal fetch does not serve static assets. The markdown was already
// rendered to HTML in Node by `npm run sync`, so no renderer ships either way.
//
// On a static host this costs nothing at runtime: prerender resolves it and
// inlines the result into the payload, which is what client navigation reads.
const src = `/api/page/${route.params.kind}/${route.params.plugin}/${route.params.name}`

// `transform` drops `html` before the result is stored, so the body never
// enters this page's payload — <PageBody> renders it on the server instead.
// Without this the content shipped twice: once in the document, once again in
// _payload.json.
const { data: page } = await useAsyncData(src, () => $fetch<Page>(src), {
  transform: ({ html, ...meta }) => meta as Omit<Page, 'html'>
})
if (!page.value) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

const REPO = 'https://github.com/kurodaSensei/sumitsubo/blob/main/'

useSeoMeta({
  title: () => `${page.value?.title ?? ''} — Sumitsubo`,
  description: () => page.value?.description ?? ''
})
</script>

<template>
  <article v-if="page" class="doc">
    <nav class="crumb" :aria-label="t.navRef">
      <NuxtLink :to="path('/reference')">{{ t.navRef }}</NuxtLink>
      <span aria-hidden="true">/</span>
      <span>{{ page.plugin }}</span>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{{ page.title }}</span>
    </nav>

    <p class="u-label doc__kind">{{ page.kind }} · {{ page.plugin }} · v0.4.0</p>
    <!-- Skills carry a prose heading lifted from their body; commands fall back
         to the slug, which is an identifier and is set in mono. -->
    <h1 :class="page.heading ? 'doc__title' : 'doc__title doc__title--id'">
      {{ page.heading || page.title }}
    </h1>

    <!-- The signature repeats here. Without it the 42 reference pages were the
         only part of the site with no module, no chamfer and no seam — 42 of 45
         pages carrying none of the direction. -->
    <div class="interlock">
      <div class="seam" aria-hidden="true" />

      <div class="interlock__a">
        <div class="module module--raised u-chamfer pad-seam">
          <p :lang="foreign">{{ page.description }}</p>
        </div>
      </div>

      <div class="interlock__b">
        <dl class="module module--raised-2 u-chamfer doc__spec">
          <dt class="u-label">{{ t.navRef }}</dt>
          <dd><NuxtLink :to="path('/reference')">{{ page.plugin }}</NuxtLink></dd>
          <dt class="u-label">{{ page.kind }}</dt>
          <dd>{{ page.title }}</dd>
          <dt class="u-label">source</dt>
          <dd><a :href="REPO + page.source" rel="noopener">{{ page.source }}</a></dd>
        </dl>
      </div>
    </div>

    <div class="doc__layout">
      <!-- Before the body in the DOM, to the right of it on screen. A reader on
           a keyboard should reach a navigation aid before the thing it helps
           navigate; placed after <PageBody> it sat behind the entire article,
           which is where it is least useful.
           Three entries is where a list starts beating a scroll — below that the
           headings are already on one screen. The 9 command pages have no h2 at
           all and get nothing.
           Labelled *by* its heading rather than with a copy of it: an aria-label
           duplicating a visible <h2> is what made the reference groups' region
           landmarks worthless. -->
      <nav v-if="page.toc.length >= 3" class="toc" aria-labelledby="toc-title">
        <h2 id="toc-title" class="u-label toc__title">{{ t.tocLabel }}</h2>
        <ol class="toc__list" role="list">
          <li v-for="h in page.toc" :key="h.id">
            <a :href="`#${h.id}`" :lang="foreign">{{ h.text }}</a>
          </li>
        </ol>
      </nav>

      <PageBody :src="src" />
    </div>

    <footer class="doc__foot">
      <NuxtLink :to="path('/reference')" class="u-label">← {{ t.navRef }}</NuxtLink>
    </footer>
  </article>
</template>

<style scoped>
.doc {
  padding-block-start: clamp(2rem, 6vh, 4rem);
  max-width: var(--measure-wide);
  /* DESIGN.md §6: the contents sizes to this column, not the viewport. The two
     differ by the gutter, which is itself fluid. */
  container-type: inline-size;
}

.doc__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

/* The contents is a wide-screen affordance (DESIGN.md §6). Below this it is not
   rendered at all rather than stacked above the body: on the worst page that
   would put 14 links between the reader and the first paragraph, to reach
   headings that are in the document anyway. The ids stay on the headings at
   every width, so a deep link still works. */
@container (width >= 60rem) {
  .doc__layout {
    grid-template-columns: minmax(0, 1fr) var(--measure-toc);
    column-gap: var(--space-7);
  }

  /* Explicit placement, because the DOM order is nav-then-body and the visual
     order is body-then-nav. */
  .toc { grid-column: 2; grid-row: 1; }
  .doc__layout > :not(.toc) { grid-column: 1; grid-row: 1; }
}

@container (width < 60rem) {
  .toc {
    display: none;
  }
}

.toc {
  position: sticky;
  /* Breathing room only — the header is not sticky, so nothing overlays the
     headings either and they need no scroll-margin. */
  top: var(--space-7);
  align-self: start;
  max-height: calc(100svh - var(--space-7) * 2);
  overflow-y: auto;
  padding-inline-start: var(--space-5);
  border-inline-start: var(--divider-width) solid var(--color-divider);
}

.toc__title {
  color: var(--color-text-muted);
  margin-block-end: var(--space-4);
}

.toc__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.toc__list a {
  display: block;
  color: var(--color-text-muted);
  text-decoration: none;
  /* --text-small, not --text-meta: §2 declares that one mono-only, and these
     entries are prose set in the body face. */
  font-size: var(--text-small);
  line-height: var(--text-small-lh);
  text-wrap: pretty;
  transition: color var(--motion-quick) var(--ease-move);
}

.toc__list a:hover {
  color: var(--color-accent);
}

.crumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-block-end: var(--space-6);
  font-family: var(--font-mono);
  font-variation-settings: 'wdth' var(--mono-width-label);
  font-size: var(--text-label);
  line-height: var(--text-label-lh);
  letter-spacing: var(--text-label-ls);
  font-weight: 500;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.crumb a {
  display: inline-flex;
  align-items: center;
  min-height: var(--target-min);
}

.crumb [aria-current] {
  color: var(--color-text);
}

.doc__kind {
  color: var(--color-text-muted);
  margin-block-end: var(--space-4);
}

.doc__title {
  margin-block-end: var(--space-5);
}

/* Command pages title themselves with their invocation, which is an
   identifier, not prose. DESIGN.md §2 puts identifiers in mono at wdth 100. */
.doc__title--id {
  font-family: var(--font-mono);
  font-variation-settings: 'wdth' var(--mono-width-label);
  font-weight: 500;
}

/* --- The interlock, same grid line as every other section ----------------- */
.interlock {
  position: relative;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  row-gap: var(--space-1);
  margin-block-end: var(--space-7);
}

.interlock__a { grid-column: 1 / 8; min-width: 0; }
.interlock__b { grid-column: 6 / 13; min-width: 0; }

.seam {
  position: absolute;
  inset-block: 0;
  left: calc(100% * 5 / 12);
  width: var(--seam-width);
  background: var(--color-seam);
  pointer-events: none;
  z-index: 1;
}

.module {
  height: 100%;
  padding: var(--space-module-pad);
  color: var(--color-text-muted);
}

.module--raised { background: var(--color-surface-raised); }
.module--raised-2 { background: var(--color-surface-raised-2); }
.pad-seam { padding-inline-end: var(--pad-seam-side); }

.doc__spec {
  margin: 0;
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  column-gap: var(--space-5);
}

.doc__spec dt {
  padding-block: var(--space-3);
  border-block-start: var(--divider-width) solid var(--color-divider);
}

.doc__spec dd {
  margin: 0;
  padding-block: var(--space-3);
  border-block-start: var(--divider-width) solid var(--color-divider);
  font-family: var(--font-mono);
  font-variation-settings: 'wdth' var(--mono-width-code);
  font-size: var(--text-small);
  overflow-wrap: anywhere;
}

@media (width < 48rem) {
  .interlock__a,
  .interlock__b { grid-column: 1 / -1; }

  .seam { display: none; }

  .interlock > div:not(.seam) + div:not(.seam),
  .interlock > dl:not(.seam) {
    border-block-start: var(--seam-width) solid var(--color-seam);
  }

  .pad-seam { padding-inline-end: var(--space-module-pad); }
}

.doc__foot {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-block-start: var(--space-section-block);
  padding-block-start: var(--space-4);
  border-block-start: var(--divider-width) solid var(--color-divider);
}

.doc__foot a {
  display: inline-flex;
  align-items: center;
  min-height: var(--target-touch);
  color: var(--color-text-muted);
  text-decoration: none;
  overflow-wrap: anywhere;
}

.doc__foot a:hover {
  color: var(--color-accent);
}
</style>
