<template>
  <div class="form-driven-editor">
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
            @click="$emit('close')"
          >
            返回列表
          </button>
          <button
            class="btn-secondary"
            @click="validateCompose"
            :disabled="!formData.services.length"
          >
            验证配置
          </button>
          <button
            class="btn-primary"
            @click="saveComposition"
            :disabled="!formData.services.length || saving"
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
            :disabled="!formData.services.length || deploying"
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
      <!-- 项目基本信息 -->
      <div class="project-info-section">
        <div class="section-header">
          <h5 class="text-sm font-medium text-slate-100">项目信息</h5>
        </div>
        <div class="project-fields">
          <div class="field-group">
            <label class="field-label">项目名称 *</label>
            <input
              v-model="formData.projectName"
              class="field-input"
              placeholder="my-web-stack"
              @input="validateProjectName"
            />
            <div v-if="projectNameError" class="field-error">{{ projectNameError }}</div>
          </div>
          <div class="field-group">
            <label class="field-label">项目描述</label>
            <textarea
              v-model="formData.description"
              class="field-textarea"
              placeholder="描述这个容器组的用途..."
              rows="2"
            ></textarea>
          </div>
          <div class="field-group">
            <label class="field-label">Compose版本</label>
            <select v-model="formData.version" class="field-select">
              <option value="3.8">3.8</option>
              <option value="3.7">3.7</option>
              <option value="3.6">3.6</option>
              <option value="3.5">3.5</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 服务配置 -->
      <div class="services-section">
        <div class="section-header">
          <h5 class="text-sm font-medium text-slate-100">服务配置</h5>
          <button
            class="btn-secondary"
            @click="addService"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            添加服务
          </button>
        </div>
        
        <div class="services-list">
          <div
            v-for="(service, index) in formData.services"
            :key="service.id"
            class="service-card"
          >
            <div class="service-header">
              <div class="service-title">
                <h6 class="text-sm font-medium text-slate-100">服务 {{ index + 1 }}</h6>
                <span class="service-name-badge">{{ service.name || '未命名' }}</span>
              </div>
              <button
                class="remove-service-btn"
                @click="removeService(index)"
                :disabled="formData.services.length === 1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div class="service-fields">
              <!-- 基本信息 -->
              <div class="field-row">
                <div class="field-group">
                  <label class="field-label">服务名称 *</label>
                  <input
                    v-model="service.name"
                    class="field-input"
                    placeholder="web"
                    @input="validateServiceName(service, index)"
                  />
                  <div v-if="service.nameError" class="field-error">{{ service.nameError }}</div>
                </div>
                <div class="field-group">
                  <label class="field-label">镜像 *</label>
                  <input
                    v-model="service.image"
                    class="field-input"
                    placeholder="nginx:latest"
                    @input="validateServiceImage(service, index)"
                  />
                  <div v-if="service.imageError" class="field-error">{{ service.imageError }}</div>
                </div>
              </div>

              <!-- 端口配置 -->
              <div class="field-group">
                <label class="field-label">端口映射</label>
                <div class="ports-container">
                  <div
                    v-for="(port, portIndex) in service.ports"
                    :key="portIndex"
                    class="port-item"
                  >
                    <input
                      v-model="port.host"
                      class="port-input"
                      placeholder="80"
                    />
                    <span class="port-separator">:</span>
                    <input
                      v-model="port.container"
                      class="port-input"
                      placeholder="80"
                    />
                    <button
                      class="remove-port-btn"
                      @click="removePort(service, portIndex)"
                      :disabled="service.ports.length === 1"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  <button
                    class="add-port-btn"
                    @click="addPort(service)"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- 环境变量 -->
              <div class="field-group">
                <label class="field-label">环境变量</label>
                <div class="env-container">
                  <div
                    v-for="(env, envIndex) in service.environment"
                    :key="envIndex"
                    class="env-item"
                  >
                    <input
                      v-model="env.key"
                      class="env-key-input"
                      placeholder="KEY"
                    />
                    <span class="env-separator">=</span>
                    <input
                      v-model="env.value"
                      class="env-value-input"
                      placeholder="value"
                    />
                    <button
                      class="remove-env-btn"
                      @click="removeEnvironment(service, envIndex)"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  <button
                    class="add-env-btn"
                    @click="addEnvironment(service)"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- 卷映射 -->
              <div class="field-group">
                <label class="field-label">卷映射</label>
                <div class="volumes-container">
                  <div
                    v-for="(volume, volumeIndex) in service.volumes"
                    :key="volumeIndex"
                    class="volume-item"
                  >
                    <select v-model="volume.type" class="volume-type-select">
                      <option value="bind">绑定挂载</option>
                      <option value="named">命名卷</option>
                      <option value="direct">直接路径</option>
                    </select>
                    <input
                      v-if="volume.type === 'bind'"
                      v-model="volume.containerPath"
                      class="volume-input"
                      placeholder="/var/lib/postgresql/data"
                    />
                    <template v-else-if="volume.type === 'named'">
                      <input
                        v-model="volume.name"
                        class="volume-input"
                        placeholder="volume_name"
                      />
                      <span class="volume-separator">:</span>
                      <input
                        v-model="volume.containerPath"
                        class="volume-input"
                        placeholder="/data"
                      />
                    </template>
                    <template v-else>
                      <input
                        v-model="volume.hostPath"
                        class="volume-input"
                        placeholder="/host/path"
                      />
                      <span class="volume-separator">:</span>
                      <input
                        v-model="volume.containerPath"
                        class="volume-input"
                        placeholder="/container/path"
                      />
                    </template>
                    <button
                      class="remove-volume-btn"
                      @click="removeVolume(service, volumeIndex)"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  <button
                    class="add-volume-btn"
                    @click="addVolume(service)"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- 高级配置 -->
              <div class="advanced-config">
                <button
                  class="toggle-advanced-btn"
                  @click="toggleAdvanced(service)"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                  高级配置
                </button>
                
                <div v-if="service.showAdvanced" class="advanced-fields">
                  <div class="field-row">
                    <div class="field-group">
                      <label class="field-label">重启策略</label>
                      <select v-model="service.restart" class="field-select">
                        <option value="no">不重启</option>
                        <option value="always">总是重启</option>
                        <option value="on-failure">失败时重启</option>
                        <option value="unless-stopped">除非手动停止</option>
                      </select>
                    </div>
                    <div class="field-group">
                      <label class="field-label">容器名称</label>
                      <input
                        v-model="service.containerName"
                        class="field-input"
                        placeholder="自动生成"
                      />
                    </div>
                  </div>
                  
                  <div class="field-group">
                    <label class="field-label">依赖服务</label>
                    <div class="depends-container">
                      <div
                        v-for="(dep, depIndex) in service.dependsOn"
                        :key="depIndex"
                        class="depends-item"
                      >
                        <select 
                          :value="dep" 
                          @change="updateDepends(service, depIndex, $event.target.value)"
                          class="depends-select"
                        >
                          <option value="">选择服务</option>
                          <option
                            v-for="otherService in getOtherServices(service)"
                            :key="otherService.name"
                            :value="otherService.name"
                          >
                            {{ otherService.name }}
                          </option>
                        </select>
                        <button
                          class="remove-depends-btn"
                          @click="removeDepends(service, depIndex)"
                        >
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                      <button
                        class="add-depends-btn"
                        @click="addDepends(service)"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览面板 -->
    <div v-if="showPreview" class="preview-panel">
      <div class="preview-header">
        <h5 class="text-sm font-medium text-slate-100">YAML 预览</h5>
        <button
          class="close-preview-btn"
          @click="showPreview = false"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div class="preview-content">
        <MonacoEditor
          v-model="previewYAML"
          language="yaml"
          :height="'400px'"
          :read-only="true"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import MonacoEditor from './MonacoEditor.vue';

