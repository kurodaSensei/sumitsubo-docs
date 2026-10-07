---
title: "/sumi-design:critique"
description: "Critica el trabajo de interfaz contra DESIGN.md y el catálogo anti-relleno usando la lente de diseño sin contexto, más la crítica y la auditoría de Impeccable cuando está instalado; después corrige y pule."
source-hash: "4f9e9ba270fcfc7f"
---

Objetivo: $ARGUMENTS (por defecto: los archivos visuales cambiados desde la base de fusión con la rama principal).

1. Confirma que existe `DESIGN.md`. Si no existe, detente y sugiere `/sumi-design:direction`.
2. Lanza `sumi-design:lens-design` como subagente (con el modelo que indique `sumi:model-routing`: `lens` para pantallas normales, `lens-high` para la portada o un rediseño completo) pasándole ÚNICAMENTE: el objetivo (rango, archivos o rutas), la ruta a `DESIGN.md` y a `design/brief.md`, y la URL de un servidor de desarrollo si hay uno corriendo. No le pases tu propio razonamiento.
3. En paralelo, si Impeccable está instalado, ejecuta su crítica y su auditoría sobre el mismo objetivo; si está instalado `review-animations` de Emil Kowalski y cambió el movimiento, ejecútalo también.
4. Une los hallazgos, verifica tú mismo cada bloqueante y cada major, descarta lo que puedas refutar y ordénalos por severidad.
5. Corrige los bloqueantes y los majors usando solo tokens. Si una corrección necesita un token nuevo, añádelo primero a DESIGN.md.
6. Vuelve a pasar la lente sobre las correcciones. Después, una pasada de pulido (el `polish` de Impeccable si está instalado): alineación, ritmo del espaciado, estados y texto.
7. **Informa** siguiendo `sumi:output`. Asunto: las pantallas o archivos criticados. Cuerpo: una tabla de hallazgos (severidad · dónde · estado), con los detalles menores separados de lo que ya se corrigió. Siguiente paso: lo más grave que siga abierto, o `/sumi:review` cuando la pasada visual esté terminada.


