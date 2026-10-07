import type { Locale } from './routing'

/* Chrome strings only. The 42 reference pages carry their own translations in
 * content/<locale>/ and are rendered by the sync, not by anything here; these
 * are the strings the site itself speaks. See PRODUCT.md "Content truth". */

export interface Strings {
  skip: string
  navAria: string
  navHome: string
  navRef: string
  langSwitchTo: string
  themeToDark: string
  themeToLight: string

  manifesto: string
  lede: string
  seoTitle: string
  seoDescription: string
  install: string
  /** What activating the install button actually does (2.4.6). */
  installAction: string
  seeSkills: string
  copy: string
  copied: string
  figLabel: string
  figTitle: string
  figLead: string
  always: string
  alwaysSub: string
  pick: string
  pickSub: string
  pluginsTitle: string
  skills: string
  commandsLabel: string

  refTitle: string
  tocLabel: string
  refSeoDescription: (c: { commands: number, skills: number, plugins: number }) => string
  filterLabel: string
  filterPlaceholder: string
  clear: string
  noResults: (q: string) => string
  commands: string

  /** Shown when every reference page has been translated into this locale. */
  protoNote: string
  /** Shown when some have not: takes how many are still English. */
  protoNotePartial: (n: number) => string
  /** Shown on a page whose body is still English because no translation exists. */
  untranslated: string
  /** Shown on a translation whose English source has moved since it was made. */
  staleTranslation: string
}

const en: Strings = {
  skip: 'Skip to content',
  navAria: 'Main',
  navHome: 'Home',
  navRef: 'Reference',
  langSwitchTo: 'Ver en español',
  themeToDark: 'Switch to dark theme',
  themeToLight: 'Switch to light theme',

  manifesto: 'It marks the true line before any cut is made.',
  lede:
    "Sumitsubo is the Japanese carpenter's ink line: snapped once, before any cut. This framework works the same way. A one-line fix does not get a written plan; a migration does not get improvised. Accessibility and performance have to pass, not get added at the end. And the look is settled before anything is drawn, so it does not come out like everything else a model has made.",
  seoTitle: 'Sumitsubo — direction first, then the work',
  seoDescription:
    'A framework for building websites with Claude Code. Direction gets decided first, then the work. Accessibility and performance are requirements, not polish.',
  install: 'Install the plugin',
  installAction: 'Copy the install command',
  seeSkills: 'See the skills',
  copy: 'Copy',
  copied: 'Copied',

  figLabel: 'How it composes',
  figTitle: 'Core and direction always, one stack pack on top',
  figLead:
    'Every skill belongs to exactly one plugin. What you choose is not which skills you want but which stack you are on: the core and the direction ship in every project, and one piece fits on top.',
  always: 'Always',
  alwaysSub: 'In every project, whatever the stack.',
  pick: 'Pick one',
  pickSub: 'The piece that fits the project stack.',
  pluginsTitle: 'Six plugins that fit into one another',
  skills: 'skills',
  commandsLabel: 'commands',

  refTitle: 'Reference',
  tocLabel: 'On this page',
  refSeoDescription: (c) =>
    `${c.commands} commands and ${c.skills} skills across ${c.plugins} plugins.`,
  filterLabel: 'Filter',
  filterPlaceholder: 'Search for a page',
  clear: 'Clear the filter',
  noResults: (q) => `No results for «${q}»`,
  commands: 'Commands',

  protoNote: 'Reference content is generated from the framework repo.',
  protoNotePartial: (n) =>
    `Reference content is generated from the framework repo. ${n} page${n === 1 ? '' : 's'} ` +
    `${n === 1 ? 'is' : 'are'} not translated yet and ${n === 1 ? 'is' : 'are'} shown in English, marked as such.`,
  untranslated: 'This page has not been translated yet. It is shown in English.',
  staleTranslation: 'This translation was made from an earlier version of the English page. Some of it may not match any more.'
}

