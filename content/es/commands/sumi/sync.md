---
title: "/sumi:sync"
description: "Actualiza el bloque de CLAUDE.md gestionado por Sumitsubo a la versión instalada del framework, sin tocar nada fuera de los marcadores de Sumitsubo."
source-hash: "79d560ea02d76e02"
---

1. Lee `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.managed.md` (la versión actual) y el `CLAUDE.md` del proyecto.
2. Localiza el bloque entre `<!-- sumi:begin` y `<!-- sumi:end -->`. Si no existe, dile al usuario que ejecute `/sumi:init` y detente.
3. Conserva los valores de "Project facts" que ya estén rellenados en el bloque existente (stack, gestor de paquetes, comandos) y llévalos a la plantilla nueva.
4. Reemplaza únicamente el contenido entre los marcadores (marcadores incluidos). Todo lo que está encima y debajo queda byte a byte idéntico.
5. Muestra un resumen breve del diff de lo que cambió en el bloque gestionado y la transición de versión (por ejemplo v0.1.0 → v0.2.0).
6. Contrasta `.sumi/config.json` con `${CLAUDE_PLUGIN_ROOT}/templates/config.json`: añade las claves que falten con sus valores por defecto; nunca sobrescribas valores existentes. Informa de las claves añadidas.
