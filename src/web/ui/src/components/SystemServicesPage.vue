<template>
  <div class="system-services-page">
    <div class="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur">
      <SystemServices />
    </div>
  </div>
</template>

<script setup>
import SystemServices from './SystemServices.vue';
</script>

<style scoped>
.system-services-page {
  @apply h-full;
}
</style>
