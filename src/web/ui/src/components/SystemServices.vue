<template>
  <div class="system-services">
    <div class="header">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-slate-100">系统服务</h2>
          <p class="text-sm text-slate-400 mt-1">管理可插拔的系统级扩展模块</p>
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
            v-for="service in availableServices"
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
                      :class="service.installed ? 'installed' : 'not-installed'">
                  {{ service.installed ? '已安装' : '未安装' }}
                </span>
              </div>
            </div>
            
            <div class="service-details">
              <div class="detail-item">
                <span class="text-xs text-slate-400">版本</span>
                <span class="text-xs text-slate-200">{{ service.version }}</span>
              </div>
              <div class="detail-item">
                <span class="text-xs text-slate-400">依赖</span>
                <span class="text-xs text-slate-200">{{ service.dependencies.join(', ') || '无' }}</span>
              </div>
            </div>
            
            <div class="service-actions">
              <button
                v-if="!service.installed"
                class="install-btn"
                :disabled="service.installing"
                @click="installService(service)"
              >
                <div v-if="service.installing" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {{ service.installing ? '安装中...' : '安装' }}
              </button>
              <button
                v-else
                class="uninstall-btn"
                :disabled="service.uninstalling"
                @click="uninstallService(service)"
              >
                <div v-if="service.uninstalling" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {{ service.uninstalling ? '卸载中...' : '卸载' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="installed-services-section">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-4">已安装服务</h3>
        
        <div v-if="installedServices.length === 0" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mx-auto text-slate-500">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <p class="text-sm text-slate-500 mt-2">还没有安装任何系统服务</p>
        </div>
        
        <div v-else class="installed-list">
          <div
            v-for="service in installedServices"
            :key="service.id"
            class="installed-service-item"
          >
            <div class="flex items-center gap-3">
              <component :is="service.icon" class="w-5 h-5 text-sky-400" />
              <div>
                <h4 class="text-sm font-medium text-slate-100">{{ service.name }}</h4>
                <p class="text-xs text-slate-400">{{ service.description }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-500">v{{ service.version }}</span>
              <button
                class="text-xs text-sky-300 hover:text-sky-200"
                @click="openService(service)"
              >
                打开
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 安装确认模态框 -->
    <div v-if="showInstallModal" class="modal-overlay" @click="closeInstallModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="text-lg font-semibold text-slate-100">安装系统服务</h3>
          <button class="modal-close" @click="closeInstallModal">
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
            
            <div v-if="selectedService.dependencies.length > 0" class="dependencies">
              <h5 class="text-sm font-medium text-slate-300 mb-2">依赖检查</h5>
              <div class="dependency-list">
                <div
                  v-for="dep in selectedService.dependencies"
                  :key="dep"
                  class="dependency-item"
                >
                  <span class="text-sm text-slate-200">{{ dep }}</span>
                  <span class="text-xs"
                        :class="dependencyStatus[dep] ? 'text-emerald-400' : 'text-red-400'">
                    {{ dependencyStatus[dep] ? '✓ 已安装' : '✗ 未安装' }}
                  </span>
                </div>
              </div>
            </div>
            
            <div v-if="!allDependenciesMet" class="warning">
              <div class="flex items-center gap-2 text-amber-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span class="text-sm">请先安装所需的依赖</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeInstallModal">取消</button>
          <button
            class="btn-primary"
            :disabled="!allDependenciesMet"
            @click="confirmInstall"
          >
            确认安装
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
    const availableServices = ref([]);
    const showInstallModal = ref(false);
    const selectedService = ref(null);
    const dependencyStatus = ref({});

    // 计算已安装的服务
    const installedServices = computed(() => {
      return availableServices.value.filter(service => service.installed);
    });

    // 计算所有依赖是否满足
    const allDependenciesMet = computed(() => {
      if (!selectedService.value) return false;
      return selectedService.value.dependencies.every(dep => dependencyStatus.value[dep]);
    });

    // 获取系统服务列表
    async function fetchServices() {
      loading.value = true;
      try {
        const res = await fetch('/api/services');
        if (!res.ok) {
          throw new Error('无法获取系统服务列表');
        }
        const data = await res.json();
        if (data.success) {
          availableServices.value = data.data || [];
        } else {
          alert('获取系统服务列表失败: ' + data.error);
        }
      } catch (err) {
        console.error(err);
        alert('获取系统服务列表失败: ' + err.message);
      } finally {
        loading.value = false;
      }
    }

    // 检查依赖状态
    async function checkDependencies(dependencies) {
      const status = {};
      for (const dep of dependencies) {
        try {
          const res = await fetch(`/api/services/check-dependency/${dep}`);
          status[dep] = res.ok && (await res.json()).success;
        } catch {
          status[dep] = false;
        }
      }
      dependencyStatus.value = status;
    }

    // 安装服务
    async function installService(service) {
      selectedService.value = service;
      
      // 检查依赖
      if (service.dependencies.length > 0) {
        await checkDependencies(service.dependencies);
      }
      
      showInstallModal.value = true;
    }

    // 确认安装
    async function confirmInstall() {
      if (!selectedService.value) return;
      
      try {
        const res = await fetch(`/api/services/${selectedService.value.id}/install`, {
          method: 'POST'
        });
        
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || '安装服务失败');
        }
        
        alert('服务安装成功！请刷新页面以查看新功能。');
        closeInstallModal();
        await fetchServices();
      } catch (err) {
        console.error(err);
        alert('安装服务失败: ' + err.message);
      }
    }

    // 卸载服务
    async function uninstallService(service) {
      if (!confirm(`确定要卸载服务「${service.name}」吗？`)) {
        return;
      }
      
      try {
        const res = await fetch(`/api/services/${service.id}/uninstall`, {
          method: 'POST'
        });
        
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || '卸载服务失败');
        }
        
        alert('服务卸载成功！请刷新页面。');
        await fetchServices();
      } catch (err) {
        console.error(err);
        alert('卸载服务失败: ' + err.message);
      }
    }

    // 打开服务
    function openService(service) {
      // 这里可以触发导航到对应的服务页面
      alert(`打开服务「${service.name}」功能即将上线`);
    }

    // 关闭安装模态框
    function closeInstallModal() {
      showInstallModal.value = false;
      selectedService.value = null;
      dependencyStatus.value = {};
    }

    onMounted(() => {
      fetchServices();
    });

    return {
      loading,
      availableServices,
      installedServices,
      showInstallModal,
      selectedService,
      dependencyStatus,
      allDependenciesMet,
      installService,
      confirmInstall,
      uninstallService,
      openService,
      closeInstallModal
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

.status-badge.installed {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.status-badge.not-installed {
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

.install-btn {
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

.install-btn:hover:not(:disabled) {
  background: #0284c7;
}

.install-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.uninstall-btn {
  flex: 1;
  background: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.uninstall-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
}

.uninstall-btn:disabled {
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
</style>
