<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { ALL_LOCALES, absolute, localePath, stripLocale } from '~/utils/routing'

const { locale, t, path, otherLocalePath, applied, toggleTheme, restoreTheme } = useChrome()
const route = useRoute()

let stopThemeTracking: (() => void) | undefined
onMounted(() => { stopThemeTracking = restoreTheme() })
onBeforeUnmount(() => stopThemeTracking?.())

// The path with no locale prefix, which both link sets are built from.
const base = computed(() => stripLocale(route.path))

// `lang` must be right in the prerendered HTML, not patched on hydration.
//
// The links were previously one `hreflang` pointing at the other locale with a
// RELATIVE href. Lighthouse scored that rule 0 and was right to: a crawler
// resolving the annotation from another host has nothing to resolve it against,
// so the two language versions were never actually declared to be each other.
// Fully qualified now, every locale listed on every page including itself —
// Google ignores a set where any version fails to name all the others — plus
// `x-default` for a reader whose language matches neither.
//
// The canonical exists because /reference and /reference/ both answer 200, so
// without it the two are a duplicate pair with no stated preference.
useHead(() => ({
  htmlAttrs: { lang: locale.value },
  link: [
    { rel: 'canonical', href: absolute(localePath(locale.value, base.value)) },
    ...ALL_LOCALES.map((loc) => ({
      rel: 'alternate',
      hreflang: loc,
      href: absolute(localePath(loc, base.value))
    })),
    { rel: 'alternate', hreflang: 'x-default', href: absolute(localePath('en', base.value)) },

    // The SVG mark themes itself with prefers-color-scheme; the .ico is the
    // fallback for anything that will not take an SVG. Until now the site
    // shipped the Nuxt default favicon from the scaffold commit — somebody
    // else's logo in the tab.
    { rel: 'icon', type: 'image/svg+xml', href: '/mark.svg' },
    { rel: 'icon', sizes: '16x16 32x32 48x48', href: '/favicon.ico' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }
  ],

  // Not in the Open Graph spec and read by no major platform — Facebook, X,
  // Slack and LinkedIn all ignore it. It is here because validators ask for it
  // and the answer is a file that already exists, so declining costs more
  // words than complying. Lives in useHead, not useSeoMeta: unhead's typed
  // schema has no `ogLogo` key.
  meta: [{ property: 'og:logo', content: absolute('/apple-touch-icon.png') }]
}))

// Social metadata. The site had none at all: posting the link anywhere
// produced a bare title and no image. The card is per locale because the
// manifesto printed on it is.
//
// Only the invariants live here. Each page sets its own ogTitle and
// ogDescription beside the title and description it already declares, because
// the layout cannot see them.
useSeoMeta({
  ogType: 'website',
  ogSiteName: 'Sumitsubo',
  ogUrl: () => absolute(localePath(locale.value, base.value)),
  ogLocale: () => (locale.value === 'es' ? 'es_ES' : 'en_US'),
  ogImage: () => absolute(`/og/${locale.value}.png`),
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageType: 'image/png',
  ogImageAlt: () => t.value.manifesto,
  twitterCard: 'summary_large_image',
  twitterImage: () => absolute(`/og/${locale.value}.png`),
  twitterImageAlt: () => t.value.manifesto
})
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
        <!-- The visible label is part of the accessible name (2.5.3), and the
             foreign phrase carries its own lang so it is not read with the
             wrong voice (3.1.2). -->
        <NuxtLink :to="otherLocalePath" class="lang" :hreflang="locale === 'en' ? 'es' : 'en'">
          {{ locale === 'en' ? 'ES' : 'EN' }}
          <span class="u-visually-hidden" :lang="locale === 'en' ? 'es' : 'en'">{{ t.langSwitchTo }}</span>
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

    <!-- tabindex="-1" so the skip link moves focus, not just the scroll
         position: without it the next Tab resumes from the skip link. -->
    <main id="main" class="main" tabindex="-1">
      <slot />
    </main>

    <footer class="footer">
      <span>SUMITSUBO <span lang="ja">墨壺</span> · MIT</span>
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
  font-size: var(--text-h3);
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
  transition: color var(--motion-quick) var(--ease-move),
              border-color var(--motion-quick) var(--ease-move);
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
  transition: color var(--motion-quick) var(--ease-move),
              border-color var(--motion-quick) var(--ease-move);
}

.lang:hover,
.theme:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.lang:active,
.theme:active {
  color: var(--color-accent-contrast);
  background: var(--color-accent);
  border-color: var(--color-accent);
  transition-duration: var(--motion-instant);
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
