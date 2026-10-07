---
title: "claude-design-bridge"
description: "Entrega una dirección de diseño de Sumitsubo a Claude Design (la superficie de diseño visual de la app de Claude) o a otras herramientas, para que el resultado siga DESIGN.md en vez de los valores genéricos por defecto: produce un brief de sistema de diseño y prompts pantalla por pantalla con anti-referencias explícitas. Úsala cuando el usuario quiera diseñar o maquetar pantallas en Claude Design, Figma u otra herramienta visual, o cuando quiera convertir las tres direcciones en vistas previas visuales."
source-hash: "70fbc99514571120"
---

# Puente con Claude Design

Claude Design no carga los plugins de Claude Code, así que la dirección tiene que viajar como texto. Sin ella, la herramienta de diseño rellena los huecos con promedios. Esta skill escribe el paquete que transporta la dirección.

## Salida: `design/claude-design-brief.md`

Genéralo a partir de `design/brief.md` y `DESIGN.md` (o de una de las tres direcciones, si hacen falta vistas previas). Secciones:

1. **Contexto** (5 líneas): cliente, audiencia, tarea principal, restricciones de plataforma.
2. **Dirección**: concepto, tensiones de marca, elemento característico, personalidad del movimiento.
3. **Especificación del sistema de diseño**: copia los valores exactos, nunca los parafrasees. Familias tipográficas con sus pesos y su escala, roles de color con OKLCH o hexadecimal, escala de espaciado, radios por rol, modelo de profundidad, set de iconos y reglas de imagen. Esto es lo que hay que usar al crear un Design System en Claude Design para el cliente.
4. **No usar** (anti-referencias): los clichés de la categoría, las señales de valores por defecto de IA más probables en este proyecto (de `sumi-design:anti-slop`) y las exclusiones del registro, redactadas como prohibiciones explícitas ("Nada de portada centrada con insignia en píldora", "Nada de degradados morados o azules", "Nada de Inter").
5. **Pantallas**: un bloque de prompt por pantalla — propósito, contenido real (titulares, nombres de producto y datos de verdad), componentes necesarios, el único punto focal, estados a mostrar (vacío, error, carga, donde corresponda) y puntos de ruptura (primero móvil).
6. **Aceptación**: contrastes mínimos, visibilidad del foco, tamaño de los objetivos táctiles, y "todos los valores deben salir de la sección 3".

## Flujo de trabajo

1. Si el cliente todavía no tiene un Design System en Claude Design, el usuario crea uno primero a partir de la sección 3; los diseños parten de ahí.
2. Pega un prompt de pantalla cada vez, y revisa cada resultado contra la autoevaluación anti-relleno antes de seguir.
3. Cuando un diseño quede aprobado, impleméntalo en código desde los tokens de DESIGN.md (no midiendo a ojo sobre la maqueta), y actualiza DESIGN.md con cualquier decisión nueva que el diseño haya introducido.
4. Para las vistas previas de dirección: produce tres briefs breves (uno por dirección) con el mismo prompt de pantalla, para que la comparación aísle la dirección.

## Reglas de los prompts

- Sustantivos y números concretos antes que adjetivos ("Fraunces 600 a 64/68, tracking -1%", no "una serif elegante").
- Texto real, nunca lorem ipsum.
- Un solo punto focal por pantalla, nombrado.
- Declara el elemento característico y dónde aparece.
