---
title: "shopify-theme-architecture"
description: "Estructura y flujo de trabajo de temas de Online Store 2.0: roles de los directorios, templates JSON y templates alternativos, grupos de sections, la decisión entre section, theme block y snippet, settings_schema.json, locales y claves de traducción del schema, Shopify CLI (theme dev, push a temas sin publicar, pull, theme check) y un flujo de git que sobrevive a las ediciones del personalizador sobre el JSON. Úsala al crear o reorganizar archivos del tema, al decidir dónde encaja un componente, al editar templates/*.json, sections/*-group.json, config/settings_schema.json, config/settings_data.json, locales/*.json, layout/theme.liquid, .shopifyignore, o al ejecutar comandos shopify theme, desplegar o resolver conflictos de fusión de JSON."
source-hash: "efd3e039c0d01212"
---

# Arquitectura de temas de Shopify (OS 2.0)

Se aplica a cualquier tema de Online Store 2.0: derivado de Dawn, temas al estilo Horizon basados en theme blocks, o totalmente personalizado, con o sin un bundler que emita en `assets/`. Detecta cuál es antes de escribir código: lee `layout/theme.liquid`, lista `blocks/` y revisa `package.json` por si hay un paso de compilación.

## Roles de los directorios

| Ruta | Contiene | Reglas |
|---|---|---|
| `layout/` | `theme.liquid` (+ `password.liquid`, composiciones alternativas opcionales) | Debe imprimir `{{ content_for_header }}` en `<head>` y `{{ content_for_layout }}` en `<body>`. Mantenlo delgado. |
| `templates/*.json` | Composición de sections por tipo de página | JSON en lugar de `.liquid`. `customers/*`, `gift_card.liquid` siguen siendo Liquid donde sea necesario. |
| `sections/*.liquid` | Módulos que el comerciante puede colocar, con `{% schema %}` | Un trabajo por section. |
| `sections/*-group.json` | Grupos de sections (header, footer, superposiciones) | Se renderizan con `{% sections 'header-group' %}` en el layout. |
| `blocks/*.liquid` | Theme blocks, reutilizables entre sections, anidables | Solo en temas que adoptan theme blocks. |
| `snippets/*.liquid` | Parciales solo de código mediante `{% render %}` | Sin schema, sin ajustes propios para el comerciante. |
| `config/settings_schema.json` | Definición de los ajustes globales del tema | Bajo control de versiones, editado por desarrolladores. |
| `config/settings_data.json` | Valores guardados de los ajustes globales | Los escribe el personalizador. Trátalo como datos del comerciante. |
| `locales/` | Textos de la tienda en `*.default.json`, textos del editor en `*.schema.json` | Todo texto visible vive aquí. |
| `assets/` | Directorio plano (sin subcarpetas) de CSS, JS, SVG, fuentes | Si un bundler emite aquí, edita el código fuente, nunca la salida. |

## ¿Dónde encaja?

| Necesidad | Usa |
|---|---|
| Módulo de página de ancho completo que el comerciante añade, quita y reordena | Section |
| Contenido repetible o reordenable dentro de una sola section | Block local de la section (definido en el schema de esa section) |
| Componente reutilizado en muchas sections, posiblemente anidado (encabezado, botón, imagen, grupo) | Theme block en `blocks/` |
| Hijo fijo que una section siempre renderiza, aún editable | Block estático: `{% content_for 'block', type: 'x', id: 'y' %}` |
| Marcado reutilizado por código, sin ajustes de comerciante (precio, icono, interior de tarjetas de producto) | Snippet |
| Token de todo el sitio (colores, escala tipográfica, radio, espaciado) | `settings_schema.json` |
| Header, barra de anuncios, footer | Grupo de sections |
| Datos estructurados por producto o por página | Metafield o metaobject, no un ajuste de section |

Reglas: una section o bien acepta theme blocks (`@theme`) o bien define blocks locales; no mezcles ambos en un mismo schema. Si el tema no tiene una carpeta `blocks/`, no introduzcas theme blocks sin preguntar: cambia el modelo de autoría de todas las sections.

## Templates JSON

- Mapa `sections`: ID únicos arbitrarios hacia `{ "type", "settings", "blocks", "block_order" }`. `order` lista los ID de las sections de arriba abajo.
- `block_order` debe listar todos los ID de block presentes; los blocks omitidos se descartan o se reordenan de forma inesperada.
- Templates alternativos: `product.preorder.json`, `page.contact.json`. El comerciante los asigna por recurso en el administrador. Crea uno solo cuando la composición realmente difiera; prefiere ajustes o condicionales guiados por metafields para las variaciones pequeñas.
- Los templates contienen a la vez los valores por defecto y las ediciones guardadas del comerciante. Cuando el tema está en producción, el personalizador es su dueño (consulta el flujo de git).
- `"disabled": true` en una section la oculta sin borrarla; consérvala en lugar de eliminar contenido del comerciante.

## Ajustes globales (`config/settings_schema.json`)

