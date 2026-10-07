---
title: "react-components"
description: "Diseño de componentes en React 19: composición en lugar de configuración, reglas de los hooks, cuándo NO usar useEffect, useActionState/useOptimistic/useFormStatus/use(), ref como prop, implicaciones del React Compiler (sin abusar de memo manual), colocación del estado, formularios controlados frente a no controlados, primitivas headless accesibles (Radix, React Aria) frente a widgets hechos a mano, y props tipadas. Úsala al escribir o revisar componentes *.tsx/*.jsx, hooks propios (use*.ts), formularios, proveedores de contexto, APIs de componentes o primitivas del sistema de diseño en components/**, o al refactorizar componentes grandes o código lleno de efectos."
source-hash: "7c66a6c53036134f"
---

# Componentes de React (React 19)

Objetivo: React 19.2, TypeScript estricto, React Compiler activado siempre que sea posible. Estilos con Tailwind y los tokens de `DESIGN.md` (`sumi:css-architecture`). Tabla de decisión de efectos y refactorizaciones: `references/effects.md`.

## Principios

1. **Un componente hace un solo trabajo.** Si necesitas una "y" para describirlo, divídelo. Unas 150 líneas son un motivo de revisión, no un objetivo.
2. **Compón, no configures.** Prefiere `children` y ranuras a la explosión de props booleanas o de configuración.
3. **Deriva, no sincronices.** Todo lo que se pueda calcular a partir de props o estado se calcula durante el renderizado.
4. **El estado vive lo más abajo posible y lo más arriba necesario.** Súbelo solo hasta el propietario común más cercano; prefiere el estado en la URL para el estado de interfaz que se pueda compartir (filtros, pestañas, paginación).
5. **La semántica primero.** Elementos nativos antes que ARIA; primitivas headless probadas antes que widgets hechos a mano (`sumi:a11y`).
6. **Deja que el compilador optimice.** Escribe código llano; mide antes de memoizar.

## Composición en lugar de configuración

ASÍ NO:
```tsx
<Card title="Plan" subtitle="Pro" showIcon iconPosition="left" footerButtons={[...]} variant="highlight" />
```

ASÍ SÍ:
```tsx
<Card tone="highlight">
  <Card.Header>
    <Card.Title>Plan</Card.Title>
    <Card.Description>Pro</Card.Description>
  </Card.Header>
  <Card.Footer><Button>Upgrade</Button></Card.Footer>
</Card>
```

- Las variantes mediante un mapa tipado (`cva` o un simple `Record<Variant, string>`), no ternarios improvisados en `className`. Combínalas con `cn()` (clsx + tailwind-merge).
- Acepta `className` y propaga el resto de props nativas al elemento raíz para que quien consuma el componente pueda extenderlo.
- Tipa las props a partir del elemento: `ComponentProps<'button'> & { tone?: Tone }`. Sin `any`, sin `React.FC` (`sumi:js-ts`).
- Polimorfismo: prefiere una ranura `asChild` (`Slot` de Radix) a las props genéricas `as` con tipado complejo.

## Refs (React 19)

`ref` es una prop corriente en los componentes de función. No uses `forwardRef` en código nuevo.

```tsx
export function Input({ ref, className, ...props }: ComponentProps<'input'>) {
  return <input ref={ref} className={cn('input', className)} {...props} />;
}
```

Los callbacks de ref pueden devolver una función de limpieza. Usa refs para acceder al DOM y como vías de escape imperativas, no para estado que se renderiza.

## Efectos: probablemente no necesitas uno

`useEffect` sirve para **sincronizarse con un sistema externo** (APIs del DOM, suscripciones, widgets que no son de React, conexiones de red). No sirve para:

| En lugar de un efecto para... | Haz esto |
|---|---|
| Derivar estado de props o estado | Calcúlalo en el renderizado (`const total = items.reduce(...)`) |
| Reaccionar a una acción del usuario | Pon la lógica en el manejador de eventos |
| Reiniciar el estado cuando cambia una prop | `key={id}` en el componente |
| Obtener los datos iniciales | Server Component, o `use(promise)`; TanStack Query para datos dirigidos por el cliente |
| Avisar al padre de un cambio | Llama al callback del padre en el mismo manejador |
| Suscribirse a un almacén externo | `useSyncExternalStore` |
| Leer las últimas props dentro de un efecto sin volver a suscribirse | `useEffectEvent` (19.2) |

ASÍ NO:
```tsx
const [fullName, setFullName] = useState('');
useEffect(() => setFullName(`${first} ${last}`), [first, last]);
```
ASÍ SÍ:
```tsx
const fullName = `${first} ${last}`;
```

Todo efecto que quede: lista de dependencias correcta (sin suprimir el lint), limpieza para suscripciones, temporizadores y oyentes, e idempotente ante la doble invocación del Strict Mode.

## Reglas de los hooks

