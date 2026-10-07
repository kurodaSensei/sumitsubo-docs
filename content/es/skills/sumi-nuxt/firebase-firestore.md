---
title: "firebase-firestore"
description: "Firebase para aplicaciones Nuxt/Vue: modelado de datos en Firestore guiado por las consultas (desnormalización, documentos de agregación, índices compuestos, paginación por cursor, lotes y transacciones), reglas de seguridad como el backend real (denegar por defecto, validación de la forma, pruebas con el emulador), patrones de Auth, Cloud Functions v2 (idempotencia, reintentos, secretos), coste y amplificación de lecturas, Emulator Suite, y el SDK modular o nuxt-vuefire. Úsala al diseñar colecciones, escribir consultas, editar firestore.rules, storage.rules, firestore.indexes.json, firebase.json, functions/** o cualquier código que importe firebase/* o firebase-admin."
source-hash: "632be05abf5e6518"
---

# Firebase y Firestore

Firestore no es una base de datos relacional ni un cubo de JSON de forma libre. Es un almacén de documentos donde
**pagas por cada documento leído**, **las consultas deben ser atendidas por un índice** y **las reglas de seguridad son el
único backend** para todo lo que toca el SDK de cliente. Diseña para las consultas que ejecuta la interfaz y escribe después
las reglas como si todos los clientes fueran hostiles.

## Principios básicos

1. **Modelado guiado por las consultas.** Lista cada pantalla y la consulta exacta que ejecuta antes de crear una
   colección. La forma de los documentos sigue a las lecturas, no a un diagrama entidad-relación.
2. **Las lecturas son la unidad de coste y de latencia.** Una pantalla debe costar un número pequeño y acotado de lecturas,
   independiente del volumen total de datos. Nunca cuentes ni agregues leyendo todos los documentos.
3. **Las reglas son el backend.** Deniega por defecto. Valida la autenticación, la propiedad, la forma del documento, los tipos de
   campo, los campos permitidos y los campos inmutables en cada escritura. Pruébalas en el emulador.
4. **El servidor para los privilegios, el cliente para la comodidad.** Todo lo que implique dinero, roles, escrituras entre
   usuarios o secretos pasa por Cloud Functions o Nitro con firebase-admin.
5. **Solo el SDK modular, con tree-shaking e inicializado una vez.** Sin importaciones compat.

## Reglas de modelado

- Colecciones de nivel superior para las entidades que consultas entre propietarios (`projects`, `orders`). Subcolecciones
  para los datos a los que siempre se accede a través de un padre (`projects/{id}/tasks`). Usa consultas de grupo de colecciones
  cuando debas consultar subcolecciones de varios padres.
- **Desnormaliza lo que muestran las listas.** Una lista de tareas que muestra el nombre del responsable guarda `assignee: { uid, name, photoURL }`
  en la tarea. Acepta la propagación en el momento de la escritura; actualiza las copias con una función cuando cambie el origen.
- **Documentos de agregación** para contadores y resúmenes (`projects/{id}/stats/summary` o campos en el
  padre), actualizados en una transacción o mediante un disparador. Para tasas de escritura altas, usa contadores fragmentados.
  Para recuentos ocasionales, `getCountFromServer` / `getAggregateFromServer` (se facturan por lote de entradas de
  índice, no por documento; verifica los precios vigentes).
- Mantén los documentos muy por debajo del límite de 1 MiB; nunca uses un array o mapa que crezca sin límite (comentarios, registros)
  dentro de un documento. Las listas sin límite son subcolecciones.
- Evita las escrituras sostenidas sobre un único documento por encima de aproximadamente 1 por segundo, y evita los ID de documento
  monótonamente crecientes o las marcas de tiempo indexadas con volúmenes de escritura muy altos (puntos calientes).
- Guarda las marcas de tiempo con `serverTimestamp()` al escribir; guarda el dinero como enteros en unidades menores.
- Versiona tu esquema: un campo `schemaVersion` hace manejables las migraciones.

