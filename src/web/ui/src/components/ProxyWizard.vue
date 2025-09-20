<template>
  <div class="proxy-wizard">
    <div class="wizard-header">
      <h3 class="text-lg font-semibold text-slate-100">创建工作流代理</h3>
      <p class="text-sm text-slate-400 mt-1">为容器服务创建可公网访问的Webhook代理</p>
    </div>

    <div class="wizard-content">
      <!-- 步骤1: 基本信息 -->
      <div v-if="currentStep === 1" class="step-content">
        <div class="step-header">
          <div class="step-number">1</div>
          <div class="step-title">
            <h4 class="text-base font-medium text-slate-100">基本信息</h4>
            <p class="text-sm text-slate-400">配置代理的基本信息</p>
          </div>
        </div>

        <div class="step-fields">
          <div class="field-group">
            <label class="field-label">代理名称 *</label>
            <input
              v-model="proxyData.name"
              class="field-input"
              placeholder="my-web-proxy"
              @input="validateProxyName"
            />
            <div v-if="proxyData.nameError" class="field-error">{{ proxyData.nameError }}</div>
          </div>

          <div class="field-group">
            <label class="field-label">代理描述</label>
            <textarea
              v-model="proxyData.description"
              class="field-textarea"
              placeholder="描述这个代理的用途..."
              rows="3"
            ></textarea>
          </div>

          <div class="field-group">
            <label class="field-label">容器组</label>
            <div class="composition-info">
              <div class="info-item">
                <span class="info-label">名称:</span>
                <span class="info-value">{{ compositionName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">服务:</span>
                <span class="info-value">{{ serviceName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">端口:</span>
                <span class="info-value">{{ targetPort }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤2: 请求配置 -->
      <div v-if="currentStep === 2" class="step-content">
        <div class="step-header">
          <div class="step-number">2</div>
          <div class="step-title">
            <h4 class="text-base font-medium text-slate-100">请求配置</h4>
            <p class="text-sm text-slate-400">配置HTTP请求参数</p>
          </div>
        </div>

        <div class="step-fields">
          <div class="field-row">
            <div class="field-group">
              <label class="field-label">HTTP方法</label>
              <select v-model="proxyData.method" class="field-select">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
                <option value="HEAD">HEAD</option>
                <option value="OPTIONS">OPTIONS</option>
              </select>
            </div>
            <div class="field-group">
              <label class="field-label">请求路径</label>
              <input
                v-model="proxyData.path"
                class="field-input"
                placeholder="/api/endpoint"
              />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">请求头</label>
            <div class="headers-container">
              <div
                v-for="(header, index) in proxyData.headers"
                :key="index"
                class="header-item"
              >
                <input
                  v-model="header.key"
                  class="header-key-input"
                  placeholder="Content-Type"
                />
                <span class="header-separator">:</span>
                <input
                  v-model="header.value"
                  class="header-value-input"
                  placeholder="application/json"
                />
                <button
                  class="remove-header-btn"
                  @click="removeHeader(index)"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <button
                class="add-header-btn"
                @click="addHeader"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </button>
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">超时时间 (毫秒)</label>
            <input
              v-model.number="proxyData.timeout"
              type="number"
              class="field-input"
              placeholder="30000"
              min="1000"
              max="300000"
            />
          </div>

          <div class="field-group">
            <label class="field-label">跟随重定向</label>
            <div class="checkbox-group">
              <input
                v-model="proxyData.followRedirects"
                type="checkbox"
                class="checkbox"
                id="followRedirects"
              />
              <label for="followRedirects" class="checkbox-label">自动跟随HTTP重定向</label>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤3: 预览和确认 -->
      <div v-if="currentStep === 3" class="step-content">
        <div class="step-header">
          <div class="step-number">3</div>
          <div class="step-title">
            <h4 class="text-base font-medium text-slate-100">预览和确认</h4>
            <p class="text-sm text-slate-400">确认代理配置信息</p>
          </div>
        </div>

        <div class="preview-content">
          <div class="preview-section">
            <h5 class="text-sm font-medium text-slate-100 mb-3">代理配置</h5>
            <div class="preview-grid">
              <div class="preview-item">
                <span class="preview-label">代理名称:</span>
                <span class="preview-value">{{ proxyData.name }}</span>
              </div>
              <div class="preview-item">
                <span class="preview-label">描述:</span>
                <span class="preview-value">{{ proxyData.description || '无' }}</span>
              </div>
              <div class="preview-item">
                <span class="preview-label">目标服务:</span>
                <span class="preview-value">{{ compositionName }}/{{ serviceName }}:{{ targetPort }}</span>
              </div>
              <div class="preview-item">
                <span class="preview-label">HTTP方法:</span>
                <span class="preview-value">{{ proxyData.method }}</span>
              </div>
              <div class="preview-item">
                <span class="preview-label">请求路径:</span>
                <span class="preview-value">{{ proxyData.path }}</span>
              </div>
              <div class="preview-item">
                <span class="preview-label">超时时间:</span>
                <span class="preview-value">{{ proxyData.timeout }}ms</span>
              </div>
            </div>
          </div>

          <div v-if="proxyData.headers.length > 0" class="preview-section">
            <h5 class="text-sm font-medium text-slate-100 mb-3">请求头</h5>
            <div class="headers-preview">
              <div
                v-for="(header, index) in proxyData.headers"
                :key="index"
                class="header-preview-item"
              >
                <span class="header-preview-key">{{ header.key }}:</span>
                <span class="header-preview-value">{{ header.value }}</span>
              </div>
            </div>
          </div>

          <div class="preview-section">
            <h5 class="text-sm font-medium text-slate-100 mb-3">生成的Webhook URL</h5>
            <div class="webhook-url">
              <code class="url-text">{{ generatedWebhookUrl }}</code>
              <button
                class="copy-url-btn"
                @click="copyWebhookUrl"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="wizard-footer">
      <div class="step-indicator">
        <div
          v-for="step in 3"
          :key="step"
          class="step-dot"
          :class="{ active: step <= currentStep, completed: step < currentStep }"
        ></div>
      </div>

      <div class="wizard-actions">
        <button
          v-if="currentStep > 1"
          class="btn-secondary"
          @click="previousStep"
        >
          上一步
        </button>
        <button
          v-if="currentStep < 3"
          class="btn-primary"
          @click="nextStep"
          :disabled="!canProceed"
        >
          下一步
        </button>
        <button
          v-if="currentStep === 3"
          class="btn-primary"
          @click="createProxy"
          :disabled="creating"
        >
          <svg v-if="creating" class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          {{ creating ? '创建中...' : '创建代理' }}
        </button>
        <button
          class="btn-secondary"
          @click="$emit('close')"
        >
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

// Props
const props = defineProps({
  compositionName: {
    type: String,
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  targetPort: {
    type: Number,
    required: true
  }
});

// Emits
const emit = defineEmits(['close', 'created']);

// 响应式数据
const currentStep = ref(1);
const creating = ref(false);

const proxyData = reactive({
  name: '',
  description: '',
  method: 'GET',
  path: '/',
  headers: [],
  timeout: 30000,
  followRedirects: true,
  nameError: ''
});

// 计算属性
const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return proxyData.name && !proxyData.nameError;
  }
  return true;
});

const generatedWebhookUrl = computed(() => {
  const baseUrl = window.location.origin;
  const proxyId = `proxy-${props.compositionName}-${props.serviceName}-${props.targetPort}-${Date.now()}`;
  return `${baseUrl}/api/webhook/proxy/${proxyId}`;
});

// 方法
function validateProxyName() {
  if (!proxyData.name) {
    proxyData.nameError = '代理名称不能为空';
    return false;
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(proxyData.name)) {
    proxyData.nameError = '代理名称只能包含字母、数字、连字符和下划线';
    return false;
  }
  proxyData.nameError = '';
  return true;
}

function nextStep() {
  if (canProceed.value) {
    currentStep.value++;
  }
}

function previousStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
}

function addHeader() {
  proxyData.headers.push({ key: '', value: '' });
}

function removeHeader(index) {
  proxyData.headers.splice(index, 1);
}

function copyWebhookUrl() {
  navigator.clipboard.writeText(generatedWebhookUrl.value).then(() => {
    alert('Webhook URL已复制到剪贴板');
  }).catch(() => {
    alert('复制失败，请手动复制');
  });
}

async function createProxy() {
  creating.value = true;
  try {
    const response = await fetch('/api/workflow-proxy/create-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        compositionName: props.compositionName,
        serviceName: props.serviceName,
        targetPort: props.targetPort,
        proxyName: proxyData.name,
        description: proxyData.description,
        method: proxyData.method,
        path: proxyData.path,
        headers: proxyData.headers.reduce((acc, header) => {
          if (header.key && header.value) {
            acc[header.key] = header.value;
          }
          return acc;
        }, {}),
        timeout: proxyData.timeout,
        followRedirects: proxyData.followRedirects
      })
    });

    const data = await response.json();

    if (data.success) {
      emit('created', data.data);
      alert('工作流代理创建成功！');
    } else {
      alert('创建失败：' + data.error);
    }
  } catch (error) {
    alert('创建失败：' + error.message);
  } finally {
    creating.value = false;
  }
}
</script>

