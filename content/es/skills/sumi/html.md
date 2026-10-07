---
title: "html"
description: "Estándares de HTML semántico moderno: elementos nativos antes que JavaScript (dialog, details, popover, search, validación de formularios), estructura del documento, landmarks, formularios, medios, metadatos y convenciones de ID. Úsala al escribir o revisar marcado en cualquier lenguaje de plantillas (*.html, plantillas *.vue, JSX de *.jsx/*.tsx, *.liquid, *.twig, plantillas *.php) o al decidir si un comportamiento de UI necesita JavaScript. Base independiente del framework; las skills de los paquetes de stack tienen prioridad en lo específico de cada stack."
source-hash: "63caf0ded99a23d2"
---

# HTML — primero lo semántico, primero la plataforma

El navegador ya incluye componentes accesibles, listos para el teclado y eficientes. Úsalos antes de escribir JavaScript y antes de recurrir a una biblioteca.

## Documento

- `<html lang="…">` siempre; `<title>` único por página; un `<h1>` por página.
- `<meta name="viewport" content="width=device-width, initial-scale=1">`: nunca desactives el zoom.
- Landmarks: un `<header>` a nivel de página (banner), `<nav>` (con etiqueta si hay más de uno), un `<main id="main">`, `<footer>`; `<aside>` para el contenido complementario. Un enlace de salto a `#main` es el primer elemento enfocable.
- Los encabezados forman un esquema; nunca te saltes niveles por el tamaño visual. El tamaño es trabajo del CSS.

## Elementos nativos preferibles

| Necesidad | Usa | No |
|---|---|---|
| Modal | `<dialog>` + `showModal()` (trampa de foco, Esc y fondo inerte incluidos) | superposición con div + trampa personalizada |
| Disclosure / accordion | `<details><summary>`; atributo `name` para grupos excluyentes | div + manejador de clic |
| Tooltip, menú, popover | atributo `popover` + `popovertarget` (cierre ligero, capa superior) | div con posición absoluta + JS de clic exterior |
| Anclaje de popovers | CSS anchor positioning (mejora progresiva) | bibliotecas JS de posicionamiento para casos simples |
| Región de búsqueda | `<search>` envolviendo el formulario | div role="search" |
| Acción de navegación | `<a href>` | `<div onclick>` / `<button>` que navega |
| Acción dentro de la página | `<button type="button">` | `<a href="#">` / div |
| Progreso / medidores | `<progress>`, `<meter>` | divs con estilos y sin semántica |
| Salida calculada | `<output for="…">` | span |
| Sugerencias de autocompletado | `<datalist>` para casos simples | combobox personalizado cuando lo nativo basta |

## Formularios

- Todo control tiene un `<label for>` visible; los placeholders son pistas, nunca etiquetas.
- Usa el `type` correcto (`email`, `tel`, `url`, `number`, `date`, `search`) y los tokens de `inputmode` / `autocomplete` (`email`, `given-name`, `postal-code`, `one-time-code`, `cc-number`): determinan los teclados móviles y el autocompletado.
- Primero la validación nativa (`required`, `pattern`, `min`, `max`, `minlength`); mejora los mensajes con la Constraint Validation API. Los errores son texto vinculado con `aria-describedby`, no solo color.
- Agrupa los controles relacionados con `<fieldset><legend>` (grupos de radios, bloques de dirección).
- Los botones dentro de formularios declaran `type` de forma explícita.

## Medios

- `<img>` siempre lleva `width`/`height` (o `aspect-ratio` de CSS) para evitar el desplazamiento de la composición, un `alt` significativo (`alt=""` vacío cuando es decorativa), `loading="lazy"` bajo el pliegue y `fetchpriority="high"` solo en la imagen LCP.
- Imágenes adaptables: `srcset` + `sizes`, o `<picture>` para dirección de arte y formatos modernos (AVIF/WebP).
- Iconos SVG en línea: `aria-hidden="true"` cuando son decorativos; `role="img"` + `<title>` cuando son significativos. Usa `currentColor`.
- `<video>`: pista de subtítulos, sin reproducción automática con sonido, `playsinline` y un póster.

## IDs y atributos

- IDs solo para vincular label/ARIA, destinos de fragmento y asociación de formularios; nunca para estilar. Hazlos únicos por página (prefíjalos con componente + instancia en los bucles).
- Atributos de datos para los ganchos de JS (`data-cart-drawer`), clases para los estilos. No acoples el JS a las clases de estilo.
- Los atributos booleanos están presentes o ausentes (`hidden`, `disabled`, `inert`), no `="false"`.

## Señales de relleno genérico

- Un caos de `div` con manejadores de clic; `role="button"` en un div cuando `<button>` sirve.
- ARIA añadido a elementos nativos que ya tienen la semántica (`<button role="button">`, `<nav role="navigation">` en código nuevo).
- Placeholder como etiqueta, `alt` ausente, `<br>` para espaciar, enlaces o botones vacíos con solo un icono y sin nombre accesible.
- Modales, accordions y tooltips con JS personalizado cuando los elementos nativos cubren el caso.

## Lista de verificación

- [ ] Valida (sin IDs duplicados, sin anidación inválida, como un elemento interactivo dentro de otro).
- [ ] Todo elemento interactivo es un control nativo o tiene soporte completo de teclado + ARIA.
- [ ] Toda imagen tiene el `alt` y las dimensiones correctos; imagen LCP priorizada.
- [ ] Formularios: etiquetas, tipos, autocompletado, errores accesibles.
- [ ] El esquema de encabezados tiene sentido leído por sí solo.