Ejemplos de modelado desarrollados: `references/modeling.md`.

## Consultas, índices, paginación

```ts
import { collection, query, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore'

const q = query(
  collection(db, 'projects'),
  where('ownerId', '==', uid),
  where('status', '==', 'active'),
  orderBy('updatedAt', 'desc'),
  limit(20),
  ...(cursor ? [startAfter(cursor)] : []),
)
```

- Toda consulta compuesta necesita un índice compuesto; confírmalos en `firestore.indexes.json` (expórtalos
  con `firebase firestore:indexes`), nunca solo mediante enlaces de la consola.
- Pagina con cursores (`startAfter(lastSnapshot)`) y `limit`. Nunca `offset`: los documentos omitidos
  se siguen facturando y son lentos.
- `in`/`array-contains-any`/`or()` tienen límites de valores (verifica el máximo vigente); no son un join.
- Nada de filtrar en el cliente conjuntos de resultados grandes "porque la consulta era difícil". Cambia el modelo.
- Usa `withConverter` (o una capa de repositorio) para mapear los documentos a objetos de dominio tipados y convertir
  `Timestamp` en valores simples en la frontera.

## Escrituras: lotes y transacciones

- **Lote** para las escrituras independientes que deben aplicarse todas juntas (crear proyecto + membresía del propietario).
- **Transacción** cuando una escritura depende de una lectura (descontar existencias, incrementar un contador con tope).
  Las transacciones se reintentan; mantenlas libres de efectos secundarios (sin correos, sin llamadas externas dentro).
- Respeta los límites de tamaño de lotes y transacciones y los límites por petición (verifica los límites vigentes).
- Prefiere `updateDoc` con rutas de campo e `increment()`/`arrayUnion()` antes que leer-modificar-escribir.

## Reglas de seguridad

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function signedIn() { return request.auth != null; }
    function isOwner(d) { return signedIn() && d.ownerId == request.auth.uid; }

    match /projects/{projectId} {
      allow read: if isOwner(resource.data);
      allow create: if isOwner(request.resource.data) && validProject(request.resource.data)
                    && request.resource.data.createdAt == request.time;
      allow update: if isOwner(resource.data) && validProject(request.resource.data)
                    && request.resource.data.diff(resource.data).affectedKeys()
                         .hasOnly(['name', 'status', 'updatedAt']);
      allow delete: if false; // soft delete via status, or server-only
    }
    function validProject(d) {
      return d.keys().hasOnly(['ownerId','name','status','createdAt','updatedAt'])
        && d.name is string && d.name.size() > 0 && d.name.size() <= 120
        && d.status in ['active', 'archived'];
    }
  }
}
```

- Nada fuera de los bloques `match` explícitos está permitido; nunca publiques `allow read, write: if true` ni
  reglas de prueba con límite de tiempo.
- Las reglas no son filtros: una consulta debe estar restringida de modo que todo resultado posible pase la regla
  (por ejemplo, incluye `where('ownerId', '==', uid)`).
- `get()`/`exists()` en las reglas cuestan lecturas y tienen límites por petición; prefiere las custom claims para los roles.
- Los roles viven en custom claims (fijadas con el SDK de admin) o en un documento escrito por el servidor; los clientes nunca escriben su propio rol.
- Prueba con `@firebase/rules-unit-testing` contra el emulador: una prueba de permitir y una de denegar por regla.
  Consulta `references/rules-testing.md`.
- Activa App Check en las aplicaciones web de producción para reducir el abuso de la configuración pública.

## Auth

- Cliente: `onAuthStateChanged` una sola vez (en un plugin o composable), expuesto como estado reactivo. En
  nuxt-vuefire: `useCurrentUser()` y `await getCurrentUser()` en el middleware de ruta.
- El SSR necesita al usuario en el servidor: usa cookies de sesión o el soporte de SSR para auth de nuxt-vuefire (verifica la
  configuración para tu versión), y verifica los tokens con firebase-admin en `server/`. De lo contrario, define las rutas
  autenticadas con `ssr: false`.
- Nunca confíes en un uid enviado en el cuerpo de una petición; derívalo del token verificado.

## Cloud Functions (v2)

```ts
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { setGlobalOptions } from 'firebase-functions/v2'
setGlobalOptions({ region: 'us-central1', maxInstances: 10 })

