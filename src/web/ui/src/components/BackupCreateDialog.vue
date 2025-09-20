<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
  >
    <div
      class="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
    >
      <!-- 头部 -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-slate-100">创建容器自动备份</h3>
        <p class="text-sm text-slate-400 mt-1">
          为选中的容器创建定时备份工作流
        </p>
      </div>

      <!-- 表单内容 -->
      <div class="space-y-6">
        <!-- 容器选择 -->
        <div>
          <label class="text-sm font-medium text-slate-300">选择容器</label>
          <select
            v-model="form.containerId"
            class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
          >
            <option value="">请选择容器</option>
            <option
              v-for="container in containers"
              :key="container.id"
              :value="container.id"
            >
              {{ container.name || container.id }} ({{
                getContainerStatus(container.status)
              }})
            </option>
          </select>
        </div>

        <!-- 备份频率 -->
        <div>
          <label class="text-sm font-medium text-slate-300"
            >备份频率 (Cron表达式)</label
          >
          <div class="mt-1 flex items-center gap-2">
            <input
              v-model="form.cronExpression"
              type="text"
              class="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              placeholder="0 2 * * * (每天凌晨2点)"
            />
            <button
              class="rounded-lg border border-emerald-500 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/10"
              @click="$emit('showCronHelper')"
            >
              AI助手
            </button>
          </div>
          <p class="mt-1 text-xs text-slate-500">
            使用AI助手生成Cron表达式，或手动输入
          </p>
        </div>

        <!-- 备份路径 -->
        <div>
          <label class="text-sm font-medium text-slate-300">备份路径</label>
          <input
            v-model="form.backupPath"
            type="text"
            class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            placeholder="/tmp/backups"
          />
        </div>

        <!-- 保留天数 -->
        <div>
          <label class="text-sm font-medium text-slate-300">保留天数</label>
          <input
            v-model.number="form.retentionDays"
            type="number"
            min="1"
            max="365"
            class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            placeholder="30"
          />
          <p class="mt-1 text-xs text-slate-500">
            备份文件保留的天数，超过此时间将自动删除
          </p>
        </div>

        <!-- 备份选项 -->
        <div class="space-y-4">
          <h4 class="text-sm font-medium text-slate-300">备份选项</h4>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              class="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/40"
            >
              <div>
                <p class="text-sm font-medium text-slate-300">包含数据卷</p>
                <p class="text-xs text-slate-500">备份容器的数据卷内容</p>
              </div>
              <label class="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  class="peer sr-only"
                  v-model="form.includeVolumes"
                />
                <div
                  class="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-5"
                ></div>
              </label>
            </div>

            <div
              class="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/40"
            >
              <div>
                <p class="text-sm font-medium text-slate-300">包含配置</p>
                <p class="text-xs text-slate-500">备份容器的配置信息</p>
              </div>
              <label class="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  class="peer sr-only"
                  v-model="form.includeConfig"
                />
                <div
                  class="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-5"
                ></div>
              </label>
            </div>

            <div
              class="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/40"
            >
              <div>
                <p class="text-sm font-medium text-slate-300">压缩备份</p>
                <p class="text-xs text-slate-500">将备份文件压缩为tar.gz格式</p>
              </div>
              <label class="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  class="peer sr-only"
                  v-model="form.compress"
                />
                <div
                  class="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-5"
                ></div>
              </label>
            </div>

            <div
              class="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/40"
            >
              <div>
                <p class="text-sm font-medium text-slate-300">上传到飞书</p>
                <p class="text-xs text-slate-500">
                  备份完成后自动上传到飞书云盘
                </p>
              </div>
              <label class="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  class="peer sr-only"
                  v-model="form.uploadToFeishu"
                />
                <div
                  class="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-5"
                ></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="mt-8 flex items-center justify-end gap-3">
        <button
          class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          @click="$emit('close')"
        >
          取消
        </button>
        <button
          class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="$emit('create', form)"
          :disabled="!form.containerId || !form.cronExpression"
        >
          创建备份工作流
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 备份创建对话框组件
 * 负责创建新的备份计划
 */

import { ref, watch } from "vue";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  containers: {
    type: Array,
    default: () => [],
  },
  initialForm: {
    type: Object,
    default: () => ({
      containerId: "",
      cronExpression: "0 2 * * *",
      backupPath: "/tmp/backups",
      retentionDays: 30,
      includeVolumes: true,
      includeConfig: true,
      compress: true,
      uploadToFeishu: true,
    }),
  },
});

const emit = defineEmits(["close", "create", "showCronHelper"]);

// 表单数据
const form = ref({ ...props.initialForm });

// 监听初始表单变化
watch(
  () => props.initialForm,
  (newForm) => {
    form.value = { ...newForm };
  },
  { deep: true }
);

// 监听对话框显示状态，重置表单
watch(
  () => props.show,
  (show) => {
    if (show) {
      form.value = { ...props.initialForm };
    }
  }
);

// 获取容器状态
function getContainerStatus(status) {
  const statusMap = {
    running: "运行中",
    exited: "已停止",
    created: "已创建",
    restarting: "重启中",
    paused: "已暂停",
  };
  return statusMap[status] || status;
}
</script>
