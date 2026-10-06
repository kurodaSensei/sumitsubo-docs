<script setup lang="ts">
import { onMounted } from 'vue'

const { locale, t, path, otherLocalePath, applied, toggleTheme, restoreTheme, resolvedTheme } = useChrome()

onMounted(restoreTheme)

// `lang` must be right in the prerendered HTML, not patched on hydration.
useHead(() => ({
  htmlAttrs: { lang: locale.value },
  link: [{ rel: 'alternate', hreflang: locale.value === 'en' ? 'es' : 'en', href: otherLocalePath.value }]
}))
</script>

<template>
  <div class="shell">
    <a class="skip" :href="'#main'">{{ t.skip }}</a>

    <header class="header">
      <NuxtLink :to="path('/')" class="wordmark">
        <span class="wordmark__name">SUMITSUBO</span>
        <span class="wordmark__kanji" aria-hidden="true">墨壺</span>
      </NuxtLink>

      <nav class="nav" :aria-label="t.navAria">
        <NuxtLink :to="path('/')" class="nav__link">{{ t.navHome }}</NuxtLink>
        <NuxtLink :to="path('/reference')" class="nav__link">{{ t.navRef }}</NuxtLink>

        <!-- A real link to the translated route, not a JS toggle: it works
             without script and search engines can follow it. -->
        <NuxtLink :to="otherLocalePath" class="lang" :aria-label="t.langSwitchTo">
          {{ locale === 'en' ? 'ES' : 'EN' }}
        </NuxtLink>

        <button
          type="button"
          class="theme"
          :aria-label="applied === 'dark' ? t.themeToLight : t.themeToDark"
          @click="toggleTheme"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <rect x="3" y="3" width="14" height="14" />
            <path d="M10 3v14" />
          </svg>
        </button>
      </nav>
    </header>

    <main id="main" class="main">
      <slot />
    </main>

    <footer class="footer">
      <span>SUMITSUBO 墨壺 · MIT</span>
      <span>v0.4.0</span>
    </footer>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  min-height: 100svh;
}

/* Off-screen until focused, then it lands in the top-left corner. */
.skip {
  position: absolute;
  left: -9999px;
  top: var(--space-2);
  z-index: 10;
  padding: var(--space-3) var(--space-4);
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  font-family: var(--font-mono);
  font-size: var(--text-label);
  letter-spacing: var(--text-label-ls);
  text-transform: uppercase;
  text-decoration: none;
}

.skip:focus-visible {
  left: var(--space-2);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-gutter);
  border-bottom: var(--divider-width) solid var(--color-divider);
}

.wordmark {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  min-height: var(--target-touch);
  color: var(--color-text);
  text-decoration: none;
}

.wordmark__name {
  font-family: var(--font-display);
  font-weight: 700;
  font-variation-settings: 'wdth' 85;
  font-size: 1.3rem;
  letter-spacing: 0.06em;
}

.wordmark__kanji {
  font-family: var(--font-mono);
  font-variation-settings: 'wdth' var(--mono-width-code);
  font-size: var(--text-small);
  color: var(--color-text-muted);
}

.nav {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.nav__link,
.lang,
.theme {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--target-touch);
  font-family: var(--font-mono);
  font-variation-settings: 'wdth' var(--mono-width-label);
  font-size: var(--text-label);
  line-height: var(--text-label-lh);
  letter-spacing: var(--text-label-ls);
  font-weight: 500;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--color-text);
}

.nav__link {
  padding: 0 var(--space-4);
  /* 2px, not --border-width: this is the active-page indicator, which has to
     read as heavier than a hairline. */
  border-bottom: 2px solid transparent;
  transition: border-color var(--motion-quick) var(--ease-move);
}

.nav__link:hover {
  color: var(--color-accent);
}

/* aria-current is set by NuxtLink on the active route. */
.nav__link.router-link-exact-active {
  border-bottom-color: var(--color-accent);
}

.lang,
.theme {
  min-width: var(--target-touch);
  padding: 0 var(--space-3);
  border: var(--border-width) solid var(--color-border);
  background: none;
  cursor: pointer;
  font-weight: 600;
}

.lang:hover,
.theme:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.main {
  flex: 1;
  width: 100%;
  max-width: var(--measure-grid);
  margin-inline: auto;
  padding-inline: var(--space-gutter);
  padding-block-end: var(--space-section-block);
}

.footer {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-gutter);
  border-top: var(--divider-width) solid var(--color-divider);
  font-family: var(--font-mono);
  font-variation-settings: 'wdth' var(--mono-width-label);
  font-size: var(--text-label);
  line-height: var(--text-label-lh);
  letter-spacing: var(--text-label-ls);
  font-weight: 500;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
</style>
