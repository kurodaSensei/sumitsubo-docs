---
title: "/sumi:ship"
description: "Control final antes del PR: verifica los chequeos, el recibo de revisión y los criterios de aceptación, y después redacta los commits y la descripción del PR (único o encadenado)."
source-hash: "54ce5abb2e5fda41"
---

Funcionalidad: $ARGUMENTS (por defecto: el único archivo `active` en `.sumi/tasks/`).

1. **Guarda de rama.** Confirma que estás en una rama de funcionalidad, no en una rama protegida de `.sumi/config.json`.
2. **Chequeos.** Ejecuta la comprobación de tipos, el lint, las pruebas y la compilación con los comandos del proyecto. Pega los resultados resumidos. Cualquier fallo detiene el envío.
3. **Recibo.** Para el trabajo de riesgo medio o alto tiene que haber en `.sumi/reviews/` un recibo quemado y aprobado que cubra el HEAD actual. Si no lo hay, ejecuta antes `/sumi:review`.
4. **Criterios de aceptación.** Recorre los criterios del expediente de funcionalidad; cada uno necesita evidencia en la sección de evidencia. Enumera los que falten y detente, salvo que el usuario acepte el hueco de forma explícita (regístralo).
5. **Commits.** Asegúrate de que sigan Conventional Commits, con una sola preocupación cada uno. Sugiere fusiones o reescrituras de mensaje si el historial está desordenado (no reescribas historial ya publicado sin preguntar).
6. **Simplificaciones deliberadas.** Reúne las notas `ponytail:` añadidas en el diff (`git diff <base>...HEAD | grep '^+.*ponytail:'`) y enuméralas en el PR bajo "Deliberate simplifications", con su archivo y su disparador. Enumera también las notas retiradas (su disparador ocurrió).
7. **Borrador del PR.** Rellena `${CLAUDE_PLUGIN_ROOT}/templates/pull-request.md` a partir del expediente y del recibo (evidencia, riesgo, reversión). Para `delivery: chained-prs`, redacta una descripción por rebanada con los enlaces de la cadena, más una descripción final de PR de seguimiento.
8. No hagas push ni abras el PR tú mismo salvo que el usuario lo pida; dale los comandos exactos (`git push -u origin <branch>`, `gh pr create --fill` o el archivo del cuerpo).
9. Actualiza el expediente de funcionalidad: estado, entrada en el registro de proceso y seguimientos.
