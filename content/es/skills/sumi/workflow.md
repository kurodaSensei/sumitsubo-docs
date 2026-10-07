---
title: "workflow"
description: "El flujo de trabajo adaptativo de Sumitsubo: cómo ajustar el proceso al tamaño y la incertidumbre de una petición. Niveles (directo, delegado, expediente de funcionalidad), refutar la incertidumbre antes de actuar, el expediente único con criterios de aceptación y evidencia, el presupuesto de ~400 líneas por rebanada, la evaluación de riesgo previa al commit y los PR encadenados. Úsala al inicio de CUALQUIER petición de implementación, al planificar trabajo, cuando una tarea crece, o cuando el usuario diga \"feature\", \"plan\", \"implement\", \"build\", \"migrate\" o \"refactor\"."
source-hash: "f656771b4b53479b"
---

# Flujo de trabajo de Sumitsubo

El proceso debe estar justificado por la petición. Lo pequeño se hace; lo incierto se investiga; lo grande recibe un plan. Nunca apliques un proceso pesado a una tarea ligera, y nunca improvises una tarea grande sin un plan por escrito.

## 1. Clasifica la petición (siempre, en silencio)

| Nivel | Señales | Qué haces |
|---|---|---|
| **T0 Directo** | Un cambio claro, ≤ ~50 líneas, 1–3 archivos, sin preguntas abiertas | Hazlo en el hilo principal. Sin expediente de funcionalidad. Verifica e informa en dos líneas. |
| **T1 Delegado** | Objetivo claro pero varios archivos o un bloque autocontenido (≤ ~400 líneas) | Diagnostica primero en el hilo principal y luego delega la escritura en un subagente con un brief preciso. Verifica tú mismo su resultado. |
| **T2 Funcionalidad** | > ~400 líneas, varias fases, decisiones de arquitectura, migraciones, o cualquier cosa que abarque varias sesiones | Crea un expediente de funcionalidad (sección 3), consigue respuesta a las preguntas abiertas y ejecuta después rebanada por rebanada. |

Reclasifica cuando aprendas algo. Un T0 que resulta tocar autenticación o pagos pasa a ser T1 como mínimo.

## 1b. Ajusta el tamaño antes de planificar (control de alcance)

Tu trabajo es ayudar al usuario a decidir, no usar todas las capacidades. Antes de escribir un plan, compáralo con la **petición literal**:

- ¿El plan superaría las 3 rebanadas, o añadiría subsistemas que el usuario no mencionó (i18n, un pipeline de contenido, rutas de servidor/API, autenticación, un CMS, búsqueda, páginas generadas, un generador de tokens)?
- ¿Existe una versión sensiblemente más simple que satisfaga la petición literal?

Si la respuesta es sí, DETENTE y presenta dos opciones antes de planificar en detalle: **Mínima** (lo que se pidió literalmente) y **Ampliada** (lo que añadirías y por qué), cada una con sus rebanadas, un recuento aproximado de líneas y lo que cuesta en tiempo y revisión. Recomienda una. El usuario elige; registra la elección como una decisión. Un "a lo grande" deliberado del usuario es válido: lo importante es que sea una elección, no una deriva.

Repite este control siempre que el plan crezca durante el trabajo (nueva fase, nuevo subsistema): el crecimiento necesita el visto bueno del usuario, no solo una línea en el registro del proceso.

El peso del proceso sigue la misma regla: los sitios pequeños y los cambios simples reciben T0/T1, una sola revisión `--quick` y ningún expediente de funcionalidad. Un proceso pesado sobre un trabajo ligero es un defecto, no rigor.

## 2. Refuta la incertidumbre antes de actuar

Antes de escribir código para algo no trivial, enumera lo que estás asumiendo e intenta refutar las suposiciones arriesgadas con evidencia: lee el código, comprueba las versiones en los lockfiles, ejecuta las pruebas existentes, consulta la documentación. Solo las incógnitas sin resolver y de nivel de decisión van al usuario.

- Diagnostica en el hilo principal para que el orquestador conserve el contexto que necesita para delegar bien.
- Haz las preguntas en un solo lote, cada una con un valor por defecto recomendado y el compromiso en una línea. Nunca preguntes lo que el repositorio puede responder.
- Si el usuario no está disponible, toma el valor por defecto recomendado y regístralo en "Decisions" en el expediente de funcionalidad.

## 3. El expediente de funcionalidad (solo T2)

Un archivo por funcionalidad en `.sumi/tasks/<yyyy-mm-dd>-<slug>.md`, creado a partir de `${CLAUDE_PLUGIN_ROOT}/templates/feature.md` (o con `/sumi:feature`). Reemplaza los flujos de especificación de varios documentos: un archivo orgánico que crece con el trabajo.

Contiene: el objetivo y el porqué, el alcance y los no-objetivos explícitos (lo que NO debe construirse: tu principal defensa contra el exceso de ingeniería), decisiones, restricciones, fases con tareas, criterios de aceptación, un registro del proceso y evidencia.

Reglas:
- Refleja las tareas en la lista de tareas de la sesión y mantén ambas sincronizadas sobre la marcha.
- Todo criterio de aceptación debe ser comprobable (un comando, una prueba, un valor medible, una captura de pantalla).
- Añade al registro del proceso en cada paso significativo, una o dos líneas cada vez: qué cambió, qué aprendiste, qué sigue. Cualquiera debe poder retomar el trabajo solo con el archivo; es un registro, no un informe.
- La evidencia es obligatoria para marcar una tarea: la salida de una prueba, el resultado de un comando, una cifra de Lighthouse/axe o la ruta de una captura. "Debería funcionar" no es evidencia.
- Establece `status:` en el frontmatter (`active`, `blocked`, `done`). El hook de inicio de sesión muestra los expedientes activos.