- La primera entrada es `theme_info` (nombre, versión, autor, URL de documentación y de soporte). Usa los datos del propietario o del cliente, nunca una empresa de relleno.
- Agrupa en categorías que los comerciantes reconozcan: Logo y favicon, Colores / esquemas de color, Tipografía, Composición, Botones, Tarjetas de producto, Carrito, Redes sociales.
- Prefiere `color_scheme_group` + un `color_scheme` por section a una docena de selectores de color sueltos cuando el tema admite esquemas.
- Léelos en Liquid como `settings.<id>`. Exponlos a CSS una sola vez (un snippet `css-variables` o `{% style %}` en el layout) y luego consume propiedades personalizadas en todas partes. Consulta `sumi:css-architecture`.
- Nunca renombres ni elimines el ID de un ajuste existente en un tema en producción sin una migración: los valores guardados en `settings_data.json` y en los templates quedan huérfanos en silencio.

## Locales

- Textos de la tienda: `{{ 'products.product.add_to_cart' | t }}`, claves en `locales/en.default.json` (o el archivo del idioma por defecto de la tienda).
- Textos del editor: `"label": "t:settings.heading"` resuelto en `locales/en.default.schema.json`. Usa claves de traducción para el texto del schema en temas pensados para varios idiomas o para la Theme Store; las cadenas simples en minúscula de oración son aceptables en un tema personalizado de un solo idioma si el código existente ya lo hace. Sigue el código base.
- Las claves van en snake_case, agrupadas por funcionalidad, poco profundas (2 a 3 niveles). Interpola, nunca concatenes: `'cart.items_count' | t: count: cart.item_count` con claves de plural `one`/`other`.
- Añade las claves a la configuración regional por defecto; señala las claves que falten en otras configuraciones regionales en lugar de traducir automáticamente en silencio.

## Flujo de trabajo con Shopify CLI (resumen)

```bash
shopify theme dev --store my-store            # local preview with hot reload, uses a dev theme
shopify theme check                           # lint Liquid, JSON, schema, a11y and perf rules
shopify theme push --unpublished              # new unpublished theme for review
shopify theme push --theme <id>               # update a known unpublished/staging theme
shopify theme pull --theme <id> --only 'templates/*.json' --only 'sections/*-group.json' --only config/settings_data.json
shopify theme share                           # throwaway preview link
```

Innegociables:
- Nunca hagas push al tema en producción (publicado). Nunca uses `--allow-live` salvo que el propietario pida explícitamente ese comando exacto en esta sesión.
- Antes de cada push a un tema que el comerciante pueda haber editado, haz pull de su JSON primero o haz push con `--nodelete` más `--ignore` para los archivos JSON, para que las ediciones del personalizador no se sobrescriban.
- Ejecuta `shopify theme check` antes de hacer push; corrige los errores y justifica cualquier comprobación desactivada en `.theme-check.yml`.
- Opciones completas, `.shopifyignore`, integración con GitHub y resolución de conflictos: `references/cli-git-workflow.md`.

## Señales de relleno de IA (rechazar en la revisión)

- Un template `.liquid` creado donde bastaba un template JSON.
- Una section monolítica gigante (hero + funcionalidades + testimonios + newsletter) en lugar de sections o blocks componibles.
- Ajustes globales nuevos para asuntos puntuales de una section, o ajustes de section que duplican tokens globales.
- Snippet con su propio `{% schema %}`; section sin `presets` que el comerciante no puede añadir.
- Archivos colocados en `assets/subfolder/` (no admitido) o ediciones sobre la salida del bundler.
- `theme_info` con un autor inventado, o ID de ajustes renombrados por "coherencia" en un tema en producción.
- JSON del personalizador (`settings_data.json`, templates) sobrescrito desde una copia local obsoleta.

## Lista de verificación

- [ ] El componente está en el nivel correcto (section / block / block estático / snippet) según la tabla de arriba.
- [ ] Los templates son JSON; `order` y `block_order` solo hacen referencia a ID existentes.
- [ ] Las sections nuevas tienen `presets` (si se pueden añadir) y `enabled_on`/`disabled_on` donde la ubicación importa.
- [ ] Todos los textos visibles y del editor se resuelven mediante locales (o siguen la convención de un solo idioma ya existente en el tema).
- [ ] Ningún ID de ajuste eliminado o renombrado sin notas de migración.
- [ ] `shopify theme check` pasa; vista previa con `theme dev` o un tema sin publicar, nunca en producción.
- [ ] JSON remoto descargado antes del push; diferencias de `templates/` y `config/settings_data.json` revisadas.

Relacionado: `shopify-liquid`, `shopify-sections-blocks`, `shopify-storefront-js`, `shopify-performance-a11y`.

## Shopify CLI y flujo de trabajo con Git

Las opciones cambian entre versiones del CLI. Confirma con `shopify theme <command> --help` y verifica en shopify.dev ante la duda.

### Entornos

