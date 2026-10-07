---
title: "design-direction"
description: "El proceso de dirección creativa de Sumitsubo que corre ANTES de cualquier diseño visual o código de interfaz: brief de descubrimiento, anti-referencias, consulta al registro, tres direcciones realmente divergentes construidas sobre ejes explícitos, selección, y un DESIGN.md que toda pantalla posterior debe obedecer. Orquesta las skills de Impeccable, Taste y Emil Kowalski cuando están instaladas. Úsala al empezar un sitio, una app, una página de aterrizaje o un rediseño, al abrir una sección nueva con su propia apariencia, o cuando el usuario pida un diseño, una maqueta o un prompt para Claude Design y no exista DESIGN.md. Para ajustes visuales pequeños en un proyecto que ya tiene DESIGN.md, usa design-tokens y anti-slop."
source-hash: "6daa5ef318acd3a0"
---

# Dirección de diseño

El diseño genérico de IA es lo que ocurre cuando el modelo rellena con el promedio estadístico cada decisión que nadie especificó. La cura es no dejar nada sin especificar: decidir la dirección a conciencia, por escrito, antes de dibujar o programar nada. Este proceso produce `DESIGN.md`; toda pantalla posterior se construye desde ahí.

## Etapa 0 — Acompañantes

Se instalan automáticamente como dependencias de `sumi-design` (referenciadas desde sus repos de origen):
- **Impeccable** (`impeccable`): contexto de producto (`PRODUCT.md`), crítica, auditoría, pulido y detectores de antipatrones. Etapas 1 y 6.
- **Taste** (`taste` = design-taste-frontend, más las familias de estilo `taste-minimalist`, `taste-brutalist`, `taste-soft`, `taste-redesign`): diales de varianza, movimiento y densidad, y referencias de estilo. Etapa 3; `taste-redesign` para rediseños de sitios existentes.
- **Emil Kowalski** (`emil-design-eng`, `emil-review-animations`, `emil-animation-vocabulary`): oficio de movimiento y auditorías de movimiento. Etapa 6 y `sumi-design:motion`.
Si falta alguna (por ejemplo por haberse instalado sin dependencias), ejecuta `/sumi-design:deps`.

## Etapa 1 — Brief de descubrimiento

Rellena `${CLAUDE_PLUGIN_ROOT}/templates/brief.md` (guárdalo como `design/brief.md`). Pregunta solo lo que no puedas deducir del repo, del sitio actual del cliente o de los enlaces que te dé el usuario. El brief debe recoger:
- Negocio, oferta, audiencia (quién, contexto de uso, mezcla de dispositivos) y conversión o tarea principal.
- **De tres a cinco rasgos de marca formulados como tensiones**, no como adjetivos: "preciso pero cálido", "lujoso pero no excluyente". Los adjetivos sueltos ("moderno", "limpio") están prohibidos: describen todos los sitios.
- La realidad del contenido: longitud real del texto, fotos de producto reales o ninguna, densidad de datos.
- Restricciones: plataforma (ajustes de un tema de Shopify, editor de WordPress, app), nivel de accesibilidad, presupuesto de rendimiento, y los recursos de marca existentes que no se negocian.
Si tienes Impeccable instalado, escribe o actualiza `PRODUCT.md` con los mismos hechos (con su flujo `init` o `shape`) para que sus críticas tengan contexto.

## Etapa 2 — Anti-referencias

Escribe a qué NO se debe parecer esto, en tres listas:
1. **Clichés de la categoría**: lo que hace cada competidor de este nicho (reúne de 3 a 5 patrones de la competencia si el usuario da enlaces o si puedes investigarlos).
2. **Señales de valores por defecto de IA**: de `sumi-design:anti-slop`; nombra las concretas a las que este proyecto está más expuesto.
3. **Exclusiones del registro**: ejecuta `node ${CLAUDE_PLUGIN_ROOT}/skills/design-ledger/scripts/ledger.mjs recent` y descarta las tipografías de display, los tonos de acento y las firmas de composición usados en proyectos recientes.

## Etapa 3 — Tres direcciones divergentes

Genera exactamente tres direcciones. Cada una se define sobre los ejes de `references/divergence-axes.md` (concepto o metáfora, voz tipográfica, estrategia de color, sistema de composición, lenguaje de forma, imagen, personalidad del movimiento, densidad, voz del texto). **Dos direcciones cualesquiera deben diferir en al menos cinco ejes**; renombrar la misma composición con otra paleta no es una dirección.

Cada dirección contiene:
- Un nombre y un concepto de una frase anclado en la marca (una metáfora del mundo del cliente, no del mundo "tech").
- Emparejamiento tipográfico con familias concretas (y por qué encajan), proporción de la escala, y un gesto tipográfico característico.
- Paleta expresada como roles (surface, text, muted, accent, signal) con valores OKLCH y el contraste verificado.
- Sistema de composición y una composición característica para la portada o la pantalla clave.
- Ajustes de los diales de Taste (DESIGN_VARIANCE, MOTION_INTENSITY, VISUAL_DENSITY del 1 al 10) si Taste está instalado.
- Personalidad del movimiento en una línea (por ejemplo "mecánica y precisa: 120–180 ms, ease-out, sin sobrepaso").
- Riesgos: qué podría salir mal con esta dirección para esta audiencia.

La dirección A debería ser la que mejor encaja con el brief; la B debería llevar un eje a un lugar inesperado; la C debería ser la opción audaz que el cliente no habría imaginado. Ninguna puede ser un "promedio seguro".

