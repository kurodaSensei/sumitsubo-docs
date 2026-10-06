---
title: "wp-custom-blocks"
description: "Bloques propios de Gutenberg sin paso de compilación: bloques dinámicos con block.json (apiVersion 3) y render.php, scripts de editor en JavaScript plano (wp.element.createElement), un editor compartido guiado por configuración con vista previa mediante ServerSideRender para los bloques de sección, InnerBlocks para cuerpos WYSIWYG, repetidores, selectores de medios, escapado y accesibilidad en render.php. Úsala al crear o editar blocks/*/block.json, render.php o el JS del editor de bloques, o cuando una sección de un tema de bloques nativo deba ser editable por el cliente."
source-hash: "9fc8c3939e86a86f"
---

# Bloques propios (dinámicos, sin compilación)

Cada sección propia es un **bloque dinámico**: los atributos en `block.json`, el marcado en `render.php` (renderizado en el servidor, siempre al día, fácil de cambiar) y un editor ligero en JavaScript plano. Sin JSX, sin `@wordpress/scripts`, sin node_modules dentro del tema.

## Anatomía

```
blocks/<name>/
  block.json     metadata + attributes (+ editorScript handle)
  render.php     the real markup
  index.js       only when the block needs its own editor (rich inline editing, InnerBlocks)
blocks/sections-editor.js   one shared editor for simple section blocks (config-driven)
```

`block.json`:
- `"apiVersion": 3`, `"name": "{theme}/<name>"`, `"category": "{theme}"`, `"textdomain": "{theme}"`, con `title` y `description` legibles en el idioma del cliente.
- Atributos tipados con valores por defecto sensatos escritos como contenido real (el bloque debe verse terminado en el momento en que se inserta).
- `"supports": { "html": false, "align": ["wide"|"full"], "anchor": true }` según haga falta; `"reusable": false` para las secciones propias de una página.
- `"render": "file:./render.php"`, `"editorScript": "<registered-handle>"`.

El registro va en `inc/setup.php` sobre `init`: `wp_register_script( handle, …/index.js, [ 'wp-blocks','wp-element','wp-block-editor','wp-components','wp-i18n' (+ 'wp-server-side-render') ], VERSION, true )`, y después `register_block_type( DIR . '/blocks/<name>' )`.

## Reglas de render.php

- Lee cada atributo con un valor por defecto (`$attributes['title'] ?? ''`); valida las enumeraciones contra una lista de permitidos (`'split' === $x ? 'split' : 'overlay'`); acota los números.
- El envoltorio sale de `get_block_wrapper_attributes( [ 'class' => '{theme}-<name> alignwide …' ] )`, para que funcionen los anclajes, la alineación y las clases del editor.
- Escapa toda la salida: `esc_html` para texto, `esc_url` para enlaces e imágenes, `esc_attr` para atributos, y `wp_kses_post` solo en los campos que legítimamente admiten marcado en línea. Los ayudantes que devuelven SVG de confianza son la única excepción con `phpcs:ignore`, y llevan el motivo escrito al lado.
- Estilos desde los tokens: `var(--wp--preset--spacing--48)`, `var(--wp--custom--radius--lg)`. Los valores calculados (por ejemplo un degradado de veladura a partir de un color y una intensidad) se calculan en PHP y se replican en la vista previa del editor.
- Semántica y accesibilidad: encabezados reales y en orden, elementos decorativos con `aria-hidden="true"`, distinción correcta entre botones y enlaces, nombres accesibles en los enlaces con icono, y texto que avise de que se abre en una pestaña nueva cuando haya `target="_blank"`.
- Imágenes: `<picture>` con un `<source>` para móvil en la dirección de arte; la imagen principal con `loading="eager" fetchpriority="high"`, y todas las demás diferidas y con dimensiones.
- Nada de consultas dentro de bucles; cuando un bloque liste entradas, consulta una sola vez pidiendo los campos necesarios.

## Patrones de editor

**1. Editor compartido guiado por configuración (la mayoría de los bloques de sección).** Un único `sections-editor.js` contiene un mapa `CONFIG`: nombre del bloque → lista de campos (`{ key, label }`, `type: 'select'` con opciones, `repeater: true` con campos `item` y un elemento `blank`). Dibuja los controles del inspector desde esa configuración y previsualiza con `ServerSideRender`, de modo que el editor muestra exactamente lo que emite `render.php`. Añadir una sección es block.json más render.php más una entrada en CONFIG.

**2. Editor propio con edición en línea.** Para bloques tipo portada: `RichText` para los titulares en el lienzo, `MediaUpload` dentro de `MediaUploadCheck` para las imágenes de escritorio y móvil (guarda tanto `id` como `url`), y los controles en paneles de `InspectorControls`. Replica en la vista previa cualquier estilo calculado en render.php.

**3. InnerBlocks para cuerpos ricos.** Páginas legales, páginas informativas: los campos propios del bloque (portada, llamada a la acción) viven en el inspector; el cuerpo es `InnerBlocks` con una `TEMPLATE` inicial de encabezados y párrafos del núcleo, para que el cliente tenga el editor de siempre (negrita, enlaces, listas). `save` devuelve `InnerBlocks.Content`; render.php imprime sus partes alrededor de `$content`. Los bloques padre e hijo (`info-page` → `info-section`) restringen los hijos con `allowedBlocks`.

Todas las cadenas del editor pasan por `wp.i18n.__( '…', '{theme}' )`.

## Reutiliza antes de crear

1. Un bloque del núcleo más un estilo de theme.json o una variación de estilo registrada.
2. Un patrón compuesto de bloques del núcleo.
3. Solo entonces, un bloque dinámico propio. Nómbralo por el contenido ("steps", "destino-card"), no por la composición ("three-columns").

## Señales de relleno genérico

- Una cadena de compilación añadida al tema solo por un bloque; JSX en un tema sin compilación.
- Bloques estáticos (`save` con marcado) para secciones que el diseño va a cambiar: cada cambio de marcado rompe la validación.
- Atributos sin escapar; `wp_kses_post` en todo; colores fijos escritos en línea.
- Vista previa del editor que no coincide con el frente (sin ServerSideRender, sin estilos replicados).
- Bloques con valores por defecto vacíos, que al insertarse parecen rotos.

## Lista de verificación

- [ ] block.json válido, atributos tipados con valores por defecto reales, supports correctos.
- [ ] render.php escapa todo y usa únicamente tokens.
- [ ] La vista previa del editor es igual que el frente; las cadenas son traducibles.
- [ ] Revisión con teclado y lector de pantalla sobre el bloque renderizado (`sumi:a11y`).
- [ ] Existe un patrón si el bloque está pensado para insertarse con contenido por defecto.
