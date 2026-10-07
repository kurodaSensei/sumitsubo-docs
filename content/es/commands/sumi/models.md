---
title: "/sumi:models"
description: "Muestra o cambia el perfil de modelos de este proyecto (balanced, economy, performance): actualiza .sumi/config.json y, con tu visto bueno, el modelo de sesión en .claude/settings.json."
source-hash: "9ca74376f5e8ee7e"
---

Perfil solicitado: $ARGUMENTS

1. Lee `.sumi/config.json` (créalo desde `${CLAUDE_PLUGIN_ROOT}/templates/config.json` si no existe) y la tabla de enrutado de `sumi:model-routing`.
2. **Sin argumento:** muestra el perfil actual, el modelo que usa cada rol bajo ese perfil, y el modelo de sesión actual según `.claude/settings.json` (o "valor por defecto de la cuenta").
3. **Con argumento:** valida que sea `balanced`, `economy` o `performance`; escribe `"modelProfile"` en `.sumi/config.json`.
4. Propón el modelo de sesión correspondiente (`opusplan`, `sonnet` u `opus`) para `.claude/settings.json` → `"model"`. Pregunta una sola vez antes de escribirlo (afecta a todo el que abra este repo con Claude Code si el archivo está versionado; sugiere `.claude/settings.local.json` para un ajuste solo personal). Nunca toques otras claves de esos archivos.
5. Informa de la nueva tabla de enrutado y recuerda que el cambio de modelo de sesión se aplica a las sesiones nuevas (o que se puede ejecutar `/model <name>` ahora).
