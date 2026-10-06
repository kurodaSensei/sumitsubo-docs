// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/tokens.css', '~/assets/css/base.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      link: [
        // Only the two faces above the fold. Martian Mono carries labels and
        // code and is never the LCP element, so it loads on demand.
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
          href: '/fonts/bricolage-grotesque-latin.woff2',
          crossorigin: 'anonymous'
        }
      ]
    }
  },

  nitro: {
    prerender: {
      // The route list is explicit and generated from content/index.json in
      // phase 3. Crawling would miss the /es/ tree anyway, since the language
      // switch is the only thing that links to it.
      crawlLinks: false,
      failOnError: true,
      routes: ['/', '/es', '/reference', '/es/reference']
    }
  }
})
