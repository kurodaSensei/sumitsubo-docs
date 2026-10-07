---
title: "model-routing"
description: "El enrutamiento de modelos de Sumitsubo: qué modelo hace qué trabajo (Haiku para explorar, Sonnet para construir y revisar, Opus para decidir), los perfiles balanced / economy / performance en .sumi/config.json, cómo pasar el modelo en cada delegación y el modelo de sesión recomendado. Úsala siempre que delegues en un subagente, ejecutes revisiones, elijas cómo abordar una tarea, o cuando el usuario mencione tokens, coste, límites, velocidad o modelos."
source-hash: "d126bf3aa51b64ca"
---

# Enrutamiento de modelos

Gasta razonamiento caro solo donde cambie el resultado. Los hechos son baratos, la implementación tiene un precio medio, las decisiones son caras.

## Roles

| Rol | Agente | Trabajo típico |
|---|---|---|
| **scout** | `sumi:scout` | Encontrar archivos, mapear la estructura, leer versiones y documentación, resumir. Solo lectura |
| **builder** | `sumi:builder` | Implementar una tarea o rebanada con su brief, escribir pruebas, ejecutar las comprobaciones |
| **architect** | `sumi:architect` | Arquitectura, modelo de datos, migraciones, diseño de seguridad, dividir en rebanadas una funcionalidad grande, compromisos |
| **lens** | `sumi:lens-correctness`, `lens-a11y`, `lens-performance`, `sumi-design:lens-design` | Revisiones de rebanadas de riesgo medio |
| **lens-high** | `lens-correctness` + `sumi:lens-security` (+ una más como máximo) | Revisiones de rebanadas de riesgo alto |

## Perfiles (`.sumi/config.json` → `"modelProfile"`)

| Rol | `balanced` (por defecto) | `economy` | `performance` |
|---|---|---|---|
| scout | haiku | haiku | sonnet |
| builder | sonnet | sonnet | sonnet |
| architect | opus | sonnet | opus |
| lens | sonnet | haiku | sonnet |
| lens-high | opus | sonnet | opus |
| **Sesión (orquestador)** | `opusplan` | `sonnet` | `opus` |

- `balanced`: el perfil por defecto. Opus solo para decisiones y revisiones de alto riesgo.
- `economy`: proyectos pequeños, límites de plan ajustados o mantenimiento rutinario.
- `performance`: trabajo complejo o de alto riesgo donde la calidad pesa más que el coste. Con mucho Opus: úsalo para una funcionalidad concreta y luego vuelve al perfil anterior.

El frontmatter de los agentes contiene los valores de `balanced`. Para los demás perfiles, **pasa `model` de forma explícita en cada delegación** (el valor de cada llamada anula el frontmatter del agente). Lee el perfil de `.sumi/config.json` una vez por sesión; usa `balanced` por defecto si no existe.

## Reglas de enrutamiento para el orquestador

1. **¿Necesitas hechos?** Envía un scout. Nunca gastes el modelo de sesión en buscar o leer muchos archivos. Varias preguntas independientes → varios scouts en paralelo.
2. **¿Necesitas una decisión cara de deshacer?** Envía al architect con los hechos que reunieron los scouts. Registra su decisión en el expediente de funcionalidad.
3. **¿Necesitas código?** El trabajo T0 se queda en la sesión. Las tareas T1/T2 van a un builder con un brief completo (`sumi:workflow` §5).
4. **¿Necesitas revisión?** Lentes según `/sumi:review` (como máximo 3, cada una sobre un diff congelado y con un presupuesto de herramientas), con los modelos de `lens` o `lens-high` según el riesgo. Los cambios rutinarios usan `--quick` (una lente con el modelo del scout).
5. **La dirección de diseño** (`/sumi-design:direction`) es una decisión: ejecútala en la sesión con el modelo de nivel architect del perfil (en `balanced`, el modo de planificación bajo `opusplan` usa Opus).
6. Sube un nivel cuando un modelo más barato falle dos veces en la misma tarea; anótalo en el registro del proceso. No subas de forma preventiva.

## Modelo de sesión

Configúralo por proyecto en `.claude/settings.json` (`"model": "opusplan"`), con `/model opusplan` dentro de una sesión, o mediante `/sumi:models <profile>`, que actualiza tanto el perfil como el ajuste del proyecto. Bajo `opusplan`, la planificación en modo de planificación corre en Opus y la ejecución en Sonnet.

## Evidencia de ahorro

Cuando se cierre una funcionalidad, añade a su registro del proceso un resumen de una línea de las delegaciones por rol (p. ej., "scouts 9, builders 4, architect 1, lenses 5") para poder comparar los perfiles entre proyectos.
