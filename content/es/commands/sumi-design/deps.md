---
title: "/sumi-design:deps"
description: "Verifica que los plugins acompañantes que Sumitsubo orquesta estén instalados y activados, y encuentra copias duplicadas que hayan quedado sueltas (skills sueltas o de otros marketplaces) y que convenga eliminar."
source-hash: "5c8b887bd52abde2"
---

Los acompañantes están declarados como dependencias de `sumi` y de `sumi-design`, así que instalar esos plugins los instala. Este comando comprueba el resultado y despeja el terreno.

1. **Acompañantes esperados** (todos del marketplace `sumitsubo`, referenciados desde su origen):
   - Con `sumi`: `ponytail`, `superpowers-debugging`, `superpowers-tdd`, `superpowers-verification`, `superpowers-worktrees`, `superpowers-review-intake`.
   - Con `sumi-design`: `impeccable`, `taste`, `taste-minimalist`, `taste-brutalist`, `taste-soft`, `taste-redesign`, `emil-design-eng`, `emil-review-animations`, `emil-animation-vocabulary`.
2. **Comprueba** con `claude plugin list`: cada uno debe estar instalado y activado desde `@sumitsubo`. Ofrece `claude plugin install <name>@sumitsubo` para los que falten (pregunta antes de ejecutarlo).
3. **Busca duplicados** que puedan competir con ellos o taparlos:
   - Los mismos proyectos instalados desde otros marketplaces (`impeccable@impeccable`, `ponytail@ponytail`, `superpowers@claude-plugins-official`).
   - Copias sueltas en `~/.claude/skills/` o `.claude/skills/` (carpetas o enlaces simbólicos a `~/.agents/skills/`) con nombres como los de los acompañantes (`design-taste-frontend`, `minimalist-ui`, `industrial-brutalist-ui`, `high-end-visual-design`, `redesign-existing-projects`, `emil-design-eng`, `review-animations`, `animation-vocabulary`, `impeccable`), y agentes `impeccable-*` sueltos en `~/.claude/agents/`.
   - Plugins de flujo de trabajo que inyecten una metodología rival al arrancar la sesión (por ejemplo el plugin completo de superpowers) o una voz de diseño rival (`frontend-design`).
4. **Informa** siguiendo `sumi:output`. Asunto: el número de compañeros, presentes sobre esperados. Cuerpo: una tabla de elemento · dónde · recomendación, con los comandos exactos — `claude plugin uninstall <name>@<marketplace>`, `claude plugin marketplace remove <name>`, y el `mv` de las skills sueltas a una carpeta de archivo, nunca un borrado. Siguiente paso: el único comando que arregla la fila más importante. No ejecutes nada destructivo sin el visto bueno explícito del usuario.
5. Recuérdale al usuario que reinicie Claude Code después de los cambios.
