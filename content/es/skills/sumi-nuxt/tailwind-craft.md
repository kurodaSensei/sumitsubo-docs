---
title: "tailwind-craft"
description: "Tailwind CSS v4 en proyectos Nuxt/Vue: configuración @theme basada en CSS alimentada por los tokens de DESIGN.md, capas de tokens semánticos, extracción de componentes en lugar de proliferación de @apply, APIs de variantes, disciplina de escala de espaciado y tipografía, modo oscuro, container queries, y cómo evitar el abuso de valores arbitrarios y la sopa de clases. Úsala al dar estilo a plantillas *.vue, al editar app/assets/css/*.css, main.css, la configuración de tailwind en nuxt.config.ts, al añadir tokens de diseño, temas o modo oscuro, o al revisar listas largas de clases."
source-hash: "daec9dd5e237eb3c"
---

# Oficio con Tailwind

Tailwind es un sistema de restricciones. Su valor viene de un conjunto pequeño y con nombre de tokens aplicados
de forma coherente. Los valores arbitrarios, los colores sueltos y las cadenas de 40 clases son la señal de que las
restricciones se abandonaron. Los tokens vienen de `DESIGN.md` (sumi-design); las reglas de capas y de nombres de CSS
vienen de `sumi:css-architecture`.

## Principios básicos

1. **Primero los tokens.** Cada color, fuente, radio, sombra y paso de espaciado de la interfaz se asigna a un token en
   `@theme`. Si un valor no está en el tema, añádelo a `DESIGN.md` y al tema, o no lo uses.
2. **Semántico antes que crudo.** Los componentes usan `bg-surface`, `text-fg-muted`, `border-line`, no
   `bg-zinc-50 dark:bg-zinc-900`. Los pasos crudos de la paleta existen solo para definir tokens semánticos.
3. **Extrae componentes, no clases.** La repetición se resuelve con un componente de Vue (o una función de
   variantes), no con copias de `@apply` de cadenas de utilidades.
4. **Una sola escala.** El espaciado, la tipografía y el radio siguen la escala. Nada de `mt-[13px]`.
5. **Accesible por construcción.** Estilos de focus-visible, pares de tokens con contraste comprobado, movimiento reducido.

## Configuración en Nuxt (v4)

```ts
// nuxt.config.ts
import tailwindcss from '@tailwindcss/vite'
export default defineNuxtConfig({
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
})
```

El módulo `@nuxtjs/tailwindcss` es una alternativa; verifica su compatibilidad con Tailwind v4 antes de elegirlo.
En la v4 no hay un `tailwind.config.js` por defecto; la configuración vive en el CSS.

## Tema a partir de DESIGN.md

```css
/* app/assets/css/main.css */
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* raw tokens copied from DESIGN.md */
  --font-sans: "<Body family from DESIGN.md>", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Fraunces Variable", ui-serif, serif;
  --color-ink-950: oklch(0.18 0.02 260);
  --color-ink-50:  oklch(0.98 0.005 260);
  --color-brand-600: oklch(0.55 0.17 35);
  --radius-container: 0.75rem;
  --ease-enter: cubic-bezier(0.22, 1, 0.36, 1);
}

/* semantic layer: switches with theme, consumed by components */
@theme inline {
  --color-surface: var(--surface);
  --color-fg: var(--fg);
  --color-fg-muted: var(--fg-muted);
  --color-line: var(--line);
  --color-accent: var(--accent);
}

:root  { --surface: var(--color-ink-50);  --fg: var(--color-ink-950); --fg-muted: oklch(0.45 0.02 260);
         --line: oklch(0.9 0.01 260); --accent: var(--color-brand-600); }
.dark  { --surface: var(--color-ink-950); --fg: var(--color-ink-50);  --fg-muted: oklch(0.75 0.02 260);
         --line: oklch(0.3 0.02 260); --accent: oklch(0.7 0.15 35); }
```

- Reemplaza los espacios de nombres por defecto de forma deliberada (`--color-*: initial;`) cuando la paleta de la marca deba ser la
  única paleta; así dejan de compilarse los `bg-blue-500` sueltos.
- Cada par fg/superficie debe cumplir el contraste WCAG 2.2 AA (4.5:1 para texto, 3:1 para texto grande y la interfaz). Comprueba ambos temas.
- Los nombres de los tokens reflejan los roles de `DESIGN.md` mediante la tabla de alias de Tailwind de `sumi-design:design-tokens` (`text`→`fg`, `text-muted`→`fg-muted`, `border`→`line`, `accent-contrast`→`accent-fg`, de modo que las utilidades se lean `text-fg`, no `text-text`); nunca inventes nombres en los componentes. Detalles: `references/tokens-and-variants.md`.

## Disciplina de clases

