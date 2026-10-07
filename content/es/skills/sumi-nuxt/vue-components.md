---
title: "vue-components"
description: "Escritura de componentes Vue 3.5+ con <script setup lang=\"ts\">: defineProps/defineEmits/defineModel/defineSlots tipados, corrección de la reactividad (desestructuración, shallowRef, computed antes que watch), provide/inject, tamaño y responsabilidad de los componentes, patrones headless accesibles. Úsala al crear, refactorizar o revisar cualquier archivo *.vue o un composable a nivel de componente, o al corregir errores de reactividad, prop drilling o componentes demasiado grandes."
source-hash: "c6abaef13679c1cd"
---

# Componentes de Vue

Un buen componente de Vue es pequeño, tipado, deriva en lugar de sincronizar y es accesible por defecto.
La mayoría de los errores en las bases de código de Vue vienen de copiar modelos mentales de React (efectos por todas partes) o de
perder la reactividad al intentar ser ingenioso.

## Principios básicos

1. **Deriva, no sincronices.** Si un valor se puede calcular a partir de otro estado, es un `computed`, nunca un
   `ref` actualizado por un `watch`.
2. **Una responsabilidad por componente.** La carga de datos, la composición y los widgets de interacción son preocupaciones
   separadas. Una página orquesta; los componentes hoja renderizan props y emiten intención.
3. **Los tipos son la API.** Props, emits, modelos y slots se tipan con genéricos de TS. Sin sintaxis de
   objeto en tiempo de ejecución, sin `any`, sin acrobacias con `PropType`.
4. **Primero HTML semántico, después ARIA.** Un `<button>` es mejor que `<div role="button" tabindex="0">`.
   Reglas de accesibilidad: `sumi:a11y`.
5. **Props hacia abajo, eventos hacia arriba, inject para contexto realmente ambiental.** No un store global para todo.

## Esqueleto de un componente

```vue
<script setup lang="ts">
type Size = 'sm' | 'md' | 'lg'

const { label, size = 'md', disabled = false } = defineProps<{
  label: string
  size?: Size
  disabled?: boolean
}>()

const emit = defineEmits<{ select: [id: string] }>()
const open = defineModel<boolean>('open', { default: false })

defineSlots<{ default(): any; icon?(props: { size: Size }): any }>()
</script>
```

Orden dentro de `<script setup>`: tipos, props/emits/model/slots, inyecciones, estado local, computed,
funciones, watchers (si los hay), ciclo de vida. Que se lea de arriba abajo con facilidad.

## Props y modelos

- La desestructuración reactiva de props de Vue 3.5 es segura: las props desestructuradas siguen siendo reactivas *dentro de la plantilla
  y de los getters de computed/watch*. Pasar `size` a una llamada de función simple captura el valor actual;
  pasa un getter `() => size` a los composables en su lugar.
- Usa `defineModel` para los enlaces bidireccionales en lugar del código repetitivo de `modelValue` + `update:modelValue`.
  Varios modelos: `defineModel('open')`, `defineModel('query')`.
- Nunca mutes una prop. Si necesitas una copia local editable (un borrador de formulario), copia de forma explícita y nómbrala
  `draft`, con un flujo claro de restablecer y confirmar.
- Las props booleanas tienen `false` por defecto y se nombran como adjetivos (`disabled`, `loading`), no `isDisabled`.
- Prefiere una unión discriminada a un montón de booleanos opcionales:
  `variant: 'primary' | 'ghost'` es mejor que `primary?: boolean; ghost?: boolean`.

## Reglas de reactividad

```ts
// BAD: destructuring a reactive() / store loses reactivity
const { count } = useCounterStore()
// GOOD
const { count } = storeToRefs(useCounterStore())

// BAD: watch to keep derived state in sync
const fullName = ref('')
watch([first, last], () => { fullName.value = `${first.value} ${last.value}` })
// GOOD
const fullName = computed(() => `${first.value} ${last.value}`)

// Large immutable data (API lists, chart series, map features): avoid deep proxying
const rows = shallowRef<Row[]>([])
rows.value = await fetchRows()         // replace, don't mutate in place
```

- `ref` por defecto; `reactive` rara vez (objetos de formulario que nunca desestructuras ni reasignas).
- `shallowRef` / `markRaw` para listas grandes, instancias de terceros (mapa, gráfico, editor) e instancias de clase.
- `watch` es para efectos secundarios ligados a cambios de estado (sincronizar con la URL, analítica, APIs imperativas). Usa
  `onWatcherCleanup` (3.5) o el argumento `onCleanup` para cancelar el trabajo asíncrono obsoleto.
