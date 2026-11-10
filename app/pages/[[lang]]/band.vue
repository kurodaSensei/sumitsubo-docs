<script setup lang="ts">
import { h } from 'vue'
import { isLocaleParam } from '~/utils/routing'

definePageMeta({ validate: (route) => isLocaleParam(route.params.lang) })

const { t, path } = useChrome()

useSeoMeta({
  title: () => `${t.value.bandTitle} — Sumitsubo`,
  description: () => t.value.bandLede,
  ogTitle: () => `${t.value.bandTitle} — Sumitsubo`,
  ogDescription: () => t.value.bandLede
})

// The band's strings name files, keys and commands; backticks mark them so the
// two locales keep one sentence each instead of being cut around every <code>.
const Prose = (props: { text: string }) =>
  props.text.split('`').map((part, i) => (i % 2 ? h('code', part) : part))

// What the band prints is English in both locales, so it lives here, not in strings.ts.
const SAMPLE = 'checkout-flow 3/7   212/400 lines   review behind   ✓ evidence        Feature  Review  Ship  Hide'
const STATES = [
  ['✓ reviewed', 'bandReviewCurrent'],
  ['review behind', 'bandReviewBehind'],
  ['review open', 'bandReviewOpen'],
  ['no review', 'bandReviewNone']
] as const
const BUTTONS = ['feature', 'review', 'ship'] as const
const TOGGLE = ['/sumi-band', '/sumi-band off', '/sumi-band on'].join('\n')
</script>

<template>
  <section class="band">
    <p class="u-label band__meta">sumi · /sumi-band</p>
    <h1>{{ t.bandTitle }}</h1>
    <p class="band__lede u-prose">{{ t.bandLede }}</p>

    <figure class="sample">
      <!-- Scrolls rather than wraps, like the commands on /install: the band is
           one line. Focusable so the overflow is reachable by keyboard. -->
      <pre class="cmd" tabindex="0"><code><span lang="ja">墨</span>  {{ SAMPLE }}</code></pre>
      <figcaption class="sample__caption u-prose">{{ t.bandSample }}</figcaption>
    </figure>

    <h2 id="parts">{{ t.bandParts }}</h2>

    <h3>{{ t.bandFeature }}</h3>
    <p class="u-prose"><Prose :text="t.bandFeatureBody" /></p>

    <h3>{{ t.bandLines }}</h3>
    <p class="u-prose"><Prose :text="t.bandLinesBody" /></p>
    <p class="u-prose"><Prose :text="t.bandLinesCount" /></p>

    <h3>{{ t.bandReview }}</h3>
    <p class="u-prose"><Prose :text="t.bandReviewBody" /></p>
    <dl class="terms">
      <template v-for="[label, key] in STATES" :key="key">
        <dt><code>{{ label }}</code></dt>
        <dd class="u-prose"><Prose :text="t[key]" /></dd>
      </template>
    </dl>

    <h3>{{ t.bandEvidence }}</h3>
    <p class="u-prose"><Prose :text="t.bandEvidenceBody" /></p>

    <h2 id="buttons">{{ t.bandButtons }}</h2>
    <p class="u-prose">{{ t.bandButtonsBody }}</p>
    <dl class="terms">
      <template v-for="name in BUTTONS" :key="name">
        <dt>{{ name[0].toUpperCase() + name.slice(1) }}</dt>
        <dd><NuxtLink :to="path(`/commands/sumi/${name}`)"><code>/sumi:{{ name }}</code></NuxtLink></dd>
      </template>
      <dt>Hide</dt>
      <dd class="u-prose"><Prose :text="t.bandButtonHide" /></dd>
    </dl>

    <h2 id="toggle">{{ t.bandToggle }}</h2>
    <p class="u-prose"><Prose :text="t.bandToggleBody" /></p>
    <pre class="cmd cmd--block"><code>{{ TOGGLE }}</code></pre>

    <h2 id="when">{{ t.bandWhen }}</h2>
    <p class="u-prose"><Prose :text="t.bandWhenBody" /></p>

    <h2 id="where">{{ t.bandWhere }}</h2>
    <p class="u-prose"><Prose :text="t.bandWhereBody" /></p>

    <h2 id="ponytail">{{ t.bandPonytail }}</h2>
    <p class="u-prose">{{ t.bandPonytailBody }}</p>
  </section>
</template>

<style scoped>
.band {
  padding-block-start: clamp(2.5rem, 7vh, 5rem);
}

.band__meta {
  color: var(--color-text-muted);
  margin-block-end: var(--space-4);
}

.band__lede {
  margin-block: var(--space-5) var(--space-7);
  color: var(--color-text-muted);
  font-size: var(--text-h3);
  line-height: var(--text-h3-lh);
}

.sample {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.sample__caption {
  color: var(--color-text-muted);
  font-size: var(--text-small);
  line-height: var(--text-small-lh);
}

/* Same treatment as the commands on /install. */
.cmd {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface-sunk);
  border: var(--border-width) solid var(--color-border);
  overflow-x: auto;
  white-space: pre;
  font-size: var(--text-code);
  line-height: var(--text-code-lh);
}

.cmd code {
  font-size: inherit;
}

.cmd--block {
  margin-block-start: var(--space-5);
  max-width: var(--measure-control);
}

h2 {
  margin-block: var(--space-section-block) var(--space-4);
  scroll-margin-block-start: var(--space-5);
}

h3 {
  margin-block: var(--space-6) var(--space-3);
}

.terms {
  margin: var(--space-4) 0 0;
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--space-3) var(--space-5);
  max-width: var(--measure-control);
}

.terms dt {
  font-size: var(--text-small);
  color: var(--color-text-muted);
}

.terms dd {
  margin: 0;
}

@media (width < 48rem) {
  .cmd {
    font-size: var(--text-meta);
  }

  .terms {
    grid-template-columns: 1fr;
    gap: var(--space-1);
  }

  .terms dd + dt {
    margin-block-start: var(--space-3);
  }
}
</style>
