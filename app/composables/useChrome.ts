import { computed } from 'vue'
import { STRINGS } from '~/utils/strings'
import { localeOf, localePath, stripLocale, type Locale } from '~/utils/routing'

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
    // Strips whichever locale prefix is present rather than a hard-coded /es:
    // LOCALES is a list, and a second entry would have silently broken the
    // switcher. Query and hash ride along so the link does not drop them.
    const stripped = stripLocale(route.path)
    return localePath(other.value, stripped) + (route.hash || '')
  })

  /** Prefix a path for the current locale: '/reference' -> '/es/reference'. */
  const path = (p: string) => localePath(locale.value, p)

  // `null` means "no explicit choice yet", which is what lets the CSS media
  // query stay in charge. useState keeps it stable across hydration.
  const theme = useState<Theme | null>('theme', () => null)

  // What the system would pick, tracked live. Without this `applied` fell back
  // to 'dark' whenever no choice was stored, so on a light-preference machine
  // the page rendered light while the toggle announced "switch to light" and
  // then switched to dark. The label has to read the same source the click does.
  const systemTheme = useState<Theme>('system-theme', () => 'dark')

  const applied = computed<Theme>(() => theme.value ?? systemTheme.value)

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
    return theme.value ?? systemTheme.value
  }

  /**
   * Read the stored choice and start tracking the system preference. Called
   * once from the layout; returns a teardown for the media-query listener.
   */
  function restoreTheme() {
    if (!import.meta.client) return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const sync = () => { systemTheme.value = mq.matches ? 'light' : 'dark' }
    sync()
    mq.addEventListener('change', sync)

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
    return () => mq.removeEventListener('change', sync)
  }

  return { locale, t, path, otherLocalePath, applied, toggleTheme, restoreTheme }
}
