<template>
  <div class="backup-management-page">
    <div class="space-y-6">
      <!-- 飞书文件管理 -->
      <div 
        :class="[
          'rounded-2xl border backdrop-blur p-6 transition-all duration-300',
          feishuConfigStatus.configured 
            ? 'border-slate-800 bg-slate-900/60' 
            : 'border-slate-700 bg-slate-900/30 opacity-60'
        ]"
      >
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-semibold text-slate-100">飞书文件管理</h2>
            <p class="text-sm text-slate-400 mt-1">管理飞书云盘中的文件和备份计划</p>
            <div class="mt-2">
              <a 
                href="https://t1zosp7g1k7.feishu.cn/docx/QNN6dcEefohapsxmpMTcBnusnkf#share-WdW3dzZq2oHl8ix57GUcNLKun5g" 
                target="_blank" 
                class="text-xs text-sky-400 hover:text-sky-300 underline"
              >
                📖 查看飞书集成配置步骤
              </a>
            </div>
            <!-- WebSocket状态指示器 -->
            <div class="flex items-center gap-2 mt-2">
              <div class="flex items-center gap-1">
                <div 
                  :class="[
                    'w-2 h-2 rounded-full',
                    feishuWebSocketStatus.connected ? 'bg-green-500' : 'bg-red-500'
                  ]"
                ></div>
                <span class="text-xs text-slate-400">
                  WebSocket: {{ feishuWebSocketStatus.connected ? '已连接' : '未连接' }}
                </span>
              </div>
              <button
                v-if="!feishuWebSocketStatus.connected"
                @click="startFeishuWebSocket"
                :disabled="feishuWebSocketLoading || !feishuConfigStatus.configured"
                class="text-xs text-sky-400 hover:text-sky-300 underline disabled:opacity-50"
              >
                {{ feishuWebSocketLoading ? '启动中...' : '启动连接' }}
              </button>
              <button
                v-else
                @click="stopFeishuWebSocket"
                :disabled="feishuWebSocketLoading"
                class="text-xs text-amber-400 hover:text-amber-300 underline disabled:opacity-50"
              >
                {{ feishuWebSocketLoading ? '停止中...' : '停止连接' }}
              </button>
              <button
                v-if="!feishuWebSocketStatus.connected && feishuConfigStatus.configured"
                @click="openFeishuLongConnectionConfig"
                class="text-xs text-purple-400 hover:text-purple-300 underline"
              >
                🔗 配置长连接
              </button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="rounded-lg border border-amber-500 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/10"
              @click="showFeishuConfigDialog = true"
              v-if="!feishuAuthStatus.authenticated"
            >
              ⚙️ 配置飞书
            </button>
            <button
              class="rounded-lg border border-sky-500 px-4 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="refreshFeishuFiles"
              :disabled="!feishuConfigStatus.configured"
            >
              刷新文件列表
            </button>
            <button
              class="rounded-lg border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="createBackupPlan"
              :disabled="!feishuConfigStatus.configured"
            >
              创建备份计划
            </button>
          </div>
        </div>

        <!-- 文件列表 -->
        <div class="space-y-4">
          <div v-if="feishuFilesLoading" class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
            <span class="ml-2 text-sm text-slate-400">加载文件列表中...</span>
          </div>
          
          <div v-else-if="feishuFiles.length === 0" class="text-center py-8">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mx-auto text-slate-500">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
            </svg>
            <h3 class="mt-4 text-lg font-medium text-slate-300">暂无文件</h3>
            <p class="mt-2 text-slate-500">飞书云盘中还没有文件</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="file in feishuFiles"
              :key="file.token"
              class="rounded-lg border border-slate-700 bg-slate-800/40 p-4 hover:bg-slate-800/60 transition"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h4 class="text-sm font-medium text-slate-100 truncate">{{ file.name }}</h4>
                  <p class="text-xs text-slate-400 mt-1">{{ file.type === 'file' ? '文件' : '文件夹' }}</p>
                  <p class="text-xs text-slate-500 mt-1">{{ formatFileSize(file.size) }}</p>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    class="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-700"
                    @click="downloadFile(file)"
                  >
                    下载
                  </button>
                  <button
                    class="rounded border border-red-500/40 px-2 py-1 text-xs text-red-300 transition hover:bg-red-500/10"
                    @click="deleteFile(file)"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 备份计划管理 -->
      <div class="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-semibold text-slate-100">备份计划管理</h2>
            <p class="text-sm text-slate-400 mt-1">管理自动备份任务和计划</p>
          </div>
          <button
            class="rounded-lg border border-sky-500 px-4 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/10"
            @click="refreshBackupPlans"
          >
            刷新计划
          </button>
        </div>

        <div v-if="backupPlansLoading" class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
          <span class="ml-2 text-sm text-slate-400">加载备份计划中...</span>
        </div>

        <div v-else-if="backupPlans.length === 0" class="text-center py-8">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mx-auto text-slate-500">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
          <h3 class="mt-4 text-lg font-medium text-slate-300">暂无备份计划</h3>
          <p class="mt-2 text-slate-500">还没有创建任何备份计划</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="plan in backupPlans"
            :key="plan.id"
            class="rounded-lg border border-slate-700 bg-slate-800/40 p-4"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="text-sm font-medium text-slate-100">{{ plan.name }}</h4>
                <p class="text-xs text-slate-400 mt-1">{{ plan.description }}</p>
                <p class="text-xs text-slate-500 mt-1">
                  频率: {{ plan.schedule }} | 状态: 
                  <span :class="plan.enabled ? 'text-emerald-400' : 'text-slate-500'">
                    {{ plan.enabled ? '启用' : '禁用' }}
                  </span>
                </p>
              </div>
              <div class="flex items-center gap-1">
                <button
                  class="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-700"
                  @click="editBackupPlan(plan)"
                >
                  编辑
                </button>
                <button
                  class="rounded border border-red-500/40 px-2 py-1 text-xs text-red-300 transition hover:bg-red-500/10"
                  @click="deleteBackupPlan(plan)"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 备份创建对话框 -->
    <div v-if="showBackupDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div class="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-slate-100">创建容器自动备份</h3>
          <p class="text-sm text-slate-400 mt-1">为选中的容器创建定时备份工作流</p>
        </div>

        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium text-slate-300">选择容器</label>
            <select
              v-model="backupForm.containerId"
              class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            >
              <option value="">请选择容器</option>
              <option v-for="container in containers" :key="container.id" :value="container.id">
                {{ container.name || container.id }} ({{ getContainerStatus(container.status) }})
              </option>
            </select>
          </div>

          <div>
            <label class="text-sm font-medium text-slate-300">备份频率 (Cron表达式)</label>
            <div class="mt-1 flex items-center gap-2">
              <input
                v-model="backupForm.cronExpression"
                type="text"
                class="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                placeholder="0 2 * * * (每天凌晨2点)"
              />
              <button
                class="rounded-lg border border-emerald-500 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/10"
                @click="showCronHelper = true"
              >
                AI助手
              </button>
            </div>
            <p class="mt-1 text-xs text-slate-500">使用AI助手生成Cron表达式，或手动输入</p>
          </div>

          <div>
            <label class="text-sm font-medium text-slate-300">备份路径</label>
            <input
              v-model="backupForm.backupPath"
              type="text"
              class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              placeholder="/tmp/backups"
            />
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-slate-300">包含数据卷</p>
                <p class="text-xs text-slate-500">备份容器的数据卷内容</p>
              </div>
              <label class="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" class="peer sr-only" v-model="backupForm.includeVolumes" />
                <div class="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-5"></div>
              </label>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-slate-300">包含配置</p>
                <p class="text-xs text-slate-500">备份容器的配置信息</p>
              </div>
              <label class="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" class="peer sr-only" v-model="backupForm.includeConfig" />
                <div class="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-5"></div>
              </label>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-slate-300">压缩备份</p>
                <p class="text-xs text-slate-500">将备份文件压缩为tar.gz格式</p>
              </div>
              <label class="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" class="peer sr-only" v-model="backupForm.compress" />
                <div class="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-5"></div>
              </label>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-slate-300">上传到飞书</p>
                <p class="text-xs text-slate-500">备份完成后自动上传到飞书云盘</p>
              </div>
              <label class="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" class="peer sr-only" v-model="backupForm.uploadToFeishu" />
                <div class="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-5"></div>
              </label>
            </div>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <button
            class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            @click="showBackupDialog = false"
          >
            取消
          </button>
          <button
            class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            @click="createBackupWorkflow"
            :disabled="!backupForm.containerId"
          >
            创建备份工作流
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 响应式数据
const feishuFiles = ref([]);
const feishuFilesLoading = ref(false);
const backupPlans = ref([]);
const backupPlansLoading = ref(false);
const containers = ref([]);
const showBackupDialog = ref(false);
const showCronHelper = ref(false);
const showFeishuConfigDialog = ref(false);

