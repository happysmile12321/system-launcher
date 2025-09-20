<template>
  <div class="containers-tab">
    <div class="tab-header">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <h3 class="text-base font-medium text-slate-100">容器列表</h3>
          <div class="flex items-center space-x-2">
            <label class="flex items-center text-sm text-slate-400">
              <input
                v-model="showAllContainers"
                type="checkbox"
                class="mr-2 rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-sky-500"
                @change="fetchContainers"
              />
              显示所有容器
            </label>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button
            class="btn-secondary"
            @click="fetchContainers"
            :disabled="loading"
          >
            <svg v-if="loading" class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            刷新
          </button>
        </div>
      </div>
    </div>

    <div class="tab-content">
      <div v-if="loading" class="loading-state">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
        <p class="text-sm text-slate-400 mt-2">加载容器中...</p>
      </div>

      <div v-else-if="containers.length === 0" class="empty-state">
        <div class="text-center py-12">
          <svg class="w-12 h-12 text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
          </svg>
          <h3 class="text-lg font-medium text-slate-300 mb-2">暂无容器</h3>
          <p class="text-sm text-slate-500">没有找到任何容器</p>
        </div>
      </div>

      <div v-else class="containers-list">
        <div class="table-container">
          <table class="containers-table">
            <thead>
              <tr>
                <th class="text-left">容器</th>
                <th class="text-left">镜像</th>
                <th class="text-left">状态</th>
                <th class="text-left">端口</th>
                <th class="text-left">创建时间</th>
                <th class="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="container in containers" :key="container.ID" class="container-row">
                <td class="container-info">
                  <div class="flex items-center space-x-3">
                    <div class="container-icon">
                      <svg class="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                      </svg>
                    </div>
                    <div>
                      <div class="font-medium text-slate-100">{{ container.Names || container.ID }}</div>
                      <div class="text-xs text-slate-500">{{ container.ID.substring(0, 12) }}</div>
                    </div>
                  </div>
                </td>
                <td class="image-info">
                  <div class="text-sm text-slate-300">{{ container.Image }}</div>
                </td>
                <td class="status-cell">
                  <span class="status-badge" :class="getStatusClass(container.State)">
                    {{ container.Status }}
                  </span>
                </td>
                <td class="ports-cell">
                  <div v-if="container.Ports" class="text-xs text-slate-400">
                    {{ formatPorts(container.Ports) }}
                  </div>
                  <div v-else class="text-xs text-slate-500">-</div>
                </td>
                <td class="created-cell">
                  <div class="text-xs text-slate-400">{{ formatDate(container.CreatedAt) }}</div>
                </td>
                <td class="actions-cell">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      v-if="container.State === 'running'"
                      class="action-btn stop"
                      @click="stopContainer(container.ID)"
                      :disabled="loading"
                    >
                      停止
                    </button>
                    <button
                      v-else
                      class="action-btn start"
                      @click="startContainer(container.ID)"
                      :disabled="loading"
                    >
                      启动
                    </button>
                    <button
                      class="action-btn logs"
                      @click="showLogs(container.ID)"
                    >
                      日志
                    </button>
                    <button
                      class="action-btn delete"
                      @click="removeContainer(container.ID)"
                      :disabled="loading"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 日志模态框 -->
    <div v-if="showLogsModal" class="modal-overlay" @click="closeLogsModal">
      <div class="modal-content logs-modal" @click.stop>
        <div class="modal-header">
          <h3 class="text-lg font-semibold text-slate-100">容器日志</h3>
          <button class="modal-close" @click="closeLogsModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="logs-container">
            <pre class="logs-content">{{ currentLogs }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 响应式数据
const containers = ref([]);
const loading = ref(false);
const showAllContainers = ref(false);
const showLogsModal = ref(false);
const currentLogs = ref('');

// 获取容器列表
async function fetchContainers() {
  loading.value = true;
  try {
    const response = await fetch('/api/containers');
    const data = await response.json();
    
    if (data.success) {
      containers.value = data.data;
    }
  } catch (error) {
    console.error('Failed to fetch containers:', error);
  } finally {
    loading.value = false;
  }
}

// 启动容器
async function startContainer(containerId) {
  loading.value = true;
  try {
    const response = await fetch(`/api/containers/${containerId}/start`, {
      method: 'POST'
    });
    const data = await response.json();
    
    if (data.success) {
      await fetchContainers();
    }
  } catch (error) {
    console.error('Failed to start container:', error);
  } finally {
    loading.value = false;
  }
}

// 停止容器
async function stopContainer(containerId) {
  loading.value = true;
  try {
    const response = await fetch(`/api/containers/${containerId}/stop`, {
      method: 'POST'
    });
    const data = await response.json();
    
    if (data.success) {
      await fetchContainers();
    }
  } catch (error) {
    console.error('Failed to stop container:', error);
  } finally {
    loading.value = false;
  }
}

// 删除容器
async function removeContainer(containerId) {
  if (!confirm('确定要删除这个容器吗？')) return;
  
  loading.value = true;
  try {
    const response = await fetch(`/api/containers/${containerId}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    
    if (data.success) {
      await fetchContainers();
    }
  } catch (error) {
    console.error('Failed to remove container:', error);
  } finally {
    loading.value = false;
  }
}

// 显示日志
async function showLogs(containerId) {
  try {
    const response = await fetch(`/api/containers/${containerId}/logs?tail=100`);
    const data = await response.json();
    
    if (data.success) {
      currentLogs.value = data.data.logs;
      showLogsModal.value = true;
    }
  } catch (error) {
    console.error('Failed to get container logs:', error);
  }
}

// 关闭日志模态框
function closeLogsModal() {
  showLogsModal.value = false;
  currentLogs.value = '';
}

// 获取状态样式类
function getStatusClass(state) {
  switch (state) {
    case 'running':
      return 'running';
    case 'exited':
      return 'exited';
    default:
      return 'unknown';
  }
}

// 格式化端口
function formatPorts(ports) {
  if (!ports) return '-';
  return ports.split(',').slice(0, 2).join(', ');
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// 组件挂载时获取容器列表
onMounted(() => {
  fetchContainers();
});
</script>

<style scoped>
.containers-tab {
  @apply h-full flex flex-col;
}

.tab-header {
  @apply px-6 py-4 border-b border-slate-700;
}

.tab-content {
  @apply flex-1 overflow-hidden;
}

.loading-state, .empty-state {
  @apply flex flex-col items-center justify-center h-full;
}

.containers-list {
  @apply h-full overflow-hidden;
}

.table-container {
  @apply h-full overflow-auto;
}

.containers-table {
  @apply w-full;
}

.containers-table th {
  @apply px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider border-b border-slate-700;
}

.containers-table td {
  @apply px-4 py-3 border-b border-slate-800;
}

.container-row:hover {
  @apply bg-slate-800/50;
}

.status-badge {
  @apply inline-flex items-center px-2 py-1 rounded-full text-xs font-medium;
}

.status-badge.running {
  @apply bg-green-900/20 text-green-400;
}

.status-badge.exited {
  @apply bg-red-900/20 text-red-400;
}

.status-badge.unknown {
  @apply bg-gray-900/20 text-gray-400;
}

.action-btn {
  @apply px-3 py-1 text-xs font-medium rounded transition-colors;
}

.action-btn.start {
  @apply bg-green-600 text-white hover:bg-green-700;
}

.action-btn.stop {
  @apply bg-red-600 text-white hover:bg-red-700;
}

.action-btn.logs {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.action-btn.delete {
  @apply bg-red-600 text-white hover:bg-red-700;
}

.action-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.btn-secondary {
  @apply flex items-center px-3 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded transition-colors;
}

.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full mx-4;
}

.logs-modal {
  @apply max-w-6xl;
}

.modal-header {
  @apply flex items-center justify-between px-6 py-4 border-b border-slate-700;
}

.modal-close {
  @apply text-slate-400 hover:text-slate-200 transition-colors;
}

.modal-body {
  @apply p-6;
}

.logs-container {
  @apply bg-slate-900 rounded border border-slate-700 max-h-96 overflow-auto;
}

.logs-content {
  @apply p-4 text-sm text-slate-300 font-mono whitespace-pre-wrap;
}
</style>
