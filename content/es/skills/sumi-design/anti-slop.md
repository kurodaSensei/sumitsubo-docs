---
title: "anti-slop"
description: "Catálogo de las señales que delatan el diseño y el texto por defecto de la IA —los patrones que hacen que las interfaces generadas parezcan intercambiables— con qué hacer en su lugar. Úsala al generar o revisar cualquier interfaz, página de aterrizaje, maqueta, estilado de componentes o texto de marketing, al escribir anti-referencias, y cuando un diseño \"se parece a todos los demás sitios hechos con IA\"."
source-hash: "5b5d09608bc13d2c"
---

# Catálogo anti-relleno

Un patrón es relleno genérico cuando se elige por defecto y no por intención. Cualquier elemento de esta lista solo se permite si DESIGN.md lo justifica explícitamente para esta marca. Si no, se reemplaza.

## Señales de composición

| Señal | En su lugar |
|---|---|
| Portada centrada: insignia en píldora → titular gigante → subtítulo → dos botones → captura de pantalla | Compón desde el sistema de composición de la dirección: asimétrico, editorial, guiado por el producto o guiado por el contenido. Deja que la portada haga una sola cosa. |
| Tres tarjetas de características con un icono dentro de un cuadrado redondeado y teñido | Muestra el producto de verdad, una comparación, una secuencia, una sola afirmación fuerte con su prueba, o una lista con detalle real. |
| Rejilla bento para todo | Usa bento solo cuando los elementos sean de verdad heterogéneos y comparables en importancia. |
| Ritmo de sección idéntico (mismo relleno, mismo encabezado centrado más rejilla, repetido 8 veces) | Varía la densidad y la composición según el contenido: un momento a sangre completa, una lista apretada, una cita compuesta en tipografía de display. |
| Nube de logotipos en escala de grises justo después de la portada, por reflejo | Prueba social donde ayude a decidir, con datos concretos (cifras, resultados con nombre). |
| Precios: tres tarjetas, con la del medio marcada como "La más popular" y ampliada | Diseña en torno a cómo vende realmente este cliente; considera una tabla, una calculadora o un único plan bien explicado. |
| Acordeón de preguntas frecuentes, franja gigante de llamada a la acción y pie de cuatro columnas como final por defecto | Termina con lo que el usuario necesita a continuación. |

## Señales visuales

| Señal | En su lugar |
|---|---|
| Degradados de morado a azul (o de turquesa a violeta), titulares con texto degradado | Una estrategia de color que venga de la dirección; degradados solo si salen de la marca o de la imagen. |
| Glassmorphism, tarjetas esmeriladas sobre manchas desenfocadas | Un modelo de profundidad deliberado (bordes, capas tonales, una sola elevación). |
| Inter, Geist o system-ui como toda la identidad | Un emparejamiento tipográfico elegido por la voz de la marca; las tipografías del sistema solo como elección utilitaria deliberada. |
| El mismo radio de 8 a 12 px y la misma sombra suave en todos los elementos | Un lenguaje de forma por rol (por ejemplo contenedores rectos y controles redondeados) definido en los tokens. |
| Negro puro sobre blanco puro, o texto gris sobre fondos de color | Neutros teñidos derivados de la paleta; roles de texto con el contraste verificado. |
| Emoji o iconos de línea genéricos como decoración (destellos, cohetes, rayos) | Iconos solo donde ayuden a escanear; set propio o consistente; nada de emoji decorativo. |
| Manchas 3D abstractas, degradados de malla, fotos de archivo del "equipo riendo frente a un portátil" | Producto real, personas reales, ilustración con una intención y un estilo especificado, o tipografía. |
| Modo oscuro con acentos de neón como sinónimo de "premium" | Lo premium viene de la contención, la tipografía y el espaciado, en cualquiera de los dos temas. |
| Exceso de animación: todo aparece con un fundido al hacer scroll, escalas rebotonas al pasar el cursor | Movimiento con un propósito (`sumi-design:motion`): respuesta, continuidad, jerarquía. |
| Paneles de control estilo Dribbble: gráficos de anillo, tarjetas con minigráficos aleatorios, indicadores inventados | Muestra los datos que el usuario necesita para decidir, en la forma más legible. |

## Señales en el texto

- "Desbloquea", "Eleva", "Sin fricciones", "Potencia", "Impulsa", "Revoluciona", "De nueva generación", "Todo en uno", "Sin esfuerzo", "Tu … definitivo", "Dile adiós a…".
- Tríos por reflejo ("Rápido. Simple. Potente.").
- Titulares que podrían describir cualquier producto. La prueba: cambia el nombre por el de un competidor; si sigue funcionando, reescríbelo.
- Testimonios falsos y cifras inventadas. Usa los reales o deja un marcador de posición claramente señalado para el cliente.
- Signos de exclamación y emoji en el texto de la interfaz; botones con la etiqueta "Empezar" en todas partes. Los botones dicen qué va a pasar ("Reservar una prueba", "Ver la carta").

## Señales de ingeniería que se ven en pantalla

- Contenido de relleno publicado (lorem, "Característica uno", cajas grises).
- Valores de espaciado inconsistentes; elementos casi alineados.
- Iconos de tres sets distintos; grosores de trazo que no coinciden.
- Estados de hover sin estados de foco; cursor de puntero sobre cosas que no son interactivas.
- Imágenes estiradas o recortadas por la cara; texto sobre imágenes sin un tratamiento de contraste.

## Autoevaluación rápida antes de enseñar cualquier diseño

1. ¿Podría ser una plantilla para cualquier empresa de otro sector? → no está terminado.
2. Nombra el elemento característico. Si no puedes, no lo hay.
3. Señala de dónde sale cada tipografía, color y radio dentro de DESIGN.md.
4. Lee el titular con el nombre de un competidor. ¿Sigue siendo cierto? Reescríbelo.
5. Entorna los ojos: ¿hay una jerarquía clara y un único punto focal por vista?
6. Recórrelo con el teclado: ¿se ve el foco en todas partes?
