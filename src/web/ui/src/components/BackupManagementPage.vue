<template>
  <div class="backup-management-page">
    <!-- 页面头部 -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-100 mb-2">数据备份管理</h1>
      <p class="text-slate-400">管理容器备份计划和飞书文件存储</p>
    </div>

    <!-- 主要内容区域 -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <!-- 飞书文件管理 -->
      <div class="xl:col-span-1">
        <FeishuFileManager
          :feishu-files="feishuFiles"
          :feishu-files-loading="feishuFilesLoading"
          :feishu-config-status="feishuConfigStatus"
          :feishu-auth-status="feishuAuthStatus"
          :feishu-web-socket-status="feishuWebSocketStatus"
          :feishu-web-socket-loading="feishuWebSocketLoading"
          @start-web-socket="startFeishuWebSocket"
          @stop-web-socket="stopFeishuWebSocket"
          @open-long-connection-config="openFeishuLongConnectionConfig"
          @show-config-dialog="showFeishuConfigDialog = true"
          @refresh-files="refreshFeishuFiles"
          @create-backup-plan="createBackupPlan"
          @download-file="downloadFile"
          @delete-file="deleteFile"
        />
      </div>

      <!-- 备份计划管理 -->
      <div class="xl:col-span-1">
        <BackupPlanManager
          :backup-plans="backupPlans"
          :backup-plans-loading="backupPlansLoading"
          @refresh-plans="refreshBackupPlans"
          @create-plan="createBackupPlan"
          @execute-plan="executeBackupPlan"
          @edit-plan="editBackupPlan"
          @delete-plan="handleDeleteBackupPlan"
        />
      </div>
    </div>

    <!-- 备份创建对话框 -->
    <BackupCreateDialog
      :show="showBackupDialog"
      :containers="containers"
      :initial-form="backupForm"
      @close="showBackupDialog = false"
      @create="handleCreateBackupWorkflow"
      @show-cron-helper="showCronHelper = true"
    />
  </div>
</template>

<script setup>
/**
 * 备份管理页面组件
 * 负责协调飞书文件管理和备份计划管理
 */

import { onMounted } from "vue";
import { useBackupManagement } from "../hooks/useBackupManagement.js";
import FeishuFileManager from "./FeishuFileManager.vue";
import BackupPlanManager from "./BackupPlanManager.vue";
import BackupCreateDialog from "./BackupCreateDialog.vue";

// 使用备份管理hooks
const {
  // 状态
  feishuFiles,
  feishuFilesLoading,
  feishuConfigStatus,
  feishuAuthStatus,
  feishuWebSocketStatus,
  feishuWebSocketLoading,
  backupPlans,
  backupPlansLoading,
  containers,
  showBackupDialog,
  showCronHelper,
  showFeishuConfigDialog,
  backupForm,

  // 方法
  refreshFeishuFiles,
  refreshBackupPlans,
  startFeishuWebSocket,
  stopFeishuWebSocket,
  createBackupWorkflow,
  deleteBackupPlan,
  downloadFile,
  deleteFile,
  initializeData,
} = useBackupManagement();

// 创建备份计划
function createBackupPlan() {
  showBackupDialog.value = true;
}

// 处理创建备份工作流
async function handleCreateBackupWorkflow(formData) {
  const success = await createBackupWorkflow();
  if (success) {
    // 可以添加成功提示
    console.log("备份工作流创建成功");
  }
}

// 执行备份计划
async function executeBackupPlan(plan) {
  try {
    const response = await fetch(
      `/api/backup-management/workflows/${plan.id}/execute`,
      {
        method: "POST",
      }
    );
    const data = await response.json();

    if (data.success) {
      console.log("备份计划执行成功");
    }
  } catch (error) {
    console.error("执行备份计划失败:", error);
  }
}

// 编辑备份计划
function editBackupPlan(plan) {
  console.log("编辑备份计划:", plan);
  // 这里可以实现编辑功能
}

// 删除备份计划
async function handleDeleteBackupPlan(plan) {
  if (!confirm("确定要删除这个备份计划吗？")) return;

  const success = await deleteBackupPlan(plan);
  if (success) {
    console.log("备份计划删除成功");
  }
}

// 打开飞书长连接配置
function openFeishuLongConnectionConfig() {
  console.log("打开飞书长连接配置");
  // 这里可以实现长连接配置功能
}

// 组件挂载时初始化数据
onMounted(() => {
  initializeData();
});
</script>

<style scoped>
.backup-management-page {
  @apply h-full p-6;
}

/* 响应式布局优化 */
@media (max-width: 1280px) {
  .backup-management-page {
    @apply p-4;
  }
}

@media (max-width: 768px) {
  .backup-management-page {
    @apply p-3;
  }
}
</style>
