<template>
  <div class="component-detail">
    <div v-if="selectedComponent" class="h-full flex flex-col">
      <!-- 组件头部信息 -->
      <div class="border-b border-slate-800 px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-slate-100">{{ selectedComponent.displayName || selectedComponent.name }}</h2>
            <p class="text-sm text-slate-400 mt-1">{{ selectedComponent.description || '暂无描述' }}</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
                  :class="componentType === 'official' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'">
              {{ componentType === 'official' ? '系统组件' : '用户组件' }}
            </span>
            <span class="text-xs text-slate-500">v{{ selectedComponent.version || '1.0.0' }}</span>
          </div>
        </div>
      </div>

      <!-- 组件内容区域 -->
      <div class="flex-1 flex">
        <!-- 标签页导航 -->
        <div class="w-48 border-r border-slate-800 bg-slate-900/40">
          <nav class="p-4 space-y-1">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :class="['w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition',
                       activeTab === tab.id ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40']"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- 内容区域 -->
        <div class="flex-1 p-6">
          <!-- 组件清单 -->
          <div v-if="activeTab === 'manifest'" class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-300">组件清单 (component.json)</h3>
              <div class="flex items-center gap-2">
                <button
                  v-if="componentType === 'user'"
                  class="rounded-lg border border-sky-500 px-3 py-1 text-xs font-medium text-sky-300 transition hover:bg-sky-500/10"
                  @click="toggleManifestView"
                >
                  {{ manifestViewMode === 'form' ? '源码视图' : '表单视图' }}
                </button>
                <button
                  v-if="componentType === 'user' && manifestViewMode === 'code'"
                  class="rounded-lg border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-600"
                  @click="saveManifest"
                >
                  保存清单
                </button>
              </div>
            </div>
            
            <!-- 表单视图 -->
            <div v-if="manifestViewMode === 'form'" class="space-y-4">
              <!-- 系统组件提示 -->
              <div v-if="componentType === 'official'" class="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                <div class="flex items-center gap-2">
                  <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                  系统组件不允许编辑，只能查看
                </div>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">组件名称</label>
                  <input
                    v-model="manifestForm.name"
                    type="text"
                    :disabled="componentType === 'official'"
                    class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="组件名称"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">显示名称</label>
                  <input
                    v-model="manifestForm.displayName"
                    type="text"
                    :disabled="componentType === 'official'"
                    class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="显示名称"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">描述</label>
                <textarea
                  v-model="manifestForm.description"
                  rows="3"
                  :disabled="componentType === 'official'"
                  class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="组件描述"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">版本</label>
                <input
                  v-model="manifestForm.version"
                  type="text"
                  :disabled="componentType === 'official'"
                  class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="1.0.0"
                />
              </div>
            </div>
            
            <!-- 源码视图 -->
            <div v-else>
              <MonacoEditor
                v-model="manifestCode"
                language="json"
                :height="'300px'"
                :read-only="componentType !== 'user'"
                :options="{
                  formatOnPaste: true,
                  formatOnType: true
                }"
                @change="onManifestCodeChange"
              />
            </div>
          </div>

          <!-- 组件代码 -->
          <div v-else-if="activeTab === 'code'" class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-300">组件代码 (index.js)</h3>
              <div class="flex items-center gap-2">
                <button
                  v-if="componentType === 'user'"
                  class="rounded-lg border border-sky-500 px-3 py-1 text-xs font-medium text-sky-300 transition hover:bg-sky-500/10"
                  @click="saveCode"
                >
                  保存代码
                </button>
                <button
                  class="rounded-lg border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-600"
                  @click="copyCode"
                >
                  复制代码
                </button>
              </div>
            </div>
            <MonacoEditor
              v-model="componentCode"
              language="javascript"
              :height="'500px'"
              :read-only="componentType !== 'user'"
              :options="{
                formatOnPaste: true,
                formatOnType: true,
                suggestOnTriggerCharacters: true,
                quickSuggestions: true
              }"
              @change="onCodeChange"
            />
          </div>

          <!-- 执行测试 -->
          <div v-else-if="activeTab === 'test'" class="space-y-4">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-300">执行测试</h3>
            
            <!-- 输入参数配置 -->
            <div v-if="testInputs.length > 0" class="space-y-4">
              <h4 class="text-sm font-medium text-slate-300">输入参数</h4>
              <div class="space-y-3">
                <div
                  v-for="(input, index) in testInputs"
                  :key="index"
                  class="rounded-lg border border-slate-700 bg-slate-900/60 p-4"
                >
                  <label class="block text-xs font-medium text-slate-400 mb-2">
                    {{ input.name || input.id }}
                    <span v-if="input.required" class="text-red-400">*</span>
                  </label>
                  <p v-if="input.description" class="text-xs text-slate-500 mb-2">{{ input.description }}</p>
                  
                  <!-- 文本输入 -->
                  <input
                    v-if="!input.type || input.type === 'string'"
                    v-model="inputValues[input.id]"
                    type="text"
                    class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                    :placeholder="input.placeholder || `请输入${input.name || input.id}`"
                  />
                  
                  <!-- 数字输入 -->
                  <input
                    v-else-if="input.type === 'number'"
                    v-model.number="inputValues[input.id]"
                    type="number"
                    class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                    :placeholder="input.placeholder || `请输入${input.name || input.id}`"
                  />
                  
                  <!-- 布尔输入 -->
                  <label v-else-if="input.type === 'boolean'" class="flex items-center">
                    <input
                      v-model="inputValues[input.id]"
                      type="checkbox"
                      class="rounded border-slate-700 bg-slate-950 text-sky-500 focus:border-sky-500 focus:ring-sky-500"
                    />
                    <span class="ml-2 text-sm text-slate-300">{{ input.name || input.id }}</span>
                  </label>
                  
                  <!-- 文本域 -->
                  <textarea
                    v-else-if="input.type === 'text'"
                    v-model="inputValues[input.id]"
                    rows="3"
                    class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                    :placeholder="input.placeholder || `请输入${input.name || input.id}`"
                  />
                </div>
              </div>
            </div>
            
            <!-- 执行按钮和结果 -->
            <div class="space-y-4">
              <button
                class="rounded-lg bg-sky-500/90 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="isExecuting"
                @click="executeComponent"
              >
                {{ isExecuting ? '执行中...' : '执行组件' }}
              </button>
              
              <!-- 执行结果 -->
              <div v-if="executionResult" class="space-y-3">
                <h4 class="text-sm font-medium text-slate-300">执行结果</h4>
                <div class="rounded-lg border border-slate-700 bg-slate-950/80 p-4">
                  <pre class="text-sm text-slate-300 overflow-x-auto">{{ JSON.stringify(executionResult, null, 2) }}</pre>
                </div>
              </div>
              
              <!-- 执行日志 -->
              <div v-if="executionLogs.length > 0" class="space-y-3">
                <h4 class="text-sm font-medium text-slate-300">执行日志</h4>
                <div class="rounded-lg border border-slate-700 bg-slate-950/80 p-4">
                  <div class="space-y-1">
                    <div
                      v-for="(log, index) in executionLogs"
                      :key="index"
                      class="text-sm font-mono"
                      :class="{
                        'text-slate-300': log.level === 'info',
                        'text-red-400': log.level === 'error',
                        'text-green-400': log.level === 'success'
                      }"
                    >
                      [{{ log.level.toUpperCase() }}] {{ log.message }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch } from 'vue';
