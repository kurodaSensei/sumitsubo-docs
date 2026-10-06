<script setup lang="ts">
import { computed, ref } from 'vue'
import { isLocaleParam } from '~/utils/routing'

definePageMeta({ validate: (route) => isLocaleParam(route.params.lang) })

const { t, path } = useChrome()
const { counts, groups, hrefOf } = useContentIndex()

// Empty on the server, so the prerendered HTML carries the full list and the
// page is complete without JavaScript. The filter is an enhancement on top.
const query = ref('')
const input = ref<HTMLInputElement | null>(null)

// Clearing the filter destroys the empty state the button lives in, so without
// moving focus first it lands on <body> and keyboard position is lost.
function clearQuery() {
  query.value = ''
  input.value?.focus()
}

const visible = computed(() => {
  const q = query.value.trim().toLowerCase()
  return groups.value
    .map((g) => ({ ...g, entries: q ? g.entries.filter((e) => e.name.toLowerCase().includes(q)) : g.entries }))
    .filter((g) => g.entries.length > 0)
})

const matches = computed(() => visible.value.reduce((n, g) => n + g.entries.length, 0))
const groupTitle = (key: string) => (key === 'commands' ? t.value.commands : key)

useSeoMeta({
  title: `${t.value.refTitle} — Sumitsubo`,
  description: `${counts.commands} commands and ${counts.skills} skills across ${counts.plugins} plugins.`
})
</script>

<template>
  <section class="reference">
    <p class="u-label reference__meta">
      {{ counts.commands }} {{ t.commandsLabel }} · {{ counts.skills }} {{ t.skills }} ·
      {{ counts.plugins }} plugins
    </p>
    <h1 class="reference__title">{{ t.refTitle }}</h1>

    <label for="q" class="u-label reference__filter-label">{{ t.filterLabel }}</label>
    <div class="search">
      <svg class="search__icon" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <rect x="3" y="3" width="10" height="10" />
        <path d="M13 13l4 4" />
      </svg>
      <input
        id="q"
        ref="input"
        v-model="query"
        type="search"
        class="search__input"
        :placeholder="`${t.filterPlaceholder} (${counts.pages})`"
      >
      <!-- The count is the honest answer to "is the list complete?" — it can
           never disagree with what is on screen because both derive from the
           same filtered list. -->
      <span class="u-label search__count tabular" role="status" aria-live="polite">
        {{ query.trim() ? `${matches} / ${counts.pages}` : counts.pages }}
      </span>
    </div>

    <div v-if="matches === 0" class="module module--raised u-chamfer empty">
      <p>{{ t.noResults(query.trim()) }}</p>
      <button type="button" class="btn-outline" @click="clearQuery">{{ t.clear }}</button>
    </div>

    <div class="interlock">
      <div class="seam" aria-hidden="true" />
      <div
        v-for="(g, i) in visible"
        :key="g.key"
        :class="i % 2 ? 'interlock__b' : 'interlock__a'"
      >
        <section
          class="module u-chamfer group"
          :class="[i % 2 ? 'module--raised-2' : 'module--raised', { 'pad-seam': i % 2 === 0 }]"
          :aria-label="groupTitle(g.key)"
        >
          <h2 class="u-label group__title tabular">{{ groupTitle(g.key) }} · {{ g.entries.length }}</h2>
          <ul class="group__list" role="list">
            <li v-for="e in g.entries" :key="e.plugin + e.name" class="group__item">
              <NuxtLink :to="path(hrefOf(e))" class="entry">
                <span>{{ e.kind === 'commands' ? e.title : e.name }}</span>
                <span class="entry__arrow" aria-hidden="true">→</span>
              </NuxtLink>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <p class="reference__note u-prose">{{ t.protoNote }}</p>
  </section>
</template>

<style scoped>
.reference {
  padding-block-start: clamp(2.5rem, 7vh, 5rem);
}

.reference__meta {
  color: var(--color-text-muted);
  margin-block-end: var(--space-4);
}

.reference__title {
  margin-block-end: var(--space-6);
}

.reference__filter-label {
  display: block;
  margin-block-end: var(--space-2);
  color: var(--color-text-muted);
}

.search {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  max-width: 44rem;
  padding-inline: var(--space-4);
  border: var(--border-width) solid var(--color-border);
  background: var(--color-surface-raised);
}

.search:focus-within {
  outline: var(--focus-width) solid var(--color-focus);
  outline-offset: var(--focus-offset);
}

.search__icon {
  flex: none;
  color: var(--color-text-muted);
}

.search__input {
  flex: 1;
  min-width: 0;
  min-height: var(--space-7);
  border: 0;
  outline: 0;
  background: none;
  color: var(--color-text);
  font-size: var(--text-body);
}

.search__count {
  color: var(--color-text-muted);
}

.empty {
  max-width: 44rem;
  margin-block-start: var(--space-6);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-5);
}

.btn-outline {
  min-height: var(--target-touch);
  padding-inline: var(--space-5);
  border: var(--border-width) solid var(--color-border);
  background: none;
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: var(--text-body);
  font-weight: 500;
  cursor: pointer;
  transition: color var(--motion-quick) var(--ease-move),
              border-color var(--motion-quick) var(--ease-move),
              background var(--motion-quick) var(--ease-move);
}

.btn-outline:active {
  color: var(--color-accent-contrast);
  background: var(--color-accent);
  border-color: var(--color-accent);
  transition-duration: var(--motion-instant);
}

.btn-outline:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.interlock {
  position: relative;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  /* A spacing token, not --seam-width: that one is a line weight. */
  row-gap: var(--space-1);
  margin-block-start: var(--space-7);
}

.interlock__a {
  grid-column: 1 / 8;
  min-width: 0;
}

.interlock__b {
  grid-column: 6 / 13;
  min-width: 0;
}

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
}

.module--raised {
  background: var(--color-surface-raised);
}

.module--raised-2 {
  background: var(--color-surface-raised-2);
}

.pad-seam {
  padding-inline-end: var(--pad-seam-side);
}

.group__title {
  margin-block-end: var(--space-5);
  color: var(--color-text-muted);
}

.group__list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.group__item {
  border-block-start: var(--divider-width) solid var(--color-divider);
}

.entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  min-height: var(--target-touch);
  color: var(--color-text);
  text-decoration: none;
  font-family: var(--font-mono);
  font-variation-settings: 'wdth' var(--mono-width-code);
  font-size: var(--text-small);
  transition: color var(--motion-quick) var(--ease-move);
}

.entry:hover {
  color: var(--color-accent);
}

.entry:focus-visible {
  outline-offset: -2px;
}

.entry__arrow {
  color: var(--color-accent);
}

.reference__note {
  margin-block-start: var(--space-6);
  font-size: var(--text-small);
  line-height: var(--text-small-lh);
  color: var(--color-text-muted);
}

@media (width < 48rem) {
  .interlock__a,
  .interlock__b {
    grid-column: 1 / -1;
  }

  /* DESIGN.md §6: the seam becomes a full-width horizontal rule here, it does
     not disappear. One absolutely-positioned element cannot sit between every
     stacked pair, so the joint is drawn as a top edge on each sibling that
     follows another: same token, same weight, now horizontal. */
  .seam {
    display: none;
  }

  .interlock > div:not(.seam) + div:not(.seam) {
    border-block-start: var(--seam-width) solid var(--color-seam);
  }

  .pad-seam {
    padding-inline-end: var(--space-module-pad);
  }
}
</style>
