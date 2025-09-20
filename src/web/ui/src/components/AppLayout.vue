<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
      <div class="mx-auto max-w-7xl px-6 py-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-sm uppercase tracking-[0.3em] text-sky-400">Orchestrator Pro</p>
            <h1 class="mt-1 text-2xl font-semibold">可视化工作流设计器</h1>
          </div>
          <div class="text-right text-xs text-slate-400">
            <p>UI 2.0 · 阶段一</p>
            <p class="opacity-70">结构化配置 &amp; 核心骨架</p>
          </div>
        </div>
        <nav class="flex space-x-1">
          <router-link
            v-for="route in navigationRoutes"
            :key="route.path"
            :to="route.path"
            class="rounded-lg px-4 py-2 text-sm font-medium transition"
            :class="isActive(route.path) ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'"
          >
            {{ route.meta.title }}
          </router-link>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-6 py-8">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// 导航路由配置
const navigationRoutes = [
  { path: '/workflows', meta: { title: '工作流' } },
  { path: '/components', meta: { title: '组件' } },
  { path: '/triggers', meta: { title: '触发器' } },
  { path: '/backup', meta: { title: '备份管理' } },
  { path: '/containers', meta: { title: '容器管理' } },
  { path: '/services', meta: { title: '系统服务' } }
];

// 检查路由是否激活
const isActive = (path) => {
  return route.path === path;
};
</script>

<style scoped>
/* 路由链接样式 */
.router-link-active {
  @apply bg-slate-800 text-slate-100;
}
</style>