<style scoped>
.proxy-wizard {
  @apply bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full mx-4;
}

.wizard-header {
  @apply px-6 py-4 border-b border-slate-700;
}

.wizard-content {
  @apply px-6 py-6;
}

.step-content {
  @apply space-y-6;
}

.step-header {
  @apply flex items-start space-x-4;
}

.step-number {
  @apply w-8 h-8 bg-sky-600 text-white rounded-full flex items-center justify-center text-sm font-medium;
}

.step-title {
  @apply flex-1;
}

.step-fields {
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

.composition-info {
  @apply bg-slate-700 border border-slate-600 rounded p-3;
}

.info-item {
  @apply flex items-center space-x-2 mb-2 last:mb-0;
}

.info-label {
  @apply text-sm font-medium text-slate-400;
}

.info-value {
  @apply text-sm text-slate-300;
}

.headers-container {
  @apply space-y-2;
}

.header-item {
  @apply flex items-center space-x-2;
}

.header-key-input, .header-value-input {
  @apply bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500;
}

.header-separator {
  @apply text-slate-400;
}

.remove-header-btn, .add-header-btn {
  @apply text-slate-400 hover:text-sky-400 transition-colors;
}

.checkbox-group {
  @apply flex items-center space-x-2;
}

.checkbox {
  @apply w-4 h-4 text-sky-600 bg-slate-700 border-slate-600 rounded focus:ring-sky-500;
}

.checkbox-label {
  @apply text-sm text-slate-300;
}

.preview-content {
  @apply space-y-6;
}

.preview-section {
  @apply bg-slate-700 border border-slate-600 rounded p-4;
}

.preview-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-3;
}

.preview-item {
  @apply flex items-center space-x-2;
}

.preview-label {
  @apply text-sm font-medium text-slate-400;
}

.preview-value {
  @apply text-sm text-slate-300;
}

.headers-preview {
  @apply space-y-2;
}

.header-preview-item {
  @apply flex items-center space-x-2;
}

.header-preview-key {
  @apply text-sm font-medium text-slate-400;
}

.header-preview-value {
  @apply text-sm text-slate-300;
}

.webhook-url {
  @apply flex items-center space-x-2 bg-slate-900 border border-slate-600 rounded p-3;
}

.url-text {
  @apply flex-1 text-sm text-slate-300 font-mono break-all;
}

.copy-url-btn {
  @apply text-slate-400 hover:text-sky-400 transition-colors;
}

.wizard-footer {
  @apply px-6 py-4 border-t border-slate-700;
}

.step-indicator {
  @apply flex items-center justify-center space-x-2 mb-4;
}

.step-dot {
  @apply w-2 h-2 rounded-full bg-slate-600 transition-colors;
}

.step-dot.active {
  @apply bg-sky-600;
}

.step-dot.completed {
  @apply bg-green-500;
}

.wizard-actions {
  @apply flex items-center justify-end space-x-3;
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
