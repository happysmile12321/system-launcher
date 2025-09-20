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
            class="btn-primary"
            @click="showComposeEditor = true"
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
      <div class="compose-editor">
        <div class="editor-header">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <h4 class="text-sm font-medium text-slate-100">Docker Compose 配置</h4>
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
                @click="validateCompose"
                :disabled="!composeContent.trim()"
              >
                验证配置
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
            <!-- YAML 编辑器 -->
            <div v-if="editorMode === 'yaml'" class="yaml-editor">
              <textarea
                v-model="composeContent"
                class="compose-textarea"
                placeholder="在此输入 Docker Compose YAML 配置..."
                @input="onComposeChange"
              ></textarea>
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
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

// 响应式数据
const editorMode = ref('yaml');
const composeContent = ref('');
const deploying = ref(false);
const deployResult = ref(null);
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

// 初始化
loadSampleCompose();
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
</style>
