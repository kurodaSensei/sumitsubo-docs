<script setup lang="ts">
import { isLocaleParam } from '~/utils/routing'
import { INSTALL } from '~/utils/install'

definePageMeta({ validate: (route) => isLocaleParam(route.params.lang) })

const { t, locale } = useChrome()
const { version } = useContentIndex()

useSeoMeta({
  title: () => `${t.value.instTitle} — Sumitsubo`,
  description: () => t.value.instLede,
  ogTitle: () => `${t.value.instTitle} — Sumitsubo`,
  ogDescription: () => t.value.instLede
})
</script>

<template>
  <section class="install">
    <p class="u-label install__meta">v{{ version }} · Node 18+ · MIT</p>
    <h1>{{ t.instTitle }}</h1>
    <p class="install__lede u-prose">{{ t.instLede }}</p>

    <!-- The three routes, numbered. They are ordered by what most people
         should do, not by what is most interesting: one command, then the
         two fallbacks for when Node or npx are not an option. -->
    <ol class="ways" role="list">
      <li class="ways__item">
        <div class="module module--raised u-chamfer way">
          <p class="u-label way__n">01 · {{ t.instWay1 }}</p>
          <!-- A <pre>, not a styled <p>: it is a command, and it has to stay
               selectable and copyable with the shell characters intact. -->
          <pre class="cmd"><code>{{ INSTALL.primary }}</code></pre>
          <p class="way__note u-prose">{{ t.instWay1Note }}</p>
        </div>
      </li>

      <li class="ways__item">
        <div class="module module--raised-2 u-chamfer way">
          <p class="u-label way__n">02 · {{ t.instWay2 }}</p>
          <pre class="cmd"><code>{{ INSTALL.claudeCode.join('\n') }}</code></pre>
          <p class="way__note u-prose">{{ t.instWay2Note }}</p>
        </div>
      </li>

      <li class="ways__item">
        <div class="module module--raised u-chamfer way">
          <p class="u-label way__n">03 · {{ t.instWay3 }}</p>
          <pre class="cmd"><code>{{ INSTALL.clone.join('\n') }}</code></pre>
          <p class="way__note u-prose">{{ t.instWay3Note }}</p>
        </div>
      </li>
    </ol>

    <p class="install__restart u-prose">{{ t.instRestart }}</p>

    <h2 id="needs">{{ t.instNeeds }}</h2>
    <p class="u-prose">{{ t.instNeedsBody }}</p>

    <h2 id="try">{{ t.instTry }}</h2>
    <p class="u-prose">{{ t.instTryNote }}</p>
    <dl class="cmds">
      <dt>{{ t.instSandbox }}</dt>
      <dd><pre class="cmd"><code>{{ INSTALL.sandbox }}</code></pre></dd>
      <dt>{{ t.instNoSsh }}</dt>
      <dd><pre class="cmd"><code>{{ INSTALL.noSsh }}</code></pre></dd>
    </dl>

    <h2 id="after">{{ t.instMaintain }}</h2>
    <p class="u-prose">{{ t.instMaintainNote }}</p>
    <dl class="cmds">
      <template v-for="[key, cmd] in INSTALL.maintain" :key="key">
        <dt>{{ key === 'doctor' ? t.instDoctor : key === 'update' ? t.instUpdate : t.instUninstall }}</dt>
        <dd><pre class="cmd"><code>{{ cmd }}</code></pre></dd>
      </template>
    </dl>

    <h2 id="trouble">{{ t.instTrouble }}</h2>
    <p class="u-prose">{{ t.instTroubleBody }}</p>
  </section>
</template>

<style scoped>
.install {
  padding-block-start: clamp(2.5rem, 7vh, 5rem);
}

.install__meta {
  color: var(--color-text-muted);
  margin-block-end: var(--space-4);
}

.install__lede {
  margin-block: var(--space-5) var(--space-7);
  color: var(--color-text-muted);
  font-size: var(--text-h3);
  line-height: var(--text-h3-lh);
}

/* One module per route, stacked. They are read in order, so the staggered
   interlock the landing uses would fight the sequence. */
.ways {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: none;
}

.ways__item {
  min-width: 0;
}

.way {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.way__n {
  color: var(--color-accent);
}

.way__note {
  color: var(--color-text-muted);
  font-size: var(--text-small);
  line-height: var(--text-small-lh);
  margin: 0;
}

.way__fine {
  margin: 0;
  font-size: var(--text-meta);
  line-height: var(--text-meta-lh);
  color: var(--color-text-muted);
  border-inline-start: var(--seam-width) solid var(--color-seam);
  padding-inline-start: var(--space-4);
}

/* Commands scroll rather than wrap: a wrapped shell line reads as two
   commands. The horizontal scroller is focusable so it is reachable by
   keyboard, which a plain overflow container is not. */
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

.install__restart {
  margin-block-start: var(--space-6);
  color: var(--color-text);
  font-weight: 500;
}

h2 {
  margin-block: var(--space-section-block) var(--space-4);
  scroll-margin-block-start: var(--space-5);
}

.cmds {
  margin: var(--space-5) 0 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: var(--measure-control);
}

.cmds dt {
  font-size: var(--text-small);
  color: var(--color-text-muted);
  margin-block-end: var(--space-2);
}

.cmds dd {
  margin: 0;
}

@media (width < 48rem) {
  .cmd {
    font-size: var(--text-meta);
  }
}
</style>
