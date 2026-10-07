// The site is Spanish at `/` and English at `/en/`. Because `[[lang]]` is an
// optional param it will happily match ANY first segment, so every page under
// it must validate or `/fr/reference` and `/bogus` answer 200.
//
// Two different things used to be the same word. Keeping them apart is now the
// main job of this file:
//
//   DEFAULT_LOCALE   served with no URL prefix                    es
//   SOURCE_LOCALE    what every page is written in upstream       en
//
// Both were English, so `locale === 'en'` meant either one and it never
// mattered which. It matters now — the URL default moved and the source did
// not. Everything keyed on a URL reads DEFAULT_LOCALE; everything reaching for
// a file under server/assets/pages/ reads SOURCE_LOCALE. check-routes.mjs
// asserts the two disagree, so they cannot quietly collapse back into one.

export const ALL_LOCALES = ['es', 'en'] as const
export type Locale = (typeof ALL_LOCALES)[number]

/** Served with no prefix. Every other locale carries one. */
export const DEFAULT_LOCALE: Locale = 'es'

/**
 * The locale the framework's own files are written in. It is what sits at the
 * root of `server/assets/pages/` and what a page with no translation falls
 * back to. Nothing to do with URLs: this one did not move.
 */
export const SOURCE_LOCALE: Locale = 'en'

/** Carries a URL prefix — every locale but the default. */
export const PREFIXED_LOCALES: readonly Locale[] = ALL_LOCALES.filter(
  (l) => l !== DEFAULT_LOCALE
)

/** Has a hand-written tree under `content/<locale>/` — every locale but the source. */
export const TRANSLATED_LOCALES: readonly Locale[] = ALL_LOCALES.filter(
  (l) => l !== SOURCE_LOCALE
)

export const KINDS = ['skills', 'commands'] as const
export type Kind = (typeof KINDS)[number]

/**
 * `/reference` (omitted, Spanish) and `/en/reference` are valid.
 * `/es/reference` is NOT — Spanish moved to the root, so that prefix is gone
 * and must 404 rather than render a soft 200 of a route the build never emits.
 */
export function isLocaleParam(param: unknown): boolean {
  const v = toSegment(param)
  return v === '' || (PREFIXED_LOCALES as readonly string[]).includes(v)
}

export function isKindParam(param: unknown): boolean {
  return (KINDS as readonly string[]).includes(toSegment(param))
}

/** The locale a route is in. An omitted prefix means the default. */
export function localeOf(param: unknown): Locale {
  const v = toSegment(param)
  return (PREFIXED_LOCALES as readonly string[]).includes(v)
    ? (v as Locale)
    : DEFAULT_LOCALE
}

/** Prefix a path for a locale: ('en', '/reference') -> '/en/reference'. */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  return locale === DEFAULT_LOCALE ? clean : `/${locale}${clean === '/' ? '' : clean}`
}

/** Remove any known locale prefix: '/en/reference' -> '/reference'. */
export function stripLocale(path: string): string {
  for (const loc of PREFIXED_LOCALES) {
    if (path === `/${loc}`) return '/'
    if (path.startsWith(`/${loc}/`)) return path.slice(loc.length + 1)
  }
  return path
}

/**
 * Which subtree of `server/assets/pages/` holds a locale's content. The source
 * locale sits at the root, every translation under its own folder. This is the
 * content namespace, not the URL one — `contentPrefix('es')` is `es/` even
 * though Spanish has no URL prefix at all.
 */
export function contentPrefix(locale: Locale): string {
  return locale === SOURCE_LOCALE ? '' : `${locale}/`
}

function toSegment(param: unknown): string {
  return Array.isArray(param) ? (param[0] ?? '') : String(param ?? '')
}

/**
 * The canonical origin. hreflang and canonical links are only honoured as
 * fully-qualified URLs — the layout shipped a relative `hreflang` href and
 * Lighthouse scored that rule 0, because a crawler on another host cannot
 * resolve it.
 */
export const SITE = 'https://sumitsubo-docs.vercel.app'

export function absolute(path: string): string {
  return SITE + path
}

/**
 * The framework's own repository. The site documents an MIT-licensed public
 * repo and had no link to it anywhere — the landing offered the install command
 * and nothing else, so reading the source meant guessing the URL.
 *
 * The root, not a blob path. `blobOf()` builds the deep links the detail pages
 * use, which is what this constant replaced a hardcoded copy of.
 */
export const REPO = 'https://github.com/kurodaSensei/sumitsubo'

/** A file's page in the repo: blobOf('plugins/sumi/skills/workflow/SKILL.md'). */
export function blobOf(path: string): string {
  return `${REPO}/blob/main/${path}`
}
