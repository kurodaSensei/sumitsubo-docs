---
title: "/sumi:review"
description: "Revisión con recibo de la rebanada actual: dimensiona el riesgo, congela el diff y los chequeos una sola vez, ejecuta solo las lentes que el riesgo exige (nunca todas), cada una con un presupuesto estricto, consolida los hallazgos y emite un recibo de revisión."
source-hash: "ff33fbc4eb42c789"
---

Objetivo de la revisión: $ARGUMENTS

El orquestador hace UNA SOLA VEZ el trabajo compartido caro (diff, chequeos) y las lentes solo juzgan. Las lentes nunca vuelven a descubrir el proyecto.

1. **Rango y tamaño.** Determina el rango (el argumento; si no, desde el último recibo aprobado en `.sumi/reviews/`; si no, `git merge-base HEAD <main>`). Cuenta las líneas cambiadas excluyendo los patrones de `review.exclude` de `.sumi/config.json` (por defecto: archivos de bloqueo, `node_modules/`, `dist/`, `.nuxt/`, `.output/`, `.next/`, la salida de compilación y cualquier carpeta generada que figure ahí).
   - Si las líneas contadas superan 1,5 × `lineBudget` (600 por defecto), el rango abarca varias rebanadas. Detente y propón revisar rebanada por rebanada (un recibo por rebanada o por grupo de commits): revisar 2.000 líneas de golpe es lento, caro y superficial. Continúa como una sola revisión únicamente si el usuario lo pide de forma explícita.
2. **Congela una sola vez.** Escribe, para el identificador de recibo `<yyyy-mm-dd>-<shortsha>`:
   - `.sumi/reviews/<id>.diff` — `git diff -U5 <range> -- . ':(exclude)<each exclude glob>'`.
   - `.sumi/reviews/<id>.checks.txt` — la salida de los comandos de comprobación de tipos, lint, pruebas y compilación del proyecto, ejecutados una única vez aquí. Las lentes leen ese archivo; nunca ejecutan compilaciones ni instalaciones por su cuenta.
3. **Linaje.** De 5 a 10 líneas de hechos: qué cambió, por qué (la tarea del expediente), qué archivos y qué queda fuera de alcance. Sin defender la implementación.
4. **Riesgo y lentes** (`sumi:workflow` §6). Tope duro: `review.maxLenses` (3 por defecto).
   - **Bajo** → ninguna lente; recorre tú mismo las listas de verificación.
   - **Medio** → solo `lens-correctness`, más como mucho UNA adicional si el diff claramente la pide (`lens-a11y` para interfaz interactiva nueva, `lens-performance` para dependencias nuevas, carga de datos o recursos pesados).
   - **Alto** → `lens-correctness` más `lens-security`, más como mucho UNA de accesibilidad o rendimiento, la que más toque el diff.
   - La calidad visual NO se revisa aquí: eso es `/sumi-design:critique`, que se ejecuta sobre pantallas, no sobre diffs.
   - `--quick` → una sola `lens-correctness` con el modelo `scout` del perfil; para cambios pequeños o rutinarios.
   - `--all-lenses` → todas las lentes aplicables; solo cuando el usuario lo pida.
5. **Ejecuta las lentes en paralelo**, cada una con el modelo que indique `sumi:model-routing` (`lens` para riesgo medio, `lens-high` para alto). Dale a cada una ÚNICAMENTE: las rutas de los archivos `.diff` y `.checks.txt`, el linaje, la raíz del proyecto y los presupuestos relevantes. Nunca le pases tu razonamiento ni la conversación.
6. **Consolida.** Elimina duplicados, verifica tú mismo cada bloqueante y cada major contra el código (descarta lo que puedas refutar, y dilo), y ordena por severidad. Usa el acompañante de recepción de revisiones cuando esté disponible.
7. **Recibo.** `.sumi/reviews/<id>.md`: rango, linaje, lentes ejecutadas (con sus modelos), veredicto y hallazgos con su estado (abierto, corregido, o no se corregirá más el motivo). `approved` solo si no queda ningún bloqueante ni major abierto.
8. **Ciclo de corrección.** Corrige los bloqueantes y los majors dentro de la misma rebanada; vuelve a ejecutar SOLO las lentes que los levantaron, y solo sobre el diff nuevo. Cuando quede aprobado, pon `burned: true` con el sha del commit.
9. Informa en el idioma del usuario: veredicto, correcciones, detalles menores que quedan, y el coste de las lentes (lentes × modelo) para que el usuario vea en qué se gastó la revisión.
