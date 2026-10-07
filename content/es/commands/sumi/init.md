---
title: "/sumi:init"
description: "Instala Sumitsubo en el proyecto actual: detecta el stack y los comandos, escribe el bloque gestionado de CLAUDE.md, crea .sumi/ (config, tasks, reviews) y recomienda los plugins de stack y de diseño."
source-hash: "97c0430e55b5c864"
---

Inicializa el framework Sumitsubo en este repositorio. Argumentos (sustitución opcional del stack): $ARGUMENTS

1. **Detecta** (leyendo, sin adivinar):
   - El stack a partir de los archivos: `nuxt.config.*` → nuxt; `next.config.*` o `app/layout.tsx` → react/next; `config/settings_schema.json` más `sections/` → shopify; `style.css` con `Theme Name:`, `functions.php` o `theme.json` → wordpress; `firebase.json` o `firestore.rules` → firebase.
   - El gestor de paquetes a partir del archivo de bloqueo (pnpm-lock.yaml, package-lock.json, yarn.lock, bun.lock).
   - Los comandos a partir de los scripts de `package.json` (dev, build, test, lint, typecheck) o de las CLI de la plataforma (shopify theme dev, wp-env).
2. **Crea `.sumi/`** si no existe: copia `${CLAUDE_PLUGIN_ROOT}/templates/config.json` a `.sumi/config.json` con el `stack` detectado; crea `.sumi/tasks/` y `.sumi/reviews/` (con un `.gitkeep`). Pregunta una sola vez al usuario si `.sumi/` debe versionarse (recomendado en repos de equipo o de cliente, para que los expedientes viajen con el código) o quedarse en local (añadiéndolo a `.git/info/exclude`).
3. **CLAUDE.md**: lee `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.managed.md`, rellena los marcadores `{{…}}` con los hechos detectados, y después:
   - Si `CLAUDE.md` tiene un bloque `<!-- sumi:begin` … `<!-- sumi:end -->`, reemplaza solo ese bloque.
   - Si no, inserta el bloque al principio, conservando todo lo demás tal cual.
   - Nunca borres ni reescribas contenido del usuario fuera de los marcadores.
4. **Recomienda plugins** según lo detectado (solo los que no estén ya activados): `sumi-nuxt`, `sumi-react`, `sumi-shopify`, `sumi-wordpress`, y `sumi-design` para cualquier proyecto con interfaz. Muestra los comandos exactos `/plugin install <name>@sumitsubo`.
5. **Modelos**: pon `modelProfile` en `balanced` salvo que el usuario pida otro perfil explícitamente (`economy` para sitios pequeños o límites de plan ajustados; `performance` solo si lo pide, porque tira mucho de Opus). Después, con una sola confirmación, escribe `"model": "opusplan"` (o el modelo de sesión del perfil) en `.claude/settings.local.json` (personal, sin versionar), creando el archivo si hace falta y sin tocar nunca otras claves.
   Las carpetas generadas que produzca el proyecto (por ejemplo un paso de compilación de contenido) van a `review.exclude` dentro de `.sumi/config.json`.
6. **Nota sobre la línea de estado**: si Ponytail pide añadir su línea de estado a `~/.claude/settings.json` y la edición queda bloqueada, explica que es opcional y cosmética; la ruta que sugiere incluye un número de versión y se rompería al actualizar.
7. **Informa** en el idioma del usuario: stack detectado, archivos creados o modificados, y el siguiente paso (normalmente `/sumi-design:direction` para proyectos de interfaz nuevos, o `/sumi:feature` para una funcionalidad nueva).
