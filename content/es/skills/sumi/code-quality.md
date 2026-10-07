---
title: "code-quality"
description: "Nivel de calidad de ingeniería para cada cambio de código: las reglas que separan el trabajo senior del relleno de IA. Cubre simplicidad y alcance, nombres, tamaño de funciones y archivos, manejo de errores, comentarios, dependencias, tipos, pruebas, código muerto y verificación. Úsala en toda implementación, refactorización o revisión de código, en cualquier lenguaje o stack, y siempre que el código \"funcione\" pero parezca generado."
source-hash: "a15b7ee8cd406d81"
---

# Calidad del código — sin relleno

Escribe el código que un ingeniero senior querría mantener dentro de dos años. Correcto, pequeño, obvio, verificado.

## Principios

1. **Resuelve el problema planteado.** No su versión general. Sin opciones de configuración, capas de abstracción, sistemas de plugins ni "preparación para el futuro" que nadie pidió. Tres líneas parecidas valen más que una abstracción prematura; extrae a la tercera repetición real.
2. **Lee antes de escribir.** Ajústate a los patrones, los nombres y la estructura que ya tiene el proyecto. Busca una utilidad existente antes de escribir una nueva. Un patrón nuevo necesita una razón.
3. **Nunca inventes APIs.** Si no estás seguro de que una función, opción, filtro o hook exista en la versión instalada, revisa `node_modules`, la versión del lockfile o la documentación oficial. Adivinar es la primera fuente de relleno.
4. **Haz irrepresentables los estados ilegales.** Tipos precisos, uniones discriminadas, enums en lugar de cadenas mágicas, validación en las fronteras (entrada del usuario, red, almacenamiento) y confianza en el interior.
5. **Falla con claridad en el nivel adecuado.** Gestiona los errores donde puedas hacer algo útil (reintentar, alternativa, mensaje al usuario). Si no, déjalos propagarse. Nunca los tragues (`catch {}`), nunca registres y continúes en silencio.
6. **Borra sin miedo.** Elimina el código muerto, los imports sin usar, las banderas obsoletas y los bloques comentados. Git lo recuerda.

## Simplicidad deliberada: notas `ponytail:`

El exceso de ingeniería suele nacer del miedo al futuro. Responde a ese miedo por escrito y no en código: construye la versión simple y deja un comentario `ponytail:` en la juntura.

```ts
// ponytail: single currency (COP) hardcoded; extend when the client sells abroad (add a currency field + Intl.NumberFormat per locale).
```

Formato: `ponytail: <what was simplified>; extend when <concrete trigger> (<how>)`. En la sintaxis de comentarios del archivo (`//`, `#`, `/* */`, `{% comment %}`, `<!-- -->`).

Reglas:
- Úsala siempre que omitas una abstracción, opción, configuración, plugin o generalización que alguien podría esperar razonablemente. La nota es la justificación de NO haberla construido.
- El disparador debe ser concreto y observable ("cuando haya 3 o más proveedores de pago", "si el cliente necesita editarlos"), nunca "si hace falta" ni "en el futuro".
- Una nota por juntura, junto al código que describe. Sin notas ponytail para cosas que nadie construiría de todos modos.
- La regla inversa: añadir complejidad más allá de lo pedido (capas, opciones, helpers genéricos, plugins) necesita una justificación de una línea en el expediente de funcionalidad o en el PR. La simplicidad es el valor por defecto y no necesita defensa; la complejidad sí.
- Cuando se cumple un disparador, implementa la extensión y borra la nota en el mismo cambio.
- Es compatible con el plugin Ponytail (DietrichGebert/ponytail), que usa el mismo marcador: si está instalado, también se aplican sus reglas y `/ponytail-review` / `/ponytail-debt`; la parte `extend when <trigger>` es un añadido de Sumitsubo.
- `/sumi:ship` lista las notas añadidas en el diff bajo "Deliberate simplifications" en el PR, para que el cliente y los revisores vean las junturas.

## Tamaño y forma