- `watchEffect` solo para efectos cortos cuyas dependencias sean obvias; prefiere fuentes explícitas de `watch`.
- `computed` debe ser puro: sin peticiones, sin mutaciones, sin `emit`.
- Refs de plantilla: `useTemplateRef<HTMLInputElement>('input')` (3.5).
- Ids estables para enlazar label y aria: `useId()` (seguro para SSR), nunca `Math.random()`.

## Composición: slots, provide/inject

- Usa slots para que los padres controlen el renderizado en lugar de añadir props para cada variación.
  Los slots con ámbito exponen datos: `<slot name="row" :item="item" />`.
- Los componentes compuestos (Tabs, Accordion, Menu) comparten estado mediante `provide`/`inject` con un
  `InjectionKey` tipado, y lanzan un error claro cuando se usan fuera del padre:

```ts
// tabs-context.ts
export interface TabsContext { active: Ref<string>; select(id: string): void }
export const TabsKey: InjectionKey<TabsContext> = Symbol('Tabs')
export function useTabsContext() {
  const ctx = inject(TabsKey)
  if (!ctx) throw new Error('<TabsTab> must be used inside <Tabs>')
  return ctx
}
```

- Hacer prop drilling de más de dos niveles para el mismo valor es la señal para usar un slot o inject,
  no un store de Pinia.

## Tamaño y responsabilidad

- Apunta a menos de 150 líneas por SFC (plantilla + script). Pasadas ~250, divide. Un componente con más de ~8
  props o varias ramas `v-if` sin relación está haciendo demasiado.
- Extrae cuando un bloque tenga su propio estado o se reutilice; no extraigas fragmentos puramente de presentación de 6 líneas
  a archivos separados "por limpieza".
- Mueve la lógica, no el marcado, a los composables: `useCombobox()`, `useDisclosure()`, `usePagination()`.
- Los elementos de lista reciben un `:key` estable a partir de la identidad de los datos, nunca el índice cuando la lista puede reordenarse.

## Patrones headless accesibles

Los widgets interactivos (combobox, dialog, menu, tabs, listbox) son difíciles de acertar. Prefiere una biblioteca
headless probada (Reka UI, o la que ya use el proyecto) con estilos de Tailwind, antes que ARIA
hecho a mano. Si lo haces a mano, sigue el patrón de WAI-ARIA Authoring Practices al pie de la letra: roles, estados,
mapa de teclado, gestión del foco, y prueba con teclado + lector de pantalla. Patrones y ejemplos:
`references/patterns.md`.

Innegociables:
- Todo input tiene una etiqueta programática. El texto de error enlazado mediante `aria-describedby`.
- Los diálogos atrapan el foco, lo restauran al cerrarse, se cierran con Escape y usan `<dialog>` o una biblioteca.
- Los botones solo con icono tienen un nombre accesible. Los SVG decorativos reciben `aria-hidden="true"`.
- Estilos de foco visibles; nunca `outline: none` sin un reemplazo.
- Respeta `prefers-reduced-motion` al usar `<Transition>`.

## Antipatrones (señales de relleno de IA)

- `watch` + `ref` reproduciendo lo que haría un solo `computed`; "al montar, pedir datos,
  fijar el estado" al estilo `useEffect` en lugar de `useFetch`/`useAsyncData`.
- Watchers con `deep: true` sobre objetos grandes "por seguridad".
- `any` en props/emits, o `props: { foo: Object }` en tiempo de ejecución sin tipo.
- SFC de 500 líneas que mezclan obtención de datos, formato, composición y lógica de modales.
- `<div @click>` como botones, etiquetas ausentes, `v-html` sobre contenido de usuarios.
- `index` como `:key` en listas ordenables o filtrables.
- Envolver cada primitiva en un componente (`<AppText>`, `<AppBox>`) sin comportamiento.
- Emitir eventos llamados `change`/`update` con una carga sin tipo en lugar de nombres de intención (`select`, `remove`).
- Buses de eventos globales (`mitt`) para la comunicación entre padre e hijo.
- `nextTick` esparcido para "arreglar" errores de temporización que en realidad son errores de estado derivado.

## Lista de verificación

- [ ] `<script setup lang="ts">`; props/emits/model/slots tipados mediante genéricos; cero `any`.
- [ ] Sin estado derivado guardado en refs; cada `watch` es un efecto secundario genuino, con limpieza si es asíncrono.
- [ ] Datos grandes o de terceros en `shallowRef`/`markRaw`.
- [ ] El componente tiene una sola responsabilidad y cabe en el presupuesto de tamaño; la lógica está extraída a composables.
- [ ] Elementos semánticos, etiquetas, soporte de teclado, foco visible (`sumi:a11y`).
- [ ] Claves estables a partir de la identidad de los datos; ids de `useId()`.
- [ ] Los estilos usan tokens y utilidades según `tailwind-craft`; sin valores mágicos en línea.

