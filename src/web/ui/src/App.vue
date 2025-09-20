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
          <button 
            class="rounded-lg px-4 py-2 text-sm font-medium transition" 
            :class="activeTab === 'workflows' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'"
            @click="activeTab = 'workflows'"
          >
            工作流
          </button>
          <button 
            class="rounded-lg px-4 py-2 text-sm font-medium transition" 
            :class="activeTab === 'components' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'"
            @click="activeTab = 'components'"
          >
            组件
          </button>
          <button 
            class="rounded-lg px-4 py-2 text-sm font-medium transition" 
            :class="activeTab === 'triggers' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'"
            @click="activeTab = 'triggers'"
          >
            触发器
          </button>
          <button 
            class="rounded-lg px-4 py-2 text-sm font-medium transition" 
            :class="activeTab === 'database' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'"
            @click="activeTab = 'database'"
          >
            备份管理
          </button>
          <button 
            class="rounded-lg px-4 py-2 text-sm font-medium transition" 
            :class="activeTab === 'containers' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'"
            @click="activeTab = 'containers'"
          >
            容器管理
          </button>
          <button 
            class="rounded-lg px-4 py-2 text-sm font-medium transition" 
            :class="activeTab === 'settings' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'"
            @click="activeTab = 'settings'"
          >
            系统服务
          </button>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-6 py-8">
      <!-- 工作流页面 -->
      <WorkflowsPage v-if="activeTab === 'workflows'" />

      <!-- 组件页面 -->
      <ComponentsPage v-else-if="activeTab === 'components'" />

      <!-- 触发器页面 -->
      <TriggersPage v-else-if="activeTab === 'triggers'" />

      <!-- 备份管理页面 -->
      <BackupManagementPage v-else-if="activeTab === 'database'" />

      <!-- 容器管理页面 -->
      <ContainerManagement v-else-if="activeTab === 'containers'" />

      <!-- 系统服务页面 -->
      <SystemServicesPage v-else-if="activeTab === 'settings'" />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import WorkflowsPage from './components/WorkflowsPage.vue';
import ComponentsPage from './components/ComponentsPage.vue';
import TriggersPage from './components/TriggersPage.vue';
import BackupManagementPage from './components/BackupManagementPage.vue';
import ContainerManagement from './components/ContainerManagement.vue';
import SystemServicesPage from './components/SystemServicesPage.vue';

// 响应式数据
const activeTab = ref('workflows');
</script>

<style scoped>
/* 全局样式 */
</style>
