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
  /** Nav label for the repository. Short — it sits in the header. */
  navSource: string
  /** Nav label for the install page. */
  navInstall: string

  /* --- The install page (DESIGN.md §6 grid, one module per route) --------- */
  instTitle: string
  instLede: string
  instNeeds: string
  instNeedsBody: string
  instWay1: string
  instWay1Note: string
  instWay2: string
  instWay2Note: string
  instWay3: string
  instWay3Note: string
  instRestart: string
  instTry: string
  instTryNote: string
  instSandbox: string
  instNoSsh: string
  instMaintain: string
  instMaintainNote: string
  instDoctor: string
  instUpdate: string
  instUninstall: string
  instTrouble: string
  instTroubleBody: string
  instAllWays: string

  /* --- The band page. Text between backticks renders as <code>. ---------- */
  /** Nav label for the band page. */
  navBand: string
  bandTitle: string
  bandLede: string
  bandSample: string
  bandParts: string
  bandFeature: string
  bandFeatureBody: string
  bandLines: string
  bandLinesBody: string
  bandLinesCount: string
  bandReview: string
  bandReviewBody: string
  bandReviewCurrent: string
  bandReviewBehind: string
  bandReviewOpen: string
  bandReviewNone: string
  bandEvidence: string
  bandEvidenceBody: string
  bandButtons: string
  bandButtonsBody: string
  bandButtonHide: string
  bandToggle: string
  bandToggleBody: string
  bandWhen: string
  bandWhenBody: string
  bandWhere: string
  bandWhereBody: string
  bandPonytail: string
  bandPonytailBody: string
  /** The landing's third action, beside install and the index. */
  seeSource: string
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
  install: 'Install Sumitsubo',
  installAction: 'Copy the install command',
  seeSkills: 'See the skills',
  navSource: 'Source',
  navInstall: 'Install',

  instTitle: 'Install',
  instLede: 'Three ways in. The first is one command; the others exist for when you cannot or would rather not run it.',
  instNeeds: 'What you need',
  instNeedsBody: 'Claude Code and git. Node 18 or newer only for the first way — the other two do not use it.',
  instWay1: 'One command',
  instWay1Note: 'Run it inside the project. It installs the core, the design layer, the companions and the stack pack it detects, then checks the files really landed on disk.',
  instWay2: 'Inside Claude Code',
  instWay2Note: 'No Node. The third line is the stack pack — swap it for sumi-react, sumi-shopify or sumi-wordpress.',
  instWay3: 'From a clone',
  instWay3Note: 'The plugins load in place from the checkout, so your edits are live and `git pull` is the update.',
  instRestart: 'Restart Claude Code afterwards. Plugins apply on the next session, not this one.',
  instTry: 'Try it without touching your setup',
  instTryNote: 'A throwaway profile through CLAUDE_CONFIG_DIR. Your real configuration is never read or written, and deleting the folder undoes everything.',
  instSandbox: 'Install into a disposable profile',
  instNoSsh: 'Same, simulating a machine with no GitHub SSH keys',
  instMaintain: 'Afterwards',
  instMaintainNote: 'The same command maintains the install. `update` also repairs a broken one.',
  instDoctor: 'Read-only check of what is installed',
  instUpdate: 'Pull the latest version of every plugin',
  instUninstall: 'Remove every plugin from the marketplace',
  instTrouble: 'If something fails',
  instTroubleBody: '`Permission denied (publickey)` means an old copy of the marketplace or of Claude Code, not a missing key. Re-run the first way, or `claude update`.',
  instAllWays: 'All the ways to install',

  navBand: 'Band',
  bandTitle: 'The band above the prompt',
  bandLede: 'One line over the prompt: the feature you are on, the slice against its line budget, whether the review still covers it and how the last evidence run went. The commands that move them are buttons on the same line.',
  bandSample: 'A feature with three of seven tasks done, a slice at 212 of 400 lines, a review the work has moved past and a clean evidence run.',
  bandParts: 'What each part shows',
  bandFeature: 'Feature and tasks',
  bandFeatureBody: 'The first feature file in `.sumi/tasks/` whose status is `active` or `blocked` — the one the status line names — with ticked boxes over all boxes. A blocked feature starts with `blocked`, in yellow. With none, the band says `no active feature`.',
  bandLines: 'Lines against the budget',
  bandLinesBody: 'Lines added plus lines deleted in the slice, over `lineBudget` from `.sumi/config.json` (400 when unset). Dim below 80% of the budget, yellow from 80%, red past it.',
  bandLinesCount: 'It counts the way `/sumi:review` does: from the commit of the last burned receipt while HEAD descends from it, otherwise from the merge-base with your main branch (`protectedBranches`, `main` or `master` by default). Edits not committed yet count; paths in `review.exclude` do not. A new file counts once git knows it — `git add -N` it if it matters before the commit.',
  bandReview: 'Review',
  bandReviewBody: 'The newest receipt in `.sumi/reviews/`, in one of four states.',
  bandReviewCurrent: 'Green. The receipt is burned and nothing has changed since its commit.',
  bandReviewBehind: 'Grey. The receipt is burned, but the slice has changed since. Run `/sumi:review` again before shipping.',
  bandReviewOpen: 'Yellow. The latest receipt is not burned yet: the review has findings still to fix.',
  bandReviewNone: 'Grey. There is no receipt yet.',
  bandEvidence: 'Evidence',
  bandEvidenceBody: 'The newest run in `.sumi/evidence/`, the one `/sumi:ship` makes for UI work. `✓ evidence` in green when every route passed; `✗ evidence 2/9` in red when 2 of the 9 routes it checked have problems. Nothing shows until there is a run.',
  bandButtons: 'The buttons',
  bandButtonsBody: 'On the right of the line. Each one runs its command as if you had typed it.',
  bandButtonHide: 'Hides the band, the same as `/sumi-band off`.',
  bandToggle: 'Hide it, bring it back',
  bandToggleBody: 'Without an argument `/sumi-band` switches it; `off` and `on` set it outright. The choice is kept across sessions until you change it.',
  bandWhen: 'When it updates',
  bandWhenBody: 'When the session starts, after every turn, and after `/clear` and `/resume`. If a refresh fails it keeps what it last showed. It appears only in a project set up with `/sumi:init`, and steps aside while Claude Code shows a survey.',
  bandWhere: 'Where it shows',
  bandWhereBody: 'It needs a Claude Code build with mods. The VS Code chat panel, cloud sessions and `claude -p` have no band, and the rest of Sumitsubo works the same there.',
  bandPonytail: 'With Ponytail',
  bandPonytailBody: 'Ponytail has its own band, with cost, tokens and tests. The two share the slot: Sumitsubo draws its line first and Ponytail\'s goes beneath it. Neither repeats what the other shows.',
  seeSource: 'Read the source',
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
  install: 'Instalar Sumitsubo',
  installAction: 'Copiar el comando de instalación',
  seeSkills: 'Ver los skills',
  navSource: 'Código',
  navInstall: 'Instalación',

  instTitle: 'Instalación',
  instLede: 'Tres formas de entrar. La primera es un solo comando; las otras existen para cuando no puedes ejecutarlo o prefieres no hacerlo.',
  instNeeds: 'Qué hace falta',
  instNeedsBody: 'Claude Code y git. Node 18 o más nuevo solo para la primera forma — las otras dos no lo usan.',
  instWay1: 'Un comando',
  instWay1Note: 'Ejecútalo dentro del proyecto. Instala el núcleo, la capa de diseño, los compañeros y el stack pack que detecte, y después comprueba que los archivos llegaron de verdad al disco.',
  instWay2: 'Dentro de Claude Code',
  instWay2Note: 'Sin Node. La tercera línea es el stack pack: cámbiala por sumi-react, sumi-shopify o sumi-wordpress.',
  instWay3: 'Desde un clon',
  instWay3Note: 'Los plugins cargan en el sitio desde el clon, así que tus ediciones van en vivo y `git pull` es la actualización.',
  instRestart: 'Reinicia Claude Code después. Los plugins se aplican en la sesión siguiente, no en la actual.',
  instTry: 'Pruébalo sin tocar tu configuración',
  instTryNote: 'Un perfil desechable a través de CLAUDE_CONFIG_DIR. Tu configuración real no se lee ni se escribe, y borrar la carpeta deshace todo.',
  instSandbox: 'Instalar en un perfil desechable',
  instNoSsh: 'Lo mismo, simulando una máquina sin llaves SSH de GitHub',
  instMaintain: 'Después',
  instMaintainNote: 'El mismo comando mantiene la instalación. `update` además repara una que esté dañada.',
  instDoctor: 'Revisión de solo lectura de lo instalado',
  instUpdate: 'Traer la última versión de cada plugin',
  instUninstall: 'Quitar todos los plugins del marketplace',
  instTrouble: 'Si algo falla',
  instTroubleBody: '`Permission denied (publickey)` significa una copia vieja del marketplace o de Claude Code, no que falte una llave. Vuelve a ejecutar la primera forma, o `claude update`.',
  instAllWays: 'Todas las formas de instalar',

  navBand: 'Franja',
  bandTitle: 'La franja sobre el prompt',
  bandLede: 'Una línea encima del prompt: la feature en la que estás, el slice frente a su presupuesto de líneas, si la revisión todavía lo cubre y cómo salió la última corrida de evidencia. Los comandos que los mueven son botones en la misma línea.',
  bandSample: 'Una feature con tres de siete tareas hechas, un slice en 212 de 400 líneas, una revisión que el trabajo ya dejó atrás y una corrida de evidencia limpia.',
  bandParts: 'Qué muestra cada parte',
  bandFeature: 'Feature y tareas',
  bandFeatureBody: 'El primer archivo de feature en `.sumi/tasks/` con estado `active` o `blocked` — el mismo que nombra la línea de estado — con las casillas marcadas sobre el total. Una feature bloqueada empieza con `blocked`, en amarillo. Si no hay ninguna, la franja dice `no active feature`.',
  bandLines: 'Líneas frente al presupuesto',
  bandLinesBody: 'Líneas añadidas más líneas borradas en el slice, sobre `lineBudget` de `.sumi/config.json` (400 si no está definido). Atenuado por debajo del 80% del presupuesto, amarillo desde el 80%, rojo al pasarlo.',
  bandLinesCount: 'Cuenta igual que `/sumi:review`: desde el commit del último recibo quemado mientras HEAD descienda de él; si no, desde el merge-base con tu rama principal (`protectedBranches`, `main` o `master` por defecto). Las ediciones sin commit cuentan; las rutas de `review.exclude`, no. Un archivo nuevo cuenta cuando git lo conoce — hazle `git add -N` si importa antes del commit.',
  bandReview: 'Revisión',
  bandReviewBody: 'El recibo más reciente en `.sumi/reviews/`, en uno de cuatro estados.',
  bandReviewCurrent: 'Verde. El recibo está quemado y nada cambió desde su commit.',
  bandReviewBehind: 'Gris. El recibo está quemado, pero el slice cambió después. Vuelve a ejecutar `/sumi:review` antes de entregar.',
  bandReviewOpen: 'Amarillo. El último recibo todavía no está quemado: la revisión tiene hallazgos por corregir.',
  bandReviewNone: 'Gris. Todavía no hay recibo.',
  bandEvidence: 'Evidencia',
  bandEvidenceBody: 'La corrida más reciente en `.sumi/evidence/`, la que hace `/sumi:ship` para trabajo de interfaz. `✓ evidence` en verde cuando pasaron todas las rutas; `✗ evidence 2/9` en rojo cuando 2 de las 9 rutas revisadas tienen problemas. No aparece nada hasta que haya una corrida.',
  bandButtons: 'Los botones',
  bandButtonsBody: 'A la derecha de la línea. Cada uno ejecuta su comando como si lo hubieras escrito.',
  bandButtonHide: 'Oculta la franja, igual que `/sumi-band off`.',
  bandToggle: 'Ocultarla y volver a mostrarla',
  bandToggleBody: 'Sin argumento, `/sumi-band` la alterna; `off` y `on` la fijan directamente. La elección se mantiene entre sesiones hasta que la cambies.',
  bandWhen: 'Cuándo se actualiza',
  bandWhenBody: 'Al empezar la sesión, después de cada turno y después de `/clear` y `/resume`. Si una actualización falla, conserva lo último que mostró. Solo aparece en un proyecto preparado con `/sumi:init`, y se aparta mientras Claude Code muestra una encuesta.',
  bandWhere: 'Dónde aparece',
  bandWhereBody: 'Necesita una versión de Claude Code con mods. El panel de chat de VS Code, las sesiones en la nube y `claude -p` no tienen franja, y el resto de Sumitsubo funciona igual ahí.',
  bandPonytail: 'Con Ponytail',
  bandPonytailBody: 'Ponytail tiene su propia franja, con costo, tokens y tests. Las dos comparten el espacio: Sumitsubo dibuja su línea primero y la de Ponytail va debajo. Ninguna repite lo que muestra la otra.',
  seeSource: 'Ver el código',
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
