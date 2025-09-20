<template>
  <div class="compositions-tab">
    <div class="tab-header">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-base font-medium text-slate-100">容器组管理</h3>
          <p class="text-sm text-slate-400 mt-1">管理Docker Compose项目</p>
        </div>
        <div class="flex items-center space-x-2">
          <button
            class="btn-secondary"
            @click="fetchCompositions"
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
          <button
            class="btn-primary"
            @click="handleCreateClick"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            新建容器组
          </button>
        </div>
      </div>
    </div>

    <div class="tab-content">
      <!-- 容器组列表 -->
      <div v-if="!showComposeEditor" class="compositions-list">
        <div v-if="loading" class="loading-state">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
          <p class="text-sm text-slate-400 mt-2">加载容器组中...</p>
        </div>

        <div v-else-if="compositions.length === 0" class="empty-state">
          <div class="text-center py-12">
            <svg class="w-12 h-12 text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
            <h3 class="text-lg font-medium text-slate-300 mb-2">暂无容器组</h3>
            <p class="text-sm text-slate-500">还没有创建任何Docker Compose项目</p>
          </div>
        </div>

        <div v-else class="table-container">
          <table class="compositions-table">
            <thead>
              <tr>
                <th class="text-left">项目名称</th>
                <th class="text-left">状态</th>
                <th class="text-left">服务数量</th>
                <th class="text-left">创建时间</th>
                <th class="text-left">最后更新</th>
                <th class="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="composition in compositions" :key="composition.id" class="composition-row">
                <td class="composition-info">
                  <div class="flex items-center space-x-3">
                    <div class="composition-icon">
                      <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                      </svg>
                    </div>
                    <div>
                      <div class="font-medium text-slate-100">{{ composition.name }}</div>
                      <div class="text-xs text-slate-500">{{ composition.description || '无描述' }}</div>
                    </div>
                  </div>
                </td>
                <td class="status-cell">
                  <span class="status-badge" :class="getStatusClass(composition.status)">
                    {{ getStatusText(composition.status) }}
                  </span>
                </td>
                <td class="services-cell">
                  <div class="text-sm text-slate-300">{{ composition.services?.length || 0 }} 个服务</div>
                </td>
                <td class="created-cell">
                  <div class="text-xs text-slate-400">{{ formatDate(composition.createdAt) }}</div>
                </td>
                <td class="updated-cell">
                  <div class="text-xs text-slate-400">{{ formatDate(composition.updatedAt) }}</div>
                </td>
                <td class="actions-cell">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      class="action-btn view"
                      @click="viewComposition(composition)"
                    >
                      查看
                    </button>
                    <button
                      class="action-btn validate"
                      @click="validateComposition(composition)"
                    >
                      验证
                    </button>
                    <button
                      v-if="composition.status === 'stopped'"
                      class="action-btn deploy"
                      @click="deployComposition(composition)"
                      :disabled="deploying"
                    >
                      部署
                    </button>
                    <button
                      v-else
                      class="action-btn stop"
                      @click="stopComposition(composition)"
                      :disabled="deploying"
                    >
                      停止
                    </button>
                    <button
                      class="action-btn proxy"
                      @click="showCreateProxy(composition)"
                    >
                      创建代理
                    </button>
                    <button
                      class="action-btn delete"
                      @click="deleteComposition(composition)"
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

      <!-- 容器组编辑器 -->
      <div v-else class="compose-editor">
        <div class="editor-header">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <h4 class="text-sm font-medium text-slate-100">
                {{ editingComposition ? '编辑容器组' : '新建容器组' }}
              </h4>
              <div class="flex items-center space-x-2">
                <button
                  class="btn-secondary"
                  @click="loadSampleCompose"
                >
                  加载示例
                </button>
                <button
                  class="btn-secondary"
                  @click="clearCompose"
                >
                  清空
                </button>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button
                class="btn-secondary"
                @click="showComposeEditor = false"
              >
                返回列表
              </button>
              <button
                class="btn-secondary"
                @click="validateCompose"
                :disabled="!composeContent.trim()"
              >
                验证配置
              </button>
              <button
                class="btn-primary"
                @click="saveComposition"
                :disabled="!composeContent.trim() || saving"
              >
                <svg v-if="saving" class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                </svg>
                {{ saving ? '保存中...' : '保存' }}
              </button>
              <button
                class="btn-primary"
                @click="deployCompose"
                :disabled="!composeContent.trim() || deploying"
              >
                <svg v-if="deploying" class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {{ deploying ? '部署中...' : '部署' }}
              </button>
            </div>
          </div>
        </div>

        <div class="editor-container">
          <div class="editor-tabs">
            <button
              class="editor-tab"
              :class="{ active: editorMode === 'form' }"
              @click="editorMode = 'form'"
            >
              表单编辑器
            </button>
            <button
              class="editor-tab"
              :class="{ active: editorMode === 'yaml' }"
              @click="editorMode = 'yaml'"
            >
              YAML 编辑器
            </button>
            <button
              class="editor-tab"
              :class="{ active: editorMode === 'visual' }"
              @click="editorMode = 'visual'"
            >
              可视化编辑器
            </button>
          </div>

          <div class="editor-content">
            <!-- 表单编辑器 -->
            <div v-if="editorMode === 'form'" class="form-editor">
              <FormDrivenEditor
                :composition="editingComposition"
                @close="showComposeEditor = false"
                @save="handleFormSave"
                @deploy="handleFormDeploy"
              />
            </div>

            <!-- YAML 编辑器 -->
            <div v-else-if="editorMode === 'yaml'" class="yaml-editor">
              <MonacoEditor
                v-model="composeContent"
                language="yaml"
                :height="'500px'"
                :options="{
                  formatOnPaste: true,
                  formatOnType: true,
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: true
                }"
                @change="onComposeChange"
              />
            </div>

            <!-- 可视化编辑器 -->
            <div v-else-if="editorMode === 'visual'" class="visual-editor">
              <div class="visual-editor-content">
                <div class="services-section">
                  <div class="section-header">
                    <h5 class="text-sm font-medium text-slate-100">服务配置</h5>
                    <button
                      class="btn-secondary"
                      @click="addService"
                    >
                      添加服务
                    </button>
                  </div>
                  
                  <div class="services-list">
                    <div
                      v-for="(service, index) in visualServices"
                      :key="index"
                      class="service-card"
                    >
                      <div class="service-header">
                        <input
                          v-model="service.name"
                          class="service-name-input"
                          placeholder="服务名称"
                          @input="updateComposeFromVisual"
                        />
                        <button
                          class="remove-service-btn"
                          @click="removeService(index)"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                      
                      <div class="service-fields">
                        <div class="field-group">
                          <label class="field-label">镜像</label>
                          <input
                            v-model="service.image"
                            class="field-input"
                            placeholder="nginx:latest"
                            @input="updateComposeFromVisual"
                          />
                        </div>
                        
                        <div class="field-group">
                          <label class="field-label">端口映射</label>
                          <input
                            v-model="service.ports"
                            class="field-input"
                            placeholder="80:80,443:443"
                            @input="updateComposeFromVisual"
                          />
                        </div>
                        
                        <div class="field-group">
                          <label class="field-label">环境变量</label>
                          <textarea
                            v-model="service.environment"
                            class="field-textarea"
                            placeholder="KEY1=value1&#10;KEY2=value2"
                            @input="updateComposeFromVisual"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 部署结果 -->
        <div v-if="deployResult" class="deploy-result">
          <div class="result-header">
            <h5 class="text-sm font-medium text-slate-100">部署结果</h5>
            <button
              class="close-result-btn"
              @click="deployResult = null"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="result-content">
            <pre class="result-output">{{ deployResult }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 查看容器组模态框 -->
    <div v-if="showViewModal" class="modal-overlay" @click="closeViewModal">
      <div class="modal-content view-modal" @click.stop>
        <div class="modal-header">
          <h3 class="text-lg font-semibold text-slate-100">查看容器组</h3>
          <button class="modal-close" @click="closeViewModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="view-tabs">
            <button
              class="view-tab"
              :class="{ active: viewMode === 'yaml' }"
              @click="viewMode = 'yaml'"
            >
              YAML 视图
            </button>
            <button
              class="view-tab"
              :class="{ active: viewMode === 'visual' }"
              @click="viewMode = 'visual'"
            >
              可视化视图
            </button>
          </div>
          
          <div class="view-content">
            <div v-if="viewMode === 'yaml'" class="yaml-view">
              <MonacoEditor
                v-model="viewingComposition.content"
                language="yaml"
                :height="'400px'"
                :read-only="true"
              />
            </div>
            <div v-else class="visual-view">
              <div class="composition-info">
                <h4 class="text-sm font-medium text-slate-100 mb-2">项目信息</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">项目名称:</span>
                    <span class="info-value">{{ viewingComposition.name }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">状态:</span>
                    <span class="status-badge" :class="getStatusClass(viewingComposition.status)">
                      {{ getStatusText(viewingComposition.status) }}
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">服务数量:</span>
                    <span class="info-value">{{ viewingComposition.services?.length || 0 }} 个</span>
                  </div>
                </div>
              </div>
              
              <div class="services-overview">
                <h4 class="text-sm font-medium text-slate-100 mb-2">服务概览</h4>
                <div class="services-grid">
                  <div
                    v-for="service in viewingComposition.services"
                    :key="service.name"
                    class="service-overview-card"
                  >
                    <div class="service-name">{{ service.name }}</div>
                    <div class="service-image">{{ service.image }}</div>
                    <div v-if="service.ports" class="service-ports">
                      端口: {{ service.ports }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    <!-- 代理向导模态框 -->
    <div v-if="showProxyWizard" class="modal-overlay" @click="closeProxyWizard">
      <div class="modal-content proxy-modal" @click.stop>
        <ProxyWizard
          :composition-name="selectedService?.compositionName"
          :service-name="selectedService?.serviceName"
          :target-port="selectedService?.targetPort"
          @close="closeProxyWizard"
          @created="handleProxyCreated"
        />
      </div>
    </div>
</div>
 <!-- 容器组创建模态框 -->
 <CompositionCreateModal
      :show="showCreateModal"
      @close="showCreateModal = false"
      @saved="handleCompositionSaved"
      @deployed="handleCompositionDeployed"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import MonacoEditor from './MonacoEditor.vue';
import FormDrivenEditor from './FormDrivenEditor.vue';
import ProxyWizard from './ProxyWizard.vue';
import CompositionCreateModal from './CompositionCreateModal.vue';

// 响应式数据
const editorMode = ref('form');
const composeContent = ref('');
const deploying = ref(false);
const deployResult = ref(null);
const saving = ref(false);
const loading = ref(false);
const showComposeEditor = ref(false);
const showViewModal = ref(false);
const viewMode = ref('yaml');
const editingComposition = ref(null);
const viewingComposition = ref({});
const compositions = ref([]);
const showProxyWizard = ref(false);
const selectedService = ref(null);
const showCreateModal = ref(false);
const visualServices = ref([
  {
    name: 'web',
    image: 'nginx:latest',
    ports: '80:80',
    environment: ''
  }
]);

// 示例 Docker Compose 配置
const sampleCompose = `version: '3.8'

services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NGINX_HOST=localhost
      - NGINX_PORT=80
    volumes:
      - ./html:/usr/share/nginx/html
    restart: unless-stopped

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:`;

// 加载示例配置
function loadSampleCompose() {
  composeContent.value = sampleCompose;
  parseComposeToVisual();
}

// 清空配置
function clearCompose() {
  composeContent.value = '';
  visualServices.value = [{ name: '', image: '', ports: '', environment: '' }];
}

// 验证配置
function validateCompose() {
  try {
    // 简单的YAML验证
    if (!composeContent.value.trim()) {
      alert('配置不能为空');
      return;
    }
    
    // 检查基本结构
    if (!composeContent.value.includes('services:')) {
      alert('配置必须包含 services 部分');
      return;
    }
    
    alert('配置验证通过！');
  } catch (error) {
    alert('配置格式错误：' + error.message);
  }
}

// 部署容器组
async function deployCompose() {
  deploying.value = true;
  deployResult.value = null;
  
  try {
    const response = await fetch('/api/containers/compose/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        composeContent: composeContent.value
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      deployResult.value = data.data.output || '部署成功！';
    } else {
      deployResult.value = `部署失败：${data.error}`;
    }
  } catch (error) {
    deployResult.value = `部署失败：${error.message}`;
  } finally {
    deploying.value = false;
  }
}

// 添加服务
function addService() {
  visualServices.value.push({
    name: '',
    image: '',
    ports: '',
    environment: ''
  });
}

// 删除服务
function removeService(index) {
  if (visualServices.value.length > 1) {
    visualServices.value.splice(index, 1);
    updateComposeFromVisual();
  }
}

// 从可视化编辑器更新Compose内容
function updateComposeFromVisual() {
  let yaml = 'version: \'3.8\'\n\nservices:\n';
  
  visualServices.value.forEach(service => {
    if (service.name.trim()) {
      yaml += `  ${service.name}:\n`;
      
      if (service.image.trim()) {
        yaml += `    image: ${service.image}\n`;
      }
      
      if (service.ports.trim()) {
        const ports = service.ports.split(',').map(p => p.trim()).filter(Boolean);
        if (ports.length === 1) {
          yaml += `    ports:\n      - "${ports[0]}"\n`;
        } else if (ports.length > 1) {
          yaml += `    ports:\n`;
          ports.forEach(port => {
            yaml += `      - "${port}"\n`;
          });
        }
      }
      
      if (service.environment.trim()) {
        const envVars = service.environment.split('\n').filter(e => e.trim());
        if (envVars.length > 0) {
          yaml += `    environment:\n`;
          envVars.forEach(env => {
            yaml += `      - ${env}\n`;
          });
        }
      }
      
      yaml += `    restart: unless-stopped\n\n`;
    }
  });
  
  composeContent.value = yaml;
}

// 从Compose内容解析到可视化编辑器
function parseComposeToVisual() {
  // 简单的解析逻辑，实际项目中可能需要更复杂的YAML解析
  const lines = composeContent.value.split('\n');
  const services = [];
  let currentService = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('services:')) {
      continue;
    }
    
    if (trimmed && !trimmed.startsWith(' ') && !trimmed.startsWith('-') && trimmed.endsWith(':')) {
      if (currentService) {
        services.push(currentService);
      }
      currentService = {
        name: trimmed.slice(0, -1).trim(),
        image: '',
        ports: '',
        environment: ''
      };
    } else if (currentService && trimmed.startsWith('image:')) {
      currentService.image = trimmed.replace('image:', '').trim();
    } else if (currentService && trimmed.startsWith('ports:')) {
      // 处理端口配置
    } else if (currentService && trimmed.startsWith('environment:')) {
      // 处理环境变量配置
    }
  }
  
  if (currentService) {
    services.push(currentService);
  }
  
  if (services.length > 0) {
    visualServices.value = services;
  }
}

// 监听Compose内容变化
function onComposeChange() {
  if (editorMode.value === 'yaml') {
    parseComposeToVisual();
  }
}

// 获取容器组列表
async function fetchCompositions() {
  loading.value = true;
  try {
    const response = await fetch('/api/compositions');
    const data = await response.json();
    
    if (data.success) {
      compositions.value = data.data || [];
    }
  } catch (error) {
    console.error('Failed to fetch compositions:', error);
  } finally {
    loading.value = false;
  }
}

// 保存容器组
async function saveComposition() {
  saving.value = true;
  try {
    const response = await fetch('/api/compositions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `composition-${Date.now()}`,
        content: composeContent.value,
        description: 'Docker Compose项目'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showComposeEditor.value = false;
      await fetchCompositions();
      clearCompose();
    } else {
      alert('保存失败：' + data.error);
    }
  } catch (error) {
    alert('保存失败：' + error.message);
  } finally {
    saving.value = false;
  }
}

// 查看容器组
function viewComposition(composition) {
  viewingComposition.value = composition;
  showViewModal.value = true;
}

// 关闭查看模态框
function closeViewModal() {
  showViewModal.value = false;
  viewingComposition.value = {};
}

// 验证容器组
async function validateComposition(composition) {
  try {
    const response = await fetch(`/api/compositions/${composition.id}/validate`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('配置验证通过！');
    } else {
      alert('配置验证失败：' + data.error);
    }
  } catch (error) {
    alert('验证失败：' + error.message);
  }
}

// 部署容器组
async function deployComposition(composition) {
  deploying.value = true;
  try {
    const response = await fetch(`/api/compositions/${composition.id}/deploy`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success) {
      await fetchCompositions();
      alert('部署成功！');
    } else {
      alert('部署失败：' + data.error);
    }
  } catch (error) {
    alert('部署失败：' + error.message);
  } finally {
    deploying.value = false;
  }
}

// 停止容器组
async function stopComposition(composition) {
  deploying.value = true;
  try {
    const response = await fetch(`/api/compositions/${composition.id}/stop`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success) {
      await fetchCompositions();
      alert('停止成功！');
    } else {
      alert('停止失败：' + data.error);
    }
  } catch (error) {
    alert('停止失败：' + error.message);
  } finally {
    deploying.value = false;
  }
}

// 删除容器组
async function deleteComposition(composition) {
  if (!confirm('确定要删除这个容器组吗？')) return;
  
  try {
    const response = await fetch(`/api/compositions/${composition.id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      await fetchCompositions();
    } else {
      alert('删除失败：' + data.error);
    }
  } catch (error) {
    alert('删除失败：' + error.message);
  }
}

// 获取状态样式类
function getStatusClass(status) {
  switch (status) {
    case 'running':
      return 'running';
    case 'stopped':
      return 'stopped';
    case 'error':
      return 'error';
    default:
      return 'unknown';
  }
}

// 获取状态文本
function getStatusText(status) {
  switch (status) {
    case 'running':
      return '运行中';
    case 'stopped':
      return '已停止';
    case 'error':
      return '错误';
    default:
      return '未知';
  }
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString();
}

// 处理表单保存
async function handleFormSave(formData) {
  saving.value = true;
  try {
    // 调用ComposeGeneratorService生成YAML
    const response = await fetch('/api/local-fs/compositions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        compositionName: formData.name,
        composeContent: generateYAMLFromForm(formData)
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showComposeEditor.value = false;
      await fetchCompositions();
      alert('保存成功！');
    } else {
      alert('保存失败：' + data.error);
    }
  } catch (error) {
    alert('保存失败：' + error.message);
  } finally {
    saving.value = false;
  }
}

// 处理表单部署
async function handleFormDeploy(formData) {
  deploying.value = true;
  try {
    // 先保存配置
    await handleFormSave(formData);
    
    // 然后部署
    const response = await fetch('/api/containers/compose/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        composeContent: generateYAMLFromForm(formData),
        projectName: formData.name
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('部署成功！');
    } else {
      alert('部署失败：' + data.error);
    }
  } catch (error) {
    alert('部署失败：' + error.message);
  } finally {
    deploying.value = false;
  }
}

// 从表单数据生成YAML
function generateYAMLFromForm(formData) {
  let yaml = `version: '${formData.version}'\n\nservices:\n`;
  
  formData.services.forEach(service => {
    if (service.name && service.image) {
      yaml += `  ${service.name}:\n`;
      yaml += `    image: ${service.image}\n`;
      
      if (service.ports && service.ports.some(p => p.host && p.container)) {
        yaml += `    ports:\n`;
        service.ports.forEach(port => {
          if (port.host && port.container) {
            yaml += `      - "${port.host}:${port.container}"\n`;
          }
        });
      }
      
      if (service.environment && service.environment.some(e => e.key && e.value)) {
        yaml += `    environment:\n`;
        service.environment.forEach(env => {
          if (env.key && env.value) {
            yaml += `      - ${env.key}=${env.value}\n`;
          }
        });
      }
      
      if (service.volumes && service.volumes.length > 0) {
        yaml += `    volumes:\n`;
        service.volumes.forEach(volume => {
          if (volume.type === 'bind' && volume.containerPath) {
            // 使用LocalFS规范生成路径
            yaml += `      - ../../backup/${formData.name}/entitydata/${service.name}:${volume.containerPath}\n`;
          } else if (volume.type === 'named' && volume.name && volume.containerPath) {
            yaml += `      - ${formData.name}_${volume.name}:${volume.containerPath}\n`;
          } else if (volume.type === 'direct' && volume.hostPath && volume.containerPath) {
            yaml += `      - ${volume.hostPath}:${volume.containerPath}\n`;
          }
        });
      }
      
      if (service.restart) {
        yaml += `    restart: ${service.restart}\n`;
      }
      
      if (service.containerName) {
        yaml += `    container_name: ${service.containerName}\n`;
      }
      
      if (service.dependsOn && service.dependsOn.length > 0) {
        yaml += `    depends_on:\n`;
        service.dependsOn.forEach(dep => {
          if (dep) {
            yaml += `      - ${dep}\n`;
          }
        });
      }
      
      yaml += `\n`;
    }
  });
  
  return yaml.trim();
}

// 显示创建代理向导
function showCreateProxy(composition) {
  // 这里需要从容器组中获取服务信息
  // 暂时使用模拟数据
  selectedService.value = {
    compositionName: composition.name,
    serviceName: composition.services?.[0]?.name || 'web',
    targetPort: parseInt(composition.services?.[0]?.ports?.split(':')[0]) || 80
  };
  showProxyWizard.value = true;
}

// 关闭代理向导
function closeProxyWizard() {
  showProxyWizard.value = false;
  selectedService.value = null;
}

// 处理代理创建完成
function handleProxyCreated(proxyData) {
  closeProxyWizard();
  alert(`代理创建成功！\nWebhook URL: ${proxyData.proxyUrl}`);
}

// 处理新建按钮点击
function handleCreateClick() {
  showCreateModal.value = true;
}

// 处理容器组保存
function handleCompositionSaved(compositionData) {
  showCreateModal.value = false;
  fetchCompositions();
  alert('容器组创建成功！');
}

// 处理容器组部署
function handleCompositionDeployed(deployData) {
  showCreateModal.value = false;
  fetchCompositions();
  alert('容器组部署成功！');
}

// 组件挂载时获取容器组列表
onMounted(() => {
  fetchCompositions();
});
</script>

<style scoped>
.compositions-tab {
  @apply h-full flex flex-col;
}

.tab-header {
  @apply px-6 py-4 border-b border-slate-700;
}

.tab-content {
  @apply flex-1 overflow-hidden;
}

.compose-editor {
  @apply h-full flex flex-col;
}

.editor-header {
  @apply px-6 py-4 border-b border-slate-700;
}

.editor-container {
  @apply flex-1 flex flex-col overflow-hidden;
}

.editor-tabs {
  @apply flex border-b border-slate-700 bg-slate-800;
}

.editor-tab {
  @apply px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors;
}

.editor-tab.active {
  @apply text-sky-400 bg-slate-700 border-b-2 border-sky-400;
}

.editor-content {
  @apply flex-1 overflow-hidden;
}

.yaml-editor {
  @apply h-full p-6;
}

.compose-textarea {
  @apply w-full h-full bg-slate-900 border border-slate-700 rounded p-4 text-sm text-slate-300 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-sky-500;
}

.visual-editor {
  @apply h-full overflow-auto p-6;
}

.visual-editor-content {
  @apply max-w-4xl mx-auto;
}

.services-section {
  @apply space-y-4;
}

.section-header {
  @apply flex items-center justify-between;
}

.services-list {
  @apply space-y-4;
}

.service-card {
  @apply bg-slate-800 border border-slate-700 rounded-lg p-4;
}

.service-header {
  @apply flex items-center justify-between mb-4;
}

.service-name-input {
  @apply bg-slate-700 border border-slate-600 rounded px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500;
}

.remove-service-btn {
  @apply text-slate-400 hover:text-red-400 transition-colors;
}

.service-fields {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.field-group {
  @apply space-y-2;
}

.field-label {
  @apply block text-sm font-medium text-slate-300;
}

.field-input {
  @apply w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500;
}

.field-textarea {
  @apply w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none;
}

.deploy-result {
  @apply border-t border-slate-700 bg-slate-800;
}

.result-header {
  @apply flex items-center justify-between px-6 py-3 border-b border-slate-700;
}

.close-result-btn {
  @apply text-slate-400 hover:text-slate-200 transition-colors;
}

.result-content {
  @apply p-6;
}

.result-output {
  @apply bg-slate-900 border border-slate-700 rounded p-4 text-sm text-slate-300 font-mono whitespace-pre-wrap max-h-64 overflow-auto;
}

.btn-primary {
  @apply flex items-center px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded transition-colors;
}

.btn-secondary {
  @apply flex items-center px-3 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded transition-colors;
}

/* 容器组列表样式 */
.compositions-list {
  @apply h-full overflow-hidden;
}

.loading-state, .empty-state {
  @apply flex flex-col items-center justify-center h-full;
}

.table-container {
  @apply h-full overflow-auto;
}

.compositions-table {
  @apply w-full;
}

.compositions-table th {
  @apply px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider border-b border-slate-700;
}

.compositions-table td {
  @apply px-4 py-3 border-b border-slate-800;
}

.composition-row:hover {
  @apply bg-slate-800/50;
}

.status-badge {
  @apply inline-flex items-center px-2 py-1 rounded-full text-xs font-medium;
}

.status-badge.running {
  @apply bg-green-900/20 text-green-400;
}

.status-badge.stopped {
  @apply bg-red-900/20 text-red-400;
}

.status-badge.error {
  @apply bg-red-900/20 text-red-400;
}

.status-badge.unknown {
  @apply bg-gray-900/20 text-gray-400;
}

.action-btn {
  @apply px-3 py-1 text-xs font-medium rounded transition-colors;
}

.action-btn.view {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.action-btn.validate {
  @apply bg-yellow-600 text-white hover:bg-yellow-700;
}

.action-btn.deploy {
  @apply bg-green-600 text-white hover:bg-green-700;
}

.action-btn.stop {
  @apply bg-red-600 text-white hover:bg-red-700;
}

.action-btn.delete {
  @apply bg-red-600 text-white hover:bg-red-700;
}

.action-btn.proxy {
  @apply bg-purple-600 text-white hover:bg-purple-700;
}

.action-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* 模态框样式 */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full mx-4;
}

.view-modal {
  @apply max-w-6xl;
}

.proxy-modal {
  @apply max-w-4xl;
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

.view-tabs {
  @apply flex border-b border-slate-700 mb-4;
}

.view-tab {
  @apply px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors;
}

.view-tab.active {
  @apply text-sky-400 bg-slate-700 border-b-2 border-sky-400;
}

.view-content {
  @apply space-y-4;
}

.yaml-view {
  @apply bg-slate-900 border border-slate-700 rounded;
}

.visual-view {
  @apply space-y-6;
}

.composition-info {
  @apply bg-slate-800 border border-slate-700 rounded-lg p-4;
}

.info-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.info-item {
  @apply flex items-center space-x-2;
}

.info-label {
  @apply text-sm font-medium text-slate-400;
}

.info-value {
  @apply text-sm text-slate-300;
}

.services-overview {
  @apply bg-slate-800 border border-slate-700 rounded-lg p-4;
}

.services-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.service-overview-card {
  @apply bg-slate-700 border border-slate-600 rounded-lg p-3;
}

.service-name {
  @apply font-medium text-slate-100 mb-1;
}

.service-image {
  @apply text-sm text-slate-300 mb-1;
}

.service-ports {
  @apply text-xs text-slate-400;
}
</style>