```vue
<!-- BAD: class soup, raw colors, arbitrary values, duplicated in 6 places -->
<button class="inline-flex items-center justify-center gap-[6px] rounded-[10px] bg-[#e4572e]
  px-[18px] py-[9px] text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,.15)]
  hover:bg-[#c94a25] dark:bg-[#ff7a50] focus:outline-none">Save</button>

<!-- GOOD: one component owns the recipe, tokens only -->
<UiButton variant="primary" size="md">Save</UiButton>
```

- Ordena las clases de forma coherente (composición, caja, tipografía, visual, estado); usa el plugin de Tailwind para Prettier.
- Más de ~12 utilidades en un elemento, repetidas en 2 o más lugares: extrae un componente.
- Variantes mediante una función tipada (`cva` o `tailwind-variants`) dentro del componente; combina las clases
  del consumidor con `tailwind-merge` para que las sobrescrituras ganen de forma predecible.
- `@apply` solo para dar estilo a marcado que no controlas (contenido de CMS o markdown, widgets de terceros).
  En bloques `<style>` de SFC, usa `@reference "~/assets/css/main.css";` antes de `@apply`.
- Utilidades personalizadas con `@utility` para reglas realmente reutilizables y de un solo propósito
  (por ejemplo, `@utility text-balance-safe { ... }`), no para recetas de componentes.
- Los valores arbitrarios (`w-[37rem]`) se permiten una vez para un caso realmente puntual, con un comentario; un segundo uso
  significa que es un token.
- Las clases dinámicas deben ser cadenas completas en el código fuente (`variant === 'primary' ? 'bg-accent' : 'bg-surface'`).
  Nunca construyas nombres de clase por concatenación (`bg-${color}-500`); el escáner no puede verlos.

## Composición y adaptabilidad

- Primero móvil: clases base para pantallas pequeñas, `md:`/`lg:` añaden complejidad hacia arriba.
- Prefiere container queries para los componentes que viven en columnas de distinto ancho:
  `@container` en el contenedor, `@md:grid-cols-2` en los hijos. Puntos de corte del viewport para la composición de la página.
- Usa `gap` en lugar de márgenes entre hermanos; `space-*` solo para pilas simples.
- Tipografía fluida con `clamp()` definida como tokens (`--text-display`), no improvisada en las plantillas.
- Respeta el contenido: anchos basados en `max-w-prose`/`ch` para el texto de lectura.

## Estados, movimiento y modo oscuro

- Todo elemento interactivo: estilos `hover:`, `focus-visible:` (anillo visible con desfase), `active:`,
  `disabled:`/`aria-disabled:`. Nunca elimines los contornos sin un reemplazo.
- Da estilo según los atributos de estado: `aria-expanded:`, `aria-selected:`, `data-[state=open]:` (bibliotecas headless).
- `motion-safe:` para transiciones y animaciones; duraciones y curvas a partir de tokens.
- Modo oscuro mediante la estrategia de clase, con la preferencia guardada en una cookie o en `@nuxtjs/color-mode`
  (evita el parpadeo de hidratación, consulta `nuxt-data-ssr`). Los tokens semánticos hacen que los componentes no necesiten clases `dark:`.

## Antipatrones (señales de relleno de IA)

- Códigos hexadecimales y valores arbitrarios por todas partes (`text-[#333]`, `p-[13px]`, `shadow-[...]`).
- El hero genérico con degradado de morado a azul, `rounded-2xl shadow-xl` en cada tarjeta, glassmorphism
  por defecto: un estilo que ignora `DESIGN.md`.
- Duplicados `dark:` en cada elemento en lugar de tokens semánticos.
- `@apply` recreando Bootstrap (`.btn`, `.card`, `.container`) para marcado que es tuyo.
- Cadenas de 30 clases copiadas y pegadas entre archivos; nombres de clase concatenados como cadenas.
- Espaciado mezclado (`p-3`, `p-[14px]`, `p-3.5`, `p-4`) en componentes hermanos.
- `focus:outline-none` sin un reemplazo con `focus-visible`; texto de cuerpo `text-gray-400` de bajo contraste.
- Conservar un `tailwind.config.js` de la v3 con tema en JS junto a la configuración CSS de la v4 "por si acaso".

## Lista de verificación

- [ ] Todos los colores, fuentes, radios, sombras y curvas salen de tokens `@theme` rastreables hasta `DESIGN.md`.
- [ ] Los componentes usan tokens semánticos; el modo oscuro funciona sin clases `dark:` por elemento.
- [ ] Sin valores arbitrarios salvo casos puntuales documentados; sin nombres de clase concatenados.
- [ ] Las recetas repetidas están extraídas en componentes con variantes tipadas; `@apply` solo para marcado ajeno.
- [ ] Estados de focus-visible, hover, deshabilitado y movimiento reducido presentes; contraste AA verificado en ambos temas.
- [ ] La composición usa container queries donde los componentes se reutilizan en distintos anchos.
- [ ] Tamaño de la salida CSS comprobado; sin paletas sin usar en el envío (`sumi:performance`).

## Tokens y componentes con variantes

### Correspondencia de DESIGN.md con @theme

