<template>
  <div class="images-tab">
    <div class="tab-header">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <h3 class="text-base font-medium text-slate-100">镜像列表</h3>
          <div class="flex items-center space-x-2">
            <label class="flex items-center text-sm text-slate-400">
              <input
                v-model="showAllImages"
                type="checkbox"
                class="mr-2 rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-sky-500"
                @change="fetchImages"
              />
              显示所有镜像
            </label>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button
            class="btn-secondary"
            @click="fetchImages"
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
        </div>
      </div>
    </div>

    <div class="tab-content">
      <div v-if="loading" class="loading-state">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
        <p class="text-sm text-slate-400 mt-2">加载镜像中...</p>
      </div>

      <div v-else-if="images.length === 0" class="empty-state">
        <div class="text-center py-12">
          <svg class="w-12 h-12 text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <h3 class="text-lg font-medium text-slate-300 mb-2">暂无镜像</h3>
          <p class="text-sm text-slate-500">没有找到任何镜像</p>
        </div>
      </div>

      <div v-else class="images-list">
        <div class="table-container">
          <table class="images-table">
            <thead>
              <tr>
                <th class="text-left">镜像</th>
                <th class="text-left">标签</th>
                <th class="text-left">镜像ID</th>
                <th class="text-left">大小</th>
                <th class="text-left">创建时间</th>
                <th class="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="image in images" :key="image.ID" class="image-row">
                <td class="image-info">
                  <div class="flex items-center space-x-3">
                    <div class="image-icon">
                      <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <div>
                      <div class="font-medium text-slate-100">{{ getImageName(image.Repository) }}</div>
                      <div class="text-xs text-slate-500">{{ image.Repository }}</div>
                    </div>
                  </div>
                </td>
                <td class="tag-cell">
                  <span class="tag-badge">{{ image.Tag || 'latest' }}</span>
                </td>
                <td class="id-cell">
                  <div class="text-xs text-slate-400 font-mono">{{ image.ID.substring(7, 19) }}</div>
                </td>
                <td class="size-cell">
                  <div class="text-sm text-slate-300">{{ formatSize(image.Size) }}</div>
                </td>
                <td class="created-cell">
                  <div class="text-xs text-slate-400">{{ formatDate(image.CreatedAt) }}</div>
                </td>
                <td class="actions-cell">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      class="action-btn delete"
                      @click="removeImage(image.ID)"
                      :disabled="loading"
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 响应式数据
const images = ref([]);
const loading = ref(false);
const showAllImages = ref(false);

// 获取镜像列表
async function fetchImages() {
  loading.value = true;
  try {
    const response = await fetch(`/api/containers/images?all=${showAllImages.value}`);
    const data = await response.json();
    
    if (data.success) {
      images.value = data.data;
    }
  } catch (error) {
    console.error('Failed to fetch images:', error);
  } finally {
    loading.value = false;
  }
}

// 删除镜像
async function removeImage(imageId) {
  if (!confirm('确定要删除这个镜像吗？')) return;
  
  loading.value = true;
  try {
    const response = await fetch(`/api/containers/images/${imageId}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    
    if (data.success) {
      await fetchImages();
    }
  } catch (error) {
    console.error('Failed to remove image:', error);
  } finally {
    loading.value = false;
  }
}

// 获取镜像名称
function getImageName(repository) {
  if (!repository) return 'Unknown';
  const parts = repository.split('/');
  return parts[parts.length - 1];
}

// 格式化大小
function formatSize(size) {
  if (!size) return '0 B';
  
  // 如果已经是格式化的字符串（如"10.1GB"），直接返回
  if (typeof size === 'string' && /^\d+\.?\d*[A-Z]+$/.test(size)) {
    return size;
  }
  
  // 如果是数字，按字节格式化
  const bytes = parseInt(size);
  if (isNaN(bytes)) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  if (i === 0) return `${bytes} ${sizes[i]}`;
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// 组件挂载时获取镜像列表
onMounted(() => {
  fetchImages();
});
</script>

<style scoped>
.images-tab {
  @apply h-full flex flex-col;
}

.tab-header {
  @apply px-6 py-4 border-b border-slate-700;
}

.tab-content {
  @apply flex-1 overflow-hidden;
}

.loading-state, .empty-state {
  @apply flex flex-col items-center justify-center h-full;
}

.images-list {
  @apply h-full overflow-hidden;
}

.table-container {
  @apply h-full overflow-auto;
}

.images-table {
  @apply w-full;
}

.images-table th {
  @apply px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider border-b border-slate-700;
}

.images-table td {
  @apply px-4 py-3 border-b border-slate-800;
}

.image-row:hover {
  @apply bg-slate-800/50;
}

.tag-badge {
  @apply inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/20 text-blue-400;
}

.action-btn {
  @apply px-3 py-1 text-xs font-medium rounded transition-colors;
}

.action-btn.delete {
  @apply bg-red-600 text-white hover:bg-red-700;
}

.action-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.btn-secondary {
  @apply flex items-center px-3 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded transition-colors;
}
</style>