// 飞书配置状态
const feishuConfigStatus = ref({
  configured: false
});

// 飞书认证状态
const feishuAuthStatus = ref({
  authenticated: false
});

// WebSocket状态
const feishuWebSocketStatus = ref({
  connected: false
});

const feishuWebSocketLoading = ref(false);

// 备份表单
const backupForm = ref({
  containerId: '',
  cronExpression: '0 2 * * *',
  backupPath: '/tmp/backups',
  includeVolumes: true,
  includeConfig: true,
  compress: true,
  uploadToFeishu: true
});

// 获取飞书文件列表
async function refreshFeishuFiles() {
  feishuFilesLoading.value = true;
  try {
    const response = await fetch('/api/feishu/files');
    const data = await response.json();
    
    if (data.success) {
      feishuFiles.value = data.data || [];
    }
  } catch (error) {
    console.error('获取飞书文件失败:', error);
  } finally {
    feishuFilesLoading.value = false;
  }
}

// 获取备份计划列表
async function refreshBackupPlans() {
  backupPlansLoading.value = true;
  try {
    const response = await fetch('/api/backup-management');
    const data = await response.json();
    
    if (data.success) {
      backupPlans.value = data.data || [];
    }
  } catch (error) {
    console.error('获取备份计划失败:', error);
  } finally {
    backupPlansLoading.value = false;
  }
}