- Las funciones hacen una sola cosa; si necesitas "y" para describirla, divídela. Apunta a < 40 líneas.
- Los archivos tienen una sola razón para cambiar. Los componentes de más de ~200 líneas o los módulos de más de ~300 merecen una revisión (los paquetes de stack pueden fijar límites más estrictos; gana el más estricto).
- Profundidad máxima de anidación: 3. Usa retornos tempranos y cláusulas de guarda.
- Parámetros: ≤ 3 posicionales; a partir de ahí, un objeto de opciones con campos con nombre.
- La lógica pura, separada de la E/S y del código de unión con el framework, para poder probarla sin mocks.

## Nombres

- Los nombres dicen qué, no cómo: `unpaidInvoices`, no `filteredList2`. Los booleanos se leen como preguntas: `isOpen`, `hasStock`, `canEdit`.
- Las funciones son verbos (`calculateShipping`); los manejadores de eventos describen el evento (`handleSubmit`, `onCartUpdated`).
- Sin abreviaturas salvo las universales (`id`, `url`, `i` en bucles cortos). Sin `data`, `info`, `item`, `temp`, `helper`, `utils2`, `manager` sin un sustantivo del dominio.
- Unidades en los nombres cuando haya ambigüedad: `timeoutMs`, `priceCents`.

## Comentarios

Comenta el **porqué**, nunca el qué. Documenta restricciones no obvias, soluciones provisionales (con un enlace a la incidencia), reglas de negocio e invariantes. Sin comentarios que narren (`// loop over items`), sin arte de pancartas, sin encabezados de sección al estilo IA en el código (`// ===== HELPER FUNCTIONS =====`).

## Dependencias

Antes de añadir un paquete: ¿puede hacerlo la plataforma (`<dialog>` nativo, `Intl`, `fetch`, CSS)? ¿Está mantenido, tipado, compatible con tree-shaking, y se justifica su tamaño? Prefiere una dependencia bien elegida a tres que se solapen. Nunca añadas una dependencia para ahorrarte cinco líneas.

## Pruebas

- Prueba el comportamiento a través de las interfaces públicas, no de los detalles de implementación.
- Lógica nueva con ramas → pruebas. Corrección de un error → una prueba que falle antes de la corrección.
- Las pruebas son código: las mismas reglas de nombres y claridad. Una sola razón para fallar por prueba.
- Usa el ejecutor de pruebas y las convenciones del proyecto; no introduzcas un segundo.

## Señales de relleno de IA — nunca las entregues

- `any`, `as unknown as`, el `!` de no nulo esparcido para silenciar al compilador.
- Comprobaciones defensivas para estados imposibles; encadenamiento opcional sobre valores que siempre están definidos.
- try/catch alrededor de código que no puede lanzar, o bloques catch que solo hacen `console.log`.
- Funciones envoltorio que solo llaman a otra función con los mismos argumentos.
- Código trivial con exceso de comentarios; JSDoc que repite la firma.
- Lógica de relleno olvidada: `// TODO: implement`, datos de prueba en rutas de producción, depuración con `console.log`.
- Estilo inconsistente dentro del mismo archivo (mezclar async/await y `.then`, dos convenciones de nombres).
- Estructura "enterprise" para una funcionalidad pequeña: interfaces con una sola implementación, fábricas, capas servicio-repositorio-controlador para una única llamada CRUD.
- Reescribir código que funcionaba y que no formaba parte de la tarea.

## Lista de verificación

- [ ] El cambio hace lo pedido y nada más; el desvío de alcance queda anotado como seguimientos.
- [ ] Los tipos pasan, el linter pasa sin advertencias nuevas, el formateador aplicado.
- [ ] Pruebas añadidas o actualizadas y en verde; las ejecutaste y viste la salida.
- [ ] Sin código muerto, registros de depuración, stubs de TODO ni código comentado.
- [ ] Errores gestionados en el nivel adecuado con mensajes útiles.
- [ ] Toda API usada existe en la versión instalada.
- [ ] El diff se lee limpio de arriba abajo; un revisor no preguntaría "¿por qué está esto aquí?".
