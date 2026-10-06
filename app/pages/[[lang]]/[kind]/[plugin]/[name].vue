<script setup lang="ts">
import { isKindParam, isLocaleParam } from '~/utils/routing'

definePageMeta({
  validate: (route) => isLocaleParam(route.params.lang) && isKindParam(route.params.kind)
})

const route = useRoute()
const { t, path } = useChrome()

interface Page {
  title: string
  description: string
  plugin: string
  kind: string
  references: number
  source: string
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

const { data: page } = await useAsyncData(src, () => $fetch<Page>(src))
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
    <h1 class="doc__title">{{ page.title }}</h1>
    <p class="doc__lede u-prose">{{ page.description }}</p>

    <!-- Rendered in Node at sync time from first-party content. -->
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="prose" v-html="page.html" />

    <footer class="doc__foot">
      <NuxtLink :to="path('/reference')" class="u-label">← {{ t.navRef }}</NuxtLink>
      <a :href="REPO + page.source" class="u-label" rel="noopener">{{ page.source }}</a>
    </footer>
  </article>
</template>

<style scoped>
.doc {
  padding-block-start: clamp(2rem, 6vh, 4rem);
  max-width: var(--measure-wide);
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
  font-family: var(--font-mono);
  font-variation-settings: 'wdth' var(--mono-width-code);
  font-weight: 500;
  margin-block-end: var(--space-5);
}

.doc__lede {
  margin-block-end: var(--space-7);
  color: var(--color-text-muted);
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

/* --- Rendered markdown ------------------------------------------------------
 * Deep selectors because this subtree comes from v-html and carries no scope
 * attribute. Kept minimal on purpose: this slice makes the content legible,
 * not beautiful. Typographic refinement is a later slice. */
.prose {
  max-width: var(--measure-prose);
}

.prose :deep(h2) {
  margin-block: var(--space-8) var(--space-4);
}

.prose :deep(h3) {
  margin-block: var(--space-6) var(--space-3);
}

.prose :deep(h4) {
  margin-block: var(--space-5) var(--space-3);
  font-family: var(--font-mono);
  font-variation-settings: 'wdth' var(--mono-width-label);
  font-size: var(--text-small);
  text-transform: uppercase;
  letter-spacing: var(--text-label-ls);
  color: var(--color-text-muted);
}

.prose :deep(p),
.prose :deep(ul),
.prose :deep(ol) {
  margin-block-end: var(--space-4);
}

.prose :deep(li) {
  margin-block-end: var(--space-2);
}

.prose :deep(ul),
.prose :deep(ol) {
  padding-inline-start: var(--space-5);
}

.prose :deep(code) {
  padding: 1px var(--space-1);
  background: var(--color-surface-sunk);
  border: var(--border-width) solid var(--color-divider);
}

.prose :deep(pre) {
  margin-block-end: var(--space-5);
  padding: var(--space-4);
  overflow-x: auto;
  background: var(--color-surface-sunk);
  border: var(--border-width) solid var(--color-border);
}

/* A code block already has its own frame; the inline treatment would double it. */
.prose :deep(pre code) {
  padding: 0;
  background: none;
  border: 0;
}

/* Tables are the densest thing in this content — 3 to 6 columns is normal.
 * They get the full width and scroll rather than squeezing. */
.prose :deep(table) {
  width: 100%;
  margin-block-end: var(--space-5);
  border-collapse: collapse;
  font-size: var(--text-small);
  line-height: var(--text-small-lh);
}

.prose :deep(th),
.prose :deep(td) {
  padding: var(--space-3) var(--space-4);
  text-align: start;
  vertical-align: top;
  border-block-start: var(--divider-width) solid var(--color-divider);
}

.prose :deep(th) {
  font-family: var(--font-mono);
  font-variation-settings: 'wdth' var(--mono-width-label);
  font-size: var(--text-label);
  letter-spacing: var(--text-label-ls);
  text-transform: uppercase;
  color: var(--color-text-muted);
  border-block-end: var(--border-width) solid var(--color-border);
}

.prose :deep(blockquote) {
  margin: 0 0 var(--space-5);
  padding-inline-start: var(--space-4);
  border-inline-start: var(--seam-width) solid var(--color-seam);
  color: var(--color-text-muted);
}

.prose :deep(hr) {
  margin-block: var(--space-7);
  border: 0;
  border-block-start: var(--divider-width) solid var(--color-divider);
}

/* The prose column is capped, but a wide table should not be. */
.prose :deep(table),
.prose :deep(pre) {
  max-width: none;
}
</style>
