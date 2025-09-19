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
            <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-300">组件清单 (component.json)</h3>
            <div class="rounded-lg border border-slate-700 bg-slate-950/80 p-4">
              <pre class="text-sm text-slate-300 overflow-x-auto">{{ JSON.stringify(selectedComponent.manifest || {}, null, 2) }}</pre>
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
                  @click="editCode"
                >
                  编辑代码
                </button>
                <button
                  class="rounded-lg border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-600"
                  @click="copyCode"
                >
                  复制代码
                </button>
              </div>
            </div>
            <div class="rounded-lg border border-slate-700 bg-slate-950/80 p-4">
              <pre class="text-sm text-slate-300 overflow-x-auto">{{ componentCode }}</pre>
            </div>
          </div>

          <!-- 执行测试 -->
          <div v-else-if="activeTab === 'test'" class="space-y-4">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-300">执行测试</h3>
            <div class="rounded-lg border border-slate-700 bg-slate-950/80 p-4">
              <p class="text-sm text-slate-400 mb-4">点击下方按钮执行组件测试</p>
              <button
                class="rounded-lg bg-sky-500/90 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-400"
                @click="executeComponent"
              >
                执行组件
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch } from 'vue';

export default {
  name: 'ComponentManager',
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
    const loading = ref(false);

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

    // 监听组件变化，加载组件代码
    watch(() => props.selectedComponent, async (newComponent) => {
      if (newComponent) {
        await loadComponentCode();
      }
    }, { immediate: true });

    async function loadComponentCode() {
      if (!props.selectedComponent) return;
      
      loading.value = true;
      try {
        const res = await fetch(`/api/components/${props.componentType}/${props.selectedComponent.name}`);
        if (!res.ok) {
          throw new Error('无法获取组件代码');
        }
        const data = await res.json();
        if (data.success && data.data.code) {
          componentCode.value = data.data.code;
        } else {
          componentCode.value = '// 组件代码加载失败';
        }
      } catch (err) {
        console.error(err);
        componentCode.value = '// 组件代码加载失败: ' + err.message;
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

    function editCode() {
      // 编辑代码功能将在后续实现
      alert('代码编辑功能即将上线');
    }

    async function executeComponent() {
      if (!props.selectedComponent) return;
      
      try {
        const res = await fetch(`/api/components/execute/${props.componentType}/${props.selectedComponent.name}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs: {}, context: {} })
        });
        
        const data = await res.json();
        if (data.success) {
          alert('组件执行成功！\n结果: ' + JSON.stringify(data.data, null, 2));
        } else {
          alert('组件执行失败: ' + data.error);
        }
      } catch (err) {
        alert('组件执行失败: ' + err.message);
      }
    }

    return {
      activeTab,
      componentCode,
      loading,
      tabs,
      copyCode,
      editCode,
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