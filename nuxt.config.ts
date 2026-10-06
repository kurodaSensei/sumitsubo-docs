import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Prerender targets come from the content index, never a hand-kept list: a page
// added upstream must not be able to exist in the reference index while being
// missing from the build.
const index = JSON.parse(
  readFileSync(fileURLToPath(new URL('./content/index.json', import.meta.url)), 'utf8')
) as { entries: { kind: string, plugin: string, name: string }[] }

const pages = ['/', '/reference', ...index.entries.map((e) => `/${e.kind}/${e.plugin}/${e.name}`)]
// English sits at `/`, Spanish at `/es/`. Both are prerendered; the reference
// content inside them is English either way.
const routes = [...pages, ...pages.map((p) => (p === '/' ? '/es' : `/es${p}`))]

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/tokens.css', '~/assets/css/base.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
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
