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
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') ?? ''

  // The slug lands in a filesystem key, so anything but the exact shape
  // `<kind>/<plugin>/<name>` is rejected rather than normalised.
  if (!/^[a-z]+\/[a-z0-9-]+\/[a-z0-9-]+$/.test(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Malformed page slug' })
  }

  // Nitro mounts `server/assets/` as `assets:server`, so a file at
  // server/assets/pages/skills/sumi/workflow.json is the key
  // `pages:skills:sumi:workflow.json`. Verified against getKeys() rather than
  // assumed — the obvious guess, `assets:pages`, is empty.
  const page = await useStorage('assets:server').getItem(`pages:${slug.replaceAll('/', ':')}.json`)
  if (!page) throw createError({ statusCode: 404, statusMessage: 'Page not found' })

  return page
})
