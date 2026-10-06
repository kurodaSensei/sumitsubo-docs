import { computed } from 'vue'
import { STRINGS } from '~/utils/strings'
import { localeOf, localePath, type Locale } from '~/utils/routing'

const THEMES = ['dark', 'light'] as const
export type Theme = (typeof THEMES)[number]
const STORAGE_KEY = 'sumitsubo-theme'

/**
 * Locale, chrome strings and theme.
 *
 * The locale comes from the route, never from state, so a prerendered page is
 * correct before any JavaScript runs. The theme does the same job the other way
 * round: `prefers-color-scheme` in CSS covers the no-JS case, and this only
 * takes over once a visitor has made an explicit choice.
 */
export function useChrome() {
  const route = useRoute()

  const locale = computed<Locale>(() => localeOf(route.params.lang))
  const t = computed(() => STRINGS[locale.value])
  const other = computed<Locale>(() => (locale.value === 'en' ? 'es' : 'en'))

  /** Path for the current page in the other language, for the language switch. */
  const otherLocalePath = computed(() => {
    const stripped = route.path.replace(/^\/es(?=\/|$)/, '') || '/'
    return localePath(other.value, stripped)
  })

  /** Prefix a path for the current locale: '/reference' -> '/es/reference'. */
  const path = (p: string) => localePath(locale.value, p)

  // `null` means "no explicit choice yet", which is what lets the CSS media
  // query stay in charge. useState keeps it stable across hydration.
  const theme = useState<Theme | null>('theme', () => null)

  const applied = computed<Theme>(() => theme.value ?? 'dark')

  function setTheme(next: Theme) {
    theme.value = next
    if (import.meta.client) {
      document.documentElement.dataset.theme = next
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // Private mode or blocked storage: the choice simply does not persist.
      }
    }
  }

  function toggleTheme() {
    setTheme(resolvedTheme() === 'dark' ? 'light' : 'dark')
  }

  /** What the page is actually showing right now, stored choice or system. */
  function resolvedTheme(): Theme {
    if (theme.value) return theme.value
    if (import.meta.client) {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    }
    return 'dark'
  }

  /** Read the stored choice on mount. Called once, from the layout. */
  function restoreTheme() {
    if (!import.meta.client) return
    let stored: string | null = null
    try {
      stored = localStorage.getItem(STORAGE_KEY)
    } catch {
      stored = null
    }
    if (stored && (THEMES as readonly string[]).includes(stored)) {
      theme.value = stored as Theme
      document.documentElement.dataset.theme = stored
    }
  }

  return { locale, other, t, path, otherLocalePath, theme, applied, setTheme, toggleTheme, resolvedTheme, restoreTheme }
}
