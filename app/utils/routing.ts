// The site is English at `/` and Spanish at `/es/`. Because `[[lang]]` is an
// optional param it will happily match ANY first segment, so every page under
// it must validate or `/fr/reference` and `/bogus` answer 200.
export const LOCALES = ['es'] as const
export type Locale = 'en' | (typeof LOCALES)[number]

export const KINDS = ['skills', 'commands'] as const
export type Kind = (typeof KINDS)[number]

/** `/reference` (omitted) and `/es/reference` are valid; `/fr/reference` is not. */
export function isLocaleParam(param: unknown): boolean {
  const v = toSegment(param)
  return v === '' || (LOCALES as readonly string[]).includes(v)
}

export function isKindParam(param: unknown): boolean {
  return (KINDS as readonly string[]).includes(toSegment(param))
}

/** The locale a route is in. An omitted prefix means English. */
export function localeOf(param: unknown): Locale {
  const v = toSegment(param)
  return (LOCALES as readonly string[]).includes(v) ? (v as Locale) : 'en'
}

/** Prefix a path for a locale: ('es', '/reference') -> '/es/reference'. */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  return locale === 'en' ? clean : `/${locale}${clean === '/' ? '' : clean}`
}

/** Remove any known locale prefix: '/es/reference' -> '/reference'. */
export function stripLocale(path: string): string {
  for (const loc of LOCALES) {
    if (path === `/${loc}`) return '/'
    if (path.startsWith(`/${loc}/`)) return path.slice(loc.length + 1)
  }
  return path
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

/** Every locale the site serves, English first — it is the one at the root. */
export const ALL_LOCALES: readonly Locale[] = ['en', ...LOCALES]

export function absolute(path: string): string {
  return SITE + path
}
