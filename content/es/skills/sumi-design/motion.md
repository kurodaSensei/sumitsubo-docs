---
title: "motion"
description: "Reglas de oficio para el movimiento y la interacción en los proyectos de Sumitsubo: cuándo se justifica el movimiento, duración y curva según la intención, qué animar, entradas y salidas con CSS (@starting-style, transiciones de vista), muelles, respuesta a los gestos, rendimiento y política de movimiento reducido. Cede el trabajo profundo de movimiento a las skills de Emil Kowalski cuando están instaladas. Úsala al añadir transiciones, animaciones, respuesta al hover o a la pulsación, transiciones de página o efectos de scroll, o al revisar un movimiento que se siente lento, barato o excesivo."
source-hash: "e63246b57fdd6e82"
---

# Movimiento

El movimiento existe para explicar un cambio: respuesta (funcionó), continuidad (de dónde salió eso) y jerarquía (mira aquí). Si una animación no hace ninguna de las tres, quítala. Para un trabajo más fino, carga `emil-design-eng` de Emil Kowalski (y `review-animations` para auditorías) cuando estén instaladas.

## Valores por defecto (tokens en DESIGN.md)

| Intención | Duración | Curva |
|---|---|---|
| Respuesta a pulsación o hover | 80–150 ms | ease-out |
| Interfaz pequeña (desplegable, tooltip, interruptor) | 150–220 ms | ease-out al entrar, ease-in más rápida al salir |
| Superficies medianas (cajón, modal, hoja) | 220–320 ms | ease-out marcada o un muelle con amortiguación crítica |
| Transiciones grandes o de página | 300–450 ms | ease-in-out; nunca bloquees la entrada del usuario |

- Las salidas son más rápidas que las entradas (aproximadamente al 70–80 %).
- Usa curvas cubic-bezier propias nombradas por su intención (`--ease-enter`, `--ease-exit`, `--ease-move`); las integradas `ease` y `linear` rara vez se sienten bien en una interfaz.
- Nada de rebote ni elasticidad por defecto; el sobrepaso solo cuando la personalidad de movimiento de la marca lo pida.
- Las interacciones que se repiten mucho (escribir, alternar dentro de listas, navegar con el teclado) llevan poca animación o ninguna.

## Qué animar

- Solo `transform` y `opacity` (amables con la GPU). Nunca width, height, top, left ni margin; para los cambios de composición usa transformaciones, FLIP o View Transitions.
- Anima desde el origen de lo que la dispara (`transform-origin` en el botón, para los popovers).
- Escalona las listas con mesura (20–40 ms por elemento, con un tope total) o no las escalones.
- Los efectos guiados por scroll, solo en páginas narrativas y solo si se siguen leyendo sin movimiento.

## Técnicas

- Entrada y salida de diálogos, popovers y alternancias de `display`: `@starting-style` más `transition-behavior: allow-discrete`.
- Transiciones de ruta y de estado: la View Transitions API (`document.startViewTransition`, con las integraciones del framework) como mejora progresiva.
- Interacciones interrumpibles (arrastre, deslizamiento, hojas): muelles (la biblioteca `motion` de Motion, o aproximaciones con `linear()` en CSS) para que el movimiento siga al gesto.
- Respuesta a la pulsación: una escala sutil (0.97–0.98), o un cambio de color o de fondo (barato en elementos pequeños, la única excepción a transform y opacity); responde dentro del primer fotograma.

## Movimiento reducido (obligatorio)

Bajo `prefers-reduced-motion: reduce`: quita el parallax, las traslaciones grandes, las animaciones que se reproducen solas y el secuestro del scroll; conserva los fundidos breves de opacidad y los cambios de estado instantáneos. Ofrece controles de pausa para cualquier cosa que se repita más de 5 s.

## Rendimiento

- Nada de bibliotecas de animación para lo que el CSS ya hace. Carga el código de movimiento pesado solo en las rutas que lo usan.
- Pruébalo en un móvil de gama media con el procesador limitado; los fotogramas perdidos significan simplificar.
- Evita animar capas grandes con desenfoque o sombra; prefiere la opacidad sobre una capa ya renderizada.

## Señales de relleno genérico

Que todo aparezca con un fundido al hacer scroll; escala al hover en cada tarjeta; transiciones de interfaz de más de 600 ms; ruletas de carga donde encajan esqueletos o una interfaz optimista; movimiento que ignora los ajustes de movimiento reducido.

## Lista de verificación

- [ ] Cada animación tiene un propósito declarado (respuesta, continuidad, jerarquía).
- [ ] Las duraciones y las curvas vienen de los tokens; las salidas son más rápidas que las entradas.
- [ ] Solo se animan transform y opacity; va fluido en un móvil con el procesador limitado.
- [ ] El comportamiento con movimiento reducido está verificado.
