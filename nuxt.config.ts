import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Prerender targets come from the content index, never a hand-kept list: a page
// added upstream must not be able to exist in the reference index while being
// missing from the build.
const index = JSON.parse(
  readFileSync(fileURLToPath(new URL('./content/index.json', import.meta.url)), 'utf8')
) as { entries: { kind: string, plugin: string, name: string }[] }

const pages = ['/', '/reference', ...index.entries.map((e) => `/${e.kind}/${e.plugin}/${e.name}`)]
// Spanish sits at `/`, English at `/en/`. Both are prerendered. Mirrors
// DEFAULT_LOCALE in app/utils/routing.ts — the last assertion in
// scripts/check-routes.mjs is what notices if the two drift apart.
const routes = [...pages, ...pages.map((p) => (p === '/' ? '/en' : `/en${p}`))]

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/tokens.css', '~/assets/css/base.css'],

  app: {
    head: {
      // The default locale. The layout overrides this per route; this is what
      // an error page and anything rendered outside a route get.
      htmlAttrs: { lang: 'es' },

      // Applies a stored theme before first paint. Without it the page renders
      // with the system preference and only switches once the bundle has
      // hydrated, so anyone whose choice disagrees with their system gets a
      // full-viewport repaint on every cold load. Inline and blocking on
      // purpose — it has to win the race against the first paint, and it is
      // two statements.
      script: [{
        innerHTML:
          "try{var t=localStorage.getItem('sumitsubo-theme');" +
          "if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}",
        tagPriority: 'critical'
      }],

      // The two faces every route paints above the fold. The earlier comment
      // here claimed Martian Mono "is never the LCP element" — it is: it sets
      // the h1 on all 84 detail routes, plus the header nav, the breadcrumb and
      // every row of the reference index. Bricolage is preloaded only by the
      // landing, which is the one route where the display face is the LCP.
      link: [
        {
          rel: 'preload',
          as: 'font',
          type: 'font/woff2',
          href: '/fonts/spline-sans-latin.woff2',
          crossorigin: 'anonymous'
        },
        {
          rel: 'preload',
          as: 'font',
          type: 'font/woff2',
          href: '/fonts/martian-mono-latin.woff2',
          crossorigin: 'anonymous'
        }
      ]
    }
  },

  // `/es/*` was the Spanish home until this commit, and those URLs are already
  // out in the world. The old English URLs cannot be redirected — they ARE the
  // new Spanish ones — but these can, so they are.
  routeRules: {
    '/es': { redirect: { to: '/', statusCode: 301 } },
    '/es/**': { redirect: { to: '/**', statusCode: 301 } }
  },

  nitro: {
    prerender: {
      // Explicit list, no crawling: crawling would silently skip any page the
      // index links to but no rendered anchor reaches, and a missing route
      // should be a build failure rather than a 404 found in production.
      crawlLinks: false,
      failOnError: true,
      routes
    }
  }
})
