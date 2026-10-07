---
title: "/sumi:sync"
description: "Actualiza el bloque de CLAUDE.md gestionado por Sumitsubo a la versión instalada del framework, sin tocar nada fuera de los marcadores de Sumitsubo."
source-hash: "ebb4b621de4f2964"
---

1. Lee `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.managed.md` (la versión actual) y el `CLAUDE.md` del proyecto.
2. Localiza el bloque entre `<!-- sumi:begin` y `<!-- sumi:end -->`. Si no existe, dile al usuario que ejecute `/sumi:init` y detente.
3. Conserva los valores de "Project facts" que ya estén rellenados en el bloque existente (stack, gestor de paquetes, comandos) y llévalos a la plantilla nueva.
4. Reemplaza únicamente el contenido entre los marcadores (marcadores incluidos). Todo lo que está encima y debajo queda byte a byte idéntico.
5. Guarda para el informe un resumen breve del diff de lo que cambió dentro del bloque gestionado, y la transición de versión (por ejemplo v0.1.0 → v0.2.0).
6. Contrasta `.sumi/config.json` con `${CLAUDE_PLUGIN_ROOT}/templates/config.json`: añade las claves que falten con sus valores por defecto; nunca sobrescribas valores existentes.
7. **Informa** siguiendo `sumi:output`. Asunto: la transición de versión. Cuerpo: el resumen del diff del paso 5 y las claves de configuración añadidas en el paso 6 — pon `n/a` cuando alguna esté vacía, en vez de omitir la fila. Siguiente paso: ninguno si no cambió nada; en caso contrario, revisar el bloque gestionado.
