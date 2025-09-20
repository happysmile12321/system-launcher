<template>
  <div class="composition-form">
    <!-- 项目基本信息 -->
    <div class="form-section">
      <div class="section-header">
        <div class="section-title">
          <svg class="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h4 class="text-base font-medium text-slate-100">项目信息</h4>
        </div>
        <div class="section-actions">
          <button
            class="btn-secondary"
            @click="loadSampleData"
            :disabled="loading"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            加载示例
          </button>
          <button
            class="btn-secondary"
            @click="clearForm"
            :disabled="loading"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            清空
          </button>
        </div>
      </div>
      
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">
            项目名称 <span class="text-red-400">*</span>
          </label>
          <input
            v-model="formData.projectName"
            class="form-input"
            :class="{ 'border-red-500': projectNameError }"
            placeholder="my-web-stack"
            @input="validateProjectName"
            :disabled="loading"
          />
          <div v-if="projectNameError" class="form-error">{{ projectNameError }}</div>
        </div>
        
        <div class="form-group">
          <label class="form-label">项目描述</label>
          <textarea
            v-model="formData.description"
            class="form-textarea"
            placeholder="描述这个容器组的用途..."
            rows="2"
            :disabled="loading"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">Compose版本</label>
          <select v-model="formData.version" class="form-select" :disabled="loading">
            <option value="3.8">3.8</option>
            <option value="3.7">3.7</option>
            <option value="3.6">3.6</option>
            <option value="3.5">3.5</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 服务配置 -->
    <div class="form-section">
      <div class="section-header">
        <div class="section-title">
          <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
          <h4 class="text-base font-medium text-slate-100">服务配置</h4>
          <span class="service-count">{{ formData.services.length }} 个服务</span>
        </div>
        <button
          class="btn-primary"
          @click="addService"
          :disabled="loading"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          添加服务
        </button>
      </div>
      
      <div class="services-container">
        <div
          v-for="(service, index) in formData.services"
          :key="service.id"
          class="service-card"
        >
          <!-- 服务头部 -->
          <div class="service-header">
            <div class="service-title">
              <div class="service-number">{{ index + 1 }}</div>
              <div class="service-info">
                <h5 class="service-name">{{ service.name || '未命名服务' }}</h5>
                <p class="service-image">{{ service.image || '未指定镜像' }}</p>
              </div>
            </div>
            <div class="service-actions">
              <button
                class="action-btn preview"
                @click="toggleServicePreview(service)"
                :disabled="loading"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              </button>
              <button
                class="action-btn remove"
                @click="removeService(index)"
                :disabled="formData.services.length === 1 || loading"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- 服务配置表单 -->
          <div class="service-form">
            <!-- 基本信息 -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">
                  服务名称 <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="service.name"
                  class="form-input"
                  :class="{ 'border-red-500': service.nameError }"
                  placeholder="web"
                  @input="validateServiceName(service, index)"
                  :disabled="loading"
                />
                <div v-if="service.nameError" class="form-error">{{ service.nameError }}</div>
              </div>
              <div class="form-group">
                <label class="form-label">
                  镜像 <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="service.image"
                  class="form-input"
                  :class="{ 'border-red-500': service.imageError }"
                  placeholder="nginx:latest"
                  @input="validateServiceImage(service, index)"
                  :disabled="loading"
                />
                <div v-if="service.imageError" class="form-error">{{ service.imageError }}</div>
              </div>
            </div>

            <!-- 端口配置 -->
            <div class="form-group">
              <label class="form-label">端口映射</label>
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
                    :disabled="loading"
                  />
                  <span class="port-separator">:</span>
                  <input
                    v-model="port.container"
                    class="port-input"
                    placeholder="80"
                    :disabled="loading"
                  />
                  <button
                    class="remove-item-btn"
                    @click="removePort(service, portIndex)"
                    :disabled="service.ports.length === 1 || loading"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                <button
                  class="add-item-btn"
                  @click="addPort(service)"
                  :disabled="loading"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                </button>
              </div>
            </div>

            <!-- 环境变量 -->
            <div class="form-group">
              <label class="form-label">环境变量</label>
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
                    :disabled="loading"
                  />
                  <span class="env-separator">=</span>
                  <input
                    v-model="env.value"
                    class="env-value-input"
                    placeholder="value"
                    :disabled="loading"
                  />
                  <button
                    class="remove-item-btn"
                    @click="removeEnvironment(service, envIndex)"
                    :disabled="loading"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                <button
                  class="add-item-btn"
                  @click="addEnvironment(service)"
                  :disabled="loading"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                </button>
              </div>
            </div>

            <!-- 卷映射 -->
            <div class="form-group">
              <label class="form-label">卷映射</label>
              <div class="volumes-container">
                <div
                  v-for="(volume, volumeIndex) in service.volumes"
                  :key="volumeIndex"
                  class="volume-item"
                >
                  <select v-model="volume.type" class="volume-type-select" :disabled="loading">
                    <option value="bind">绑定挂载</option>
                    <option value="named">命名卷</option>
                    <option value="direct">直接路径</option>
                  </select>
                  <input
                    v-if="volume.type === 'bind'"
                    v-model="volume.containerPath"
                    class="volume-input"
                    placeholder="/var/lib/postgresql/data"
                    :disabled="loading"
                  />
                  <template v-else-if="volume.type === 'named'">
                    <input
                      v-model="volume.name"
                      class="volume-input"
                      placeholder="volume_name"
                      :disabled="loading"
                    />
                    <span class="volume-separator">:</span>
                    <input
                      v-model="volume.containerPath"
                      class="volume-input"
                      placeholder="/data"
                      :disabled="loading"
                    />
                  </template>
                  <template v-else>
                    <input
                      v-model="volume.hostPath"
                      class="volume-input"
                      placeholder="/host/path"
                      :disabled="loading"
                    />
                    <span class="volume-separator">:</span>
                    <input
                      v-model="volume.containerPath"
                      class="volume-input"
                      placeholder="/container/path"
                      :disabled="loading"
                    />
                  </template>
                  <button
                    class="remove-item-btn"
                    @click="removeVolume(service, volumeIndex)"
                    :disabled="loading"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                <button
                  class="add-item-btn"
                  @click="addVolume(service)"
                  :disabled="loading"
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
                :disabled="loading"
              >
                <svg class="w-4 h-4 mr-2 transition-transform" :class="{ 'rotate-180': service.showAdvanced }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
                高级配置
              </button>
              
              <div v-if="service.showAdvanced" class="advanced-fields">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">重启策略</label>
                    <select v-model="service.restart" class="form-select" :disabled="loading">
                      <option value="no">不重启</option>
                      <option value="always">总是重启</option>
                      <option value="on-failure">失败时重启</option>
                      <option value="unless-stopped">除非手动停止</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">容器名称</label>
                    <input
                      v-model="service.containerName"
                      class="form-input"
                      placeholder="自动生成"
                      :disabled="loading"
                    />
                  </div>
                </div>
                
                <div class="form-group">
                  <label class="form-label">依赖服务</label>
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
                        :disabled="loading"
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
                        class="remove-item-btn"
                        @click="removeDepends(service, depIndex)"
                        :disabled="loading"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                    <button
                      class="add-item-btn"
                      @click="addDepends(service)"
                      :disabled="loading"
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

    <!-- 底部操作按钮 -->
    <div class="form-footer">
      <div class="footer-left">
        <button
          class="btn-secondary"
          @click="validateForm"
          :disabled="loading"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          验证配置
        </button>
      </div>
      <div class="footer-right">
        <button
          class="btn-secondary"
          @click="$emit('cancel')"
          :disabled="loading"
        >
          取消
        </button>
        <button
          class="btn-primary"
          @click="handleSave"
          :disabled="!isValid || loading"
        >
          <svg v-if="loading" class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
          </svg>
          {{ loading ? '保存中...' : '保存' }}
        </button>
        <button
          class="btn-success"
          @click="handleDeploy"
          :disabled="!isValid || loading"
        >
          <svg v-if="loading" class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {{ loading ? '部署中...' : '保存并部署' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

// Props
const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['save', 'deploy', 'cancel']);

// 响应式数据
const formData = reactive({
  projectName: '',
  description: '',
  version: '3.8',
  services: []
});

const projectNameError = ref('');

// 计算属性
const isValid = computed(() => {
  return formData.projectName && 
         formData.services.length > 0 && 
         formData.services.every(service => service.name && service.image) &&
         !projectNameError.value &&
         formData.services.every(service => !service.nameError && !service.imageError);
});

// 初始化默认服务
addService();

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
  
  // 验证镜像格式
  if (!/^[a-zA-Z0-9._/-]+(:[a-zA-Z0-9._-]+)?$/.test(service.image)) {
    service.imageError = '镜像格式不正确';
    return false;
  }
  
  service.imageError = '';
  return true;
}

