---
title: "wp-block-theme"
description: "Arquitectura de tema de bloques nativo de WordPress (FSE) sin paso de compilación y sin maquetadores: theme.json v3 como sistema de diseño, plantillas HTML y partes de plantilla, patrones en PHP, functions.php repartido en inc/ por responsabilidad, tipografías autoalojadas, paridad entre editor y frente, versionado y copias de la base de datos para el contenido del Editor del sitio. Úsala al crear o cambiar un tema de WordPress, al editar theme.json, templates/*.html, parts/*.html, patterns/*.php, functions.php o inc/*.php, o cuando el usuario mencione Gutenberg, FSE, tema de bloques o Editor del sitio."
source-hash: "ccec6d98901f6c13"
---

# Tema de bloques de WordPress (nativo, sin compilación)

El enfoque de la casa: un tema de bloques puro. Sin Timber, sin ACF, sin Elementor ni maquetadores, sin cadena de compilación. Gutenberg y theme.json hacen el trabajo pesado; los bloques dinámicos propios (`wp-custom-blocks`) cubren lo que los bloques del núcleo no alcanzan. El cliente lo edita todo desde el editor de bloques y el Editor del sitio.

## Estructura

```
style.css            theme header only (Version drives cache-busting)
theme.json           the design system (v3)
functions.php        constants + require_once of inc/*, nothing else
inc/
  setup.php          supports, textdomain, enqueue, editor styles, block styles, pattern category, block registration
  performance.php    head cleanup, preloads, conditional plugin assets (see wp-performance-audit)
  cpt.php            post types, taxonomies, meta boxes (see wp-native-features)
  settings.php       Settings API page for site-wide options
  schema.php         JSON-LD
  icons.php          inline SVG icon helper
  media.php          upload rules (e.g. safe SVG)
templates/           *.html block templates (index, front-page, page, single-<cpt>, archive-<cpt>, taxonomy, 404 + custom)
parts/               header.html, footer.html (thin: reference a pattern)
patterns/            *.php patterns with translatable content
blocks/<name>/       custom dynamic blocks (block.json + render.php [+ index.js])
assets/css/app.css   only what theme.json cannot express
assets/js/           small vanilla scripts, deferred
assets/fonts/        self-hosted WOFF2
languages/           .pot/.po/.mo
bin/                 token audit scripts (wp-performance-audit)
database/            DB dump + README for content that lives in the DB
```

`functions.php` define `{THEME}_VERSION` (a partir de `wp_get_theme()->get('Version')`), `{THEME}_DIR`, `{THEME}_URI` y hace el require de cada archivo de `inc/`. Una responsabilidad por archivo; nada de lógica en functions.php.

## theme.json es el sistema de diseño

Cada token de `DESIGN.md` (de `sumi-design`) se mapea aquí, y el código usa únicamente las propiedades personalizadas generadas.

- `"version": 3`, `appearanceTools: true`, `useRootPaddingAwareAlignments: true`, `layout.contentSize` y `wideSize`.
- `color.palette`: slugs semánticos (`base`, `surface`, `primary`, `text-soft`, `border`, `offer`…); desactiva los valores por defecto (`defaultPalette`, `defaultGradients`, `defaultDuotone: false`) para que en el editor solo se vean los colores de marca.
- `typography.fontFamilies` con entradas `fontFace` apuntando a `assets/fonts/*.woff2` (WordPress genera el `@font-face`; nunca lo dupliques en el CSS); `fontSizes` con `fluid: {min, max}`; desactiva los tamaños por defecto.
- `spacing.spacingSizes` nombrados por su valor (`4, 8, 12, 16, 24, 32, 48, 64`), para que la escala se lea igual en el código y en el editor.
- `custom`: todo lo que no tiene un preset del núcleo — `radius.{xs…pill}`, el ritmo fluido de sección (`space.flow*` con `clamp()`), colores de estado, colores de marcas de terceros. Se consume como `var(--wp--custom--radius--lg)`.
- `styles`: estilos globales de elemento (enlaces, encabezados, botones) y estilos de bloque. Prefiere declarar aquí un valor por defecto antes que escribirlo en CSS.
- `templateParts` (cabecera y pie, con su área) y `customTemplates` (por ejemplo `page-no-title`, o una página informativa a ancho completo) declarados de forma explícita.

