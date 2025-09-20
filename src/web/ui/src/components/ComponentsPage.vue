<template>
  <div class="components-page">
    <div class="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur">
      <ComponentManager />
    </div>
  </div>
</template>

<script setup>
import ComponentManager from './ComponentManager.vue';
</script>

<style scoped>
.components-page {
  @apply h-full;
}
</style>
