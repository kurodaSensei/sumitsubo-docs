---
title: "design-tokens"
description: "Cómo escribir y usar DESIGN.md —la única fuente de verdad del sistema visual de un proyecto (tipografía, roles de color en OKLCH, espaciado, radios, elevación, movimiento, puntos de ruptura, foco y reglas de accesibilidad)— y cómo traducirlo a propiedades personalizadas de CSS, al @theme de Tailwind v4, a los ajustes de un tema de Shopify o al theme.json de WordPress. Incluye un verificador de contraste. Úsala al crear o editar DESIGN.md, al añadir un token, al tematizar, al construir el modo oscuro o al conectar los tokens con un stack."
source-hash: "28d478e2026b5959"
---

# Tokens de diseño y DESIGN.md

`DESIGN.md` (en la raíz del repo) es el contrato entre la dirección y la implementación. Plantilla: `${CLAUDE_PLUGIN_ROOT}/templates/DESIGN.md`. El código consume tokens; nunca inventa valores.

## Qué debe definir DESIGN.md

1. **Resumen de la dirección**: concepto, tensiones de marca, elemento característico y anti-referencias (breve).
2. **Tipografía**: familias con sus alternativas y sus ajustes métricos, estrategia de carga, pesos realmente usados, una escala modular (fluida con `clamp()`), alturas de línea y tracking por escalón, y reglas para encabezados, texto, interfaz y cifras (`font-variant-numeric: tabular-nums` para precios y tablas).
3. **Color**: primitivas en OKLCH (escalones de luminosidad consistentes, con el tono y el croma de la marca) y **roles semánticos**: `surface`, `surface-raised`, `text`, `text-muted`, `border`, `accent`, `accent-contrast`, `focus`, `success`, `warning`, `danger`, `info`. Valores claros y oscuros para cada rol. Cada par de texto y superficie listado con su ratio de contraste.
4. **Espaciado**: una sola escala (por ejemplo en base 4 o fluida) y espaciados de composición con nombre (`section-block`, `gutter`, `stack-sm|md|lg`).
5. **Forma**: radios por rol (contenedor, control, chip, medio), grosores de borde y estilo de los divisores.
6. **Elevación y profundidad**: el modelo de profundidad y como mucho 2 o 3 tokens de elevación, o explícitamente ninguno.
7. **Composición**: columnas de la rejilla, anchos máximos (medida de texto de 60 a 75 ch), puntos de ruptura y uso de container queries.
8. **Movimiento**: tokens de duración (`instant` ~100 ms, `quick` ~160–200 ms, `standard` ~240–300 ms, `slow` para superficies grandes), tokens de curva (curvas propias nombradas por intención: `enter`, `exit`, `move`) y política de movimiento reducido.
9. **Iconografía e imagen**: set de iconos, grosor de trazo y tamaños; tratamiento fotográfico, proporciones y estilo de ilustración.
10. **Reglas de accesibilidad**: especificación del anillo de foco, tamaño mínimo de objetivo, contrastes mínimos y límites de movimiento.
11. **Inventario de componentes**: las primitivas que usa el proyecto (variantes de botón, campos, tarjetas…) con su mapeo a tokens, añadidas a medida que se construyen.

## Nomenclatura

- Primitivas: `--{category}-{name}-{step}` → `--color-clay-600`, `--space-4`.
- Roles: `--{category}-{role}` → `--color-text-muted`, `--radius-control`, `--motion-quick`, `--ease-enter`.
- Los componentes referencian solo roles. Cambiar de tema es volver a mapear roles.

## Traducción por stack

- **CSS plano o SCSS**: un `tokens.css` con `:root { … }` y `[data-theme="dark"] { … }` dentro de `@layer tokens`.
- **Tailwind v4**: `@theme { --color-surface: …; --font-display: …; --radius-control: …; }` para que las utilidades se generen desde los tokens; el modo oscuro con una variante propia que remapea los roles. Nada de valores arbitrarios en el marcado. Como Tailwind antepone la propiedad al nombre de la utilidad (`text-`, `border-`), usa estos alias para los roles de color y así las clases se leen bien:

  | Rol en DESIGN.md | Token de Tailwind | Ejemplo de utilidad |
  |---|---|---|
  | `--color-text` | `--color-fg` | `text-fg` |
  | `--color-text-muted` | `--color-fg-muted` | `text-fg-muted` |
  | `--color-border` | `--color-line` | `border-line` |
  | `--color-accent-contrast` | `--color-accent-fg` | `text-accent-fg` |
  | el resto de roles | el mismo nombre | `bg-surface`, `bg-accent`, `ring-focus` |
- **Nuxt o Next**: el mismo `tokens.css` importado de forma global; las tipografías por `@nuxt/fonts` o `next/font`, con las familias de DESIGN.md.
- **Shopify**: los tokens de marca se convierten en ajustes de `settings_schema.json` (esquemas de color, selectores de tipografía, rangos) que se emiten como variables CSS en el layout; las anulaciones a nivel de sección se mapean a esos mismos nombres de variable.
- **Temas de bloques de WordPress**: en `theme.json`: `settings.color.palette`, `typography.fontFamilies` y `fontSizes` (fluidos), `spacing.spacingSizes`, y `custom` para los radios y el movimiento (el enfoque de la casa para WordPress: ver `sumi-wordpress:wp-block-theme`).

## Verificación de contraste (obligatoria)

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/design-tokens/scripts/contrast.mjs "oklch(0.27 0.03 40)" "oklch(0.97 0.01 85)"
node ${CLAUDE_PLUGIN_ROOT}/skills/design-tokens/scripts/contrast.mjs --pairs design/contrast-pairs.json
```
Archivo de pares: `[{ "name": "text on surface", "fg": "…", "bg": "…", "min": 4.5 }]`. Usa `min: 3` para texto grande, bordes de interfaz y anillos de foco. Registra los resultados en DESIGN.md. El código de salida 2 significa que algo falló.

## Reglas

- Añade el token antes de usar un valor nuevo; revisa los tokens nuevos como si fueran código.
- Prefiere menos tokens: si dos valores son casi idénticos, únelos.
- Nunca escribas un color de marca directamente en un componente; nunca uses una primitiva donde existe un rol.
- Vuelve a correr la comprobación de contraste cada vez que cambie un rol de color, en todos los temas.
