<template>
  <div
    class="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-6"
  >
    <!-- 头部 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-lg font-semibold text-slate-100">备份计划管理</h2>
        <p class="text-sm text-slate-400 mt-1">管理自动备份任务和计划</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="rounded-lg border border-sky-500 px-4 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/10"
          @click="$emit('refreshPlans')"
        >
          刷新计划
        </button>
        <button
          class="rounded-lg border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10"
          @click="$emit('createPlan')"
        >
          创建计划
        </button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="space-y-4">
      <!-- 加载状态 -->
      <div
        v-if="backupPlansLoading"
        class="flex items-center justify-center py-8"
      >
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"
        ></div>
        <span class="ml-2 text-sm text-slate-400">加载备份计划中...</span>
      </div>

      <!-- 空状态 -->
      <div v-else-if="backupPlans.length === 0" class="text-center py-8">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="mx-auto text-slate-500"
        >
          <path
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          ></path>
        </svg>
        <h3 class="mt-4 text-lg font-medium text-slate-300">暂无备份计划</h3>
        <p class="mt-2 text-slate-500">还没有创建任何备份计划</p>
        <button
          class="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          @click="$emit('createPlan')"
        >
          创建第一个备份计划
        </button>
      </div>

      <!-- 计划列表 -->
      <div v-else class="space-y-4">
        <div
          v-for="plan in backupPlans"
          :key="plan.id"
          class="rounded-lg border border-slate-700 bg-slate-800/40 p-4 hover:bg-slate-800/60 transition"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <h4 class="text-sm font-medium text-slate-100">
                  {{ plan.name || plan.containerName }}
                </h4>
                <span
                  :class="[
                    'px-2 py-1 text-xs rounded-full',
                    plan.enabled
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-500/20 text-slate-400',
                  ]"
                >
                  {{ plan.enabled ? "启用" : "禁用" }}
                </span>
              </div>

              <p class="text-xs text-slate-400 mb-2">
                {{ plan.description || "容器备份计划" }}
              </p>

              <div class="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span class="text-slate-500">容器:</span>
                  <span class="text-slate-300 ml-1">{{
                    plan.containerName || plan.containerId
                  }}</span>
                </div>
                <div>
                  <span class="text-slate-500">频率:</span>
                  <span class="text-slate-300 ml-1">{{
                    formatCronExpression(plan.cronExpression)
                  }}</span>
                </div>
                <div>
                  <span class="text-slate-500">备份路径:</span>
                  <span class="text-slate-300 ml-1">{{
                    plan.backupPath || "/tmp/backups"
                  }}</span>
                </div>
                <div>
                  <span class="text-slate-500">保留天数:</span>
                  <span class="text-slate-300 ml-1"
                    >{{ plan.retentionDays || "30" }}天</span
                  >
                </div>
              </div>

              <div class="flex items-center gap-4 mt-3 text-xs">
                <div class="flex items-center gap-1">
                  <div
                    :class="[
                      'w-2 h-2 rounded-full',
                      plan.includeVolumes ? 'bg-emerald-500' : 'bg-slate-500',
                    ]"
                  ></div>
                  <span class="text-slate-400">数据卷</span>
                </div>
                <div class="flex items-center gap-1">
                  <div
                    :class="[
                      'w-2 h-2 rounded-full',
                      plan.includeConfig ? 'bg-emerald-500' : 'bg-slate-500',
                    ]"
                  ></div>
                  <span class="text-slate-400">配置</span>
                </div>
                <div class="flex items-center gap-1">
                  <div
                    :class="[
                      'w-2 h-2 rounded-full',
                      plan.compress ? 'bg-emerald-500' : 'bg-slate-500',
                    ]"
                  ></div>
                  <span class="text-slate-400">压缩</span>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex items-center gap-1 ml-4">
              <button
                class="rounded border border-blue-500/40 px-2 py-1 text-xs text-blue-300 transition hover:bg-blue-500/10"
                @click="$emit('executePlan', plan)"
                :disabled="!plan.enabled"
              >
                执行
              </button>
              <button
                class="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-700"
                @click="$emit('editPlan', plan)"
              >
                编辑
              </button>
              <button
                class="rounded border border-red-500/40 px-2 py-1 text-xs text-red-300 transition hover:bg-red-500/10"
                @click="$emit('deletePlan', plan)"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 备份计划管理组件
 * 负责显示和管理备份计划列表
 */

defineProps({
  backupPlans: {
    type: Array,
    default: () => [],
  },
  backupPlansLoading: {
    type: Boolean,
    default: false,
  },
});

defineEmits([
  "refreshPlans",
  "createPlan",
  "executePlan",
  "editPlan",
  "deletePlan",
]);

// 格式化Cron表达式为可读文本
function formatCronExpression(cronExpression) {
  if (!cronExpression) return "未设置";

  const cronMap = {
    "0 2 * * *": "每天凌晨2点",
    "0 0 * * 0": "每周日",
    "0 0 1 * *": "每月1号",
    "0 */6 * * *": "每6小时",
    "0 */12 * * *": "每12小时",
    "0 0 */7 * *": "每7天",
  };

  return cronMap[cronExpression] || cronExpression;
}
</script>
