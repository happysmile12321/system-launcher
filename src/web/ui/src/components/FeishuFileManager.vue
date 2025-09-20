<template>
  <div
    :class="[
      'rounded-2xl border backdrop-blur p-6 transition-all duration-300',
      feishuConfigStatus.configured
        ? 'border-slate-800 bg-slate-900/60'
        : 'border-slate-700 bg-slate-900/30 opacity-60',
    ]"
  >
    <!-- 头部 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-lg font-semibold text-slate-100">飞书文件管理</h2>
        <p class="text-sm text-slate-400 mt-1">
          管理飞书云盘中的文件和备份计划
        </p>
        <div class="mt-2">
          <a
            href="https://t1zosp7g1k7.feishu.cn/docx/QNN6dcEefohapsxmpMTcBnusnkf#share-WdW3dzZq2oHl8ix57GUcNLKun5g"
            target="_blank"
            class="text-xs text-sky-400 hover:text-sky-300 underline"
          >
            📖 查看飞书集成配置步骤
          </a>
        </div>

        <!-- WebSocket状态指示器 -->
        <div class="flex items-center gap-2 mt-2">
          <div class="flex items-center gap-1">
            <div
              :class="[
                'w-2 h-2 rounded-full',
                feishuWebSocketStatus.connected ? 'bg-green-500' : 'bg-red-500',
              ]"
            ></div>
            <span class="text-xs text-slate-400">
              WebSocket:
              {{ feishuWebSocketStatus.connected ? "已连接" : "未连接" }}
            </span>
          </div>
          <button
            v-if="!feishuWebSocketStatus.connected"
            @click="$emit('startWebSocket')"
            :disabled="feishuWebSocketLoading || !feishuConfigStatus.configured"
            class="text-xs text-sky-400 hover:text-sky-300 underline disabled:opacity-50"
          >
            {{ feishuWebSocketLoading ? "启动中..." : "启动连接" }}
          </button>
          <button
            v-else
            @click="$emit('stopWebSocket')"
            :disabled="feishuWebSocketLoading"
            class="text-xs text-amber-400 hover:text-amber-300 underline disabled:opacity-50"
          >
            {{ feishuWebSocketLoading ? "停止中..." : "停止连接" }}
          </button>
          <button
            v-if="
              !feishuWebSocketStatus.connected && feishuConfigStatus.configured
            "
            @click="$emit('openLongConnectionConfig')"
            class="text-xs text-purple-400 hover:text-purple-300 underline"
          >
            🔗 配置长连接
          </button>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex items-center gap-2">
        <button
          class="rounded-lg border border-amber-500 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/10"
          @click="$emit('showConfigDialog')"
          v-if="!feishuAuthStatus.authenticated"
        >
          ⚙️ 配置飞书
        </button>
        <button
          class="rounded-lg border border-sky-500 px-4 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="$emit('refreshFiles')"
          :disabled="!feishuConfigStatus.configured"
        >
          刷新文件列表
        </button>
        <button
          class="rounded-lg border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="$emit('createBackupPlan')"
          :disabled="!feishuConfigStatus.configured"
        >
          创建备份计划
        </button>
      </div>
    </div>

    <!-- 文件列表 -->
    <div class="space-y-4">
      <!-- 加载状态 -->
      <div
        v-if="feishuFilesLoading"
        class="flex items-center justify-center py-8"
      >
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"
        ></div>
        <span class="ml-2 text-sm text-slate-400">加载文件列表中...</span>
      </div>

      <!-- 空状态 -->
      <div v-else-if="feishuFiles.length === 0" class="text-center py-8">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="mx-auto text-slate-500"
        >
          <path
            d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"
          ></path>
          <polyline points="14,2 14,8 20,8"></polyline>
        </svg>
        <h3 class="mt-4 text-lg font-medium text-slate-300">暂无文件</h3>
        <p class="mt-2 text-slate-500">飞书云盘中还没有文件</p>
      </div>

      <!-- 文件网格 -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="file in feishuFiles"
          :key="file.token"
          class="rounded-lg border border-slate-700 bg-slate-800/40 p-4 hover:bg-slate-800/60 transition"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="text-sm font-medium text-slate-100 truncate">
                {{ file.name }}
              </h4>
              <p class="text-xs text-slate-400 mt-1">
                {{ file.type === "file" ? "文件" : "文件夹" }}
              </p>
              <p class="text-xs text-slate-500 mt-1">
                {{ formatFileSize(file.size) }}
              </p>
            </div>
            <div class="flex items-center gap-1">
              <button
                class="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-700"
                @click="$emit('downloadFile', file)"
              >
                下载
              </button>
              <button
                class="rounded border border-red-500/40 px-2 py-1 text-xs text-red-300 transition hover:bg-red-500/10"
                @click="$emit('deleteFile', file)"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 飞书文件管理组件
 * 负责显示和管理飞书云盘中的文件
 */

defineProps({
  feishuFiles: {
    type: Array,
    default: () => [],
  },
  feishuFilesLoading: {
    type: Boolean,
    default: false,
  },
  feishuConfigStatus: {
    type: Object,
    default: () => ({ configured: false }),
  },
  feishuAuthStatus: {
    type: Object,
    default: () => ({ authenticated: false }),
  },
  feishuWebSocketStatus: {
    type: Object,
    default: () => ({ connected: false }),
  },
  feishuWebSocketLoading: {
    type: Boolean,
    default: false,
  },
});

defineEmits([
  "startWebSocket",
  "stopWebSocket",
  "openLongConnectionConfig",
  "showConfigDialog",
  "refreshFiles",
  "createBackupPlan",
  "downloadFile",
  "deleteFile",
]);

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
</script>
