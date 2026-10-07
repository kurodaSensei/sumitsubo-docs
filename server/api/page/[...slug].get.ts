import { SOURCE_LOCALE, TRANSLATED_LOCALES, contentPrefix, type Locale } from '~/utils/routing'

/**
 * Serves one reference page's rendered content from `server/assets/pages/`.
 *
 * This route exists so the content never goes through the bundler. Importing
 * the JSON made one JS chunk per page and esbuild rejected the generated
 * module; fetching it from `public/` instead fails during prerender, because
 * SSR's internal fetch does not serve static assets. A server route is the one
 * path that works in both places.
 *
 * It costs nothing at runtime on a static host: `nuxt generate` resolves this
 * during prerender and inlines the result into each page's payload, so client
 * navigation reads the payload and never calls this.
 *
 * The slug may carry a leading locale — `es/skills/sumi/workflow`. English is
 * the source and has no prefix HERE, in the content tree, however the URLs
 * are arranged: the site serves Spanish at `/` and English at `/en/`, and
 * this route is deliberately not keyed on that. A locale with no translation for that page
 * falls back to English rather than 404ing, and the response says which locale
 * actually answered, so the page can declare the fallback instead of presenting
 * English as though it were Spanish.
 */
export default defineEventHandler(async (event) => {
  const raw = getRouterParam(event, 'slug') ?? ''

  const parts = raw.split('/')
  // TRANSLATED_LOCALES, not the URL-prefixed ones. This slug addresses the
  // content tree, where English is still the unprefixed root — the opposite of
  // the URL, where English is now the one carrying a prefix.
  const locale: Locale = (TRANSLATED_LOCALES as readonly string[]).includes(parts[0] ?? '')
    ? (parts.shift() as Locale)
    : SOURCE_LOCALE
  const slug = parts.join('/')

  // The slug lands in a filesystem key, so anything but the exact shape
  // `<kind>/<plugin>/<name>` is rejected rather than normalised.
  if (!/^[a-z]+\/[a-z0-9-]+\/[a-z0-9-]+$/.test(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Malformed page slug' })
  }

  // Nitro mounts `server/assets/` as `assets:server`, so a file at
  // server/assets/pages/skills/sumi/workflow.json is the key
  // `pages:skills:sumi:workflow.json`. Verified against getKeys() rather than
  // assumed — the obvious guess, `assets:pages`, is empty.
  const store = useStorage('assets:server')
  const key = (loc: Locale) =>
    `pages:${contentPrefix(loc).replace('/', ':')}${slug.replaceAll('/', ':')}.json`

  const translated = locale === SOURCE_LOCALE ? null : await store.getItem(key(locale))
  const page = translated ?? await store.getItem(key(SOURCE_LOCALE))
  if (!page) throw createError({ statusCode: 404, statusMessage: 'Page not found' })

  // `locale` is what answered, not what was asked for. The caller needs the
  // difference: it is what decides whether the body gets a `lang` declaration.
  return { ...(page as object), locale: translated ? locale : SOURCE_LOCALE }
})
