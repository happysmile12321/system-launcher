<template>
  <div class="trigger-manager">
    <div class="header">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-slate-100">触发器管理</h2>
          <p class="text-sm text-slate-400 mt-1">管理所有工作流的入口触发器</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="rounded-lg border border-sky-500 px-4 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/10"
            @click="createCronTrigger"
          >
            + 创建定时触发器
          </button>
          <button
            class="rounded-lg border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10"
            @click="createWebhook"
          >
            + 创建 Webhook
          </button>
        </div>
      </div>
    </div>

    <div class="content">
      <div v-if="loading" class="loading">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
        <p class="text-sm text-slate-400 mt-2">加载中...</p>
      </div>
      
      <div v-else-if="webhooks.length === 0" class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mx-auto text-slate-500">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <h3 class="mt-6 text-lg font-medium text-slate-300">还没有触发器</h3>
        <p class="mt-2 text-slate-500">点击右上角"创建 Webhook"开始创建第一个触发器</p>
      </div>

      <div v-else class="webhook-list">
        <div
          v-for="webhook in webhooks"
          :key="webhook.id"
          class="webhook-item"
        >
          <div class="webhook-header">
            <div class="flex items-center gap-3">
              <span class="inline-flex h-2 w-2 rounded-full"
                    :class="webhook.enabled ? 'bg-emerald-400' : 'bg-slate-600'"></span>
              <div>
                <h3 class="text-sm font-medium text-slate-100">{{ webhook.name || '未命名触发器' }}</h3>
                <p class="text-xs text-slate-400">{{ webhook.description || '暂无描述' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <label class="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  class="peer sr-only"
                  :checked="webhook.enabled"
                  @change="toggleWebhook(webhook.id, $event.target.checked)"
                />
                <div class="peer h-5 w-9 rounded-full bg-slate-700 after:absolute after:left-1 after:top-1 after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-4"></div>
              </label>
            </div>
          </div>

          <div class="webhook-details">
            <div class="detail-item">
              <label class="text-xs font-medium text-slate-400">Webhook URL</label>
              <div class="flex items-center gap-2">
                <code class="flex-1 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300">
                  {{ webhook.url }}
                </code>
                <button
                  class="rounded border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:bg-slate-800"
                  @click="copyUrl(webhook.url)"
                >
                  复制
                </button>
              </div>
            </div>

            <div class="detail-item">
              <label class="text-xs font-medium text-slate-400">关联工作流</label>
              <p class="text-sm text-slate-200">{{ webhook.workflowName || '未关联工作流' }}</p>
            </div>

            <div class="detail-item">
              <label class="text-xs font-medium text-slate-400">创建时间</label>
              <p class="text-sm text-slate-200">{{ formatDate(webhook.createdAt) }}</p>
            </div>

            <div class="detail-item">
              <label class="text-xs font-medium text-slate-400">最近调用</label>
              <p class="text-sm text-slate-200">{{ webhook.lastCall ? formatDate(webhook.lastCall) : '从未调用' }}</p>
            </div>
          </div>

          <div class="webhook-actions">
            <button
              class="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:bg-slate-800"
              @click="viewRequests(webhook)"
            >
              查看调用记录
            </button>
            <button
              class="rounded border border-red-500/40 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/10"
              @click="deleteWebhook(webhook.id)"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建 Cron 触发器模态框 -->
    <div v-if="showCreateCronModal" class="modal-overlay" @click="closeCreateCronModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="text-lg font-semibold text-slate-100">创建定时触发器</h3>
          <button class="modal-close" @click="closeCreateCronModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">关联工作流</label>
            <select v-model="newCronTrigger.workflowId" class="form-select">
              <option value="">请选择工作流</option>
              <option v-for="workflow in workflows" :key="workflow.id" :value="workflow.id">
                {{ workflow.name || workflow.id }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Cron 表达式</label>
            <input
              v-model="newCronTrigger.cronExpression"
              type="text"
              class="form-input"
              placeholder="如：0 * * * * (每小时执行)"
            />
            <p class="text-xs text-slate-500 mt-1">
              格式：分 时 日 月 周。例如：0 9 * * 1-5 (工作日每天9点执行)
            </p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeCreateCronModal">取消</button>
          <button class="btn-primary" @click="submitCreateCronTrigger" :disabled="!newCronTrigger.workflowId || !newCronTrigger.cronExpression">
            创建触发器
          </button>
        </div>
      </div>
    </div>

    <!-- 创建 Webhook 模态框 -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="text-lg font-semibold text-slate-100">创建 Webhook 触发器</h3>
          <button class="modal-close" @click="closeCreateModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">触发器名称</label>
            <input
              v-model="newWebhook.name"
              type="text"
              class="form-input"
              placeholder="如：用户注册触发器"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">描述</label>
            <textarea
              v-model="newWebhook.description"
              class="form-textarea"
              rows="3"
              placeholder="描述这个触发器的用途"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label">关联工作流</label>
            <select v-model="newWebhook.workflowId" class="form-select">
              <option value="">请选择工作流</option>
              <option v-for="workflow in workflows" :key="workflow.id" :value="workflow.id">
                {{ workflow.name || workflow.id }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeCreateModal">取消</button>
          <button class="btn-primary" @click="submitCreateWebhook" :disabled="!newWebhook.name || !newWebhook.workflowId">
            创建触发器
          </button>
        </div>
      </div>
    </div>

    <!-- 调用记录模态框 -->
    <div v-if="showRequestsModal" class="modal-overlay" @click="closeRequestsModal">
      <div class="modal-content modal-large" @click.stop>
        <div class="modal-header">
          <h3 class="text-lg font-semibold text-slate-100">调用记录 - {{ selectedWebhook?.name }}</h3>
          <button class="modal-close" @click="closeRequestsModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div v-if="requestsLoading" class="loading">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500 mx-auto"></div>
            <p class="text-sm text-slate-400 mt-2">加载调用记录...</p>
          </div>
          
          <div v-else-if="requests.length === 0" class="empty-state">
            <p class="text-sm text-slate-500">暂无调用记录</p>
          </div>
          
          <div v-else class="requests-list">
            <div
              v-for="request in requests"
              :key="request.id"
              class="request-item"
              @click="viewRequestDetail(request)"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="inline-flex h-2 w-2 rounded-full"
                        :class="request.status >= 200 && request.status < 300 ? 'bg-emerald-400' : 'bg-red-400'"></span>
                  <div>
                    <p class="text-sm font-medium text-slate-100">{{ request.method }} {{ request.status }}</p>
                    <p class="text-xs text-slate-400">{{ formatDate(request.timestamp) }}</p>
                  </div>
                </div>
                <div class="text-xs text-slate-500">
                  {{ request.ip }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 请求详情模态框 -->
    <div v-if="showRequestDetailModal" class="modal-overlay" @click="closeRequestDetailModal">
      <div class="modal-content modal-large" @click.stop>
        <div class="modal-header">
          <h3 class="text-lg font-semibold text-slate-100">请求详情</h3>
          <button class="modal-close" @click="closeRequestDetailModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div v-if="selectedRequest" class="request-detail">
            <div class="detail-section">
              <h4 class="text-sm font-semibold text-slate-300 mb-2">基本信息</h4>
              <div class="detail-grid">
                <div>
                  <label class="text-xs text-slate-400">状态码</label>
                  <p class="text-sm text-slate-200">{{ selectedRequest.status }}</p>
                </div>
                <div>
                  <label class="text-xs text-slate-400">方法</label>
                  <p class="text-sm text-slate-200">{{ selectedRequest.method }}</p>
                </div>
                <div>
                  <label class="text-xs text-slate-400">时间</label>
                  <p class="text-sm text-slate-200">{{ formatDate(selectedRequest.timestamp) }}</p>
                </div>
                <div>
                  <label class="text-xs text-slate-400">来源IP</label>
                  <p class="text-sm text-slate-200">{{ selectedRequest.ip }}</p>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4 class="text-sm font-semibold text-slate-300 mb-2">请求头</h4>
              <pre class="text-xs text-slate-300 bg-slate-950 p-3 rounded border border-slate-700 overflow-x-auto">{{ JSON.stringify(selectedRequest.headers, null, 2) }}</pre>
            </div>

            <div class="detail-section">
              <h4 class="text-sm font-semibold text-slate-300 mb-2">请求体</h4>
              <pre class="text-xs text-slate-300 bg-slate-950 p-3 rounded border border-slate-700 overflow-x-auto">{{ selectedRequest.body || '无请求体' }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  name: 'TriggerManager',
  setup() {
    const loading = ref(false);
    const webhooks = ref([]);
    const workflows = ref([]);
    const showCreateModal = ref(false);
    const showCreateCronModal = ref(false);
    const showRequestsModal = ref(false);
    const showRequestDetailModal = ref(false);
    const requestsLoading = ref(false);
    const requests = ref([]);
    const selectedWebhook = ref(null);
    const selectedRequest = ref(null);

    const newWebhook = ref({
      name: '',
      description: '',
      workflowId: ''
    });

    const newCronTrigger = ref({
      workflowId: '',
      cronExpression: ''
    });

    // 获取触发器列表
    async function fetchWebhooks() {
      loading.value = true;
      try {
        // 获取Cron触发器列表
        const cronRes = await fetch('/api/triggers/cron');
        let cronTriggers = [];
        if (cronRes.ok) {
          const cronData = await cronRes.json();
          if (cronData.success) {
            cronTriggers = cronData.data || [];
          }
        }

        // 获取Webhook触发器列表（如果有的话）
        const webhookRes = await fetch('/api/triggers');
        let webhookTriggers = [];
        if (webhookRes.ok) {
          const webhookData = await webhookRes.json();
          if (webhookData.success) {
            webhookTriggers = webhookData.data || [];
          }
        }

        // 合并触发器列表
        webhooks.value = [
          ...cronTriggers.map(trigger => ({
            ...trigger,
            type: 'cron',
            url: `Cron: ${trigger.cronExpression}`,
            workflowName: trigger.workflowId
          })),
          ...webhookTriggers.map(trigger => ({
            ...trigger,
            type: 'webhook'
          }))
        ];
      } catch (err) {
        console.error(err);
        alert('获取触发器列表失败: ' + err.message);
      } finally {
        loading.value = false;
      }
    }

    // 获取工作流列表
    async function fetchWorkflows() {
      try {
        const res = await fetch('/api/workflows');
        if (!res.ok) {
          throw new Error('无法获取工作流列表');
        }
        const data = await res.json();
        workflows.value = data.workflows || [];
      } catch (err) {
        console.error(err);
      }
    }

    // 创建 Cron 触发器
    function createCronTrigger() {
      newCronTrigger.value = {
        workflowId: '',
        cronExpression: ''
      };
      showCreateCronModal.value = true;
    }

    async function submitCreateCronTrigger() {
      if (!newCronTrigger.value.workflowId || !newCronTrigger.value.cronExpression) {
        alert('请填写必要信息');
        return;
      }

      try {
        const res = await fetch('/api/triggers/cron', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCronTrigger.value)
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || '创建定时触发器失败');
        }

        alert('定时触发器创建成功');
        closeCreateCronModal();
        await fetchWebhooks();
      } catch (err) {
        console.error(err);
        alert('创建定时触发器失败: ' + err.message);
      }
    }

    // 创建 Webhook
    function createWebhook() {
      newWebhook.value = {
        name: '',
        description: '',
        workflowId: ''
      };
      showCreateModal.value = true;
    }

    async function submitCreateWebhook() {
      if (!newWebhook.value.name || !newWebhook.value.workflowId) {
        alert('请填写必要信息');
        return;
      }

      try {
        const res = await fetch('/api/triggers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newWebhook.value)
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || '创建触发器失败');
        }

        alert('触发器创建成功');
        closeCreateModal();
        await fetchWebhooks();
      } catch (err) {
        console.error(err);
        alert('创建触发器失败: ' + err.message);
      }
    }

    // 切换触发器状态
    async function toggleWebhook(webhookId, enabled) {
      try {
        const res = await fetch(`/api/triggers/${webhookId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || '更新触发器状态失败');
        }

        await fetchWebhooks();
      } catch (err) {
        console.error(err);
        alert('更新触发器状态失败: ' + err.message);
      }
    }

    // 删除触发器
    async function deleteWebhook(webhookId) {
      if (!confirm('确定要删除这个触发器吗？')) {
        return;
      }

      try {
        const res = await fetch(`/api/triggers/${webhookId}`, {
          method: 'DELETE'
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || '删除触发器失败');
        }

        alert('触发器删除成功');
        await fetchWebhooks();
      } catch (err) {
        console.error(err);
        alert('删除触发器失败: ' + err.message);
      }
    }

    // 复制URL
    function copyUrl(url) {
      navigator.clipboard.writeText(url).then(() => {
        alert('URL已复制到剪贴板');
      }).catch(() => {
        alert('复制失败，请手动复制');
      });
    }

    // 查看调用记录
    async function viewRequests(webhook) {
      selectedWebhook.value = webhook;
      showRequestsModal.value = true;
      await fetchRequests(webhook.id);
    }

    async function fetchRequests(webhookId) {
      requestsLoading.value = true;
      try {
        const res = await fetch(`/api/triggers/${webhookId}/requests`);
        if (!res.ok) {
          throw new Error('无法获取调用记录');
        }
        const data = await res.json();
        if (data.success) {
          requests.value = data.data || [];
        } else {
          alert('获取调用记录失败: ' + data.error);
        }
      } catch (err) {
        console.error(err);
        alert('获取调用记录失败: ' + err.message);
      } finally {
        requestsLoading.value = false;
      }
    }

    // 查看请求详情
    function viewRequestDetail(request) {
      selectedRequest.value = request;
      showRequestDetailModal.value = true;
    }

    // 关闭模态框
    function closeCreateModal() {
      showCreateModal.value = false;
    }

    function closeCreateCronModal() {
      showCreateCronModal.value = false;
    }

    function closeRequestsModal() {
      showRequestsModal.value = false;
      selectedWebhook.value = null;
      requests.value = [];
    }

    function closeRequestDetailModal() {
      showRequestDetailModal.value = false;
      selectedRequest.value = null;
    }

    // 格式化日期
    function formatDate(dateString) {
      if (!dateString) return '未知';
      return new Date(dateString).toLocaleString('zh-CN');
    }

    onMounted(() => {
      fetchWebhooks();
      fetchWorkflows();
    });

    return {
      loading,
      webhooks,
      workflows,
      showCreateModal,
      showCreateCronModal,
      showRequestsModal,
      showRequestDetailModal,
      requestsLoading,
      requests,
      selectedWebhook,
      selectedRequest,
      newWebhook,
      newCronTrigger,
      createCronTrigger,
      submitCreateCronTrigger,
      createWebhook,
      submitCreateWebhook,
      toggleWebhook,
      deleteWebhook,
      copyUrl,
      viewRequests,
      viewRequestDetail,
      closeCreateModal,
      closeCreateCronModal,
      closeRequestsModal,
      closeRequestDetailModal,
      formatDate
    };
  }
};
</script>

<style scoped>
.trigger-manager {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  margin-bottom: 24px;
}

.content {
  flex: 1;
  overflow-y: auto;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.webhook-list {
  space-y: 16px;
}

.webhook-item {
  border: 1px solid #334155;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.6);
  padding: 20px;
  margin-bottom: 16px;
}

.webhook-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.webhook-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.webhook-actions {
  display: flex;
  gap: 8px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-large {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #334155;
}

.modal-close {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
}

.modal-close:hover {
  color: #e2e8f0;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #334155;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #e2e8f0;
  margin-bottom: 6px;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 8px 12px;
  background: #0f172a;
  border: 1px solid #475569;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 14px;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #0ea5e9;
}

.btn-primary {
  background: #0ea5e9;
  color: #0f172a;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary:hover:not(:disabled) {
  background: #0284c7;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: #94a3b8;
  border: 1px solid #475569;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #1e293b;
}

.requests-list {
  space-y: 8px;
}

.request-item {
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.request-item:hover {
  background: #1e293b;
}

.request-detail {
  space-y: 20px;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.5;
}
</style>