- Llama a los hooks en el nivel superior, sin condiciones. Excepción: `use()` puede llamarse de forma condicional.
- Los hooks propios encapsulan un *comportamiento* reutilizable (`useMediaQuery`, `useDebouncedValue`), no "sacar código del componente". Un hook que solo envuelve un `useState` es ruido.
- Nombra los hooks `useX`; devuelve tuplas para 2 valores y objetos a partir de ahí.

## Formularios y acciones

- Por defecto, inputs **no controlados** + `<form action={fn}>` + `FormData`. Funciona antes de la hidratación, sin estado por cada pulsación de tecla.
- Inputs controlados solo cuando la interfaz reacciona a cada pulsación (formato en vivo, campos dependientes, búsqueda instantánea).
- `useActionState(action, initial)` -> `[state, formAction, isPending]` para resultados y errores.
- `useFormStatus()` dentro de un hijo del formulario para la interfaz de pendiente.
- `useOptimistic` para respuesta instantánea; el resultado del servidor la reconcilia.
- Formularios grandes del lado del cliente con validación compleja: React Hook Form + el resolver de zod es aceptable; aun así, envía mediante una Server Action.
- Todo input tiene un `<label>` visible; los errores se vinculan con `aria-describedby`; `aria-invalid` al fallar; los mensajes de estado van en una región viva educada. Ejemplo completo: la skill `next-data-caching`, `references/server-actions.md` (en este plugin: `${CLAUDE_PLUGIN_ROOT}/skills/next-data-caching/references/server-actions.md`).

## use() y Suspense

- `use(promise)` desenvuelve una promesa creada en el servidor (pasada como prop) o una cacheada. Nunca crees la promesa durante el renderizado del cliente: sería nueva en cada renderizado.
- `use(Context)` reemplaza a `useContext` y puede ser condicional.
- Combínalo con `<Suspense>` y una frontera de error en un nivel que tenga sentido.

## React Compiler

- Con el compilador activado (`reactCompiler: true` en `next.config`; verifica dónde va el indicador en tu versión), los componentes y los hooks se memoizan automáticamente.
- No añadas `useMemo`, `useCallback` ni `memo` por reflejo. Consérvalos solo donde el profiler demuestre un coste, o donde la identidad referencial sea un contrato (p. ej. las dependencias de efecto de un hook de terceros); comenta el porqué.
- El compilador exige las Reglas de React: no mutar props ni estado, no leer refs durante el renderizado, renderizado puro. Ejecuta `eslint-plugin-react-hooks` (la configuración recomendada incluye reglas del compilador) y corrige, no suprimas.
- `'use no memo'` excluye un componente temporalmente; deja un TODO con el motivo.

## Estado y contexto

- El estado del servidor no es estado del cliente: los datos del servidor permanecen en Server Components o en una caché de consultas, no se copian en `useState`.
- El contexto es para valores de baja frecuencia y necesarios en muchos sitios (tema, sesión, idioma). Divide los contextos por frecuencia de actualización. No uses un único contexto global como almacén.
- Pasar props por 2 niveles está bien. Más allá: composición (pasa el elemento ya renderizado como `children`) antes que contexto; un almacén (Zustand) solo para estado de cliente realmente compartido y de alta frecuencia.
- `useReducer` cuando las transiciones de estado están relacionadas y tienen nombre; una unión discriminada para el estado (`idle | loading | success | error`) en lugar de varios booleanos.

## Primitivas accesibles

- Usa Radix UI, React Aria Components o Base UI para dialog, popover, menu, combobox, tabs, tooltip, select, slider. Dales estilo con tokens.
- Construye a mano solo widgets triviales (un desplegable mediante `<details>`/botón + `aria-expanded`). Nunca un `div` con `onClick`: usa `<button>`; los enlaces navegan, los botones actúan.
- Verifica: trampa y retorno del foco en los diálogos, Escape cierra, foco itinerante en menús y pestañas, anillo de foco visible (2.4.7/2.4.11), tamaño del objetivo >= 24px (2.5.8). Consulta `sumi:a11y`.

## Listas y claves

- Las claves son IDs estables que vienen de los datos, nunca el índice del array en listas reordenables o filtrables, nunca `Math.random()`.
- Los estados vacío, de carga y de error forman parte del contrato del componente, no son ocurrencias tardías.

## Señales de relleno de IA

- `useEffect` + `setState` para derivar valores o "sincronizar" props en el estado.
- `useMemo`/`useCallback` alrededor de cada valor y manejador; `memo()` en cada componente.
- `forwardRef` en código nuevo de React 19; `React.FC<Props>`; `props: any`.
- Componentes de 400 líneas que mezclan obtención de datos, formato, composición y modales.
- Diez props booleanas (`isPrimary`, `isLarge`, `hasIcon`...) en lugar de variantes o composición.
- Botones hechos con `<div onClick>`, placeholder en lugar de etiqueta, botones de icono sin nombre accesible.
- Booleanos `isLoading`, `isError`, `isSuccess` que pueden contradecirse entre sí.
- Colores y espaciados escritos a mano en lugar de los tokens de `DESIGN.md`.
- `// eslint-disable-next-line react-hooks/exhaustive-deps`.

