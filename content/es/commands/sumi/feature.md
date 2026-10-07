---
title: "/sumi:feature"
description: "Empieza (o retoma) una funcionalidad T2: explora, refuta la incertidumbre, haz las preguntas de nivel decisión, estima líneas y rebanadas, y escribe el expediente único en .sumi/tasks/."
source-hash: "23962214354ee783"
---

Petición: $ARGUMENTS

Sigue `sumi:workflow`.

**Si el argumento empieza por `resume`:** abre el `.sumi/tasks/*.md` correspondiente, lee el registro de proceso y las tareas sin marcar, reconstruye desde ahí la lista de tareas, resume en tres líneas dónde está todo, y continúa con la siguiente tarea.

**Si no:**
1. **Explora** con agentes `sumi:scout` en paralelo (modelo barato) en lugar de leerlo todo dentro de la sesión. Explora primero el código relevante (estructura, patrones existentes, versiones en el archivo de bloqueo, pruebas). Investiga la documentación actual de cualquier cosa sensible a la versión.
2. **Comprobación de alcance** (`sumi:workflow` §1b): si el plan se saliera de la petición literal (más de 3 rebanadas o subsistemas que nadie pidió), presenta Mínimo frente a Extendido con sus costes y deja que el usuario elija antes de seguir.
3. **Refuta la incertidumbre**: enumera los supuestos; verifica con evidencia cada uno que puedas. Conserva solo las incógnitas de nivel decisión.
4. **Pregunta** lo que quede en un único bloque (de opción múltiple cuando se pueda), cada pregunta con un valor por defecto recomendado y su compromiso. Si el usuario no está, toma los valores por defecto y regístralos como decisiones.
5. **Decide y estima**: para las decisiones de arquitectura, modelo de datos o migración, consulta a `sumi:architect` (con los hechos que trajeron los scouts) y registra su decisión. Estima las líneas cambiadas por fase. Si el total supera el presupuesto de líneas de `.sumi/config.json` (400 por defecto), divídelo en rebanadas que dejen el código funcionando cada una; propón un PR único, PRs encadenados o rebanadas directas a main.
6. **Escribe** `.sumi/tasks/<yyyy-mm-dd>-<slug>.md` a partir de `${CLAUDE_PLUGIN_ROOT}/templates/feature.md`: objetivo, por qué, alcance, no-objetivos, restricciones, decisiones, tareas por fases, criterios de aceptación verificables (incluye siempre los de accesibilidad y rendimiento) y la primera entrada del registro de proceso.
7. Refleja las tareas en la lista de tareas. Presenta el plan brevemente y empieza por la primera rebanada, salvo que el cambio sea de alto riesgo o irreversible: entonces espera luz verde.
