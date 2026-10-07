---
title: "css-architecture"
description: "Arquitectura CSS moderna para cualquier stack (CSS plano, SCSS, Tailwind v4, estilos con ámbito de Vue/Svelte, CSS Modules): tokens como propiedades personalizadas a partir de DESIGN.md, capas de cascada, nombres, especificidad, composición intrínseca y fluida, consultas de contenedor, propiedades lógicas, selectores modernos, modo oscuro y movimiento reducido. Úsala al escribir o revisar *.css, *.scss, bloques de estilo, clases de Tailwind o la configuración del tema, o cuando intervengan la composición, la adaptabilidad o la temática."
source-hash: "4b4574afdf54d924"
---

# Arquitectura CSS

El CSS es el entorno de ejecución de un sistema de diseño. Todo valor visual sale de un token; la composición es intrínseca primero y adaptable después; la especificidad se mantiene plana.

## Tokens

- Todos los colores, familias tipográficas, tamaños de texto, espaciados, radios, sombras, z-index, duraciones y curvas son propiedades personalizadas de CSS generadas a partir de `DESIGN.md`. Los valores fijos en los componentes son errores.
- Dos capas: **primitivas** (`--color-clay-600`) y **roles semánticos** (`--color-surface`, `--color-text-muted`, `--color-accent`). Los componentes consumen solo roles, de modo que los temas y el modo oscuro intercambian roles, no componentes.
- Tailwind v4: los tokens viven en `@theme` dentro del CSS; nunca esparzas valores arbitrarios (`text-[17px]`, `bg-[#3a2f2a]`): añade un token.
- Shopify/WordPress: asigna los ajustes del comerciante o del editor a las mismas propiedades personalizadas (`--section-padding-block`) en lugar de usar estilos en línea.

## Cascada y especificidad

- Usa `@layer reset, tokens, base, layout, components, utilities, overrides;` para hacer explícito el orden.
- Especificidad objetivo 0-1-0: una clase por selector. Sin IDs, sin `!important` (salvo en la capa de utilidades, por diseño), sin calificar (`div.card`).
- Nombres: sigue el proyecto. En CSS/SCSS plano sin ámbito, usa BEM (`.card`, `.card__title`, `.card--featured`) con un máximo de un nivel de anidación. En sistemas con ámbito, módulos o utilidades, no hace falta BEM.
- `:where()` para llevar la especificidad a cero en los estilos base; `:is()` para agrupar; `:has()` para estilar según el padre o el estado (mantén estrecho el elemento sujeto por rendimiento).

## Composición

- Intrínseca primero: flexbox y grid con `minmax()`, `auto-fit`, `min()`, `clamp()` eliminan la mayoría de los puntos de corte.
- Adaptabilidad a nivel de componente con **consultas de contenedor** (`container-type: inline-size`); las media queries del viewport solo para la composición a nivel de página.
- Consultas `min-width` con enfoque móvil primero y un conjunto fijo de puntos de corte tomado de DESIGN.md (las propiedades personalizadas no funcionan dentro de las media queries: usa variables de Sass, `@custom-media` con un paso de compilación, o las claves de tema `--breakpoint-*` de Tailwind), nunca valores de píxeles improvisados.
- Texto y espaciado fluidos mediante `clamp()` con un componente en rem para que el zoom siga funcionando.
- Propiedades lógicas en todas partes (`margin-inline`, `padding-block`, `inset-inline-start`, `text-align: start`): soporte RTL gratis.
- `aspect-ratio` para las cajas de medios; `gap` en lugar de márgenes entre hermanos; evita los números mágicos.
- Usa `subgrid` para alinear el interior de las tarjetas a lo largo de una fila.

## Capacidades modernas (úsalas, con alternativas donde haga falta)

- `color-mix()` y OKLCH para matices, tonos y estados de hover derivados de los tokens.
- `@starting-style` + `transition-behavior: allow-discrete` para la entrada y salida de diálogos y popovers.
- La View Transitions API para las transiciones de página o de estado como mejora progresiva.
- Animaciones guiadas por el scroll solo cuando aporten significado; siempre seguras con movimiento reducido.
- `text-wrap: balance` para los encabezados, `text-wrap: pretty` para el cuerpo.
- La anidación nativa está bien; mantenla a un solo nivel de profundidad.

## Temática y preferencias

- El modo oscuro intercambia roles semánticos bajo `[data-theme="dark"]` y/o `prefers-color-scheme`. Nunca inviertas a ciegas; vuelve a comprobar el contraste de cada par de roles.
- `@media (prefers-reduced-motion: reduce)` desactiva el movimiento no esencial (conserva los desvanecimientos de opacidad, elimina las transformaciones y el parallax).
- Respeta `forced-colors: active`: no dependas de fondos ni sombras para transmitir significado; usa bordes y contornos reales.
- Estilos de foco: contorno `:focus-visible` visible a partir de un token (regla de la casa: ≥ 2px, contraste ≥ 3:1). Nunca `outline: none` sin un reemplazo.

## Particularidades de SCSS

- Solo el sistema de módulos: `@use` / `@forward`, nunca `@import`. `sass:math` y `sass:color` con espacio de nombres.
- SCSS para los ayudantes de tiempo de compilación (mixins para los puntos de corte, funciones para rem); los valores en tiempo de ejecución siguen siendo propiedades personalizadas.
- Parciales organizados por rol (abstracts, base, layout, components, sections/pages). Stylelint con ordenación de propiedades.

## Señales de relleno genérico

- Colores hex fijos, tamaños de fuente en px y valores de espaciado puntuales; valores arbitrarios de Tailwind.
- `z-index: 9999`; contextos de apilamiento creados por accidente; `position: absolute` para arreglar problemas de composición.
- Todos los elementos con el mismo radio y la misma sombra sin importar su rol.
- Un caos de puntos de corte en lugar de composición intrínseca; alturas fijas en contenedores de texto.
- Declaraciones duplicadas, selectores sin usar, anidación profunda que replica el DOM.

## Lista de verificación

- [ ] Ningún valor en bruto fuera de los archivos de definición de tokens.
- [ ] Funciona desde 320px hasta pantallas anchas y con zoom al 200 % sin scroll horizontal.
- [ ] Consultas de contenedor para la adaptabilidad de los componentes que se reutilizan en distintos anchos.
- [ ] Modo oscuro, movimiento reducido, colores forzados y focus-visible verificados.
- [ ] Stylelint/Prettier limpios; sin CSS sin usar entregado con la funcionalidad.