`DESIGN.md` (generado por sumi-design) es la fuente de verdad. Refleja sus grupos de tokens en los espacios de nombres
de Tailwind para que las utilidades se generen automáticamente:

| Grupo de DESIGN.md | Espacio de nombres de @theme | Genera |
| --- | --- | --- |
| Colores (crudos) | `--color-*` | `bg-*`, `text-*`, `border-*`, `fill-*`... |
| Familias tipográficas | `--font-*` | `font-*` |
| Escala tipográfica | `--text-*` (+ `--text-*--line-height`) | `text-*` |
| Base de espaciado | `--spacing` | `p-4`, `gap-6` = múltiplos de la base |
| Radios | `--radius-*` | `rounded-*` |
| Sombras / elevación | `--shadow-*` | `shadow-*` |
| Curvas | `--ease-*` | `ease-*` |
| Puntos de corte | `--breakpoint-*` | `sm:`, `md:`... |
| Tamaños de contenedor | `--container-*` | `@sm:`, `max-w-*` |

Los nombres de espacios de nombres anteriores reflejan las convenciones de Tailwind v4; verifica con la documentación vigente al añadir un
grupo menos habitual.

Reglas:
- Mantén pequeña la paleta cruda (marca, rampa neutra, colores de retroalimentación). Los tokens semánticos la referencian.
- Si el diseño necesita un valor que no está en `DESIGN.md`, actualiza primero `DESIGN.md` y luego el tema.
- Nombres: los tokens semánticos describen el rol (`surface`, `surface-raised`, `fg`, `fg-muted`, `line`,
  `accent`, `accent-fg`, `danger`, `focus`), no la apariencia (`light-gray`).

### Escala tipográfica con alturas de línea

```css
@theme {
  --text-body: 1rem;
  --text-body--line-height: 1.6;
  --text-h2: clamp(1.5rem, 1.2rem + 1.2vw, 2.125rem);
  --text-h2--line-height: 1.2;
  --text-h2--letter-spacing: -0.01em;
}
```

Uso: `text-h2`, `text-body`. Los encabezados toman su tamaño de los tokens, nunca de `text-[34px]`.

### Componente con variantes con cva + tailwind-merge

```ts
// app/utils/cn.ts
import { twMerge } from 'tailwind-merge'
import { clsx, type ClassValue } from 'clsx'
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
```

```vue
<!-- app/components/ui/Button.vue -> <UiButton> -->
<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'

const button = cva(
  'inline-flex items-center justify-center gap-2 rounded-card font-medium transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ' +
  'disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-fg hover:bg-accent/90',
        secondary: 'border border-line bg-surface text-fg hover:bg-surface-raised',
        ghost: 'text-fg hover:bg-surface-raised',
      },
      size: { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4', lg: 'h-12 px-6 text-lg' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)
type ButtonVariants = VariantProps<typeof button>

const { variant, size, class: className, type = 'button' } = defineProps<{
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: string
  type?: 'button' | 'submit' | 'reset'
}>()
</script>

<template>
  <button :type="type" :class="cn(button({ variant, size }), className)">
    <slot />
  </button>
</template>
```

Notas:
- Supone que los tokens semánticos `accent-fg`, `surface-raised` y `focus` existen en la capa `@theme inline`
  junto a los mostrados en SKILL.md.
- `h-10` da un objetivo de 40px; WCAG 2.2 AA (2.5.8) exige al menos 24x24 px CSS o un espaciado
  adecuado; más grande es mejor para el tacto.
- Si el botón puede renderizarse como enlace, acepta una prop `as`/`to` y renderiza `<NuxtLink>`; nunca pongas un
  `<button>` dentro de un `<a>`.

### Dar estilo a contenido ajeno

```css
/* Prose from CMS / markdown */
.prose-content {
  @apply text-body text-fg;
  & h2 { @apply mt-12 mb-4 font-display text-h2; }
  & a  { @apply text-accent underline underline-offset-4 hover:no-underline; }
}
```

O usa `@tailwindcss/typography` personalizado con tus tokens. Este es el hogar legítimo de `@apply`.

### Container queries

```vue
<article class="@container rounded-card border border-line bg-surface p-4">
  <div class="grid gap-4 @md:grid-cols-[8rem_1fr]">
    <NuxtImg ... class="aspect-square w-full rounded-card object-cover" />
    <div>...</div>
  </div>
</article>
```

La tarjeta se adapta a su espacio (barra lateral frente a columna principal) sin conocer el viewport.

### Migrar proyectos de v3 (resumen)

- Mueve los valores de `theme.extend` a variables de `@theme`; borra la configuración en JS al terminar.
- Revisa las utilidades renombradas (varias utilidades de sombra, radio, desenfoque y contorno se desplazaron un paso o se
  renombraron en la v4) y los cambios en el color por defecto de bordes y anillos; verifica con la guía oficial de actualización y
  ejecuta la herramienta de actualización, luego revisa el diff visualmente.
