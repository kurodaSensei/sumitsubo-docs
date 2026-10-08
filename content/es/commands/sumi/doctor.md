---
title: "/sumi:doctor"
description: "Diagnóstico de solo lectura de la instalación de Sumitsubo y de la configuración de este proyecto: origen del marketplace, versiones de los plugins frente a su fuente, compañeros y la configuración propia del proyecto. Informa y señala el comando que arregla cada fila; no cambia nada."
source-hash: "7a470608037c8873"
---

**Este comando nunca escribe.** Todos los demás comandos `/sumi:*` cambian
algo; este solo mira. Si una fila necesita arreglo, nombra el comando que la
arregla y detente. Ese es todo el contrato: un diagnóstico del que no te puedes
fiar para que no toque nada es un diagnóstico que dudas en ejecutar.

1. **Instalación.** `claude plugin list --json` y `claude plugin marketplace list --json`.
   Los dos devuelven arrays. Para cada entrada cuyo `id` termine en
   `@sumitsubo`, lee `version`, `enabled`, `scope` y —cuando estén— `folderVersion`
   y `readFromFolder`.

2. **Origen del marketplace.** De la lista de marketplaces, busca la entrada
   `sumitsubo` e informa de su `source`. `directory` significa que está conectado a un
   checkout local, así que las ediciones de ahí van en vivo y
   `claude plugin marketplace update sumitsubo` es lo que las republica;
   `github` significa que sigue al repo publicado. Ninguno de los dos está mal,
   pero cuál sea gobierna todas las demás filas, y nada en el flujo normal lo
   muestra nunca.

3. **Desfase de versión.** Un plugin cuya `version` va por detrás de su
   `folderVersion` corre desde una copia en caché más vieja que la fuente que
   lee. Los skills y comandos añadidos desde entonces simplemente no están en la
   sesión, sin error y sin señal. Enumera cada uno como `behind`, con los dos
   números, y da el único comando que los arregla todos:
   `claude plugin marketplace update sumitsubo`, seguido de un reinicio.

4. **Activación.** Informa de cualquier plugin `@sumitsubo` instalado pero con
   `enabled: false`, con `claude plugin enable <name>@sumitsubo`. Menciona la
   forma esperada en vez de un número fijo: los dos plugins del núcleo, los
   stack packs que el proyecto necesite, y los compañeros que estos arrastran
   como dependencias.

5. **Compañeros.** No vuelvas a deducir lo que `/sumi-design:deps` ya hace. Di
   cuántos compañeros `@sumitsubo` están instalados y activos y, si algo se ve
   mal, señala `/sumi-design:deps`.

   `check-companions.mjs` los resuelve contra sus repos de origen, pero vive en
   el repositorio del framework y NO se empaqueta dentro del plugin: en una
   instalación normal no hay ningún directorio `scripts/` desde el que
   ejecutarlo. Así que sugiérelo solo si el paso 2 encontró que el marketplace
   es un checkout local, y construye la ruta a partir del `installLocation` de
   esa entrada, nunca a partir de `${CLAUDE_PLUGIN_ROOT}`. En caso contrario di
   que la comprobación de origen no está disponible desde una copia instalada y
   sigue. Es además la única comprobación que necesita red, así que no la
   ejecutes nunca sin que te la pidan.

6. **Este proyecto.** Solo si el directorio de trabajo es un proyecto y no el
   repositorio del framework:
   - `.sumi/config.json`: ¿está? `stack`, `modelProfile` y el presupuesto de
     líneas; cualquier clave que falte frente a
     `${CLAUDE_PLUGIN_ROOT}/templates/config.json`.
   - `CLAUDE.md`: ¿hay un bloque `sumi:begin` / `sumi:end`, y su versión coincide
     con la de la plantilla actual? Si no está, `/sumi:init`; si va por detrás,
     `/sumi:sync`.
   - `.sumi/tasks/`: expedientes de funcionalidad activos, y `.sumi/reviews/`:
     si el recibo más reciente está quemado.
   Di claramente cuándo el directorio es el propio repositorio del framework y
   estas filas no aplican, en vez de informarlas como ausentes.

7. **Informa** siguiendo `sumi:output`. Asunto: el origen del marketplace y el
   número de plugins. Resultado: cuántas filas requieren atención, o que todo
   está al día. Cuerpo: una única tabla de área · estado · arreglo, conservando
   las filas `ok` — parte del valor de un diagnóstico está en lo que descarta.
   Siguiente paso: el único comando que resuelve más filas, normalmente la
   actualización del marketplace.

Informa una fila como `ok` solo cuando tengas la salida que lo demuestra.
Cualquier cosa que no hayas podido leer es `unknown`, nunca `ok`.