## 4. Presupuesto de líneas: casas pequeñas, no torres Eiffel

Antes de implementar una rebanada, estima su tamaño en líneas modificadas. El presupuesto es de ~400 líneas modificadas por rebanada: el rango en el que la revisión sigue siendo eficaz.

- Si te pasas del presupuesto: divide en rebanadas que dejen cada una el código funcionando y se puedan revisar de forma independiente. Cada rebanada = un commit (o un PR en equipos).
- Trabaja dentro del presupuesto como una restricción, no como una sugerencia: la mejor solución que quepa, no la más impresionante. Superarlo exige una justificación escrita de una línea en el expediente de funcionalidad. Cuando recortes alcance para ajustarte, marca cada juntura con una nota `ponytail:` (`sumi:code-quality`) en lugar de construir a medias la extensión.
- Los archivos generados, los lockfiles y los snapshots no cuentan.

## 5. Briefs de delegación

Enruta por rol (`sumi:model-routing`): hechos → `sumi:scout`, decisiones → `sumi:architect`, implementación → `sumi:builder`, pasando el `model` del perfil del proyecto en cada llamada.

Un subagente empieza sin ningún contexto. Cada brief contiene: el objetivo, los archivos/rutas exactos, las restricciones y convenciones que se aplican (nombra las skills), la comprobación de aceptación que debe ejecutar y el resultado que esperas recibir (resumen del diff + evidencia). Prefiere un subagente bien instruido a varios vagos. Ejecuta en paralelo los subagentes independientes.

## 6. Evaluación de riesgo previa al commit

Antes de cada commit, clasifica el cambio:

| Riesgo | Desencadenantes típicos | Revisión |
|---|---|---|
| **Bajo** | Texto, documentación, estilos aislados en un componente, pruebas | Autocomprobación contra la Lista de verificación |
| **Medio** | Componente o módulo nuevo, cambios de dependencias o de configuración, utilidades compartidas, enrutamiento | `/sumi:review` al final de la rebanada (1–2 lentes) |
| **Alto** | Autenticación, pagos, permisos, modelo de datos o migraciones, reglas de seguridad, capas de caché, cualquier cosa irreversible | `/sumi:review` con todas las lentes pertinentes antes del commit; pregunta al usuario antes de las acciones irreversibles |

Revisa por rebanada, no por microtarea, y nunca varias rebanadas a la vez: si un rango supera ~1.5× el presupuesto de líneas, revísalo rebanada por rebanada (`/sumi:review` lo hace cumplir).

## 7. Entrega

- Commits: Conventional Commits, en imperativo, en inglés, una sola preocupación por commit.
- Si una funcionalidad excede una unidad revisable, planifica **PR encadenados**: cada PR se apoya en el anterior y termina en un PR final de seguimiento que se fusiona en main; o, para trabajo pequeño y ágil, cada rebanada se fusiona en main de forma independiente. Registra la elección en el expediente de funcionalidad.
- Usa `/sumi:ship` para ejecutar las comprobaciones finales y redactar la descripción del PR.

## Compañeras (instaladas como dependencias de `sumi`)

Sumitsubo es dueño del proceso (niveles, expediente de funcionalidad, presupuestos, revisiones). Las skills compañeras se invocan en momentos concretos; nunca reemplazan la decisión del nivel.

| Momento | Skill compañera | Cómo la usa Sumitsubo |
|---|---|---|
| Cualquier error, prueba fallida o comportamiento inesperado | `systematic-debugging` (superpowers-debugging) | Causa raíz antes de cualquier corrección; la corrección es entonces un cambio T0/T1 normal con una prueba de regresión |
| Implementar lógica con ramas, o cualquier corrección de un error | `test-driven-development` (superpowers-tdd) | Escribe primero la prueba que falla cuando el proyecto tenga un ejecutor de pruebas; la prueba en verde es la evidencia de la tarea |
| Antes de marcar una tarea, cerrar una rebanada o decir "terminado" | `verification-before-completion` (superpowers-verification) | Ejecuta las comprobaciones y pega la evidencia; coincide con "terminado significa verificado" |
| Subagentes en paralelo o experimentos arriesgados | `using-git-worktrees` (superpowers-worktrees) | Un worktree por rebanada paralela para que los agentes no choquen |
| Procesar los hallazgos de las lentes de `/sumi:review` | `receiving-code-review` (superpowers-review-intake) | Verifica cada hallazgo contra el código antes de aplicarlo; rebate los que sean erróneos |
| Todo cambio | `ponytail` | Primero la solución mínima; junturas marcadas con notas `ponytail:` (véase `sumi:code-quality`) |

Deliberadamente NO se incluyen de superpowers: su arranque de sesión, la lluvia de ideas, escribir y ejecutar planes, el desarrollo dirigido por subagentes y el cierre de ramas. Los niveles de Sumitsubo, el expediente de funcionalidad, `/sumi:review` y `/sumi:ship` los cubren, y dos flujos de trabajo en competencia dentro de una misma sesión degradan a ambos.

## Antipatrones

- Crear un expediente de funcionalidad para una corrección de una línea, u omitirlo para una migración.
- Delegar antes de diagnosticar (el subagente vuelve a descubrirlo todo, y mal).
- Preguntar al usuario cosas que responde la base de código.
- Marcar tareas sin evidencia; "terminado" con pruebas fallidas o sin ejecutar.
- Desvío de alcance: refactorizar código adyacente sobre el que nadie preguntó. Anótalo mejor en "Follow-ups".
