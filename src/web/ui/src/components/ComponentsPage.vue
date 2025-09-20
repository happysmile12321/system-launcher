<template>
  <div class="components-page">
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-[22rem_1fr]">
      <!-- 左侧：组件列表 -->
      <section class="flex h-full flex-col gap-4">
        <div class="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur">
          <div class="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-300">组件列表</h2>
            <button
              class="rounded-lg border border-sky-500 px-3 py-1 text-xs font-medium text-sky-300 transition hover:bg-sky-500/10"
              @click="handleCreateComponent"
            >
              + 新建组件
            </button>
          </div>
          <div class="max-h-[20rem] overflow-y-auto px-2 py-2 scrollbar-hide">
            <template v-if="loadingStates.components">
              <div class="space-y-4">
                <!-- 系统组件骨架 -->
                <div>
                  <div class="flex w-full items-center justify-between rounded-lg px-3 py-2">
                    <SkeletonLoader type="text" width="80px" height="0.875rem" />
                    <div class="h-4 w-4 rounded bg-slate-600"></div>
                  </div>
                  <div class="ml-4 space-y-1">
                    <div v-for="i in 2" :key="i" class="flex items-start gap-3 rounded-xl px-3 py-2">
                      <div class="mt-1 h-2 w-2 rounded-full bg-slate-600"></div>
                      <div class="flex-1 space-y-1">
                        <SkeletonLoader type="text" width="70%" height="0.875rem" />
                        <SkeletonLoader type="text" width="50%" height="0.75rem" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 用户组件骨架 -->
                <div>
                  <div class="flex w-full items-center justify-between rounded-lg px-3 py-2">
                    <SkeletonLoader type="text" width="80px" height="0.875rem" />
                    <div class="h-4 w-4 rounded bg-slate-600"></div>
                  </div>
                  <div class="ml-4 space-y-1">
                    <div v-for="i in 2" :key="i" class="flex items-start gap-3 rounded-xl px-3 py-2">
                      <div class="mt-1 h-2 w-2 rounded-full bg-slate-600"></div>
                      <div class="flex-1 space-y-1">
                        <SkeletonLoader type="text" width="70%" height="0.875rem" />
                        <SkeletonLoader type="text" width="50%" height="0.75rem" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <!-- 本地组件区域 -->
              <div class="mb-4">
                <button
                  class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-300 hover:bg-slate-800/40"
                  @click="toggleSystemComponents"
                >
                  <span>本地组件</span>
                  <svg
                    class="h-4 w-4 transition-transform"
                    :class="showSystemComponents ? 'rotate-90' : ''"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
                <div v-if="showSystemComponents" class="ml-4 space-y-1">
                  <button
                    v-for="component in systemComponents"
                    :key="`local-${component.name}`"
                    class="group flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition"
                    :class="selectedComponentId === `local-${component.name}` ? 'bg-sky-500/10 border border-sky-500/40' : 'border border-transparent hover:border-slate-700 hover:bg-slate-800/40'"
                    @click="selectComponent(`local-${component.name}`, component)"
                  >
                    <span class="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-blue-400"></span>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-medium text-slate-100">{{ component.displayName || component.name }}</p>
                      <p class="mt-1 line-clamp-1 text-xs text-slate-400">{{ component.description || '本地组件' }}</p>
                    </div>
                  </button>
                </div>
              </div>

              <!-- 我的组件区域 -->
              <div>
                <button
                  class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-300 hover:bg-slate-800/40"
                  @click="toggleUserComponents"
                >
                  <span>我的组件</span>
                  <svg
                    class="h-4 w-4 transition-transform"
                    :class="showUserComponents ? 'rotate-90' : ''"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
                <div v-if="showUserComponents" class="ml-4 space-y-1">
                  <button
                    v-for="component in userComponents"
                    :key="`user-${component.name}`"
                    class="group flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition"
                    :class="selectedComponentId === `user-${component.name}` ? 'bg-sky-500/10 border border-sky-500/40' : 'border border-transparent hover:border-slate-700 hover:bg-slate-800/40'"
                    @click="selectComponent(`user-${component.name}`, component)"
                  >
                    <span class="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400"></span>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-medium text-slate-100">{{ component.displayName || component.name }}</p>
                      <p class="mt-1 line-clamp-1 text-xs text-slate-400">{{ component.description || '用户组件' }}</p>
                    </div>
                  </button>
                  <p v-if="!userComponents.length" class="px-3 py-4 text-xs text-slate-500">还没有自定义组件，点击右上角"新建组件"开始吧。</p>
                </div>
              </div>
            </template>
          </div>
        </div>
      </section>

      <!-- 右侧：组件内容展示区 -->
      <section class="flex flex-col gap-4">
        <div class="flex-1 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur">
          <div v-if="!currentComponent" class="flex h-full items-center justify-center">
            <div class="text-center">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mx-auto text-slate-500">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
              <h3 class="mt-6 text-lg font-medium text-slate-300">选择组件</h3>
              <p class="mt-2 text-slate-500">从左侧列表中选择一个组件来查看或编辑</p>
            </div>
          </div>
          <div v-else class="h-full">
            <ComponentManager :selected-component="currentComponent" :component-type="currentComponentType" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ComponentManager from './ComponentManager.vue';
import SkeletonLoader from './SkeletonLoader.vue';

// 响应式数据
const systemComponents = ref([]);
const userComponents = ref([]);
const selectedComponentId = ref(null);
const currentComponent = ref(null);
const currentComponentType = ref('official');
const showSystemComponents = ref(true);
const showUserComponents = ref(true);
const loadingStates = ref({
  components: false
});

// 获取组件列表
async function fetchComponents() {
  loadingStates.value.components = true;
  try {
    // 获取系统组件
    const systemRes = await fetch('/api/components/system');
    if (systemRes.ok) {
      const systemData = await systemRes.json();
      systemComponents.value = systemData.data || [];
    }

    // 获取用户组件
    const userRes = await fetch('/api/components/user');
    if (userRes.ok) {
      const userData = await userRes.json();
      userComponents.value = userData.data || [];
    }
  } catch (error) {
    console.error('获取组件列表失败:', error);
  } finally {
    loadingStates.value.components = false;
  }
}

// 选择组件
function selectComponent(componentId, component) {
  selectedComponentId.value = componentId;
  currentComponent.value = component;
  
  // 判断组件类型
  if (componentId.startsWith('local-')) {
    currentComponentType.value = 'official';
  } else if (componentId.startsWith('user-')) {
    currentComponentType.value = 'user';
  }
}

// 切换组件列表显示
function toggleSystemComponents() {
  showSystemComponents.value = !showSystemComponents.value;
}

function toggleUserComponents() {
  showUserComponents.value = !showUserComponents.value;
}

// 创建新组件
function handleCreateComponent() {
  // 这里可以打开创建组件的对话框
  console.log('创建新组件');
}

// 组件挂载时获取数据
onMounted(() => {
  fetchComponents();
});
</script>

<style scoped>
.components-page {
  @apply h-full;
}
</style>
