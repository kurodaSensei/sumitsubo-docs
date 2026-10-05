<script setup lang="ts">
import { isLocaleParam } from '~/utils/routing'

definePageMeta({ validate: (route) => isLocaleParam(route.params.lang) })
</script>

<template>
  <div>reference</div>
</template>
