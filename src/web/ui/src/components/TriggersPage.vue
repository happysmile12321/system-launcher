<template>
  <div class="triggers-page">
    <div class="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur">
      <TriggerManager />
    </div>
  </div>
</template>

<script setup>
import TriggerManager from './TriggerManager.vue';
</script>

<style scoped>
.triggers-page {
  @apply h-full;
}
</style>
