<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { isLocaleParam } from '~/utils/routing'
import { describe, type Plugin } from '~/composables/useContentIndex'

definePageMeta({ validate: (route) => isLocaleParam(route.params.lang) })

const { t, path, locale } = useChrome()

// DESIGN.md §7, landing only. The reference and detail pages get none of it.
useReveal()

// Plugin descriptions are translated per locale when one exists; `describe()`
// hands back the text and the language to declare on it together, so a card
// that fell back to English cannot end up unlabelled under `<html lang="es">`.
const { counts, core, stack, plugins, skillsOf } = useContentIndex()
const card = (p: Plugin) => describe(p, locale.value)

const INSTALL = '/plugin marketplace add kurodaSensei/sumitsubo'

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

async function copyInstall() {
  // Only announce success when it succeeded. `navigator.clipboard` is undefined
  // in an insecure context and optional chaining swallows that silently, so the
  // old version told every such visitor "Copied" while the clipboard was
  // untouched. The command stays on screen and selectable either way.
  try {
    if (!navigator.clipboard) return
    await navigator.clipboard.writeText(INSTALL)
  } catch {
    return
  }
  copied.value = true
  clearTimeout(timer)
  // 5s, not 1.8s: a status message has to outlast the time it takes to notice
  // and read it.
  timer = setTimeout(() => (copied.value = false), 5000)
}

onBeforeUnmount(() => clearTimeout(timer))

useSeoMeta({
  title: () => t.value.seoTitle,
  description: () => t.value.seoDescription
})

// The manifesto is this route's LCP element and the only place the display face
// paints above the fold, so the preload belongs here rather than in the global
// head where it would compete with the LCP on the other 86 routes.
useHead({
  link: [{
    rel: 'preload',
    as: 'font',
    type: 'font/woff2',
    href: '/fonts/bricolage-grotesque-latin.woff2',
    crossorigin: 'anonymous'
  }]
})
</script>