Preséntalas de forma compacta (una tabla más un párrafo corto por cada una). Si el usuario quiere vistas previas visuales, construye una pequeña vista previa estática por dirección (portada más un bloque de contenido), o entrega las tres a Claude Design mediante `sumi-design:claude-design-bridge`.

## Etapa 4 — Elegir y refinar

El usuario elige (o combina, con reglas explícitas sobre qué eje viene de dónde). Las contradicciones se resuelven ahora, no durante la implementación.

## Etapa 5 — DESIGN.md

Escribe `DESIGN.md` en la raíz del repo a partir de `${CLAUDE_PLUGIN_ROOT}/templates/DESIGN.md`, siguiendo `sumi-design:design-tokens`. Verifica cada par de texto y fondo con `contrast.mjs`. Después registra el proyecto en el registro (`ledger.mjs add …`).

## Etapa 6 — Construir y después criticar

- Construye las pantallas únicamente desde los tokens (`sumi:css-architecture`). El movimiento sigue `sumi-design:motion` (y las skills de Emil cuando estén instaladas).
- Después de cada pantalla importante, ejecuta `/sumi-design:critique`: el agente `lens-design` más la `critique` y la `audit` de Impeccable cuando estén disponibles. Corrige y después pasa `polish`.
- Toda decisión visual nueva que DESIGN.md no cubra se añade primero a DESIGN.md, y después se usa.

## Reglas

- Nunca empieces a dibujar ni a programar interfaz sin un DESIGN.md (para ediciones pequeñas en un proyecto existente, lee el que ya hay).
- Nunca vayas por defecto: cada elección de tipografía, color, radio y espaciado debe poder rastrearse hasta el brief o hasta DESIGN.md.
- El contenido real le gana al lorem ipsum; diseña con el texto y las imágenes reales del cliente, o con sustitutos realistas.
- La accesibilidad forma parte de la dirección: el contraste, los estilos de foco, los tamaños de objetivo y el movimiento reducido se definen en DESIGN.md, no se añaden después.

## Ejes de divergencia

Las direcciones se definen eligiendo una posición en cada eje. Dos direcciones deben diferir en 5 ejes o más. Las opciones listadas son puntos de partida, no un menú del que tomar el primer elemento.

| # | Eje | Rango de posiciones (ejemplos) |
|---|---|---|
| 1 | **Concepto o metáfora** | Sacado del mundo del cliente: un taller, un archivo, una guía de campo, un resguardo de entrada, un cuaderno de laboratorio, la cartela de una pared de galería, el tablero de un vehículo, una ficha de receta, un mapa |
| 2 | **Voz tipográfica** | Grotesca neutra · humanista cálida · geométrica estricta · neogrotesca condensada · serif de transición · didona de alto contraste · egipcia · con acentos en monoespaciada · script de display usada con mesura · de ejes variables, expresiva |
| 3 | **Escala y jerarquía tipográfica** | Proporción apretada (1.125), discreta · clásica (1.25) · dramática (1.5 o más) con display sobredimensionado · editorial con tamaños mezclados · tamaño uniforme, con la jerarquía solo por peso y color |
| 4 | **Estrategia de color** | Monocromo más una señal · neutros teñidos con acento terroso · duotono · inundación de marca muy saturada · oscuro primero · papel y tinta · color por sección (por capítulos) · paleta fotográfica extraída de la imagen |
| 5 | **Sistema de composición** | Rejilla estricta de 12 columnas · editorial asimétrica · bento modular (solo si se lo gana) · columna única narrativa · pantalla partida · secuencias a sangre completa · capas superpuestas · guiada por índice o lista · lienzo o espacial |
| 6 | **Lenguaje de forma** | Recto, radio 0 · microrradio de 2 a 4 · suave de 12 a 20 · píldora · mezclado por rol · orgánico o de mancha (raro) · esquinas cortadas · bordes finos en lugar de rellenos |
| 7 | **Modelo de profundidad** | Plano con bordes · capas tonales (sin sombras) · una sola elevación suave · sombras duras desplazadas · cristal (solo con un motivo) · textura o grano |
| 8 | **Imagen** | Fotografía de producto sobre color · documental o espontánea · ilustración (propia, con estilo especificado) · solo tipográfica · visualización de datos como pieza principal · 3D o renders (especificados) · material de archivo o escaneos · ninguna |
| 9 | **Personalidad del movimiento** | Quieta (casi nada) · mecánica y precisa · fluida con muelles · cinematográfica, de revelados lentos · juguetona o elástica (con mesura) · narrativa por scroll |
| 10 | **Densidad** | Galería espaciosa · equilibrada · panel o catálogo denso en información |
| 11 | **Voz del texto** | Experta y sin rodeos · cálida y conversacional · técnica y escueta · editorial o literaria · manifiesto rotundo · juguetona |
| 12 | **Elemento característico** | Un recurso memorable y apropiable: un tratamiento tipográfico recurrente, un cursor, una rejilla superpuesta, un sello, una transición entre secciones, un patrón de navegación único, un motivo de datos |

### Comprobaciones de encaje para cada dirección

- ¿El concepto viene del mundo de la marca, y no de "SaaS" o de "tech"?
- ¿Podría un competidor cambiar el logotipo y usarla tal cual? Si la respuesta es sí, no es una dirección.
- ¿El elemento característico es apropiable y repetible a lo largo de las páginas?
- ¿Sobrevive al contenido real (nombres de producto largos, ausencia de fotos, traducciones, tablas densas)?
- ¿Pasan el contraste y la visibilidad del foco en todos sus temas?
- ¿Puede la plataforma implementarla dentro del presupuesto (ajustes de Shopify, editor de WordPress, rendimiento)?
