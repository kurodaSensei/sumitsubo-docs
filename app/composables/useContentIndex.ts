import { computed } from 'vue'
import index from '~~/content/index.json'

export interface Entry {
  kind: 'skills' | 'commands'
  plugin: string
  name: string
  title: string
}

export interface Plugin {
  name: string
  /** English, from the framework's marketplace manifest. Always present. */
  description: string
  /** Per-locale descriptions, when one has been written and is not stale. */
  translations?: Record<string, string>
  commands: number
  skills: number
  tier: 'core' | 'stack'
}

/**
 * The description to show, and the language to declare on it.
 *
 * `lang` is undefined when the text matches the page — the common case once a
 * locale is translated, and the one that must not emit a redundant attribute.
 * Returning both together is what keeps them from disagreeing: a card showing
 * English under `<html lang="es">` with no `lang` of its own is WCAG 3.1.2.
 */
export function describe(plugin: Plugin, locale: string) {
  const translated = locale === 'en' ? null : plugin.translations?.[locale]
  return translated
    ? { text: translated, lang: undefined }
    : { text: plugin.description, lang: locale === 'en' ? undefined : 'en' }
}

/**
 * The framework surface, from the index the sync script emits.
 *
 * Metadata only — 5 KB. The 42 markdown bodies are never imported here; they
 * are rendered into prerendered HTML by the detail page. Importing them to
 * build a list would put ~290 KB of markdown in the client bundle against a
 * 170 KB budget.
 *
 * Every count on the site derives from this. Nothing is typed twice.
 */
export function useContentIndex() {
  const entries = index.entries as Entry[]
  const plugins = index.plugins as Plugin[]
  const counts = index.counts

  const core = computed(() => plugins.filter((p) => p.tier === 'core'))
  const stack = computed(() => plugins.filter((p) => p.tier === 'stack'))

  /** Skill names for one plugin, in the order the framework declares them. */
  const skillsOf = (plugin: string) =>
    entries.filter((e) => e.kind === 'skills' && e.plugin === plugin).map((e) => e.name)

  const commands = computed(() => entries.filter((e) => e.kind === 'commands'))

  /** Groups for the reference index: commands first, then one per plugin. */
  const groups = computed(() => [
    { key: 'commands', entries: commands.value },
    ...plugins.map((p) => ({
      key: p.name,
      entries: entries.filter((e) => e.kind === 'skills' && e.plugin === p.name)
    }))
  ])

  const hrefOf = (e: Entry) => `/${e.kind}/${e.plugin}/${e.name}`

  return { entries, plugins, counts, core, stack, commands, groups, skillsOf, hrefOf, sha: index.sha }
}