function validateServicePorts(service) {
  if (!service.ports || service.ports.length === 0) {
    return true; // 端口是可选的
  }
  
  const usedPorts = new Set();
  for (const port of service.ports) {
    if (port.host && port.container) {
      // 验证端口号格式
      if (!/^\d+$/.test(port.host) || !/^\d+$/.test(port.container)) {
        return false;
      }
      
      const hostPort = parseInt(port.host);
      if (hostPort < 1 || hostPort > 65535) {
        return false;
      }
      
      if (usedPorts.has(hostPort)) {
        return false; // 端口冲突
      }
      usedPorts.add(hostPort);
    }
  }
  
  return true;
}

function loadSampleData() {
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

function clearForm() {
  formData.projectName = '';
  formData.description = '';
  formData.services = [];
  addService();
}

function validateForm() {
  const isValidProject = validateProjectName();
  const isValidServices = formData.services.every((service, index) => {
    const isValidName = validateServiceName(service, index);
    const isValidImage = validateServiceImage(service, index);
    const isValidPorts = validateServicePorts(service);
    return isValidName && isValidImage && isValidPorts;
  });
  
  if (isValidProject && isValidServices) {
    // 显示成功提示
    showValidationMessage('配置验证通过！', 'success');
  } else {
    // 显示错误提示
    showValidationMessage('请检查配置错误', 'error');
  }
}

function showValidationMessage(message, type) {
  // 创建临时提示元素
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
    type === 'success' 
      ? 'bg-emerald-600 text-white' 
      : 'bg-red-600 text-white'
  }`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // 3秒后移除
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

function toggleServicePreview(service) {
  // 这里可以添加服务预览功能
  console.log('Preview service:', service);
}

function handleSave() {
  if (!isValid.value) {
    alert('请填写完整的配置信息');
    return;
  }
  
  emit('save', formData);
}

function handleDeploy() {
  if (!isValid.value) {
    alert('请填写完整的配置信息');
    return;
  }
  
  emit('deploy', formData);
}
</script>

<style scoped>
.composition-form {
  @apply space-y-6 p-6;
}

.form-section {
  @apply bg-slate-800/50 border border-slate-700 rounded-lg p-6 transition-all duration-200 hover:border-slate-600;
}

.section-header {
  @apply flex items-center justify-between mb-6;
}

.section-title {
  @apply flex items-center space-x-3;
}

.service-count {
  @apply px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full;
}

.form-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.form-row {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-slate-300;
}

.form-input, .form-textarea, .form-select {
  @apply w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 hover:border-slate-500;
}

.form-textarea {
  @apply resize-none;
}

.form-error {
  @apply text-red-400 text-xs;
}

.services-container {
  @apply space-y-4;
}

.service-card {
  @apply bg-slate-700 border border-slate-600 rounded-lg overflow-hidden transition-all duration-200 hover:border-slate-500 hover:shadow-lg;
}

.service-header {
  @apply flex items-center justify-between p-4 bg-slate-800/50 border-b border-slate-600;
}

.service-title {
  @apply flex items-center space-x-3;
}

.service-number {
  @apply w-8 h-8 bg-sky-600 text-white text-sm font-medium rounded-full flex items-center justify-center;
}

.service-info {
  @apply flex-1;
}

.service-name {
  @apply text-sm font-medium text-slate-100;
}

.service-image {
  @apply text-xs text-slate-400;
}

.service-actions {
  @apply flex items-center space-x-2;
}

.action-btn {
  @apply p-2 rounded-lg transition-colors;
}

.action-btn.preview {
  @apply text-slate-400 hover:text-sky-400 hover:bg-slate-600;
}

.action-btn.remove {
  @apply text-slate-400 hover:text-red-400 hover:bg-slate-600;
}

.service-form {
  @apply p-4 space-y-4;
}

.ports-container, .env-container, .volumes-container, .depends-container {
  @apply space-y-2;
}

.port-item, .env-item, .volume-item, .depends-item {
  @apply flex items-center space-x-2;
}

.port-input, .env-key-input, .env-value-input, .volume-input {
  @apply bg-slate-600 border border-slate-500 rounded px-2 py-1 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500;
}

.port-separator, .env-separator, .volume-separator {
  @apply text-slate-400;
}

.volume-type-select, .depends-select {
  @apply bg-slate-600 border border-slate-500 rounded px-2 py-1 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500;
}

.remove-item-btn, .add-item-btn {
  @apply p-1 rounded transition-colors;
}

.remove-item-btn {
  @apply text-slate-400 hover:text-red-400;
}

.add-item-btn {
  @apply text-slate-400 hover:text-sky-400;
}

.advanced-config {
  @apply border-t border-slate-600 pt-4;
}

.toggle-advanced-btn {
  @apply flex items-center text-sm text-slate-400 hover:text-slate-200 transition-colors;
}

.advanced-fields {
  @apply mt-4 space-y-4;
}

.form-footer {
  @apply flex items-center justify-between pt-6 border-t border-slate-700;
}

.footer-left, .footer-right {
  @apply flex items-center space-x-3;
}

.btn-primary {
  @apply flex items-center px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-sky-500/25;
}

.btn-secondary {
  @apply flex items-center px-3 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all duration-200 hover:shadow-lg;
}

.btn-success {
  @apply flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25;
}

.btn-primary:disabled, .btn-secondary:disabled, .btn-success:disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style>
