<script setup lang="ts">
/**
 * The rendered body of one reference page.
 *
 * A `.server` component on purpose: its markup is produced on the server and
 * never hydrated, so the HTML is not also serialised into the page payload.
 * Before this, every detail page shipped its content twice — once in the
 * document and once again in `_payload.json` — 337 KB gzip across the 88
 * routes, for markup that is already in the DOM and never re-rendered.
 */
const props = defineProps<{ src: string }>()

const { data } = await useAsyncData(`body:${props.src}`, () => $fetch<{ html: string }>(props.src))
</script>

<template>
  <!-- Rendered in Node at sync time from first-party content; the sync script
       refuses to emit active markup. -->
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="prose" v-html="data?.html" />
</template>

<style scoped>
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

/* Tables are the densest thing in this content — up to 6 columns. The sync
 * script wraps each one in a focusable, named scroll region (the SFC cannot:
 * the body arrives through v-html). Without this they overflowed the viewport
 * by 1.92x at 320 px. */
.prose :deep(.table-scroll) {
  margin-block-end: var(--space-5);
  overflow-x: auto;
  max-width: none;
}

.prose :deep(table) {
  width: 100%;
  min-width: 32rem;
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