// Props
const props = defineProps({
  composition: {
    type: Object,
    default: null
  }
});

// Emits
const emit = defineEmits(['close', 'save', 'deploy']);

// 响应式数据
const formData = reactive({
  projectName: '',
  description: '',
  version: '3.8',
  services: []
});

const projectNameError = ref('');
const saving = ref(false);
const deploying = ref(false);
const showPreview = ref(false);
const previewYAML = ref('');

// 初始化表单数据
if (props.composition) {
  // 编辑模式：从现有容器组加载数据
  formData.projectName = props.composition.name || '';
  formData.description = props.composition.description || '';
  formData.version = props.composition.version || '3.8';
  formData.services = props.composition.services || [];
} else {
  // 新建模式：添加默认服务
  addService();
}

// 计算属性
const isValid = computed(() => {
  return formData.projectName && 
         formData.services.length > 0 && 
         formData.services.every(service => service.name && service.image);
});

// 监听表单变化，更新预览
watch(formData, () => {
  updatePreview();
}, { deep: true });

// 方法
function addService() {
  const serviceId = `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  formData.services.push({
    id: serviceId,
    name: '',
    image: '',
    ports: [{ host: '', container: '' }],
    environment: [],
    volumes: [{ type: 'bind', containerPath: '' }],
    restart: 'unless-stopped',
    containerName: '',
    dependsOn: [],
    showAdvanced: false,
    nameError: '',
    imageError: ''
  });
}

function removeService(index) {
  if (formData.services.length > 1) {
    formData.services.splice(index, 1);
  }
}

function addPort(service) {
  service.ports.push({ host: '', container: '' });
}

function removePort(service, index) {
  if (service.ports.length > 1) {
    service.ports.splice(index, 1);
  }
}

function addEnvironment(service) {
  service.environment.push({ key: '', value: '' });
}

function removeEnvironment(service, index) {
  service.environment.splice(index, 1);
}

function addVolume(service) {
  service.volumes.push({ type: 'bind', containerPath: '' });
}

function removeVolume(service, index) {
  service.volumes.splice(index, 1);
}

function addDepends(service) {
  service.dependsOn.push('');
}

function removeDepends(service, index) {
  service.dependsOn.splice(index, 1);
}

function updateDepends(service, index, value) {
  service.dependsOn[index] = value;
}

function toggleAdvanced(service) {
  service.showAdvanced = !service.showAdvanced;
}

function getOtherServices(currentService) {
  return formData.services.filter(s => s.id !== currentService.id && s.name);
}

function validateProjectName() {
  if (!formData.projectName) {
    projectNameError.value = '项目名称不能为空';
    return false;
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(formData.projectName)) {
    projectNameError.value = '项目名称只能包含字母、数字、连字符和下划线';
    return false;
  }
  projectNameError.value = '';
  return true;
}

function validateServiceName(service, index) {
  if (!service.name) {
    service.nameError = '服务名称不能为空';
    return false;
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(service.name)) {
    service.nameError = '服务名称只能包含字母、数字、连字符和下划线';
    return false;
  }
  // 检查重复
  const duplicateIndex = formData.services.findIndex((s, i) => i !== index && s.name === service.name);
  if (duplicateIndex !== -1) {
    service.nameError = '服务名称不能重复';
    return false;
  }
  service.nameError = '';
  return true;
}

function validateServiceImage(service, index) {
  if (!service.image) {
    service.imageError = '镜像不能为空';
    return false;
  }
  service.imageError = '';
  return true;
}

function loadSampleCompose() {
  formData.projectName = 'sample-web-stack';
  formData.description = '示例Web应用栈';
  formData.services = [
    {
      id: 'service-1',
      name: 'web',
      image: 'nginx:latest',
      ports: [{ host: '80', container: '80' }],
      environment: [],
      volumes: [{ type: 'bind', containerPath: '/usr/share/nginx/html' }],
      restart: 'unless-stopped',
      containerName: '',
      dependsOn: [],
      showAdvanced: false,
      nameError: '',
      imageError: ''
    },
    {
      id: 'service-2',
      name: 'db',
      image: 'postgres:13',
      ports: [{ host: '5432', container: '5432' }],
      environment: [
        { key: 'POSTGRES_DB', value: 'myapp' },
        { key: 'POSTGRES_USER', value: 'user' },
        { key: 'POSTGRES_PASSWORD', value: 'password' }
      ],
      volumes: [{ type: 'bind', containerPath: '/var/lib/postgresql/data' }],
      restart: 'unless-stopped',
      containerName: '',
      dependsOn: [],
      showAdvanced: false,
      nameError: '',
      imageError: ''
    }
  ];
}

function clearCompose() {
  formData.projectName = '';
  formData.description = '';
  formData.services = [];
  addService();
}

function validateCompose() {
  const isValidProject = validateProjectName();
  const isValidServices = formData.services.every((service, index) => {
    return validateServiceName(service, index) && validateServiceImage(service, index);
  });
  
  if (isValidProject && isValidServices) {
    alert('配置验证通过！');
  } else {
    alert('请检查配置错误');
  }
}

function updatePreview() {
  // 这里可以调用ComposeGeneratorService来生成YAML
  // 暂时使用简单的预览
  previewYAML.value = generateSimpleYAML();
}

function generateSimpleYAML() {
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
      
      if (service.restart) {
        yaml += `    restart: ${service.restart}\n`;
      }
      
      yaml += `\n`;
    }
  });
  
  return yaml.trim();
}

async function saveComposition() {
  if (!isValid.value) {
    alert('请填写完整的配置信息');
    return;
  }
  
  saving.value = true;
  try {
    const compositionData = {
      name: formData.projectName,
      description: formData.description,
      version: formData.version,
      services: formData.services
    };
    
    emit('save', compositionData);
  } catch (error) {
    alert('保存失败：' + error.message);
  } finally {
    saving.value = false;
  }
}

async function deployCompose() {
  if (!isValid.value) {
    alert('请填写完整的配置信息');
    return;
  }
  
  deploying.value = true;
  try {
    const compositionData = {
      name: formData.projectName,
      description: formData.description,
      version: formData.version,
      services: formData.services
    };
    
    emit('deploy', compositionData);
  } catch (error) {
    alert('部署失败：' + error.message);
  } finally {
    deploying.value = false;
  }
}
</script>

<style scoped>
.form-driven-editor {
  @apply h-full flex flex-col bg-slate-900;
}

.editor-header {
  @apply px-6 py-4 border-b border-slate-700;
}

.editor-container {
  @apply flex-1 overflow-auto p-6;
}

.project-info-section {
  @apply mb-8;
}

.section-header {
  @apply flex items-center justify-between mb-4;
}

.project-fields {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.services-section {
  @apply space-y-6;
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

.service-title {
  @apply flex items-center space-x-3;
}

.service-name-badge {
  @apply px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded;
}

.service-fields {
  @apply space-y-4;
}

.field-row {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.field-group {
  @apply space-y-2;
}

.field-label {
  @apply block text-sm font-medium text-slate-300;
}

.field-input, .field-textarea, .field-select {
  @apply w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500;
}

.field-textarea {
  @apply resize-none;
}

.field-error {
  @apply text-red-400 text-xs;
}

.ports-container, .env-container, .volumes-container, .depends-container {
  @apply space-y-2;
}

.port-item, .env-item, .volume-item, .depends-item {
  @apply flex items-center space-x-2;
}

.port-input, .env-key-input, .env-value-input, .volume-input {
  @apply bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500;
}

.port-separator, .env-separator, .volume-separator {
  @apply text-slate-400;
}

.volume-type-select {
  @apply bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500;
}

.depends-select {
  @apply bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500;
}

.remove-service-btn, .remove-port-btn, .remove-env-btn, .remove-volume-btn, .remove-depends-btn {
  @apply text-slate-400 hover:text-red-400 transition-colors;
}

.add-port-btn, .add-env-btn, .add-volume-btn, .add-depends-btn {
  @apply text-slate-400 hover:text-sky-400 transition-colors;
}

.advanced-config {
  @apply border-t border-slate-700 pt-4;
}

.toggle-advanced-btn {
  @apply flex items-center text-sm text-slate-400 hover:text-slate-200 transition-colors;
}

.advanced-fields {
  @apply mt-4 space-y-4;
}

.preview-panel {
  @apply border-t border-slate-700 bg-slate-800;
}

.preview-header {
  @apply flex items-center justify-between px-6 py-3 border-b border-slate-700;
}

.close-preview-btn {
  @apply text-slate-400 hover:text-slate-200 transition-colors;
}

.preview-content {
  @apply p-6;
}

.btn-primary {
  @apply flex items-center px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded transition-colors;
}

.btn-secondary {
  @apply flex items-center px-3 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded transition-colors;
}

.btn-primary:disabled, .btn-secondary:disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style>
