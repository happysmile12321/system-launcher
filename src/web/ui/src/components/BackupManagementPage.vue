<template>
  <div class="backup-management-page">
    <div class="space-y-6">
      <!-- 备份管理标题 -->
      <div class="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-semibold text-slate-100">备份管理</h2>
            <p class="text-sm text-slate-400 mt-1">管理数据备份和恢复</p>
          </div>
        </div>
        
        <div class="text-sm text-slate-400 mb-4">
          支持数据卷和配置备份，可设置定时任务自动执行
        </div>

        <!-- 备份工作流列表 -->
        <div v-if="backupWorkflows.length > 0" class="space-y-3">
          <h4 class="text-sm font-medium text-slate-300">现有备份工作流</h4>
          <div
            v-for="workflow in backupWorkflows"
            :key="workflow.id"
            class="rounded-lg border border-slate-700 bg-slate-800/40 p-3"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-slate-200">{{ workflow.name }}</p>
                <p class="text-xs text-slate-400">Cron: {{ workflow.metadata?.cronExpression }}</p>
              </div>
              <button
                class="rounded border border-red-500/40 px-2 py-1 text-xs text-red-300 transition hover:bg-red-500/10"
                @click="deleteBackupWorkflow(workflow.id)"
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
import { ref, onMounted } from 'vue';

const backupWorkflows = ref([]);

// 获取备份工作流列表
async function fetchBackupWorkflows() {
  try {
    const response = await fetch('/api/backup-management');
    const data = await response.json();
    
    if (data.success) {
      backupWorkflows.value = data.data || [];
    }
  } catch (error) {
    console.error('Failed to fetch backup workflows:', error);
  }
}

// 删除备份工作流
async function deleteBackupWorkflow(workflowId) {
  if (!confirm('确定要删除这个备份工作流吗？')) return;

  try {
    const response = await fetch(`/api/backup-management/${workflowId}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    
    if (data.success) {
      await fetchBackupWorkflows();
    }
  } catch (error) {
    console.error('Failed to delete backup workflow:', error);
  }
}

onMounted(() => {
  fetchBackupWorkflows();
});
</script>

<style scoped>
.backup-management-page {
  @apply h-full;
}
</style>