import MonacoEditor from './MonacoEditor.vue';

export default {
  name: 'ComponentManager',
  components: {
    MonacoEditor
  },
  props: {
    selectedComponent: {
      type: Object,
      default: null
    },
    componentType: {
      type: String,
      default: 'official'
    }
  },
  setup(props) {
    const activeTab = ref('manifest');
    const componentCode = ref('');
    const manifestCode = ref('');
    const manifestViewMode = ref('form');
    const manifestForm = ref({
      name: '',
      displayName: '',
      description: '',
      version: '1.0.0',
      inputs: [],
      outputs: []
    });
    const loading = ref(false);
    const hasUnsavedChanges = ref(false);
    const isExecuting = ref(false);
    const executionResult = ref(null);
    const executionLogs = ref([]);
    const testInputs = ref([]);
    const inputValues = ref({});

    const tabs = computed(() => {
      const baseTabs = [
        { id: 'manifest', label: '组件清单' },
        { id: 'code', label: '组件代码' }
      ];
      
      // 只有用户组件才显示测试标签页
      if (props.componentType === 'user') {
        baseTabs.push({ id: 'test', label: '执行测试' });
      }
      
      return baseTabs;
    });

    // 监听组件变化，加载组件代码和清单
    watch(() => props.selectedComponent, async (newComponent) => {
      if (newComponent) {
        await loadComponentData();
      }
    }, { immediate: true });

    async function loadComponentData() {
      if (!props.selectedComponent) return;
      
      loading.value = true;
      try {
        const res = await fetch(`/api/components/${props.componentType}/${props.selectedComponent.name}`);
        if (!res.ok) {
          throw new Error('无法获取组件数据');
        }
        const data = await res.json();
        if (data.success && data.data) {
          // 加载组件代码
          componentCode.value = data.data.code || '// 组件代码加载失败';
          
          // 加载组件清单
          if (data.data.manifest) {
            manifestCode.value = JSON.stringify(data.data.manifest, null, 2);
            manifestForm.value = { ...data.data.manifest };
            
            // 初始化测试输入
            testInputs.value = data.data.manifest.inputs || [];
            inputValues.value = {};
            testInputs.value.forEach(input => {
              inputValues.value[input.id] = input.defaultValue || '';
            });
          }
        } else {
          componentCode.value = '// 组件代码加载失败';
          manifestCode.value = '{}';
        }
      } catch (err) {
        console.error(err);
        componentCode.value = '// 组件代码加载失败: ' + err.message;
        manifestCode.value = '{}';
      } finally {
        loading.value = false;
      }
    }

    function copyCode() {
      navigator.clipboard.writeText(componentCode.value).then(() => {
        alert('代码已复制到剪贴板');
      }).catch(() => {
        alert('复制失败，请手动复制');
      });
    }

    function toggleManifestView() {
      manifestViewMode.value = manifestViewMode.value === 'form' ? 'code' : 'form';
    }

    function onManifestCodeChange() {
      hasUnsavedChanges.value = true;
    }

    function onCodeChange() {
      hasUnsavedChanges.value = true;
    }

    async function saveManifest() {
      if (!props.selectedComponent || props.componentType !== 'user') return;
      
      try {
        let manifest;
        if (manifestViewMode.value === 'form') {
          manifest = { ...manifestForm.value };
        } else {
          manifest = JSON.parse(manifestCode.value);
        }

        const res = await fetch(`/api/components/user/${props.selectedComponent.name}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            manifest, 
            code: componentCode.value 
          })
        });

        if (!res.ok) {
          throw new Error('保存失败');
        }

        alert('组件清单已保存');
        hasUnsavedChanges.value = false;
      } catch (err) {
        alert('保存失败: ' + err.message);
      }
    }

    async function saveCode() {
      if (!props.selectedComponent || props.componentType !== 'user') return;
      
      try {
        const res = await fetch(`/api/components/user/${props.selectedComponent.name}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            manifest: manifestViewMode.value === 'form' ? manifestForm.value : JSON.parse(manifestCode.value), 
            code: componentCode.value 
          })
        });

        if (!res.ok) {
          throw new Error('保存失败');
        }

        alert('组件代码已保存');
        hasUnsavedChanges.value = false;
      } catch (err) {
        alert('保存失败: ' + err.message);
      }
    }

    async function executeComponent() {
      if (!props.selectedComponent) return;
      
      isExecuting.value = true;
      executionResult.value = null;
      executionLogs.value = [];
      
      try {
        const res = await fetch(`/api/components/execute/${props.componentType}/${props.selectedComponent.name}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            inputs: inputValues.value, 
            context: {} 
          })
        });
        
        const data = await res.json();
        if (data.success) {
          executionResult.value = data.data;
          executionLogs.value = [
            { level: 'success', message: '组件执行成功' },
            { level: 'info', message: `执行时间: ${new Date().toLocaleTimeString()}` }
          ];
        } else {
          executionLogs.value = [
            { level: 'error', message: `执行失败: ${data.error}` }
          ];
        }
      } catch (err) {
        executionLogs.value = [
          { level: 'error', message: `执行失败: ${err.message}` }
        ];
      } finally {
        isExecuting.value = false;
      }
    }

    return {
      activeTab,
      componentCode,
      manifestCode,
      manifestViewMode,
      manifestForm,
      loading,
      hasUnsavedChanges,
      isExecuting,
      executionResult,
      executionLogs,
      testInputs,
      inputValues,
      tabs,
      copyCode,
      toggleManifestView,
      onManifestCodeChange,
      onCodeChange,
      saveManifest,
      saveCode,
      executeComponent
    };
  }
};
</script>

<style scoped>
.component-detail {
  height: 100%;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.5;
}
</style>