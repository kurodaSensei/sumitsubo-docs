import type { Locale } from './routing'

/* Chrome strings only. The 42 reference pages are English by design — a reader
 * on the Spanish site gets Spanish navigation around English reference text.
 * See PRODUCT.md "Content truth". */

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

  protoNote: string
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
    "Sumitsubo is the Japanese carpenter's ink line. This framework does the same — direction first, then the work. It encodes how a senior design engineer works: process that scales with the request, code quality without slop, accessibility and performance as acceptance criteria, and — above all — design that doesn't look like every other AI-generated site.",
  seoTitle: 'Sumitsubo — direction first, then the work',
  seoDescription:
    'An opinionated AI framework for web design and development with Claude Code: engineering quality, accessibility, performance and design without AI slop.',
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
  filterPlaceholder: 'Search the pages',
  clear: 'Clear the filter',
  noResults: (q) => `No results for «${q}»`,
  commands: 'Commands',

  protoNote: 'Reference content is generated from the framework repo. Pages not yet translated are shown in English and say so.',
  untranslated: 'This page has not been translated yet. It is shown in English.',
  staleTranslation: 'The English source of this page changed after this translation was made, so parts of it may be out of date.'
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
    'Sumitsubo es el cordel de tinta del carpintero japonés. Este framework hace lo mismo: primero la dirección, después el trabajo. Codifica cómo trabaja un ingeniero de diseño senior: proceso que escala con la petición, calidad de código sin relleno, accesibilidad y rendimiento como criterios de aceptación y, por encima de todo, diseño que no se parece a cualquier otro sitio generado por IA.',
  seoTitle: 'Sumitsubo — primero la dirección, después el trabajo',
  seoDescription:
    'Un framework de IA opinado para diseño y desarrollo web con Claude Code: calidad de ingeniería, accesibilidad, rendimiento y diseño sin relleno.',
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
  filterPlaceholder: 'Buscar entre las páginas',
  clear: 'Limpiar el filtro',
  noResults: (q) => `Sin resultados para «${q}»`,
  commands: 'Comandos',

  protoNote: 'El contenido de referencia se genera desde el repo del framework. Las páginas que aún no están traducidas se muestran en inglés y lo indican.',
  untranslated: 'Esta página todavía no está traducida. Se muestra en inglés.',
  staleTranslation: 'La fuente en inglés de esta página cambió después de hacerse esta traducción, así que puede haber partes desactualizadas.'
}

export const STRINGS: Record<Locale, Strings> = { en, es }