<template>
  <div class="landing">
    <section class="hero" aria-labelledby="manifesto">
      <p class="u-label hero__meta">
        v0.4.0 · MIT · {{ counts.plugins }} plugins · {{ counts.commands }} {{ t.commandsLabel }} ·
        {{ counts.skills }} {{ t.skills }}
      </p>
      <h1 id="manifesto" class="hero__line">{{ t.manifesto }}</h1>
      <div class="rule" />

      <!-- The first interlock carries no `data-reveal`. DESIGN.md §7 reveals a
           module "on first entry into the viewport", and these two never enter
           it — they are on screen when the page paints. Animating them in is
           not the rule, it is the rule misapplied.
           It also costs. The start state is `opacity: 0` from CSS at parse
           time, cleared only once `useReveal` runs after hydration, so on a
           throttled phone there is a real window with the hero invisible —
           which is what Lighthouse saw when it scored the Spanish landing 96
           on accessibility against 100 for the English one. -->
      <div class="interlock">
        <div class="seam" aria-hidden="true" />

        <div class="interlock__a">
          <div class="module module--raised u-chamfer pad-seam">
            <!-- No .u-prose: `pad-seam` already caps the measure here, and the
                 two compounded to a ~38-character column at 820 px. One rule
                 owns the measure. -->
            <p>{{ t.lede }}</p>
          </div>
        </div>

        <div class="interlock__b">
          <div class="module module--raised-2 u-chamfer install">
            <div class="install__actions">
              <button type="button" class="btn u-chamfer-control" :aria-label="t.installAction" @click="copyInstall">
                {{ t.install }}
              </button>
              <NuxtLink :to="path('/reference')" class="btn-ghost">{{ t.seeSkills }}</NuxtLink>
            </div>

            <div class="code">
              <code class="code__text" tabindex="0">{{ INSTALL }}</code>
              <button type="button" class="code__copy" :aria-label="t.copy" @click="copyInstall">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <rect x="6" y="6" width="10" height="10" />
                  <path d="M4 13V4h9" />
                </svg>
              </button>
            </div>

            <p class="u-label install__status" role="status" aria-live="polite">
              {{ copied ? t.copied : '' }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="compose">
      <p class="u-label section__label">{{ t.figLabel }}</p>
      <h2 id="compose" class="section__title">{{ t.figTitle }}</h2>
      <p class="section__lead u-prose">{{ t.figLead }}</p>

      <div class="interlock">
        <div class="seam" aria-hidden="true" />

        <div class="interlock__a">
          <figure data-reveal class="module module--raised u-chamfer pad-seam fig">
            <p class="u-label fig__rule">{{ t.always }}</p>
            <p class="fig__note">{{ t.alwaysSub }}</p>
            <div v-for="p in core" :key="p.name" class="fig__row">
              <p class="fig__head">
                <span class="fig__name">{{ p.name }}</span>
                <span class="u-label fig__count">{{ p.skills }} {{ t.skills }}</span>
              </p>
              <p class="fig__skills">{{ skillsOf(p.name).join(' · ') }}</p>
            </div>
          </figure>
        </div>

        <div class="interlock__b">
          <figure data-reveal class="module module--raised-2 u-chamfer fig">
            <p class="u-label fig__rule">{{ t.pick }}</p>
            <p class="fig__note">{{ t.pickSub }}</p>
            <div v-for="p in stack" :key="p.name" class="fig__row">
              <p class="fig__head">
                <span class="fig__name">{{ p.name }}</span>
                <span class="u-label fig__count">{{ p.skills }} {{ t.skills }}</span>
              </p>
              <p class="fig__skills">{{ skillsOf(p.name).join(' · ') }}</p>
            </div>
          </figure>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="plugins">
      <h2 id="plugins" class="section__title">{{ t.pluginsTitle }}</h2>
      <div class="interlock">
        <div class="seam" aria-hidden="true" />
        <div
          v-for="(p, i) in plugins"
          :key="p.name"
          :class="i % 2 ? 'interlock__b' : 'interlock__a'"
        >
          <article
            data-reveal
            class="module u-chamfer card"
            :class="[i % 2 ? 'module--raised-2' : 'module--raised', { 'pad-seam': i % 2 === 0 }]"
          >
            <p class="u-label card__meta">
              {{ String(i + 1).padStart(2, '0') }}
              <template v-if="p.commands">· {{ p.commands }} {{ t.commandsLabel }}</template>
              · {{ p.skills }} {{ t.skills }}
            </p>
            <h3 class="card__name">{{ p.name }}</h3>
            <p :lang="card(p).lang">{{ card(p).text }}</p>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  padding-block-start: clamp(3rem, 9vh, 7rem);
}

.hero__meta {
  color: var(--color-text-muted);
  margin-block-end: var(--space-6);
}

.hero__line {
  font-size: var(--text-display);
  line-height: var(--text-display-lh);
  letter-spacing: var(--text-display-ls);
  max-width: 15ch;
}

.rule {
  margin-block-start: clamp(2.5rem, 6vh, 4.5rem);
  height: var(--divider-width);
  background: var(--color-divider);
}

.section {
  margin-block-start: var(--space-section-block);
}

.section__label {
  color: var(--color-text-muted);
  margin-block-end: var(--space-3);
}

.section__title {
  max-width: 28ch;
}

.section__lead {
  margin-block: var(--space-3) var(--space-6);
  color: var(--color-text-muted);
}

/* --- The interlock --------------------------------------------------------
 * Siblings alternate 1–7 and 6–12 so they overlap by one column, and the seam
 * sits on the shared edge. The same grid line in every section is what makes
 * the joint read as a joint rather than a stagger. */
.interlock {
  position: relative;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  /* A spacing token, not --seam-width: that one is a line weight. */
  row-gap: var(--space-1);
  margin-block-start: var(--space-1);
}

.interlock__a {
  grid-column: 1 / 8;
  min-width: 0;
}

.interlock__b {
  grid-column: 6 / 13;
  min-width: 0;
}

/* Each module enters along the axis it interlocks on. */
.interlock__a [data-reveal] { --reveal-shift: translateX(-24px); }
.interlock__b [data-reveal] { --reveal-shift: translateX(24px); }

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
  /* No border and no shadow. Depth is tonal — which is also what makes the
   * clip-path chamfer safe, since there is no edge for it to eat. */
}