const es: Strings = {
  skip: 'Saltar al contenido',
  navAria: 'Principal',
  navHome: 'Inicio',
  navRef: 'Referencia',
  langSwitchTo: 'View in English',
  themeToDark: 'Cambiar a tema oscuro',
  themeToLight: 'Cambiar a tema claro',

  // DESIGN.md §1 pins this sentence — it is the one line of manifesto voice on
  // the whole site, and it is not re-translated per implementation.
  manifesto: 'Marca la línea antes de cortar.',
  lede:
    'Sumitsubo es el cordel de tinta del carpintero japonés: se marca una vez, antes de cortar. Este framework funciona igual. Un arreglo de una línea no se lleva un plan escrito; una migración no se improvisa. La accesibilidad y el rendimiento hay que aprobarlos, no se añaden al final. Y el aspecto se decide antes de dibujar nada, para que no acabe pareciéndose a todo lo demás que ha hecho un modelo.',
  seoTitle: 'Sumitsubo — primero la dirección, después el trabajo',
  seoDescription:
    'Un framework para construir sitios web con Claude Code. Primero se decide la dirección, después se trabaja. La accesibilidad y el rendimiento son requisitos, no retoques.',
  install: 'Instalar el plugin',
  installAction: 'Copiar el comando de instalación',
  seeSkills: 'Ver los skills',
  copy: 'Copiar',
  copied: 'Copiado',

  figLabel: 'Cómo se compone',
  figTitle: 'Núcleo y dirección siempre, un paquete de stack encima',
  figLead:
    'Cada skill pertenece a un solo plugin. Lo que decides no es qué skills quieres, sino qué stack usas: el núcleo y la dirección van en todos los proyectos, y encima encaja una pieza.',
  always: 'Siempre',
  alwaysSub: 'En todos los proyectos, sea cual sea el stack.',
  pick: 'Elige uno',
  pickSub: 'La pieza que encaja con el stack del proyecto.',
  pluginsTitle: 'Seis plugins que encajan entre sí',
  skills: 'skills',
  commandsLabel: 'comandos',

  refTitle: 'Referencia',
  tocLabel: 'En esta página',
  refSeoDescription: (c) =>
    `${c.commands} comandos y ${c.skills} skills repartidos en ${c.plugins} plugins.`,
  filterLabel: 'Filtrar',
  filterPlaceholder: 'Buscar una página',
  clear: 'Limpiar el filtro',
  noResults: (q) => `Sin resultados para «${q}»`,
  commands: 'Comandos',

  protoNote: 'El contenido de referencia se genera desde el repo del framework.',
  protoNotePartial: (n) =>
    `El contenido de referencia se genera desde el repo del framework. ${n} página${n === 1 ? '' : 's'} ` +
    `${n === 1 ? 'sigue' : 'siguen'} sin traducir y se ${n === 1 ? 'muestra' : 'muestran'} en inglés, señalada${n === 1 ? '' : 's'} como tal.`,
  untranslated: 'Esta página todavía no está traducida. Se muestra en inglés.',
  staleTranslation: 'Esta traducción se hizo con una versión anterior de la página en inglés. Puede que algo ya no coincida.'
}

export const STRINGS: Record<Locale, Strings> = { en, es }

/* --- Preview descriptions ----------------------------------------------------
 * A skill description is written for a model deciding whether to load the
 * skill, not for a person looking at a link. It runs 319-848 characters, all
 * 33 of them past 200, and ends in a clause listing the words that should
 * trigger it. Pasted into a `description` or an `og:description` it came out
 * cut mid-word by whatever was rendering it, at a different point on every
 * platform.
 *
 * Two things happen here, in order:
 *
 * 1. The trigger clause goes. `Use when ... / Úsala al ...` is addressed to a
 *    model and tells a reader nothing about the page. It is what makes these
 *    long in the first place, and dropping it brings the median from 504 to 292
 *    (en) and 588 to 332 (es). The openers are matched explicitly because they
 *    are the framework's own convention, and only ever applied to its own
 *    descriptions.
 *
 * 2. What is left is capped. The descriptions are shaped `Label: a, long,
 *    comma, list.`, so a sentence boundary almost never falls in range -- there
 *    is nothing to cut cleanly at and the ellipsis is honest about that.
 *
 * The full description still renders in the lede on the page. This is the
 * snippet, not a replacement for it. */
const TRIGGER_CLAUSE = /\.\s+(?:Use|Úsal[ao])\b[\s\S]*$/

/** Capped at `limit` INCLUDING the ellipsis, so the result is never longer. */
export function previewDescription(text: string, limit = 200): string {
  const prose = text.replace(TRIGGER_CLAUSE, '.')
  if (prose.length <= limit) return prose

  const head = prose.slice(0, limit - 1)
  const space = head.lastIndexOf(' ')
  // Trailing punctuation left by the cut would read as a typo before the
  // ellipsis -- `scripts,…` rather than `scripts…`.
  return `${(space > 0 ? head.slice(0, space) : head).replace(/[\s,;:.·—–-]+$/, '')}…`
}