## CSS: solo lo que falta

`assets/css/app.css` empieza con un comentario que enuncia la regla: únicamente lo que theme.json no puede cubrir, sin tokens duplicados.
- Ayudantes acotados al tema en `:root` con el prefijo del tema (`--{theme}-header-h`, `--{theme}-container`), y tonos derivados con `color-mix()` a partir de las variables de la paleta, no valores hexadecimales nuevos.
- BEM con el prefijo del tema para los bloques propios: `.{theme}-hero`, `.{theme}-hero__title`, `.{theme}-hero--split`.
- Encólalo en el frente y usa `add_editor_style( 'assets/css/app.css' )` para que el editor se vea como el sitio.

## Plantillas, partes y patrones

- Las plantillas son delgadas: parte de cabecera → grupo `<main id="main">` (composición restringida) → contenido → parte de pie. Dale a `main` el destino del enlace para saltar al contenido.
- Las partes referencian un patrón (`<!-- wp:pattern {"slug":"{theme}/header"} /-->`), de modo que el marcado vive en PHP, donde las cadenas son traducibles.
- Los patrones llevan el contenido por defecto de los bloques propios: construye el array de atributos con cadenas en `__()`, `wp_json_encode(..., JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)` y después imprime el comentario de bloque. Campos de la cabecera: `Title`, `Slug`, `Categories` (la categoría del tema), `Block Types` y `Description`.
- Registra una sola categoría de patrones para el tema. Registra variaciones de estilo de bloque para `core/button` (y otros del núcleo) en lugar de crear bloques de botón propios.

## Contenido que vive en la base de datos

Las páginas, los menús, las opciones y las partes de plantilla personalizadas en el Editor del sitio viven en la base de datos, no en archivos. Mantén `database/<site>.sql` junto a un README con los comandos de restauración (`wp db import …`) y con qué contiene. No subas nunca credenciales ni datos de usuario que no necesites; sanea los volcados antes de publicarlos en repos abiertos.

## Versionado e internacionalización

- Sube `Version` en `style.css` en cada despliegue; eso versiona todos los recursos encolados.
- El dominio de texto es el slug del tema; todas las cadenas de PHP y del JS del editor pasan por `__()` o `wp.i18n.__`; publica el `.pot` junto a los `.po/.mo`. El contenido multilingüe va por Polylang (o la herramienta que elija el cliente), nunca escrito a mano.

## Comentarios: marca la simplicidad deliberada

Aplica la convención global `ponytail:` de `sumi:code-quality`. Costuras típicas de WordPress: un mapa fijo en PHP en vez de una interfaz de meta de término ("ponytail: fixed map of 6 categories, no term-meta UI; extend when the client needs to edit them"), una heurística con `has_block()` para cargar recursos condicionalmente, o una opción escrita a mano antes de que exista una página de ajustes.

## Señales de relleno genérico

- Timber, Twig, ACF o un maquetador añadidos a un tema de bloques nativo.
- Hexadecimales escritos a mano, tamaños de letra en px o espaciados en el CSS o en render.php en lugar de `--wp--preset--*` o `--wp--custom--*`.
- `@font-face` duplicado en el CSS; Google Fonts cargado desde su CDN.
- Un functions.php gigantesco; cadenas de marcado escritas a mano en las partes en vez de patrones traducibles.
- La paleta y los tamaños de letra por defecto de WordPress dejados activos junto a los tokens de marca.

## Lista de verificación

- [ ] Todos los valores visuales vienen de theme.json; las auditorías de `bin/` pasan.
- [ ] El editor y el frente se ven igual (tipografías, colores, espaciado).
- [ ] Hay plantillas para cada tipo de contenido en uso, incluidos el 404 y los archivos.
- [ ] Las cadenas son traducibles; el `.pot` está regenerado.
- [ ] La versión está subida; el volcado de la base de datos está actualizado si cambió contenido del Editor del sitio.