.module--raised {
  background: var(--color-surface-raised);
}

.module--raised-2 {
  background: var(--color-surface-raised-2);
}

/* Left-hand modules run under the seam without this. */
.pad-seam {
  padding-inline-end: var(--pad-seam-side);
}

.install {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.install__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-5);
}

.install__status {
  min-height: 1.2em;
  color: var(--color-accent);
}

.btn {
  min-height: var(--space-7);
  padding-inline: var(--space-6);
  border: 0;
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: var(--text-body);
  cursor: pointer;
  transition: background var(--motion-quick) var(--ease-move),
              transform var(--motion-quick) var(--ease-move);
}

/* A token, not `filter: brightness()`. The filter brightened the label as well
   as the fill, so light-theme --color-accent-contrast clipped to pure white —
   and the resulting pair existed in no table. */
.btn:hover {
  background: var(--color-accent-hover);
}

.btn:active {
  background: var(--color-accent-hover);
  transform: translateY(1px);
  transition-duration: var(--motion-instant);
}

.btn-ghost {
  min-height: var(--target-touch);
  display: inline-flex;
  align-items: center;
  border-bottom: var(--border-width) solid var(--color-text);
  color: var(--color-text);
  font-weight: 500;
  text-decoration: none;
}

.btn-ghost:hover {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

.code {
  display: flex;
  align-items: stretch;
  border: var(--border-width) solid var(--color-border);
  background: var(--color-surface-sunk);
}

.code__text {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  padding: var(--space-3) var(--space-4);
  white-space: nowrap;
  line-height: var(--text-code-lh);
}

/* The install command is the page's primary conversion. On a narrow module it
   was rendering as `/plugin marketplace add kurodaSensei/` with no visible
   affordance — it reads as broken text, not as something scrollable. Below
   64rem it wraps instead. */
@media (width < 64rem) {
  .code__text {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    overflow-x: visible;
  }
}

.code__copy {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: var(--target-touch);
  border: 0;
  border-left: var(--border-width) solid var(--color-border);
  background: none;
  color: var(--color-text);
  cursor: pointer;
}

.code__copy:hover {
  color: var(--color-accent);
}

.fig {
  margin: 0;
}

.fig__rule {
  color: var(--color-text);
  font-weight: 600;
}

.fig__note {
  margin-block: var(--space-2) var(--space-5);
  font-size: var(--text-small);
  line-height: var(--text-small-lh);
  color: var(--color-text-muted);
}

.fig__row {
  padding-block: var(--space-4);
  border-block-start: var(--divider-width) solid var(--color-divider);
}

.fig__head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-block-end: var(--space-2);
}

.fig__name {
  font-family: var(--font-mono);
  /* An identifier, not code: DESIGN.md §2 puts these at wdth 100. */
  font-variation-settings: 'wdth' var(--mono-width-label);
  font-size: var(--text-body);
  color: var(--color-accent);
}

.fig__count {
  color: var(--color-text-muted);
}

.fig__skills {
  font-family: var(--font-mono);
  font-variation-settings: 'wdth' var(--mono-width-code);
  font-size: var(--text-meta);
  line-height: var(--text-meta-lh);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
}

.card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.card__meta {
  color: var(--color-text-muted);
}

.card__name {
  font-family: var(--font-mono);
  font-variation-settings: 'wdth' var(--mono-width-label);
  font-weight: 400;
  color: var(--color-accent);
}

/* Below 48rem the interlock collapses to one column. The chamfer stays —
 * it is the signature; the offset does not. */
@media (width < 48rem) {
  .interlock__a,
  .interlock__b {
    grid-column: 1 / -1;
  }

  /* DESIGN.md §6: the seam becomes a full-width horizontal rule here — it does
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

  /* The interlock is gone here, so the entry axis becomes vertical. */
  .interlock__a [data-reveal],
  .interlock__b [data-reveal] { --reveal-shift: translateY(24px); }
}
</style>