| Tema | Propósito | Quién escribe |
|---|---|---|
| Tema de desarrollo | Creado por `shopify theme dev`, ligado a tu sesión del CLI | Tú, automáticamente |
| Tema de staging / QA sin publicar | Revisión del cliente, QA, auditorías de accesibilidad y rendimiento | Tú mediante `push --theme <id>` |
| Tema en producción (publicado) | Clientes | El comerciante mediante el personalizador; el código solo mediante un paso de lanzamiento acordado |

El archivo opcional `shopify.theme.toml` define entornos con nombre (tienda, id del tema, listas de exclusión) de modo que los comandos pasan a ser `shopify theme push -e staging`. Nunca subas a git tokens ni contraseñas; usa el inicio de sesión del CLI o variables de entorno.

### Referencia de comandos

```bash
shopify theme list --store my-store                 # ids, roles (live, unpublished, development)
shopify theme dev --store my-store                  # hot reload preview on 127.0.0.1:9292
shopify theme dev --theme-editor-sync               # two-way sync of JSON edited in the editor during dev
shopify theme check                                 # lint; --auto-correct for safe fixes; -o json for CI
shopify theme push --unpublished --json             # create a new unpublished theme, print its id
shopify theme push --theme 123456789 --nodelete     # update without deleting remote-only files
shopify theme push --theme 123456789 --ignore 'templates/*.json' --ignore 'config/settings_data.json'
shopify theme pull --theme 123456789 --only 'templates/*.json' --only 'sections/*.json' --only 'config/settings_data.json'
shopify theme package                               # zip for upload or handoff
shopify theme profile --url /products/handle        # Liquid render profiling (newer CLI; verify availability)
shopify theme console                               # Liquid REPL against store data (verify availability)
```

Reglas estrictas:
- Sin `--allow-live`, sin `shopify theme publish` salvo que el propietario lo pida explícitamente en la sesión actual.
- `--nodelete` en cualquier push a un tema compartido.
- Nunca hagas `push` de un template JSON ni de `settings_data.json` desde una copia local obsoleta a un tema que edita el comerciante.

### `.shopifyignore`

Misma sintaxis de globs que `.gitignore`, aplicada a push, pull y dev. Entradas típicas:

```
node_modules/
src/
*.md
package*.json
.github/
## Optional, when merchants own content on the target theme:
## config/settings_data.json
## templates/*.json
```

### Flujo de trabajo con Git

1. `main` refleja lo que está (o estará) en producción. Ramas de funcionalidad por cada cambio.
2. Las ediciones del personalizador ocurren en la tienda, no en git. Antes de crear una rama o hacer push, haz pull del JSON del tema que se está editando y súbelo como un commit propio (`chore: sync customizer JSON`) para que las diferencias de código sigan siendo legibles.
3. La integración de Shopify con GitHub (Online Store > Themes > Add theme > Connect from GitHub) vincula una rama a un tema y sube a esa rama los cambios del personalizador. Si la usas, nunca hagas force-push a esa rama y espera commits de bots; haz rebase de las ramas de funcionalidad sobre ella con frecuencia.
4. Lanzamiento: fusiona en la rama conectada o haz push a un tema nuevo sin publicar, haz QA y luego el comerciante (o el propietario) publica. Conserva el tema en producción anterior como reversión; no lo borres.

### Resolución de conflictos de JSON

- Los templates y `settings_data.json` son datos. Ante un conflicto, quédate con el lado remoto (el del comerciante) y luego vuelve a aplicar solo tu cambio estructural (nueva entrada de section, nueva clave en `order`).
- Shopify puede reescribir el JSON al guardar (orden de claves, un comentario de encabezado generado). No pelees con el formato; compara semánticamente.
- Cuando añadas una section nueva a un template que editan los comerciantes, añádela tanto al mapa de sections como a `order`, con valores por defecto que se rendericen limpiamente.
- Eliminar un tipo de section o de block al que hacen referencia los templates rompe esos templates en el editor. Busca el tipo en `templates/` y `sections/*.json` antes de borrar un archivo.

### Theme check

- Ejecútalo en local y en CI (`shopify theme check -o json` o la GitHub Action de Theme Check; verifica el nombre actual de la action).
- Trata los errores como bloqueantes: templates ausentes, filtros/objetos desconocidos, JSON de schema no válido, claves de traducción ausentes, `img_url` y otros filtros obsoletos, scripts que bloquean el analizador, imágenes sin width/height.
- Desactivar una comprobación requiere un comentario con el motivo, acotado a un archivo o línea (`{% # theme-check-disable CheckName %}` ... `{% # theme-check-enable CheckName %}`), no global.

### Antes de entregar una vista previa a un cliente

- Tema sin publicar subido con el JSON actual de producción (o con acuerdo explícito de que el contenido de la vista previa difiere).
- Theme check sin avisos, comprobación puntual de Lighthouse/accesibilidad en inicio, colección, producto y carrito.
- Enlace de vista previa mediante `theme share` o la URL de vista previa del administrador; ten en cuenta que caduca junto con el tema de desarrollo.