## Lista de verificación

- [ ] Ningún efecto que derive estado, gestione un evento u obtenga los datos iniciales.
- [ ] Ningún `useMemo`/`useCallback`/`memo` injustificado; lint limpio con las reglas de hooks y del compilador.
- [ ] Props tipadas a partir de elementos nativos; sin `any`; `className` y el resto de props propagados.
- [ ] Widgets interactivos construidos sobre elementos nativos o una primitiva headless; teclado y lector de pantalla comprobados.
- [ ] Formularios: etiquetas, errores vinculados, estado de pendiente, estado en región viva; funcionan sin JS cuando sea viable.
- [ ] Estado colocado cerca de su uso; estado en la URL para la interfaz compartible; sin estado del servidor copiado.
- [ ] Los estilos usan tokens; sin valores mágicos.

## Efectos: guía de decisión y refactorizaciones

Pregunta en orden. Detente en el primer sí.

1. ¿Se puede calcular a partir de las props o el estado actuales? -> calcúlalo durante el renderizado.
2. ¿Lo causa una interacción concreta del usuario? -> manejador de eventos.
3. ¿Debe reiniciarse el estado cuando cambia una identidad? -> `key`.
4. ¿Son datos para renderizar? -> Server Component / `use()` / biblioteca de consultas.
5. ¿Es una suscripción a algo ajeno a React que cambia con el tiempo? -> `useSyncExternalStore`.
6. ¿Es una sincronización con un sistema externo mientras el componente siga montado? -> `useEffect` con limpieza.

### Refactorización 1: filtrado derivado

```tsx
// Before
const [visible, setVisible] = useState<Todo[]>([]);
useEffect(() => { setVisible(todos.filter(t => t.status === filter)); }, [todos, filter]);

// After (compiler memoizes if needed)
const visible = todos.filter(t => t.status === filter);
```

### Refactorización 2: lógica disparada por una acción

```tsx
// Before: effect watches state set by a click
useEffect(() => { if (submitted) { toast('Saved'); track('save'); } }, [submitted]);

// After
async function handleSave() {
  await save();
  toast('Saved');
  track('save');
}
```

### Refactorización 3: reinicio al cambiar la identidad

```tsx
// Before
useEffect(() => { setDraft(''); }, [threadId]);

// After: parent remounts the editor per thread
<CommentEditor key={threadId} threadId={threadId} />
```

### Refactorización 4: ajustar el estado durante el renderizado (poco frecuente)

Cuando una parte del estado debe responder a un cambio de prop y `key` es demasiado grueso, guarda la prop anterior y ajusta durante el renderizado. Prefiere reestructurar primero.

```tsx
const [prevItems, setPrevItems] = useState(items);
const [selection, setSelection] = useState<string | null>(null);
if (items !== prevItems) {
  setPrevItems(items);
  setSelection(null);
}
```

### Refactorización 5: almacén externo

```tsx
function useOnlineStatus() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('online', cb);
      window.addEventListener('offline', cb);
      return () => {
        window.removeEventListener('online', cb);
        window.removeEventListener('offline', cb);
      };
    },
    () => navigator.onLine,
    () => true, // server snapshot
  );
}
```

### Refactorización 6: el último valor en un efecto sin volver a suscribirse (React 19.2)

```tsx
const onMessage = useEffectEvent((msg: Message) => {
  if (!muted) notify(msg);          // always reads current `muted`
});

useEffect(() => {
  const conn = connect(roomId);
  conn.on('message', (msg) => onMessage(msg));
  return () => conn.disconnect();
}, [roomId]);                        // muted not a dependency
```

Verifica que `useEffectEvent` se exporte como estable en la versión de React instalada; no lo llames fuera de los efectos.

### Efectos legítimos (consérvalos, con limpieza)

- Oyentes de `IntersectionObserver`, `ResizeObserver` y `matchMedia` (o `useSyncExternalStore`).
- Integrar widgets que no son de React (mapas, gráficos, reproductores de vídeo): créalos en el efecto y destrúyelos en la limpieza.
- Suscripciones `onSnapshot` de Firestore en hojas de cliente: devuelve la función de cancelación.
- Atajos de teclado a nivel de documento.
- Gestión del foco tras un cambio de estado que no está ligado a un único manejador (prefiere antes el manejador o un callback de ref).

### Strict Mode

En desarrollo se invocan los efectos dos veces (montaje -> limpieza -> montaje). Si eso rompe el comportamiento, la limpieza es incorrecta; no desactives el Strict Mode. Para una inicialización única de la aplicación, usa una guarda a nivel de módulo, no un efecto.