// 获取容器列表
async function fetchContainers() {
  try {
    const response = await fetch('/api/containers');
    const data = await response.json();
    
    if (data.success) {
      containers.value = data.data || [];
    }
  } catch (error) {
    console.error('获取容器列表失败:', error);
  }
}

// 检查飞书配置状态
async function checkFeishuConfig() {
  try {
    const response = await fetch('/api/feishu/config');
    const data = await response.json();
    
    if (data.success) {
      feishuConfigStatus.value = data.data;
    }
  } catch (error) {
    console.error('检查飞书配置失败:', error);
  }
}

// 检查飞书认证状态
async function checkFeishuAuth() {
  try {
    const response = await fetch('/api/feishu/auth/status');
    const data = await response.json();
    
    if (data.success) {
      feishuAuthStatus.value = data.data;
    }
  } catch (error) {
    console.error('检查飞书认证失败:', error);
  }
}

// 检查WebSocket状态
async function checkWebSocketStatus() {
  try {
    const response = await fetch('/api/feishu/websocket/status');
    const data = await response.json();
    
    if (data.success) {
      feishuWebSocketStatus.value = data.data;
    }
  } catch (error) {
    console.error('检查WebSocket状态失败:', error);
  }
}

// 启动飞书WebSocket
async function startFeishuWebSocket() {
  feishuWebSocketLoading.value = true;
  try {
    const response = await fetch('/api/feishu/websocket/start', {
      method: 'POST'
    });
    const data = await response.json();
    
    if (data.success) {
      await checkWebSocketStatus();
    }
  } catch (error) {
    console.error('启动WebSocket失败:', error);
  } finally {
    feishuWebSocketLoading.value = false;
  }
}

// 停止飞书WebSocket
async function stopFeishuWebSocket() {
  feishuWebSocketLoading.value = true;
  try {
    const response = await fetch('/api/feishu/websocket/stop', {
      method: 'POST'
    });
    const data = await response.json();
    
    if (data.success) {
      await checkWebSocketStatus();
    }
  } catch (error) {
    console.error('停止WebSocket失败:', error);
  } finally {
    feishuWebSocketLoading.value = false;
  }
}

// 打开飞书长连接配置
function openFeishuLongConnectionConfig() {
  // 这里可以打开长连接配置对话框
  console.log('打开飞书长连接配置');
}

// 创建备份计划
function createBackupPlan() {
  showBackupDialog.value = true;
}

// 创建备份工作流
async function createBackupWorkflow() {
  try {
    const response = await fetch('/api/backup-management', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(backupForm.value)
    });
    
    const data = await response.json();
    
    if (data.success) {
      showBackupDialog.value = false;
      await refreshBackupPlans();
      // 重置表单
      backupForm.value = {
        containerId: '',
        cronExpression: '0 2 * * *',
        backupPath: '/tmp/backups',
        includeVolumes: true,
        includeConfig: true,
        compress: true,
        uploadToFeishu: true
      };
    }
  } catch (error) {
    console.error('创建备份工作流失败:', error);
  }
}

// 编辑备份计划
function editBackupPlan(plan) {
  console.log('编辑备份计划:', plan);
}

// 删除备份计划
async function deleteBackupPlan(plan) {
  if (!confirm('确定要删除这个备份计划吗？')) return;
  
  try {
    const response = await fetch(`/api/backup-management/${plan.id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      await refreshBackupPlans();
    }
  } catch (error) {
    console.error('删除备份计划失败:', error);
  }
}

// 下载文件
async function downloadFile(file) {
  try {
    const response = await fetch(`/api/feishu/files/${file.token}/download`);
    const data = await response.json();
    
    if (data.success && data.data.downloadUrl) {
      window.open(data.data.downloadUrl, '_blank');
    }
  } catch (error) {
    console.error('下载文件失败:', error);
  }
}

// 删除文件
async function deleteFile(file) {
  if (!confirm('确定要删除这个文件吗？')) return;
  
  try {
    const response = await fetch(`/api/feishu/files/${file.token}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      await refreshFeishuFiles();
    }
  } catch (error) {
    console.error('删除文件失败:', error);
  }
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 获取容器状态
function getContainerStatus(status) {
  const statusMap = {
    'running': '运行中',
    'exited': '已停止',
    'created': '已创建',
    'restarting': '重启中',
    'paused': '已暂停'
  };
  return statusMap[status] || status;
}

// 组件挂载时获取数据
onMounted(async () => {
  await Promise.all([
    checkFeishuConfig(),
    checkFeishuAuth(),
    checkWebSocketStatus(),
    fetchContainers()
  ]);
  
  if (feishuConfigStatus.value.configured) {
    await refreshFeishuFiles();
  }
  
  await refreshBackupPlans();
});
</script>

<style scoped>
.backup-management-page {
  @apply h-full;
}
</style>
