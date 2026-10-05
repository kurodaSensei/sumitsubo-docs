<script setup lang="ts">
import { isKindParam, isLocaleParam } from '~/utils/routing'

definePageMeta({
  validate: (route) => isLocaleParam(route.params.lang) && isKindParam(route.params.kind)
})
</script>

<template>
  <div>detail</div>
</template>
