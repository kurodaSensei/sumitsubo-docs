---
title: "wp-performance-audit"
description: "Control de rendimiento y del sistema de diseño para temas de bloques nativos de WordPress: quitar el peso que WordPress trae por defecto, precargar tipografías, diferir scripts, cargar los recursos de un plugin solo donde se usan, prioridades de imagen, apuntar a Lighthouse 100, más una auditoría determinista de tokens (los colores, tamaños de letra y espaciados del CSS deben venir de theme.json) y críticas con Impeccable. Úsala al optimizar un tema de WordPress, al añadir scripts, estilos, tipografías o plugins, antes de publicar, o al comprobar que el CSS respeta el sistema de diseño de theme.json."
source-hash: "07e9ed64d7b7565c"
---

# Auditorías de rendimiento y de tokens

Objetivo: Lighthouse 100 en móvil para las páginas de marketing, y Core Web Vitals dentro de los presupuestos de `sumi:performance`. Un tema de bloques sin maquetador y sin paso de compilación vuelve eso realista; protégelo.

## Recetas para inc/performance.php

- Quita el script y los estilos de detección de emoji; quita `wp_generator`, `rsd_link` y `wlwmanifest_link` de la cabecera.
- Precarga únicamente los 1 o 2 archivos de tipografía que se usan sobre el pliegue (`<link rel="preload" as="font" type="font/woff2" crossorigin>` con prioridad 1); el resto se carga bajo demanda mediante `fontFace` de theme.json con `font-display: swap`.
- Encola el JS del tema con `array( 'strategy' => 'defer', 'in_footer' => true )`; sin dependencia de jQuery.
- Plugins que encolan de forma global (formularios, carruseles, reseñas): quita su CSS y su JS en las páginas que no los usan, detectando el uso con `has_shortcode()` o `has_block()`, incluidos tus propios bloques personalizados que los envuelvan. Deja una nota `ponytail:` indicando dónde habría que extender la heurística (widgets, plantillas).
- Imagen principal: `loading="eager"` más `fetchpriority="high"`; todas las demás imágenes en carga diferida y con width/height; dirección de arte con `<picture>` para que el móvil descargue solo su propio archivo.
- No cargues CSS de la biblioteca de bloques que no uses; prefiere `wp_enqueue_block_style` por bloque cuando añadas CSS específico de uno.

## Auditoría de tokens (obligatoria antes de publicar)

Ejecuta el auditor incluido contra el tema; falla (código 2) ante valores de CSS que queden fuera del sistema de diseño:

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/wp-performance-audit/scripts/audit-tokens.mjs <theme-dir>
```

Lee `theme.json` y recorre `assets/css/**/*.css`. Los colores, tamaños de letra y radios hacen fallar la ejecución; el espaciado se reporta como advertencia salvo que pases `--strict`:
- **Colores**: literales hexadecimales que no sean `#fff` ni `#000`. Usa `var(--wp--preset--color--*)`, `var(--wp--custom--*)` o una derivación con `color-mix()`.
- **Tamaños de letra**: `font-size` en px o rem que no corresponda a un tamaño de theme.json. Usa `var(--wp--preset--font-size--*)`.
- **Radios**: literales en `border-radius`. Usa `var(--wp--custom--radius--*)` (se permiten 0 y 50%).
- **Espaciado** (advertencia, o fallo con `--strict`): literales de margin, padding o gap que no estén en la escala de espaciado. Usa `var(--wp--preset--spacing--*)` o `--wp--custom--space--*`.
Excepciones permitidas: `0`, bordes de `1px`, veladuras con `rgba()` y las líneas que terminen en `/* token-ok: reason */`.

Si un valor es genuinamente nuevo, añádelo primero a theme.json (y a DESIGN.md), y después usa la variable.

## Crítica de diseño

Si tienes Impeccable instalado, ejecuta su crítica o auditoría sobre las páginas renderizadas y guarda su configuración en `.impeccable/` dentro del repo (las reglas ignoradas necesitan un motivo). Combínalo con `/sumi-design:critique`.

## Evidencia

Registra en el expediente de la funcionalidad: las puntuaciones de Lighthouse en móvil (rendimiento, accesibilidad, buenas prácticas, SEO) para la portada y una plantilla por tipo de contenido, la salida de la auditoría de tokens y los resultados de axe.

## Lista de verificación

- [ ] Sin peso de emoji ni de cabecera; tipografías precargadas de forma selectiva; JS diferido.
- [ ] Los recursos de cada plugin se cargan solo donde se usan.
- [ ] La auditoría de tokens pasa.
- [ ] Lighthouse en móvil ≥ 95 en todas partes, 100 en las páginas clave, con las cifras registradas.
