---
title: "output"
description: "La forma de lo que imprime un comando de Sumitsubo al terminar: encabezado, cuerpo, el único siguiente paso, y las reglas sobre números, omisiones e idioma. Úsala cuando un comando `/sumi:*` o `/sumi-design:*` llegue a su paso de informe, al escribir o editar el paso final de un comando, y siempre que haya que decidir cómo resumirle el trabajo al usuario."
source-hash: "a335ce026ec632aa"
---

# Salida de los comandos

Todo comando termina contándole al usuario qué pasó. Antes de esta skill, cada
comando describía ese momento con sus propias palabras, así que nueve comandos
producían nueve formas y el más pesado de todos, `/sumi:ship`, no describía
ninguna. Este es el único contrato al que todos se remiten.

Rige el **informe final**, no la conversación del camino.

## Forma

Tres partes, en este orden. No hace falta nada más y no se espera nada más.

```
**<command> · <subject>**
<one sentence: the result>

<the body: a table, a short list, or a diff summary>

→ <the single next step>
```

**Encabezado.** El comando y aquello sobre lo que se ejecutó, en negrita, una
línea. El asunto es una rama, un identificador de funcionalidad, un número de
archivos, una ruta — lo que identifique *esta* ejecución.

**Frase de resultado.** El veredicto, primero, en una frase. No un repaso de los
pasos. Quien se detenga aquí tiene que saber igual la respuesta.

**Cuerpo.** Solo hechos, en el formato que encaje:

- **Tabla** cuando hay filas con los mismos campos — archivos modificados,
  criterios y su evidencia, lentes y sus hallazgos, plugins y su estado.
- **Lista breve** cuando los elementos no comparten campos.
- **Resumen de diff** cuando el cambio es sobre un archivo: conteos y las líneas
  que importan, nunca el archivo entero.

**Siguiente paso.** Una línea, que empieza por `→`. Exactamente uno. Un comando
ejecutable cuando lo haya, entre comillas invertidas. Si lo que sigue es una
decisión del usuario, di cuál es la decisión, no un menú de todo lo posible.

## Reglas

Esto es lo que importa; la forma de arriba es solo dónde aterriza.

**Primero el resultado.** El proceso solo interesa cuando explica el resultado.
Nunca abras con lo que hiciste para averiguarlo.

**Todo número sale de algo que se ejecutó.** Un conteo, una duración, una
puntuación, un tamaño — si no se midió en esta sesión, no aparece como si se
hubiera medido. Una estimación se declara como estimación.

**Di lo que no se hizo.** Pasos saltados, criterios sin evidencia, checks que no
corrieron, partes del pedido que quedaron fuera: todo eso va en el informe, con
su motivo. Un informe que solo enumera éxitos no es un informe.

**Nunca afirmes una verificación que no ocurrió.** "Las pruebas pasan" exige
haberlas ejecutado y haberlas visto pasar. Si algo se cree pero no está
verificado, di cuál de las dos cosas es.

**El idioma del usuario, los identificadores del proyecto.** La prosa sigue al
usuario. Comandos, rutas, nombres de archivo, nombres de rama, código y texto de
error se quedan tal cual están — nunca se traducen.

**Sin decoración.** Ni emojis, ni cajas de ASCII, ni banners. El estado es una
palabra: `ok`, `blocked`, `open`, `skipped`, `n/a`. Los terminales varían en
ancho y en tipografía; el texto y la alineación sobreviven, el dibujo no.

**Breve.** Si el cuerpo pasa de unas quince líneas, el comando está informando
de su proceso en vez de su resultado. La excepción es una lista cuya longitud es
justamente el punto — cada criterio, cada hallazgo, cada archivo modificado — y
esa nunca se recorta para que se vea ordenada.

## Cómo se escribe el paso de informe de un comando

El paso final de un comando nombra sus campos y delega el resto:

```markdown
N. **Report** per `sumi:output`. Subject: the branch. Body: a table of
   criteria × evidence, plus any criterion still open. Next step: the push and
   PR commands, or `/sumi:review` if the receipt is missing.
```

No repitas la forma, las reglas ni las palabras de estado dentro de un comando.
Viven aquí para que cambiarlas cambie todos los comandos a la vez, que es justo
la razón de que este archivo exista.
