<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
      <div class="mx-auto max-w-7xl px-6 py-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-sm uppercase tracking-[0.3em] text-sky-400">Orchestrator Pro</p>
            <h1 class="mt-1 text-2xl font-semibold">可视化工作流设计器</h1>
          </div>
          <div class="text-right text-xs text-slate-400">
            <p>UI 2.0 · 阶段一</p>
            <p class="opacity-70">结构化配置 &amp; 核心骨架</p>
          </div>
        </div>
        <nav class="flex space-x-1">
          <button 
            class="rounded-lg px-4 py-2 text-sm font-medium transition" 
            :class="activeTab === 'workflows' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'"
            @click="activeTab = 'workflows'"
          >
            工作流
          </button>
          <button 
            class="rounded-lg px-4 py-2 text-sm font-medium transition" 
            :class="activeTab === 'components' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'"
            @click="activeTab = 'components'"
          >
            组件
          </button>
          <button 
            class="rounded-lg px-4 py-2 text-sm font-medium transition" 
            :class="activeTab === 'triggers' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'"
            @click="activeTab = 'triggers'"
          >
            触发器
          </button>
          <button 
            class="rounded-lg px-4 py-2 text-sm font-medium transition" 
            :class="activeTab === 'settings' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'"
            @click="activeTab = 'settings'"
          >
            设置
          </button>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-6 py-8">
      <!-- 工作流页面 -->
      <template v-if="activeTab === 'workflows'">
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-[22rem_1.8fr_18rem]">
      <!-- Workflow list + metadata -->
      <section class="flex h-full flex-col gap-4">
        <div class="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur">
          <div class="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-300">工作流列表</h2>
            <button
              class="rounded-lg border border-sky-500 px-3 py-1 text-xs font-medium text-sky-300 transition hover:bg-sky-500/10"
              @click="handleCreateWorkflow"
            >
              + 新建
            </button>
          </div>
          <div class="max-h-[16rem] overflow-y-auto px-2 py-2 scrollbar-hide">
            <template v-if="workflows.length">
              <button
                v-for="workflow in workflows"
                :key="workflow.id"
                class="group flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition"
                :class="selectedWorkflowId === workflow.id ? 'bg-sky-500/10 border border-sky-500/40' : 'border border-transparent hover:border-slate-700 hover:bg-slate-800/40'"
                @click="selectWorkflow(workflow.id)"
              >
                <span class="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full"
                  :class="workflow.enabled ? 'bg-emerald-400' : 'bg-slate-600'" />
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-slate-100">{{ workflow.name || workflow.id }}</p>
                  <p class="mt-1 line-clamp-2 text-xs text-slate-400">{{ workflow.description || '未填写描述' }}</p>
                </div>
              </button>
            </template>
            <p v-else class="px-3 py-6 text-sm text-slate-500">还没有任何工作流，点击右上角的“新建”开始吧。</p>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur" v-if="currentWorkflow">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-300">元信息</h3>
          <div class="mt-4 space-y-4">
            <div>
              <label class="text-xs font-medium text-slate-400">名称</label>
              <input
                v-model="currentWorkflow.name"
                type="text"
                class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                placeholder="如：销售漏斗回收"
              />
            </div>
            <div>
              <label class="text-xs font-medium text-slate-400">描述</label>
              <textarea
                v-model="currentWorkflow.description"
                rows="3"
                class="mt-1 w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                placeholder="这里记录流程的业务背景和目标"
              />
            </div>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-slate-400">是否启用</p>
                <p class="text-[11px] text-slate-500">禁用后工作流不会被调度</p>
              </div>
              <label class="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" class="peer sr-only" v-model="currentWorkflow.enabled" />
                <div class="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-5"></div>
              </label>
            </div>
          </div>
        </div>
      </section>

      <!-- Trigger + Step editor -->
      <section class="flex flex-col gap-4">
        <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-300">触发器</h2>
              <p class="text-xs text-slate-500">阶段一支持 Cron 表达式，可扩展 Webhook 等类型</p>
            </div>
            <template v-if="currentWorkflow">
              <select
                v-model="currentWorkflow.trigger.type"
                class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 focus:border-sky-500 focus:outline-none"
              >
                <option value="cron">定时任务 (Cron)</option>
                <option value="webhook" disabled>Webhook（开发中）</option>
              </select>
            </template>
            <template v-else>
              <select
                disabled
                class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-500"
              >
                <option>请选择工作流</option>
              </select>
            </template>
          </div>

          <template v-if="currentWorkflow">
            <div v-if="currentWorkflow.trigger.type === 'cron'" class="mt-5 space-y-3">
              <label class="text-xs font-medium text-slate-400">Cron 表达式</label>
              <input
                v-model="currentWorkflow.trigger.cronExpression"
                type="text"
                class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                placeholder="如：0 * * * *"
              />
              <p class="text-xs text-slate-500">稍后我们会引入可视化的 Cron 生成器，这里先手动填写。</p>
            </div>

            <div v-else class="mt-5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-4 text-xs text-amber-200">
              Webhook 配置即将上线，目前仅支持 Cron 触发。
            </div>
          </template>

          <div v-else class="mt-5 rounded-lg border border-dashed border-slate-700 bg-slate-900/40 px-4 py-6 text-center text-xs text-slate-500">
            请选择左侧的工作流后配置触发器。
          </div>
        </div>

        <div class="flex-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-300">步骤编排</h2>
              <p class="text-xs text-slate-500">阶段一提供基础表单，后续会支持拖拽与变量联想。</p>
            </div>
            <button
              class="rounded-lg border border-sky-500 px-4 py-2 text-xs font-medium text-sky-300 transition hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
              :disabled="!currentWorkflow"
              @click="addStep"
            >
              + 添加步骤
            </button>
          </div>

          <div v-if="!currentWorkflow" class="mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-10 text-center text-sm text-slate-500">
            请选择左侧的工作流开始编辑。
          </div>

          <div v-else class="mt-5 space-y-4">
            <div
              v-for="(step, index) in currentWorkflow.steps"
              :key="step.uid"
              class="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm shadow-slate-950/20"
            >
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p class="text-xs uppercase tracking-wide text-slate-400">步骤 {{ index + 1 }}</p>
                  <input
                    v-model="step.name"
                    type="text"
                    class="mt-1 w-64 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                    placeholder="例如：获取销售数据"
                  />
                </div>
                <div>
                  <p class="text-[11px] uppercase tracking-wide text-slate-500">内部 ID</p>
                  <p class="mt-1 rounded border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-mono text-slate-400">{{ step.id }}</p>
                </div>
                <div class="flex flex-1 justify-end gap-2">
                  <button
                    class="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 transition hover:border-red-500 hover:text-red-300"
                    @click="removeStep(index)"
                  >
                    删除
                  </button>
                </div>
              </div>

              <div class="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label class="text-xs font-medium text-slate-400">执行脚本</label>
                  <select
                    v-model="step.script"
                    class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="" disabled>请选择脚本</option>
                    <option v-for="script in scripts" :key="script.name" :value="script.name">{{ script.name }}</option>
                  </select>
                  <p v-if="!scripts.length" class="mt-2 text-xs text-amber-300/80">没有检测到脚本，请先在 Git 上创建脚本文件。</p>
                </div>
                <div>
                  <label class="text-xs font-medium text-slate-400">脚本路径</label>
                  <p class="mt-1 rounded-lg border border-dashed border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-400">
                    {{ selectedScriptPath(step.script) }}
                  </p>
                </div>
              </div>

              <div class="mt-4">
                <div class="flex items-center justify-between">
                  <p class="text-xs font-medium text-slate-400">输入参数</p>
                  <button
                    class="text-[11px] text-sky-300 hover:underline"
                    @click="addInput(step)"
                  >
                    + 添加输入
                  </button>
                </div>
                <div class="mt-3 space-y-2">
                  <div
                    v-for="(input, inputIndex) in step.inputs"
                    :key="input.uid"
                    class="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2"
                  >
                    <input
                      v-model="input.key"
                      type="text"
                      class="w-full rounded border border-transparent bg-transparent px-0 py-1 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                      placeholder="变量名"
                    />
                    <span class="text-xs text-slate-600">→</span>
                    <input
                      v-model="input.value"
                      type="text"
                      class="w-full rounded border border-transparent bg-transparent px-0 py-1 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                      placeholder="值或 {{steps.prev.output}}"
                    />
                    <button
                      class="text-[11px] text-slate-500 transition hover:text-red-300"
                      @click="removeInput(step, inputIndex)"
                    >
                      删除
                    </button>
                  </div>
                  <p v-if="!step.inputs.length" class="rounded-lg border border-dashed border-slate-700 bg-slate-900/60 px-3 py-3 text-xs text-slate-500">
                    暂无输入参数，点击右上角 “添加输入” 维护参数列表。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Actions + status -->
      <aside class="flex h-full flex-col gap-4">
        <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-300">操作</h2>
          <div class="mt-4 space-y-3">
            <button
              class="w-full rounded-xl bg-sky-500/90 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              :disabled="!currentWorkflow || loadingStates.saving"
              @click="saveCurrentWorkflow"
            >
              {{ loadingStates.saving ? '保存中...' : '保存到 GitHub' }}
            </button>
            <button
              class="w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-sky-500 hover:text-sky-200 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
              :disabled="!currentWorkflow"
              @click="triggerManualRun"
            >
              手动运行（即将推出）
            </button>
            <button
              class="w-full rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-red-300 transition hover:border-red-500/60 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:text-slate-600"
              :disabled="!currentWorkflow"
              @click="confirmDeleteWorkflow"
            >
              删除当前工作流
            </button>
          </div>

          <div class="mt-6 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-xs text-slate-400">
            <p class="font-medium text-slate-300">提示</p>
            <ul class="mt-2 list-disc space-y-1 pl-4">
              <li>保存前请确认 Cron 表达式合法。</li>
              <li>步骤顺序暂不支持拖拽，可通过删除重建调整。</li>
              <li>“魔法棒”联想将在阶段二上线。</li>
            </ul>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-300">状态</h2>
          <div class="mt-4 space-y-3 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">选中工作流</span>
              <span class="font-mono text-slate-200">{{ currentWorkflow?.id || '-' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">未保存变更</span>
              <span :class="hasUnsavedChanges ? 'text-amber-300' : 'text-slate-500'">
                {{ hasUnsavedChanges ? '是' : '否' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">脚本数量</span>
              <span class="text-slate-200">{{ scripts.length }}</span>
            </div>
          </div>

          <div v-if="statusMessage.text" :class="statusClasses" class="mt-4 rounded-xl border px-4 py-3 text-xs">
            <p class="font-medium">{{ statusMessage.text }}</p>
          </div>
        </div>
      </aside>
        </div>
      </template>

      <!-- 组件页面 -->
      <template v-else-if="activeTab === 'components'">
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
                <!-- 系统组件区域 -->
                <div class="mb-4">
                  <button
                    class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-300 hover:bg-slate-800/40"
                    @click="toggleSystemComponents"
                  >
                    <span>系统组件</span>
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
                      :key="`system-${component.name}`"
                      class="group flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition"
                      :class="selectedComponentId === `system-${component.name}` ? 'bg-sky-500/10 border border-sky-500/40' : 'border border-transparent hover:border-slate-700 hover:bg-slate-800/40'"
                      @click="selectComponent(`system-${component.name}`, component)"
                    >
                      <span class="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-blue-400"></span>
                      <div class="min-w-0">
                        <p class="truncate text-sm font-medium text-slate-100">{{ component.displayName || component.name }}</p>
                        <p class="mt-1 line-clamp-1 text-xs text-slate-400">{{ component.description || '系统组件' }}</p>
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
      </template>

      <!-- 触发器页面 -->
      <template v-else-if="activeTab === 'triggers'">
        <div class="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur">
          <TriggerManager />
        </div>
      </template>

      <!-- 设置页面 -->
      <template v-else-if="activeTab === 'settings'">
        <div class="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur">
          <SystemServices />
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import ComponentManager from './components/ComponentManager.vue';
import TriggerManager from './components/TriggerManager.vue';
import SystemServices from './components/SystemServices.vue';

const workflows = ref([]);
const selectedWorkflowId = ref('');
const currentWorkflow = ref(null);
const originalWorkflowSnapshot = ref(null);
const scripts = ref([]);

const loadingStates = reactive({
  list: false,
  detail: false,
  saving: false,
  scripts: false,
});

const statusMessage = reactive({ type: '', text: '' });

// 当前选中的导航项
const activeTab = ref('workflows');

// 组件管理相关状态
const systemComponents = ref([]);
const userComponents = ref([]);
const selectedComponentId = ref('');
const currentComponent = ref(null);
const currentComponentType = ref('');
const showSystemComponents = ref(true);
const showUserComponents = ref(true);

const statusClasses = computed(() => {
  if (statusMessage.type === 'error') {
    return 'border-red-500/40 bg-red-500/10 text-red-200';
  }
  if (statusMessage.type === 'success') {
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
  }
  return 'border-slate-700 bg-slate-800/60 text-slate-300';
});

const hasUnsavedChanges = computed(() => {
  if (!currentWorkflow.value || !originalWorkflowSnapshot.value) {
    return false;
  }
  try {
    const serialized = JSON.stringify(denormalizeWorkflow(currentWorkflow.value));
    return serialized !== JSON.stringify(originalWorkflowSnapshot.value);
  } catch (err) {
    console.error('Failed to diff workflow', err);
    return true;
  }
});

function setStatus(type, text) {
  statusMessage.type = type;
  statusMessage.text = text;
  if (text) {
    setTimeout(() => {
      if (statusMessage.text === text) {
        statusMessage.type = '';
        statusMessage.text = '';
      }
    }, 4000);
  }
}

function createUid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`;
}

function createInput(key = '', value = '') {
  return {
    uid: createUid('input'),
    key,
    value,
  };
}

function normalizeWorkflow(raw) {
  const steps = Array.isArray(raw.steps) ? raw.steps : [];
  return {
    id: raw.id,
    name: raw.name || raw.id,
    description: raw.description || '',
    enabled: raw.enabled !== false,
    trigger: {
      type: raw.trigger?.type || 'cron',
      cronExpression: raw.trigger?.cronExpression || '',
      webhookUrl: raw.trigger?.webhookUrl || '',
    },
    steps: steps.map((step, index) => ({
      uid: createUid(step.id || `step-${index + 1}`),
      id: step.id || `step-${index + 1}`,
      name: step.name || '',
      script: step.script || '',
      inputs: Object.entries(step.inputs || {}).map(([key, value]) => createInput(key, typeof value === 'string' ? value : JSON.stringify(value)))
    })),
  };
}

function denormalizeWorkflow(workflow) {
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    enabled: workflow.enabled,
    trigger: {
      type: workflow.trigger.type,
      cronExpression: workflow.trigger.cronExpression,
      webhookUrl: workflow.trigger.webhookUrl,
    },
    steps: workflow.steps.map((step, index) => ({
      id: step.id || `step-${index + 1}`,
      name: step.name,
      script: step.script,
      inputs: step.inputs.reduce((acc, input) => {
        if (input.key) {
          acc[input.key] = input.value ?? '';
        }
        return acc;
      }, {}),
    })),
  };
}

async function fetchWorkflowsList() {
  loadingStates.list = true;
  try {
    const res = await fetch('/api/workflows');
    if (!res.ok) {
      throw new Error('无法获取工作流列表');
    }
    const data = await res.json();
    workflows.value = data.workflows || [];
    if (!workflows.value.some((wf) => wf.id === selectedWorkflowId.value)) {
      selectedWorkflowId.value = workflows.value[0]?.id || '';
      if (selectedWorkflowId.value) {
        await selectWorkflow(selectedWorkflowId.value);
      } else {
        currentWorkflow.value = null;
        originalWorkflowSnapshot.value = null;
      }
    }
  } catch (err) {
    console.error(err);
    setStatus('error', err.message || '获取工作流列表失败');
  } finally {
    loadingStates.list = false;
  }
}

async function selectWorkflow(id) {
  if (!id || loadingStates.detail) {
    return;
  }
  selectedWorkflowId.value = id;
  loadingStates.detail = true;
  try {
    const res = await fetch(`/api/workflows/${id}`);
    if (!res.ok) {
      throw new Error('加载工作流失败');
    }
    const data = await res.json();
    if (!data.id) {
      throw new Error('工作流数据不完整');
    }
    const normalized = normalizeWorkflow(data);
    // 确保每个步骤至少有一个输入占位
    normalized.steps.forEach((step) => {
      if (!step.inputs.length) {
        step.inputs.push(createInput());
      }
    });
    currentWorkflow.value = normalized;
    originalWorkflowSnapshot.value = denormalizeWorkflow(normalized);
  } catch (err) {
    console.error(err);
    setStatus('error', err.message || '加载工作流失败');
  } finally {
    loadingStates.detail = false;
  }
}

function addStep() {
  if (!currentWorkflow.value) {
    return;
  }
  const index = currentWorkflow.value.steps.length + 1;
  const nextId = `step-${index}`;
  const step = {
    uid: createUid('step'),
    id: nextId,
    name: '',
    script: '',
    inputs: [createInput()],
  };
  currentWorkflow.value.steps.push(step);
}

function removeStep(index) {
  if (!currentWorkflow.value) {
    return;
  }
  currentWorkflow.value.steps.splice(index, 1);
  if (!currentWorkflow.value.steps.length) {
    addStep();
  }
}

function addInput(step) {
  step.inputs.push(createInput());
}

function removeInput(step, inputIndex) {
  step.inputs.splice(inputIndex, 1);
}

function selectedScriptPath(scriptName) {
  const script = scripts.value.find((item) => item.name === scriptName);
  return script?.path || '未选择脚本';
}

async function handleCreateWorkflow() {
  const name = window.prompt('请输入新工作流的名称', '新建工作流');
  if (name === null) {
    return;
  }
  try {
    loadingStates.saving = true;
    const res = await fetch('/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() || undefined }),
    });
    if (!res.ok) {
      throw new Error('创建工作流失败');
    }
    const data = await res.json();
    setStatus('success', `已创建工作流「${data.name}」`);
    await fetchWorkflowsList();
    await selectWorkflow(data.id);
  } catch (err) {
    console.error(err);
    setStatus('error', err.message || '创建工作流失败');
  } finally {
    loadingStates.saving = false;
  }
}

async function saveCurrentWorkflow() {
  if (!currentWorkflow.value) {
    return;
  }
  loadingStates.saving = true;
  try {
    const payload = denormalizeWorkflow(currentWorkflow.value);
    const res = await fetch(`/api/workflows/${payload.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || '保存失败');
    }
    const saved = await res.json();
    const normalized = normalizeWorkflow(saved);
    normalized.steps.forEach((step) => {
      if (!step.inputs.length) {
        step.inputs.push(createInput());
      }
    });
    currentWorkflow.value = normalized;
    originalWorkflowSnapshot.value = denormalizeWorkflow(normalized);
    await fetchWorkflowsList();
    setStatus('success', '工作流已保存到 GitHub');
  } catch (err) {
    console.error(err);
    setStatus('error', err.message || '保存失败');
  } finally {
    loadingStates.saving = false;
  }
}

async function confirmDeleteWorkflow() {
  if (!currentWorkflow.value) {
    return;
  }
  const confirmed = window.confirm(`确定要删除工作流「${currentWorkflow.value.name}」吗？`);
  if (!confirmed) {
    return;
  }
  try {
    const res = await fetch(`/api/workflows/${currentWorkflow.value.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('删除失败');
    }
    setStatus('success', '工作流已删除');
    await fetchWorkflowsList();
  } catch (err) {
    console.error(err);
    setStatus('error', err.message || '删除失败');
  }
}

function triggerManualRun() {
  setStatus('info', '手动运行功能将在阶段二上线，敬请期待。');
}

async function fetchScripts() {
  loadingStates.scripts = true;
  try {
    const res = await fetch('/api/scripts');
    if (!res.ok) {
      throw new Error('无法加载脚本列表');
    }
    const data = await res.json();
    scripts.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(err);
    setStatus('error', err.message || '加载脚本列表失败');
  } finally {
    loadingStates.scripts = false;
  }
}

// 组件管理相关方法
async function fetchComponents() {
  try {
    const res = await fetch('/api/components');
    if (!res.ok) {
      throw new Error('无法获取组件列表');
    }
    const data = await res.json();
    if (data.success) {
      systemComponents.value = data.data.official || [];
      userComponents.value = data.data.user || [];
    } else {
      setStatus('error', data.error || '获取组件列表失败');
    }
  } catch (err) {
    console.error(err);
    setStatus('error', err.message || '获取组件列表失败');
  }
}

function toggleSystemComponents() {
  showSystemComponents.value = !showSystemComponents.value;
}

function toggleUserComponents() {
  showUserComponents.value = !showUserComponents.value;
}

function selectComponent(componentId, component) {
  selectedComponentId.value = componentId;
  currentComponent.value = component;
  currentComponentType.value = componentId.startsWith('system-') ? 'official' : 'user';
}

async function handleCreateComponent() {
  const name = window.prompt('请输入新组件的名称（如：my-custom-sender）', '');
  if (!name || name.trim() === '') {
    return;
  }
  
  const displayName = window.prompt('请输入组件的显示名称', name);
  if (displayName === null) {
    return;
  }

  try {
    // 创建默认的组件清单
    const manifest = {
      name: name.trim(),
      displayName: displayName.trim() || name.trim(),
      description: '',
      version: '1.0.0',
      inputs: [],
      outputs: []
    };

    // 创建默认的组件代码
    const code = `// ${displayName || name} 组件
// 这是一个用户自定义组件

export default async function(context) {
  const { inputs, outputs, log } = context;
  
  // 在这里编写你的组件逻辑
  log.info('组件开始执行');
  
  // 示例：处理输入参数
  // const result = processInputs(inputs);
  
  // 示例：设置输出结果
  // outputs.result = result;
  
  log.info('组件执行完成');
  
  return {
    success: true,
    message: '组件执行成功'
  };
}`;

    const res = await fetch('/api/components/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), manifest, code })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || '创建组件失败');
    }

    setStatus('success', `已创建组件「${displayName || name}」`);
    await fetchComponents();
    
    // 自动选中新创建的组件
    const newComponent = userComponents.value.find(c => c.name === name.trim());
    if (newComponent) {
      selectComponent(`user-${newComponent.name}`, newComponent);
    }
  } catch (err) {
    console.error(err);
    setStatus('error', err.message || '创建组件失败');
  }
}

onMounted(() => {
  fetchWorkflowsList();
  fetchScripts();
  fetchComponents();
});
</script>

<style scoped>
ul {
  list-style: none;
  padding: 0;
}
</style>
