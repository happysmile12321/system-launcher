<template>
  <div class="workflows-page">
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-[22rem_1fr]">
      <!-- 工作流列表 -->
      <section class="flex h-full flex-col gap-4">
        <div class="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur">
          <div class="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-300">工作流列表</h2>
            <button
              class="rounded-lg border border-sky-500 px-3 py-1 text-xs font-medium text-sky-300 transition hover:bg-sky-500/10"
              @click="createWorkflow"
            >
              + 新建
            </button>
          </div>
          <div class="max-h-[16rem] overflow-y-auto px-2 py-2 scrollbar-hide">
            <template v-if="loadingStates.list">
              <div class="space-y-3">
                <div v-for="i in 3" :key="i" class="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                  <div class="flex items-start gap-3">
                    <div class="mt-1 h-2 w-2 rounded-full bg-slate-600"></div>
                    <div class="flex-1 space-y-2">
                      <SkeletonLoader type="text" width="60%" height="0.875rem" />
                      <SkeletonLoader type="text" width="40%" height="0.75rem" />
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <template v-else-if="workflows.length">
              <button
                v-for="workflow in workflows"
                :key="workflow.id"
                class="group flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition"
                :class="selectedWorkflowId === workflow.id ? 'bg-sky-500/10 border border-sky-500/40' : 'border border-transparent hover:border-slate-700 hover:bg-slate-800/40'"
                @click="selectWorkflow(workflow.id)"
              >
                <span class="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full"
                  :class="workflow.enabled ? 'bg-emerald-400' : 'bg-slate-600'" />
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-slate-100">{{ workflow.name || workflow.id }}</p>
                  <p class="mt-1 line-clamp-2 text-xs text-slate-400">{{ workflow.description || '未填写描述' }}</p>
                </div>
              </button>
            </template>
            <p v-else class="px-3 py-6 text-sm text-slate-500">还没有任何工作流，点击右上角的"新建"开始吧。</p>
          </div>
        </div>

        <!-- 工作流元数据 -->
        <div v-if="selectedWorkflow" class="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-5">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-4">工作流信息</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1">名称</label>
              <input
                v-model="currentWorkflow.name"
                class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="工作流名称"
                @input="updateWorkflow({})"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1">描述</label>
              <textarea
                v-model="currentWorkflow.description"
                class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="工作流描述"
                rows="3"
                @input="updateWorkflow({})"
              />
            </div>
            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 text-sm text-slate-300">
                <input
                  v-model="currentWorkflow.enabled"
                  type="checkbox"
                  class="rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-sky-500"
                  @change="updateWorkflow({})"
                />
                启用工作流
              </label>
              <button
                v-if="canSave"
                class="rounded-lg bg-sky-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-sky-700"
                :disabled="loadingStates.saving"
                @click="saveWorkflow"
              >
                {{ loadingStates.saving ? '保存中...' : '保存' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 工作流设计器 -->
      <section class="flex h-full flex-col">
        <div class="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur flex-1 flex flex-col">
          <div class="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-300">工作流设计器</h2>
            <div class="flex items-center gap-2">
              <span v-if="hasUnsavedChanges" class="text-xs text-amber-400">有未保存的更改</span>
              <button
                v-if="canSave"
                class="rounded-lg bg-sky-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-sky-700"
                :disabled="loadingStates.saving"
                @click="saveWorkflow"
              >
                {{ loadingStates.saving ? '保存中...' : '保存' }}
              </button>
            </div>
          </div>
          
          <div class="flex-1 p-5">
            <template v-if="loadingStates.detail">
              <div class="flex items-center justify-center h-full">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
                <span class="ml-2 text-sm text-slate-400">加载工作流中...</span>
              </div>
            </template>
            <template v-else-if="currentWorkflow">
              <div class="space-y-4">
                <div v-if="currentWorkflow.steps.length === 0" class="text-center py-12">
                  <svg class="w-12 h-12 text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  <h3 class="text-lg font-medium text-slate-300 mb-2">开始构建工作流</h3>
                  <p class="text-sm text-slate-500">添加步骤来构建您的工作流</p>
                </div>
                <div v-else class="space-y-3">
                  <div
                    v-for="(step, index) in currentWorkflow.steps"
                    :key="index"
                    class="rounded-lg border border-slate-700 bg-slate-800/40 p-4"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <span class="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-xs font-medium text-white">
                          {{ index + 1 }}
                        </span>
                        <div>
                          <h4 class="text-sm font-medium text-slate-100">{{ step.name || '未命名步骤' }}</h4>
                          <p class="text-xs text-slate-400">{{ step.description || '无描述' }}</p>
                        </div>
                      </div>
                      <button
                        class="text-slate-400 hover:text-red-400 transition-colors"
                        @click="removeStep(index)"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="text-center py-12">
              <svg class="w-12 h-12 text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <h3 class="text-lg font-medium text-slate-300 mb-2">选择一个工作流</h3>
              <p class="text-sm text-slate-500">从左侧列表中选择一个工作流开始编辑</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useWorkflows } from '../hooks/useWorkflows.js';
import SkeletonLoader from './SkeletonLoader.vue';

const {
  workflows,
  selectedWorkflowId,
  currentWorkflow,
  loadingStates,
  selectedWorkflow,
  hasUnsavedChanges,
  canSave,
  fetchWorkflows,
  selectWorkflow,
  createWorkflow,
  saveWorkflow,
  updateWorkflow,
  removeStep,
} = useWorkflows();

onMounted(() => {
  fetchWorkflows();
});
</script>

<style scoped>
.workflows-page {
  @apply h-full;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
