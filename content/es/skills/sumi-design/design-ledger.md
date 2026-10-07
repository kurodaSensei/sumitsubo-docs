---
title: "design-ledger"
description: "Memoria de diseño entre proyectos que evita que te repitas de un cliente a otro: registra las tipografías, el tono de acento, la firma de composición, el lenguaje de forma y el elemento característico de cada proyecto en ~/.sumi/design-ledger.json, y contrasta las direcciones nuevas contra el trabajo reciente. Úsala durante la dirección de diseño (anti-referencias), antes de cerrar DESIGN.md, después de aprobar la dirección de un proyecto, o cuando el usuario pregunte \"qué he usado antes\"."
source-hash: "d65ed5d6c8548192"
---

# Registro de diseño

Ser distinto a lo largo de un portafolio independiente exige memoria. El registro vive fuera de cualquier repo, en `~/.sumi/design-ledger.json` (puedes cambiarlo con `SUMI_LEDGER`), de modo que abarca a todos los clientes. Guarda únicamente decisiones de diseño: nunca secretos del cliente ni datos personales.

## Comandos

```bash
L="node ${CLAUDE_PLUGIN_ROOT}/skills/design-ledger/scripts/ledger.mjs"

$L recent [n]            # last n projects (default 6) — use in anti-references
$L check --project "New Client" --display "Fraunces" --fonts "Fraunces,Work Sans" --hue 28 --chroma 0.12 \
       --layout "asymmetric-editorial" --shape "sharp" --signature "…" [--window 6]
                         # exit 2 on collisions with the last <window> projects; shared body fonts are notes only
$L add --project "Acme Coffee" --fonts "Fraunces,Instrument Sans" --hue 28 --chroma 0.12 \
       --palette "oklch(0.32 0.04 40),oklch(0.95 0.02 85)" --layout "asymmetric-editorial" \
       --shape "sharp" --signature "stamp-style section numbers" --direction "Field notebook"
$L list                  # everything
```

## Reglas de uso

- **Etapa 2 de design-direction**: ejecuta `recent` y lleva los resultados a las anti-referencias.
- **Antes de escribir DESIGN.md**: ejecuta `check` con la dirección elegida. Política de colisiones dentro de la ventana:
  - Misma tipografía de **display** → cámbiala (las tipografías de texto pueden repetirse si son neutras y está justificado).
  - Tono de acento dentro de ±15° y croma dentro de ±0.04 (cuando se conocen ambos) → desplázalo o justifícalo (los colores impuestos por la marca quedan exentos; anótalos con `--brand-locked`).
  - Misma firma de composición **y** mismo lenguaje de forma → cambia al menos uno.
  - Mismo elemento característico → cámbialo siempre.
- **Después de la aprobación**: ejecuta `add`. Si la dirección cambia más adelante, vuelve a ejecutar `add` con el mismo nombre de proyecto (reemplaza la entrada).
- Las decisiones impuestas por la marca (tipografía o colores que el cliente ya tiene) se registran con `--brand-locked` y nunca cuentan como colisiones tuyas.
