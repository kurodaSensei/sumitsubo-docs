---
title: "/sumi-design:direction"
description: "Ejecuta el proceso completo de dirección creativa: brief, anti-referencias, consulta al registro, tres direcciones divergentes, selección, DESIGN.md y entrada en el registro."
source-hash: "bb6abe8ce375d929"
---

Proyecto y referencias: $ARGUMENTS

Sigue `sumi-design:design-direction` etapa por etapa. Es un comando cargado de decisiones: ejecútalo con el modelo de nivel arquitecto del perfil del proyecto (`sumi:model-routing`), y usa agentes `sumi:scout` para las partes de recopilación de hechos (repo, sitio actual, competidores). No te saltes etapas y no escribas código de interfaz durante este comando.

1. Etapa 0: comprueba qué skills acompañantes están disponibles (Impeccable, Taste, Emil Kowalski). Menciona una sola vez las que falten y continúa.
2. Etapa 1: construye `design/brief.md`. Reúne primero los hechos del repo y de los enlaces que haya; después hazle al usuario las preguntas restantes en un único bloque, con respuestas recomendadas.
3. Etapa 2: anti-referencias, incluyendo `ledger.mjs recent`.
4. Etapa 3: tres direcciones que difieran en 5 ejes o más (`${CLAUDE_PLUGIN_ROOT}/skills/design-direction/references/divergence-axes.md`). Contrasta cada una con el registro (`ledger.mjs check`) y resuelve las colisiones antes de presentarlas.
5. Presenta las direcciones de forma compacta y pide al usuario que elija o combine. Ofrece vistas previas visuales (páginas estáticas pequeñas) o un brief de Claude Design por dirección (`sumi-design:claude-design-bridge`).
6. Después de la elección: escribe `DESIGN.md`, verifica el contraste con `contrast.mjs` (corrige los fallos), registra el proyecto con `ledger.mjs add` y, si Impeccable está instalado, asegúrate de que `PRODUCT.md` refleje el brief.
7. Termina con el siguiente paso: implementar pantallas desde DESIGN.md, o generar `design/claude-design-brief.md`.
