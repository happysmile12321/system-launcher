<template>
  <div class="system-services">
    <div class="header">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-slate-100">系统服务</h2>
          <p class="text-sm text-slate-400 mt-1">配置内置核心服务，提供平台基础能力</p>
        </div>
      </div>
    </div>

    <div class="content">
      <div class="services-section">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-4">集成与服务</h3>
        
        <div v-if="loading" class="loading">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
          <p class="text-sm text-slate-400 mt-2">加载中...</p>
        </div>
        
        <div v-else class="services-grid">
          <div
            v-for="service in systemServices"
            :key="service.id"
            class="service-card"
          >
            <div class="service-header">
              <div class="service-icon">
                <component :is="service.icon" />
              </div>
              <div class="service-info">
                <h4 class="text-sm font-medium text-slate-100">{{ service.name }}</h4>
                <p class="text-xs text-slate-400">{{ service.description }}</p>
              </div>
              <div class="service-status">
                <span class="status-badge"
                      :class="service.configured ? 'configured' : 'not-configured'">
                  {{ service.configured ? '已配置' : '未配置' }}
                </span>
              </div>
            </div>
            
            <div class="service-details">
              <div class="detail-item">
                <span class="text-xs text-slate-400">类型</span>
                <span class="text-xs text-slate-200">{{ service.type }}</span>
              </div>
              <div class="detail-item">
                <span class="text-xs text-slate-400">状态</span>
                <span class="text-xs text-slate-200">{{ service.status }}</span>
              </div>
            </div>
            
            <div class="service-actions">
              <button
                class="configure-btn"
                :disabled="service.configuring"
                @click="configureService(service)"
              >
                <div v-if="service.configuring" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {{ service.configuring ? '配置中...' : '配置' }}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- 配置模态框 -->
    <div v-if="showConfigModal" class="modal-overlay" @click="closeConfigModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="text-lg font-semibold text-slate-100">配置系统服务</h3>
          <button class="modal-close" @click="closeConfigModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div v-if="selectedService">
            <div class="service-preview">
              <component :is="selectedService.icon" class="w-12 h-12 text-sky-400 mx-auto mb-4" />
              <h4 class="text-lg font-medium text-slate-100 text-center mb-2">{{ selectedService.name }}</h4>
              <p class="text-sm text-slate-400 text-center mb-4">{{ selectedService.description }}</p>
            </div>
            
            <!-- 动态配置表单 -->
            <div class="config-form">
              <div v-for="field in selectedService.configFields" :key="field.name" class="form-field">
                <label class="form-label">{{ field.label }}</label>
                <input
                  v-if="field.type === 'text' || field.type === 'password'"
                  :type="field.type"
                  v-model="configData[field.name]"
                  :placeholder="field.placeholder"
                  class="form-input"
                />
                <select
                  v-else-if="field.type === 'select'"
                  v-model="configData[field.name]"
                  class="form-input"
                >
                  <option v-for="option in field.options" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <textarea
                  v-else-if="field.type === 'textarea'"
                  v-model="configData[field.name]"
                  :placeholder="field.placeholder"
                  class="form-input"
                  rows="3"
                ></textarea>
                <p v-if="field.help" class="form-help">{{ field.help }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeConfigModal">取消</button>
          <button
            class="btn-primary"
            :disabled="!isConfigValid"
            @click="saveConfig"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';

// 图标组件
const ContainerIcon = {
  template: `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  `
};

const DatabaseIcon = {
  template: `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
  `
};

export default {
  name: 'SystemServices',
  components: {
    ContainerIcon,
    DatabaseIcon
  },
  setup() {
    const loading = ref(false);
    const systemServices = ref([]);
    const showConfigModal = ref(false);
    const selectedService = ref(null);
    const configData = ref({});

    // V3.0: 定义核心系统服务
    const coreServices = [
      {
        id: 'container-management',
        name: '容器管理',
        description: '管理Docker/Podman容器，提供容器生命周期管理能力',
        type: '核心服务',
        icon: ContainerIcon,
        configFields: [
          {
            name: 'driver',
            label: '容器驱动',
            type: 'select',
            options: [
              { value: 'docker', label: 'Docker' },
              { value: 'podman', label: 'Podman' }
            ],
            help: '选择容器运行时驱动'
          },
          {
            name: 'socketPath',
            label: 'Socket路径',
            type: 'text',
            placeholder: '/var/run/docker.sock',
            help: '容器守护进程的socket路径'
          }
        ]
      },
      {
        id: 'backup-management',
        name: '备份管理',
        description: '提供数据备份和恢复功能，支持多种存储后端',
        type: '核心服务',
        icon: DatabaseIcon,
        configFields: [
          {
            name: 'storageBackend',
            label: '存储后端',
            type: 'select',
            options: [
              { value: 'feishu', label: '飞书云盘' },
              { value: 'local', label: '本地存储' }
            ],
            help: '选择备份存储后端'
          },
          {
            name: 'retentionDays',
            label: '保留天数',
            type: 'text',
            placeholder: '30',
            help: '备份文件保留天数'
          }
        ]
      },
      {
        id: 'feishu-integration',
        name: '飞书集成',
        description: '飞书OAuth认证和云盘集成服务',
        type: '集成服务',
        icon: DatabaseIcon,
        configFields: [
          {
            name: 'appId',
            label: 'App ID',
            type: 'text',
            required: true,
            placeholder: 'cli_xxxxxxxxxxxxx',
            help: '飞书应用的App ID'
          },
          {
            name: 'appSecret',
            label: 'App Secret',
            type: 'password',
            required: true,
            placeholder: 'xxxxxxxxxxxxxxxx',
            help: '飞书应用的App Secret'
          },
          {
            name: 'redirectUri',
            label: '重定向URI',
            type: 'text',
            placeholder: 'http://localhost:3000/api/feishu/auth/callback',
            help: 'OAuth回调地址'
          }
        ]
      }
    ];

    // 计算配置是否有效
    const isConfigValid = computed(() => {
      if (!selectedService.value) return false;
      return selectedService.value.configFields.every(field => {
        if (field.required) {
          return configData.value[field.name] && configData.value[field.name].trim() !== '';
        }
        return true;
      });
    });

    // V3.0: 获取系统服务状态
    async function fetchServices() {
      loading.value = true;
      try {
        // 获取服务配置状态
        const res = await fetch('/api/services/status');
        const statusData = res.ok ? await res.json() : { data: {} };
        
        // 合并核心服务和状态信息
        systemServices.value = coreServices.map(service => ({
          ...service,
          configured: statusData.data[service.id]?.configured || false,
          status: statusData.data[service.id]?.status || '未配置',
          configuring: false
        }));
      } catch (err) {
        console.error(err);
        // 如果API失败，使用默认状态
        systemServices.value = coreServices.map(service => ({
          ...service,
          configured: false,
          status: '未配置',
          configuring: false
        }));
      } finally {
        loading.value = false;
      }
    }

    // V3.0: 配置服务
    async function configureService(service) {
      selectedService.value = service;
      
      // 获取现有配置
      try {
        const res = await fetch(`/api/services/${service.id}/config`);
        if (res.ok) {
          const data = await res.json();
          configData.value = data.config || {};
        } else {
          configData.value = {};
        }
      } catch (err) {
        console.error('获取配置失败:', err);
        configData.value = {};
      }
      
      showConfigModal.value = true;
    }

    // V3.0: 保存配置
    async function saveConfig() {
      if (!selectedService.value || !isConfigValid.value) return;
      
      try {
        const res = await fetch(`/api/services/${selectedService.value.id}/config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            config: configData.value
          })
        });
        
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || '保存配置失败');
        }
        
        alert('配置保存成功！');
        closeConfigModal();
        await fetchServices();
      } catch (err) {
        console.error(err);
        alert('保存配置失败: ' + err.message);
      }
    }

    // V3.0: 关闭配置模态框
    function closeConfigModal() {
      showConfigModal.value = false;
      selectedService.value = null;
      configData.value = {};
    }

    onMounted(() => {
      fetchServices();
    });

    return {
      loading,
      systemServices,
      showConfigModal,
      selectedService,
      configData,
      isConfigValid,
      configureService,
      saveConfig,
      closeConfigModal
    };
  }
};
</script>

<style scoped>
.system-services {
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

.services-section,
.installed-services-section {
  margin-bottom: 32px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.service-card {
  border: 1px solid #334155;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.6);
  padding: 20px;
  transition: all 0.2s;
}

.service-card:hover {
  border-color: #475569;
  background: rgba(15, 23, 42, 0.8);
}

.service-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.service-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(14, 165, 233, 0.1);
  border-radius: 8px;
  color: #0ea5e9;
}

.service-info {
  flex: 1;
  min-width: 0;
}

.service-status {
  flex-shrink: 0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
}

.status-badge.configured {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.status-badge.not-configured {
  background: rgba(107, 114, 128, 0.2);
  color: #6b7280;
}

.service-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.service-actions {
  display: flex;
  gap: 8px;
}

.configure-btn {
  flex: 1;
  background: #0ea5e9;
  color: #0f172a;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.configure-btn:hover:not(:disabled) {
  background: #0284c7;
}

.configure-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.installed-list {
  space-y: 12px;
}

.installed-service-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #334155;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.4);
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

.service-preview {
  text-align: center;
  margin-bottom: 20px;
}

.dependencies {
  margin-bottom: 20px;
}

.dependency-list {
  space-y: 8px;
}

.dependency-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 6px;
}

.warning {
  padding: 12px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 6px;
  margin-bottom: 16px;
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

.config-form {
  space-y: 16px;
}

.form-field {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #e2e8f0;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 8px 12px;
  color: #e2e8f0;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #0ea5e9;
}

.form-input::placeholder {
  color: #64748b;
}

.form-help {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}
</style>

