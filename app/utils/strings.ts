import type { Locale } from './routing'

/* Chrome strings only. The 42 reference pages are English by design — a reader
 * on the Spanish site gets Spanish navigation around English reference text.
 * See PRODUCT.md "Content truth". */

export interface Strings {
  skip: string
  navAria: string
  navHome: string
  navRef: string
  langAria: string
  langSwitchTo: string
  themeToDark: string
  themeToLight: string
  themeDark: string
  themeLight: string

  install: string
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
  filterLabel: string
  filterPlaceholder: string
  clear: string
  noResults: (q: string) => string
  pages: string
  commands: string

  protoNote: string
}

const en: Strings = {
  skip: 'Skip to content',
  navAria: 'Main',
  navHome: 'Home',
  navRef: 'Reference',
  langAria: 'Language',
  langSwitchTo: 'Ver en español',
  themeToDark: 'Switch to dark theme',
  themeToLight: 'Switch to light theme',
  themeDark: 'Dark',
  themeLight: 'Light',

  install: 'Install the plugin',
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
  filterLabel: 'Filter',
  filterPlaceholder: 'Search the pages',
  clear: 'Clear the filter',
  noResults: (q) => `No results for «${q}»`,
  pages: 'pages',
  commands: 'Commands',

  protoNote: 'Reference content is generated from the framework repo and is English only.'
}

const es: Strings = {
  skip: 'Saltar al contenido',
  navAria: 'Principal',
  navHome: 'Inicio',
  navRef: 'Referencia',
  langAria: 'Idioma',
  langSwitchTo: 'View in English',
  themeToDark: 'Cambiar a tema oscuro',
  themeToLight: 'Cambiar a tema claro',
  themeDark: 'Oscuro',
  themeLight: 'Claro',

  install: 'Instalar el plugin',
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
  filterLabel: 'Filtrar',
  filterPlaceholder: 'Buscar entre las páginas',
  clear: 'Limpiar el filtro',
  noResults: (q) => `Sin resultados para «${q}»`,
  pages: 'páginas',
  commands: 'Comandos',

  protoNote: 'El contenido de referencia se genera desde el repo del framework y está en inglés.'
}

export const STRINGS: Record<Locale, Strings> = { en, es }
