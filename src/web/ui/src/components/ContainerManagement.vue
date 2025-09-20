<template>
  <div class="container-management">
    <div class="header">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-slate-100">容器管理</h2>
          <p class="text-sm text-slate-400 mt-1">管理Docker容器、镜像和容器组</p>
        </div>
        <div class="flex items-center space-x-3">
          <div class="status-indicator" :class="serviceStatus.available ? 'online' : 'offline'">
            <div class="status-dot"></div>
            <span class="text-xs text-slate-300">
              {{ serviceStatus.available ? 'Docker 已连接' : 'Docker 未连接' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="content">
      <!-- 标签页导航 -->
      <div class="tabs-nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-button"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" class="w-4 h-4 mr-2" />
          {{ tab.name }}
        </button>
      </div>

      <!-- 标签页内容 -->
      <div class="tab-content">
        <!-- 容器标签页 -->
        <div v-if="activeTab === 'containers'" class="tab-panel">
          <ContainersTab />
        </div>

        <!-- 镜像标签页 -->
        <div v-if="activeTab === 'images'" class="tab-panel">
          <ImagesTab />
        </div>

        <!-- 容器组标签页 -->
        <div v-if="activeTab === 'compositions'" class="tab-panel">
          <CompositionsTab />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { 
  ContainerIcon, 
  ImageIcon, 
  DatabaseIcon 
} from 'lucide-vue-next';
import ContainersTab from './ContainersTab.vue';
import ImagesTab from './ImagesTab.vue';
import CompositionsTab from './CompositionsTab.vue';

// 响应式数据
const activeTab = ref('containers');
const serviceStatus = ref({
  available: false,
  driver: null
});

// 标签页配置
const tabs = [
  {
    id: 'containers',
    name: '容器',
    icon: ContainerIcon
  },
  {
    id: 'images',
    name: '镜像',
    icon: ImageIcon
  },
  {
    id: 'compositions',
    name: '容器组',
    icon: DatabaseIcon
  }
];

// 获取服务状态
async function fetchServiceStatus() {
  try {
    const response = await fetch('/api/containers/status');
    const data = await response.json();
    
    if (data.success) {
      serviceStatus.value = data.data;
    }
  } catch (error) {
    console.error('Failed to fetch service status:', error);
  }
}

// 组件挂载时获取状态
onMounted(() => {
  fetchServiceStatus();
});
</script>

<style scoped>
.container-management {
  @apply h-full flex flex-col bg-slate-900;
}

.header {
  @apply px-6 py-4 border-b border-slate-700;
}

.content {
  @apply flex-1 flex flex-col overflow-hidden;
}

.tabs-nav {
  @apply flex border-b border-slate-700 bg-slate-800;
}

.tab-button {
  @apply flex items-center px-6 py-3 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors;
}

.tab-button.active {
  @apply text-sky-400 bg-slate-700 border-b-2 border-sky-400;
}

.tab-content {
  @apply flex-1 overflow-hidden;
}

.tab-panel {
  @apply h-full overflow-hidden;
}

.status-indicator {
  @apply flex items-center space-x-2 px-3 py-1 rounded-full;
}

.status-indicator.online {
  @apply bg-green-900/20 text-green-400;
}

.status-indicator.offline {
  @apply bg-red-900/20 text-red-400;
}

.status-dot {
  @apply w-2 h-2 rounded-full;
}

.status-indicator.online .status-dot {
  @apply bg-green-400;
}

.status-indicator.offline .status-dot {
  @apply bg-red-400;
}
</style>