## Patrones de componentes de Vue (ampliado)

### Componentes genéricos

```vue
<script setup lang="ts" generic="T extends { id: string }">
const { items, selectedId } = defineProps<{ items: T[]; selectedId?: string }>()
const emit = defineEmits<{ select: [item: T] }>()
defineSlots<{ item(props: { item: T; selected: boolean }): any }>()
</script>

<template>
  <ul role="listbox" :aria-activedescendant="selectedId ? `opt-${selectedId}` : undefined">
    <li
      v-for="item in items"
      :id="`opt-${item.id}`"
      :key="item.id"
      role="option"
      :aria-selected="item.id === selectedId"
      @click="emit('select', item)"
    >
      <slot name="item" :item="item" :selected="item.id === selectedId" />
    </li>
  </ul>
</template>
```

Nota: un listbox real también necesita navegación con teclado (teclas de flecha, Home/End, escritura anticipada) y gestión
del foco. Prefiere una biblioteca headless salvo que implementes y pruebes el patrón completo.

### Composable de divulgación (lógica sin marcado)

```ts
export function useDisclosure(initial = false) {
  const open = ref(initial)
  const id = useId()
  const triggerProps = computed(() => ({
    'aria-expanded': open.value,
    'aria-controls': id,
    onClick: () => { open.value = !open.value },
  }))
  const panelProps = computed(() => ({ id, hidden: !open.value }))
  return { open, triggerProps, panelProps }
}
```

```vue
<button type="button" v-bind="triggerProps">Details</button>
<div v-bind="panelProps">...</div>
```

### Efecto secundario asíncrono con cancelación

```ts
const query = defineModel<string>('query', { default: '' })
const results = shallowRef<Result[]>([])

watch(query, async (q) => {
  if (q.length < 2) { results.value = []; return }
  const controller = new AbortController()
  onWatcherCleanup(() => controller.abort())
  results.value = await $fetch('/api/search', { query: { q }, signal: controller.signal })
})
```

Vue no tiene una opción de debounce integrada. Para una búsqueda con debounce usa `watchDebounced` de VueUse; el
fragmento anterior muestra solo la cancelación.

### Patrón de borrador de formulario

```ts
const { project } = defineProps<{ project: Project }>()
const emit = defineEmits<{ save: [patch: ProjectPatch]; cancel: [] }>()

const draft = ref<ProjectPatch>({ name: project.name, budget: project.budget })
const dirty = computed(() =>
  draft.value.name !== project.name || draft.value.budget !== project.budget)

watch(() => project.id, () => {          // reset only when the entity changes
  draft.value = { name: project.name, budget: project.budget }
})
```

Esta es una de las pocas copias legítimas de prop a ref: es explícita, tiene nombre y se restablece cuando cambia la identidad.

### Campo de formulario accesible

```vue
<script setup lang="ts">
const { label, error, hint } = defineProps<{ label: string; error?: string; hint?: string }>()
const value = defineModel<string>({ required: true })
const id = useId()
const describedBy = computed(() =>
  [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined)
</script>

<template>
  <div>
    <label :for="id">{{ label }}</label>
    <input :id="id" v-model="value" :aria-invalid="!!error" :aria-describedby="describedBy" />
    <p v-if="hint" :id="`${id}-hint`">{{ hint }}</p>
    <p v-if="error" :id="`${id}-error`">{{ error }}</p>
  </div>
</template>
```

### Dividir un componente gigante

Señales: muchos modos con `v-if`, más de una petición, un modal y una tabla en el mismo archivo, una sección
`methods` más larga que la plantilla.

Pasos:
1. Identifica a los dueños del estado: ¿qué estado necesita cada región? Dibújalo.
2. Extrae primero los componentes hoja de presentación (props de entrada, emits de salida).
3. Extrae la lógica a composables (`useProjectFilters`, `useBulkSelection`).
4. El original se convierte en un orquestador: obtiene datos, conecta composables, pasa props.
5. Verifica que no cambie el comportamiento (pruebas o una pasada manual con teclado + lector de pantalla).

### Componentes diferidos y asíncronos

- Prefija con `Lazy` en Nuxt (`<LazyChartPanel v-if="showChart" />`) para dividir el código de componentes pesados, bajo el pliegue
  o condicionales.
- Nuxt admite estrategias de hidratación diferida en los componentes `Lazy*` (por ejemplo, `hydrate-on-visible`,
  `hydrate-on-idle`); verifica su disponibilidad en tu versión de Nuxt antes de depender de ello.
- `defineAsyncComponent` con `loadingComponent`/`errorComponent` fuera de los auto-imports de Nuxt.