export const onOrderCreated = onDocumentCreated(
  { document: 'orders/{orderId}', retry: true },
  async (event) => {
    const processed = db.doc(`_processedEvents/${event.id}`)
    await db.runTransaction(async (tx) => {
      if ((await tx.get(processed)).exists) return   // idempotency guard
      tx.set(processed, { at: FieldValue.serverTimestamp() })
      tx.update(db.doc(`stats/global`), { orders: FieldValue.increment(1) })
    })
  },
)
```

- Los disparadores se ejecutan al menos una vez: haz los manejadores idempotentes (registro de ID de evento, ID de documento deterministas).
- Activa `retry` solo para manejadores idempotentes; acota los reintentos comprobando la antigüedad del evento.
- Secretos mediante `defineSecret` / Secret Manager, nunca en el código ni en `runtimeConfig.public`.
- El trabajo largo o pesado va a una cola de tareas o a una función programada; la interfaz muestra el progreso desde un documento de estado.
- Define `maxInstances` para limitar el coste descontrolado. Vigila los bucles de disparadores (una función que escribe en el documento que la dispara).

## SDK de cliente e integración con Nuxt

- Inicializa una sola vez (plugin o configuración de nuxt-vuefire). Importa solo lo que uses de `firebase/firestore`,
  `firebase/auth`; carga de forma diferida los módulos pesados (Storage, Analytics) donde se necesiten.
- Prefiere las lecturas únicas (`getDocs`) para las páginas con SSR; usa oyentes en tiempo real (`onSnapshot`,
  `useCollection`) solo donde importen las actualizaciones en vivo, y cancela la suscripción al desmontar (VueFire lo hace).
- Caché sin conexión: `initializeFirestore(app, { localCache: persistentLocalCache(...) })` solo para las aplicaciones
  que se beneficien; aumenta el tamaño del bundle.
- Convierte los tipos del SDK en la frontera del repositorio antes de que lleguen a la carga útil del SSR (`nuxt-data-ssr`).

## Emulator Suite

`firebase emulators:start --import=./.emulator-data --export-on-exit` para desarrollo local con datos semilla.
Conecta el cliente de forma condicional en desarrollo (`connectFirestoreEmulator`, `connectAuthEmulator`). La CI ejecuta
las pruebas de reglas y de funciones contra los emuladores. Nunca desarrolles contra datos de producción.

## Antipatrones (señales de relleno de IA)

- "Tablas SQL" normalizadas con joins en el cliente (N+1 lecturas por lista).
- Contar con `getDocs(...).size`, o cargar una colección entera para filtrar u ordenar en el cliente.
- Paginación con `offset`; `onSnapshot` sin límite sobre colecciones grandes.
- Arrays de comentarios o mensajes dentro de un único documento.
- Reglas en modo de prueba en producción, o reglas que comprueban la autenticación pero no la forma ni los campos.
- El cliente escribe los campos `role: 'admin'` o `price`; uid tomado del cuerpo de la petición.
- Disparadores no idempotentes; funciones sin `maxInstances`; secretos en el código fuente.
- Importaciones de `firebase/compat/*`, o importar todo `firebase` en un bundle de cliente.
- Datos de documento tipados como `any` esparcidos directamente en los componentes.

## Lista de verificación

- [ ] Las consultas de cada pantalla están listadas; el modelo las atiende con lecturas acotadas; los índices están en `firestore.indexes.json`.
- [ ] Paginación por cursor; sin offset; sin filtrado en el cliente de conjuntos grandes.
- [ ] Las reglas deniegan por defecto, validan forma, campos e inmutables, y tienen pruebas de permitir y denegar en el emulador.
- [ ] Las escrituras privilegiadas pasan por Functions/Nitro con tokens verificados.
- [ ] Las funciones son idempotentes, están limitadas, usan bien los secretos y evitan los bucles de disparadores.
- [ ] SDK modular, una sola inicialización, convertidores tipados, tipos del SDK convertidos antes de la carga útil del SSR.
- [ ] Estimación de coste escrita para la pantalla más usada (lecturas por vista x vistas esperadas).

## Ejemplos de modelado de Firestore desarrollados

### Método

1. Escribe los patrones de acceso como una tabla: pantalla, consulta, orden, tamaño de página, frecuencia, frescura.
2. Para cada uno, diseña la lectura de documento más barata que lo resuelva.
3. Decide dónde viven los datos duplicados y quién los mantiene coherentes (lote del cliente, disparador, nunca).
4. Escribe las reglas junto con el modelo; un modelo que no puedes proteger con reglas necesita una ruta por el servidor.
5. Estima las lecturas y escrituras por día de las tres pantallas principales.

### Ejemplo: portal de clientes freelance

Patrones de acceso:

| Pantalla | Consulta | Notas |
| --- | --- | --- |
| Mis proyectos | projects donde memberIds contiene uid, orden por updatedAt desc, 20 por página | la más frecuente |
| Detalle del proyecto | documento del proyecto + las últimas 30 entradas de actividad | |
| Tablero de tareas del proyecto | tareas del proyecto donde status en [...], orden por position | tiempo real |
| Panel de administración | totales: proyectos activos, tareas abiertas, facturado este mes | debe ser O(1) lecturas |

Modelo:

```
projects/{projectId}
  name, status, clientName, ownerId, memberIds: string[], updatedAt, createdAt,
  counts: { openTasks: number, doneTasks: number }        // aggregation fields
projects/{projectId}/tasks/{taskId}
  title, status, position, assignee: { uid, name, photoURL } // denormalized
projects/{projectId}/activity/{activityId}
  type, actor: { uid, name }, at, summary                   // append-only, written by functions
stats/{yyyy-mm}
  activeProjects, openTasks, invoicedMinor                  // written only by functions
```

Índices:
- `projects`: `memberIds` (array-contains) + `updatedAt desc`.
- `tasks`: `status` + `position asc` (ámbito de colección).

Coherencia:
- `counts.openTasks` se actualiza en el mismo lote que el cambio de estado de la tarea (cliente) solo si las reglas pueden
  validar el delta; de lo contrario, mediante un disparador `onDocumentWritten` sobre tasks.
- Cuando un usuario cambia su nombre visible, una función propaga las actualizaciones a las copias de `assignee.name`. Acepta
  una obsolescencia breve; documéntala.
- `memberIds` está limitado (por ejemplo, 50) y validado en las reglas; los equipos más grandes necesitan una colección `memberships`.

### Ejemplo: reservas / disponibilidad

Evita calcular la disponibilidad leyendo todas las reservas. Precalcula:

```
resources/{resourceId}/days/{yyyy-mm-dd}
  slots: { "09:00": "free" | "held" | "booked", ... }   // bounded map, one doc per day
bookings/{bookingId}
  resourceId, day, slot, userId, status, createdAt
```

La reserva es una transacción: lee el documento del día, verifica que el hueco esté libre, fija el hueco en `booked`, crea la reserva.
Un único documento por día es un punto caliente de escritura solo con un volumen extremo; fragmenta por recurso si hace falta.

### Ejemplo: chat / comentarios

```
threads/{threadId}                 lastMessage: { text, at, authorName }, participantIds, updatedAt
threads/{threadId}/messages/{id}   text, authorId, at
```

- La lista de hilos lee solo `threads` (con `lastMessage` desnormalizado), nunca los mensajes.
- Los mensajes se paginan hacia atrás con `orderBy('at','desc').limit(30)` + `startAfter`.
- Contadores de no leídos por usuario: `threads/{id}/readState/{uid}` con `lastReadAt`, o una propagación por usuario a
  `inbox/{uid}/threads/{threadId}` para listas grandes de participantes.

### Elegir la estrategia de duplicación

| Los datos cambian... | Estrategia |
| --- | --- |
| Nunca (autor en el momento de publicar) | Copia al escribir, nunca actualices |
| Rara vez (nombre visible, avatar) | Copia + propagación por disparador, tolera una obsolescencia breve |
| A menudo y deben ser exactos (precio, existencias) | No copies; lee el origen, o referencia por id + fetch |

### Comprobación de cordura del coste

`reads_per_view x views_per_day x 30`. Si la pantalla más usada cuesta más de unas pocas lecturas por vista,
busca: un documento de agregación ausente, una lista cuya renderización requiere lecturas por elemento, oyentes en tiempo real
sobre consultas amplias que se disparan de nuevo, o reglas que usan `get()` por documento.

## Pruebas de las reglas de seguridad con el emulador

### Preparación

```bash
npm i -D @firebase/rules-unit-testing vitest
firebase emulators:exec --only firestore "vitest run tests/rules"
```

```ts
// tests/rules/projects.test.ts
import { readFileSync } from 'node:fs'
import {
  initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-Sumitsubo',            // demo-* ids never touch real projects
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})
afterAll(() => env.cleanup())
beforeEach(() => env.clearFirestore())

async function seedProject(id: string, ownerId: string) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), `projects/${id}`), {
      ownerId, name: 'Site', status: 'active', createdAt: new Date(), updatedAt: new Date(),
    })
  })
}

describe('projects', () => {
  it('owner can read own project', async () => {
    await seedProject('p1', 'alice')
    const db = env.authenticatedContext('alice').firestore()
    await assertSucceeds(getDoc(doc(db, 'projects/p1')))
  })

  it('other user cannot read', async () => {
    await seedProject('p1', 'alice')
    const db = env.authenticatedContext('bob').firestore()
    await assertFails(getDoc(doc(db, 'projects/p1')))
  })

  it('owner cannot change ownerId', async () => {
    await seedProject('p1', 'alice')
    const db = env.authenticatedContext('alice').firestore()
    await assertFails(updateDoc(doc(db, 'projects/p1'), { ownerId: 'bob' }))
  })

  it('rejects unknown fields on create', async () => {
    const db = env.authenticatedContext('alice').firestore()
    await assertFails(setDoc(doc(db, 'projects/p2'), {
      ownerId: 'alice', name: 'X', status: 'active',
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(), isPaid: true,
    }))
  })

  it('unauthenticated cannot list', async () => {
    const db = env.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'projects/p1')))
  })
})
```

### Qué cubrir por colección

- Lectura: propietario permitido, no propietario denegado, sin autenticar denegado.
- Consultas de listado: consulta restringida permitida, consulta sin restringir denegada.
- Creación: la válida permitida; campo ausente, campo extra, tipo incorrecto y propietario suplantado, cada uno denegado.
- Actualización: solo los campos permitidos; campos inmutables (`ownerId`, `createdAt`) denegados; escalada de rol denegada.
- Borrado: coincide con la política prevista.
- Custom claims: `authenticatedContext('admin', { role: 'admin' })` para las rutas protegidas por rol.

### Ayudantes para escribir reglas

```
function unchanged(field) {
  return request.resource.data[field] == resource.data[field];
}
function onlyChanges(fields) {
  return request.resource.data.diff(resource.data).affectedKeys().hasOnly(fields);
}
function hasRole(role) {
  return request.auth != null && request.auth.token.role == role;
}
```

### CI

Ejecuta las pruebas de reglas en cada cambio de `firestore.rules`, `storage.rules` o del modelo de datos. Despliega las reglas
desde el repositorio (`firebase deploy --only firestore:rules,firestore:indexes`), nunca editándolas en
la consola.
