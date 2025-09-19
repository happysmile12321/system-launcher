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
            :class="activeTab === 'database' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'"
            @click="activeTab = 'database'"
          >
            数据库管理
          </button>
          <button 
            class="rounded-lg px-4 py-2 text-sm font-medium transition" 
            :class="activeTab === 'containers' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'"
            @click="activeTab = 'containers'"
          >
            容器管理
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
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-[22rem_1fr]">
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
            <template v-if="loadingStates.list">
              <div class="space-y-3">
                <div v-for="i in 3" :key="i" class="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                  <div class="flex items-start gap-3">
                    <div class="mt-1 h-2 w-2 rounded-full bg-slate-600"></div>
                    <div class="flex-1 space-y-2">
                      <SkeletonLoader type="text" width="60%" height="0.875rem" />
                      <SkeletonLoader type="text" width="40%" height="0.75rem" />
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <template v-else-if="workflows.length">
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
            <p v-else class="px-3 py-6 text-sm text-slate-500">还没有任何工作流，点击右上角的"新建"开始吧。</p>
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
            
            <!-- 触发器配置 -->
            <div>
              <label class="text-xs font-medium text-slate-400">触发器类型</label>
              <select
                v-model="currentWorkflow.trigger.type"
                class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              >
                <option value="cron">定时任务 (Cron)</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>
            
            <div v-if="currentWorkflow.trigger.type === 'cron'">
              <label class="text-xs font-medium text-slate-400">Cron 表达式</label>
              <div class="mt-1 flex items-center gap-2">
                <input
                  v-model="currentWorkflow.trigger.cronExpression"
                  type="text"
                  class="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                  placeholder="如：0 * * * *"
                />
                <button
                  class="rounded-lg border border-emerald-500 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/10"
                  @click="showCronHelper = true"
                >
                  AI助手
                </button>
              </div>
              <p class="mt-1 text-xs text-slate-500">使用AI助手生成Cron表达式，或手动输入</p>
            </div>
            
            <div v-if="currentWorkflow.trigger.type === 'webhook'">
              <label class="text-xs font-medium text-slate-400">Webhook URL</label>
              <div class="mt-1 flex items-center gap-2">
                <input
                  :value="`${window.location.origin}/api/webhook/${currentWorkflow.id}`"
                  type="text"
                  readonly
                  class="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-sky-500 focus:outline-none"
                />
                <button
                  class="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-600"
                  @click="copyWebhookUrl"
                >
                  复制
                </button>
              </div>
              <p class="mt-1 text-xs text-slate-500">使用此URL作为Webhook端点</p>
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

      <!-- 工作流步骤编排 -->
      <section class="flex flex-col gap-4">
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
                  <label class="text-xs font-medium text-slate-400">选择组件</label>
                  <select
                    v-model="step.component"
                    class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                    @change="onStepComponentChange(step)"
                  >
                    <option value="" disabled>请选择组件</option>
                    <optgroup label="本地组件">
                      <option v-for="component in systemComponents" :key="`local-${component.name}`" :value="`local:${component.name}`">
                        {{ component.displayName || component.name }}
                      </option>
                    </optgroup>
                    <optgroup label="用户组件">
                      <option v-for="component in userComponents" :key="`user-${component.name}`" :value="`user:${component.name}`">
                        {{ component.displayName || component.name }}
                      </option>
                    </optgroup>
                  </select>
                  <p v-if="!systemComponents.length && !userComponents.length" class="mt-2 text-xs text-amber-300/80">没有可用的组件，请先创建组件。</p>
                </div>
                <div>
                  <label class="text-xs font-medium text-slate-400">组件类型</label>
                  <p class="mt-1 rounded-lg border border-dashed border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-400">
                    {{ getStepComponentType(step.component) }}
                  </p>
                </div>
              </div>

              <div class="mt-4">
                <div class="flex items-center justify-between">
                  <p class="text-xs font-medium text-slate-400">输入参数</p>
                  <button
                    v-if="!getStepComponentInputs(step).length"
                    class="text-[11px] text-sky-300 hover:underline"
                    @click="addInput(step)"
                  >
                    + 添加输入
                  </button>
                </div>
                
                <!-- 基于组件清单的动态输入表单 -->
                <div v-if="getStepComponentInputs(step).length" class="mt-3 space-y-3">
                  <div
                    v-for="inputSchema in getStepComponentInputs(step)"
                    :key="inputSchema.id"
                    class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-3"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <label class="text-xs font-medium text-slate-300">{{ inputSchema.label }}</label>
                      <span v-if="inputSchema.required" class="text-xs text-red-400">*</span>
                    </div>
                    
                    <div v-if="inputSchema.type === 'string'" class="space-y-2">
                      <input
                        v-model="step.inputs[inputSchema.id]"
                        type="text"
                        class="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                        :placeholder="inputSchema.description || `请输入${inputSchema.label}`"
                      />
                      <div class="flex items-center gap-2">
                        <button
                          class="text-[11px] text-sky-300 hover:underline"
                          @click="showVariableSelector(step, inputSchema.id)"
                        >
                          🔗 连接数据
                        </button>
                        <span class="text-[11px] text-slate-500">或使用变量 {{steps.prev.output}}</span>
                      </div>
                    </div>
                    
                    <div v-else-if="inputSchema.type === 'number'" class="space-y-2">
                      <input
                        v-model.number="step.inputs[inputSchema.id]"
                        type="number"
                        class="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                        :placeholder="inputSchema.description || `请输入${inputSchema.label}`"
                      />
                    </div>
                    
                    <div v-else-if="inputSchema.type === 'boolean'" class="space-y-2">
                      <label class="flex items-center gap-2">
                        <input
                          v-model="step.inputs[inputSchema.id]"
                          type="checkbox"
                          class="rounded border-slate-700 bg-slate-900 text-sky-500 focus:border-sky-500 focus:ring-sky-500"
                        />
                        <span class="text-sm text-slate-300">{{ inputSchema.description || inputSchema.label }}</span>
                      </label>
                    </div>
                    
                    <div v-else-if="inputSchema.type === 'json'" class="space-y-2">
                      <textarea
                        v-model="step.inputs[inputSchema.id]"
                        rows="3"
                        class="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                        :placeholder="inputSchema.description || `请输入JSON格式的${inputSchema.label}`"
                      />
                    </div>
                    
                    <div v-else-if="inputSchema.type === 'secret'" class="space-y-2">
                      <input
                        v-model="step.inputs[inputSchema.id]"
                        type="password"
                        class="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                        :placeholder="inputSchema.description || `请输入${inputSchema.label}`"
                      />
                      <p class="text-[11px] text-amber-300">⚠️ 敏感信息，请谨慎输入</p>
                    </div>
                    
                    <p v-if="inputSchema.description" class="text-[11px] text-slate-500 mt-1">
                      {{ inputSchema.description }}
                    </p>
                  </div>
                </div>
                
                <!-- 传统输入参数配置（当组件没有定义输入时） -->
                <div v-else class="mt-3 space-y-2">
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
                    暂无输入参数，点击右上角 "添加输入" 维护参数列表。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

          <!-- 操作按钮区域 -->
          <div class="mt-6 flex items-center justify-between border-t border-slate-800 pt-6">
            <div class="flex items-center gap-3">
              <button
                class="rounded-xl bg-sky-500/90 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                :disabled="!currentWorkflow || loadingStates.saving"
                @click="saveCurrentWorkflow"
              >
                {{ loadingStates.saving ? '保存中...' : '保存到 GitHub' }}
              </button>
              <button
                class="rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-sky-500 hover:text-sky-200 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
                :disabled="!currentWorkflow"
                @click="triggerManualRun"
              >
                手动运行
              </button>
              <button
                class="rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-red-300 transition hover:border-red-500/60 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:text-slate-600"
                :disabled="!currentWorkflow"
                @click="confirmDeleteWorkflow"
              >
                删除工作流
              </button>
            </div>
            
            <div class="flex items-center gap-4 text-xs text-slate-400">
              <span>工作流: {{ currentWorkflow?.id || '-' }}</span>
              <span :class="hasUnsavedChanges ? 'text-amber-300' : 'text-slate-500'">
                未保存: {{ hasUnsavedChanges ? '是' : '否' }}
              </span>
            </div>
          </div>

          <div v-if="statusMessage.text" :class="statusClasses" class="mt-4 rounded-xl border px-4 py-3 text-xs">
            <p class="font-medium">{{ statusMessage.text }}</p>
          </div>
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
      </template>

      <!-- 触发器页面 -->
      <template v-else-if="activeTab === 'triggers'">
        <div class="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur">
          <TriggerManager />
        </div>
      </template>

      <!-- 数据库管理页面 -->
      <template v-else-if="activeTab === 'database'">
        <div class="space-y-6">
          <!-- 飞书文件管理 -->
          <div 
            :class="[
              'rounded-2xl border backdrop-blur p-6 transition-all duration-300',
              feishuConfigStatus.configured 
                ? 'border-slate-800 bg-slate-900/60' 
                : 'border-slate-700 bg-slate-900/30 opacity-60'
            ]"
          >
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-lg font-semibold text-slate-100">飞书文件管理</h2>
                <p class="text-sm text-slate-400 mt-1">管理飞书云盘中的文件和备份计划</p>
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
                        feishuWebSocketStatus.connected ? 'bg-green-500' : 'bg-red-500'
                      ]"
                    ></div>
                    <span class="text-xs text-slate-400">
                      WebSocket: {{ feishuWebSocketStatus.connected ? '已连接' : '未连接' }}
                    </span>
                  </div>
                  <button
                    v-if="!feishuWebSocketStatus.connected"
                    @click="startFeishuWebSocket"
                    :disabled="feishuWebSocketLoading || !feishuConfigStatus.configured"
                    class="text-xs text-sky-400 hover:text-sky-300 underline disabled:opacity-50"
                  >
                    {{ feishuWebSocketLoading ? '启动中...' : '启动连接' }}
                  </button>
                  <button
                    v-else
                    @click="stopFeishuWebSocket"
                    :disabled="feishuWebSocketLoading"
                    class="text-xs text-amber-400 hover:text-amber-300 underline disabled:opacity-50"
                  >
                    {{ feishuWebSocketLoading ? '停止中...' : '停止连接' }}
                  </button>
                  <button
                    v-if="!feishuWebSocketStatus.connected && feishuConfigStatus.configured"
                    @click="openFeishuLongConnectionConfig"
                    class="text-xs text-purple-400 hover:text-purple-300 underline"
                  >
                    🔗 配置长连接
                  </button>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  class="rounded-lg border border-amber-500 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/10"
                  @click="showFeishuConfigDialog = true"
                  v-if="!feishuAuthStatus.authenticated"
                >
                  ⚙️ 配置飞书
                </button>
                <button
                  class="rounded-lg border border-sky-500 px-4 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="refreshFeishuFiles"
                  :disabled="!feishuConfigStatus.configured"
                >
                  刷新文件列表
                </button>
                <button
                  class="rounded-lg border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="createBackupPlan"
                  :disabled="!feishuConfigStatus.configured"
                >
                  创建备份计划
                </button>
              </div>
            </div>

            <!-- 文件列表 -->
            <div class="space-y-4">
              <div v-if="feishuFilesLoading" class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
                <span class="ml-2 text-sm text-slate-400">加载文件列表中...</span>
              </div>
              
              <div v-else-if="feishuFiles.length === 0" class="text-center py-8">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mx-auto text-slate-500">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                </svg>
                <h3 class="mt-4 text-lg font-medium text-slate-300">暂无文件</h3>
                <p class="mt-2 text-slate-500">飞书云盘中还没有文件</p>
              </div>

              <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  v-for="file in feishuFiles"
                  :key="file.token"
                  class="rounded-lg border border-slate-700 bg-slate-800/40 p-4 hover:bg-slate-800/60 transition"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <h4 class="text-sm font-medium text-slate-100 truncate">{{ file.name }}</h4>
                      <p class="text-xs text-slate-400 mt-1">{{ file.type === 'file' ? '文件' : '文件夹' }}</p>
                      <p class="text-xs text-slate-500 mt-1">{{ formatFileSize(file.size) }}</p>
                    </div>
                    <div class="flex items-center gap-1">
                      <button
                        class="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-700"
                        @click="downloadFile(file)"
                      >
                        下载
                      </button>
                      <button
                        class="rounded border border-red-500/40 px-2 py-1 text-xs text-red-300 transition hover:bg-red-500/10"
                        @click="deleteFile(file)"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 备份计划管理 -->
          <div class="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-lg font-semibold text-slate-100">备份计划管理</h2>
                <p class="text-sm text-slate-400 mt-1">管理自动备份任务和计划</p>
              </div>
              <button
                class="rounded-lg border border-sky-500 px-4 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/10"
                @click="refreshBackupPlans"
              >
                刷新计划
              </button>
            </div>

            <div v-if="backupPlansLoading" class="flex items-center justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
              <span class="ml-2 text-sm text-slate-400">加载备份计划中...</span>
            </div>

            <div v-else-if="backupPlans.length === 0" class="text-center py-8">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mx-auto text-slate-500">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              <h3 class="mt-4 text-lg font-medium text-slate-300">暂无备份计划</h3>
              <p class="mt-2 text-slate-500">还没有创建任何备份计划</p>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="plan in backupPlans"
                :key="plan.id"
                class="rounded-lg border border-slate-700 bg-slate-800/40 p-4"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h4 class="text-sm font-medium text-slate-100">{{ plan.name }}</h4>
                    <p class="text-xs text-slate-400 mt-1">{{ plan.description }}</p>
                    <p class="text-xs text-slate-500 mt-1">
                      频率: {{ plan.schedule }} | 状态: 
                      <span :class="plan.enabled ? 'text-emerald-400' : 'text-slate-500'">
                        {{ plan.enabled ? '启用' : '禁用' }}
                      </span>
                    </p>
                  </div>
                  <div class="flex items-center gap-1">
                    <button
                      class="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-700"
                      @click="editBackupPlan(plan)"
                    >
                      编辑
                    </button>
                    <button
                      class="rounded border border-red-500/40 px-2 py-1 text-xs text-red-300 transition hover:bg-red-500/10"
                      @click="deleteBackupPlan(plan)"
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

      <!-- 容器管理页面 -->
      <template v-else-if="activeTab === 'containers'">
        <div class="space-y-6">
          <!-- 容器服务状态 -->
          <div class="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-lg font-semibold text-slate-100">容器服务状态</h2>
                <p class="text-sm text-slate-400 mt-1">检查Docker/Podman服务可用性</p>
              </div>
              <button
                class="rounded-lg border border-sky-500 px-4 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/10"
                @click="checkContainerServiceStatus"
              >
                检查状态
              </button>
            </div>

            <div v-if="containerServiceLoading" class="flex items-center justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
              <span class="ml-2 text-sm text-slate-400">检查服务状态中...</span>
            </div>

            <div v-else-if="containerServiceStatus" class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="h-3 w-3 rounded-full" :class="containerServiceStatus.available ? 'bg-emerald-400' : 'bg-red-400'"></div>
                <span class="text-sm font-medium text-slate-200">
                  {{ containerServiceStatus.available ? '服务可用' : '服务不可用' }}
                </span>
              </div>
              
              <div v-if="containerServiceStatus.driver" class="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
                <h4 class="text-sm font-medium text-slate-300 mb-2">驱动信息</h4>
                <p class="text-xs text-slate-400">类型: {{ containerServiceStatus.driver.driver }}</p>
                <p class="text-xs text-slate-400">版本: {{ containerServiceStatus.driver.version }}</p>
              </div>
            </div>
          </div>

          <!-- 容器列表 -->
          <div class="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-lg font-semibold text-slate-100">容器列表</h2>
                <p class="text-sm text-slate-400 mt-1">管理本地Docker/Podman容器</p>
              </div>
              <button
                class="rounded-lg border border-sky-500 px-4 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/10"
                @click="refreshContainers"
              >
                刷新列表
              </button>
            </div>

            <div v-if="containersLoading" class="flex items-center justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
              <span class="ml-2 text-sm text-slate-400">加载容器列表中...</span>
            </div>

            <div v-else-if="containers.length === 0" class="text-center py-8">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mx-auto text-slate-500">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              <h3 class="mt-4 text-lg font-medium text-slate-300">暂无容器</h3>
              <p class="mt-2 text-slate-500">没有找到任何容器</p>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="container in containers"
                :key="container.id"
                class="rounded-lg border border-slate-700 bg-slate-800/40 p-4"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <h4 class="text-sm font-medium text-slate-100">{{ container.name || container.id }}</h4>
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        :class="getContainerStatusClass(container.status)">
                        {{ getContainerStatus(container.status) }}
                      </span>
                    </div>
                    <p class="text-xs text-slate-400 mb-1">镜像: {{ container.image }}</p>
                    <p class="text-xs text-slate-500">创建时间: {{ formatDate(container.created) }}</p>
                    <div v-if="container.ports && container.ports.length" class="mt-2">
                      <p class="text-xs text-slate-500">端口: {{ container.ports.join(', ') }}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-2">
                    <button
                      v-if="getContainerStatus(container.status) === '已停止'"
                      class="rounded border border-emerald-500/40 px-2 py-1 text-xs text-emerald-300 transition hover:bg-emerald-500/10"
                      @click="startContainer(container.id)"
                    >
                      启动
                    </button>
                    <button
                      v-else
                      class="rounded border border-amber-500/40 px-2 py-1 text-xs text-amber-300 transition hover:bg-amber-500/10"
                      @click="stopContainer(container.id)"
                    >
                      停止
                    </button>
                    <button
                      class="rounded border border-sky-500/40 px-2 py-1 text-xs text-sky-300 transition hover:bg-sky-500/10"
                      @click="viewContainerLogs(container.id)"
                    >
                      日志
                    </button>
                    <button
                      class="rounded border border-red-500/40 px-2 py-1 text-xs text-red-300 transition hover:bg-red-500/10"
                      @click="removeContainer(container.id)"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 容器备份管理 -->
          <div class="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-lg font-semibold text-slate-100">容器备份管理</h2>
                <p class="text-sm text-slate-400 mt-1">为容器创建定时备份工作流</p>
              </div>
              <button
                class="rounded-lg border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10"
                @click="showBackupDialog = true"
              >
                创建自动备份
              </button>
            </div>

            <div class="text-sm text-slate-400 mb-4">
              支持数据卷和配置备份，可设置定时任务自动执行
            </div>

            <!-- 备份工作流列表 -->
            <div v-if="backupWorkflows.length > 0" class="space-y-3">
              <h4 class="text-sm font-medium text-slate-300">现有备份工作流</h4>
              <div
                v-for="workflow in backupWorkflows"
                :key="workflow.id"
                class="rounded-lg border border-slate-700 bg-slate-800/40 p-3"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-slate-200">{{ workflow.name }}</p>
                    <p class="text-xs text-slate-400">Cron: {{ workflow.metadata?.cronExpression }}</p>
                  </div>
                  <button
                    class="rounded border border-red-500/40 px-2 py-1 text-xs text-red-300 transition hover:bg-red-500/10"
                    @click="deleteBackupWorkflow(workflow.id)"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 设置页面 -->
      <template v-else-if="activeTab === 'settings'">
        <div class="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur">
          <SystemServices />
        </div>
      </template>
    </main>

    <!-- 备份创建对话框 -->
    <div v-if="showBackupDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div class="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-slate-100">创建容器自动备份</h3>
          <p class="text-sm text-slate-400 mt-1">为选中的容器创建定时备份工作流</p>
        </div>

        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium text-slate-300">选择容器</label>
            <select
              v-model="backupForm.containerId"
              class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            >
              <option value="">请选择容器</option>
              <option v-for="container in containers" :key="container.id" :value="container.id">
                {{ container.name || container.id }} ({{ getContainerStatus(container.status) }})
              </option>
            </select>
          </div>

          <div>
            <label class="text-sm font-medium text-slate-300">备份频率 (Cron表达式)</label>
            <div class="mt-1 flex items-center gap-2">
              <input
                v-model="backupForm.cronExpression"
                type="text"
                class="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                placeholder="0 2 * * * (每天凌晨2点)"
              />
              <button
                class="rounded-lg border border-emerald-500 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/10"
                @click="showCronHelper = true"
              >
                AI助手
              </button>
            </div>
            <p class="mt-1 text-xs text-slate-500">使用AI助手生成Cron表达式，或手动输入</p>
          </div>

          <div>
            <label class="text-sm font-medium text-slate-300">备份路径</label>
            <input
              v-model="backupForm.backupPath"
              type="text"
              class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              placeholder="/tmp/backups"
            />
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-slate-300">包含数据卷</p>
                <p class="text-xs text-slate-500">备份容器的数据卷内容</p>
              </div>
              <label class="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" class="peer sr-only" v-model="backupForm.includeVolumes" />
                <div class="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-5"></div>
              </label>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-slate-300">包含配置</p>
                <p class="text-xs text-slate-500">备份容器的配置信息</p>
              </div>
              <label class="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" class="peer sr-only" v-model="backupForm.includeConfig" />
                <div class="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-5"></div>
              </label>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-slate-300">压缩备份</p>
                <p class="text-xs text-slate-500">将备份文件压缩为tar.gz格式</p>
              </div>
              <label class="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" class="peer sr-only" v-model="backupForm.compress" />
                <div class="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-5"></div>
              </label>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-slate-300">上传到飞书</p>
                <p class="text-xs text-slate-500">备份完成后自动上传到飞书云盘</p>
              </div>
              <label class="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" class="peer sr-only" v-model="backupForm.uploadToFeishu" />
                <div class="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-5"></div>
              </label>
            </div>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <button
            class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            @click="showBackupDialog = false"
          >
            取消
          </button>
          <button
            class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            @click="createBackupWorkflow"
            :disabled="!backupForm.containerId"
          >
            创建备份工作流
          </button>
        </div>
      </div>
    </div>

    <!-- Cron助手对话框 -->
    <div v-if="showCronHelper" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div class="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-slate-100">AI Cron表达式助手</h3>
          <p class="text-sm text-slate-400 mt-1">用自然语言描述你的定时需求，AI会帮你生成Cron表达式</p>
        </div>

        <div class="space-y-4">
          <!-- 输入区域 -->
          <div>
            <label class="text-sm font-medium text-slate-300">描述你的定时需求</label>
            <div class="mt-1 flex items-center gap-2">
              <input
                v-model="cronHelperInput"
                type="text"
                class="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                placeholder="例如：每天凌晨2点、每周一上午9点、每2小时"
                @keyup.enter="generateCronExpression"
              />
              <button
                class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                @click="generateCronExpression"
                :disabled="!cronHelperInput.trim()"
              >
                生成
              </button>
            </div>
          </div>

          <!-- 生成结果 -->
          <div v-if="cronHelperResult" class="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-sm font-medium text-slate-200">生成结果</h4>
              <span class="text-xs text-slate-400">置信度: {{ Math.round(cronHelperResult.confidence * 100) }}%</span>
            </div>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="text-xs text-slate-400">Cron表达式:</span>
                <code class="rounded bg-slate-700 px-2 py-1 text-xs text-emerald-300">{{ cronHelperResult.cron }}</code>
                <button
                  class="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-700"
                  @click="copyCronExpression(cronHelperResult.cron)"
                >
                  复制
                </button>
              </div>
              <p class="text-xs text-slate-300">{{ cronHelperResult.explanation }}</p>
            </div>
          </div>

          <!-- 常用建议 -->
          <div>
            <h4 class="text-sm font-medium text-slate-300 mb-3">常用建议</h4>
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="suggestion in cronSuggestions"
                :key="suggestion.cron"
                class="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-left transition hover:bg-slate-800/60"
                @click="selectCronSuggestion(suggestion)"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-slate-200">{{ suggestion.description }}</p>
                    <p class="text-xs text-slate-400">{{ suggestion.explanation }}</p>
                  </div>
                  <code class="rounded bg-slate-700 px-2 py-1 text-xs text-emerald-300">{{ suggestion.cron }}</code>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <button
            class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            @click="showCronHelper = false"
          >
            关闭
          </button>
          <button
            v-if="cronHelperResult"
            class="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
            @click="applyCronExpression"
          >
            应用表达式
          </button>
        </div>
      </div>
    </div>

    <!-- 飞书配置对话框 -->
    <div v-if="showFeishuConfigDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div class="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-slate-100">配置飞书集成</h3>
          <p class="mt-1 text-sm text-slate-400">填写飞书应用的配置信息，这些信息将保存到GitFS中</p>
        </div>

        <form @submit.prevent="saveFeishuConfig" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">App ID</label>
            <input
              v-model="feishuConfigForm.appId"
              type="text"
              required
              class="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="cli_xxxxxxxxxxxxxxxx"
            />
            <p class="mt-1 text-xs text-slate-400">
              用于生成事件订阅页面链接：https://open.feishu.cn/app/{App ID}/event?tab=callback
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">App Secret</label>
            <input
              v-model="feishuConfigForm.appSecret"
              type="password"
              required
              class="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="xxxxxxxxxxxxxxxxxxxx"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">重定向URI</label>
            <input
              v-model="feishuConfigForm.redirectUri"
              type="url"
              required
              class="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="http://localhost:3000/api/feishu/auth/callback"
            />
          </div>

          <div v-if="feishuConfigError" class="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2">
            <p class="text-sm text-red-300">{{ feishuConfigError }}</p>
          </div>

          <div class="flex items-center gap-3 pt-4">
            <button
              type="button"
              @click="showFeishuConfigDialog = false"
              class="flex-1 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
              :disabled="feishuConfigLoading"
            >
              取消
            </button>
            <button
              type="submit"
              class="flex-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-50"
              :disabled="feishuConfigLoading"
            >
              <span v-if="feishuConfigLoading" class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                保存中...
              </span>
              <span v-else>保存配置</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 飞书配置激活对话框 -->
    <div v-if="showFeishuActivationDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div class="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-slate-100">激活飞书配置</h3>
          <p class="mt-1 text-sm text-slate-400">配置已保存成功！现在需要激活长连接回调功能</p>
        </div>

        <div class="space-y-4">
          <div class="rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-3">
            <div class="flex items-start gap-3">
              <svg class="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
              <div>
                <h4 class="text-sm font-medium text-blue-300">配置步骤</h4>
                <ul class="mt-2 text-sm text-blue-200 space-y-1">
                  <li>1. 点击下方按钮打开飞书开放平台</li>
                  <li>2. 在"事件订阅"页面启用长连接模式</li>
                  <li>3. 确保已申请必要的权限</li>
                  <li>4. 返回此页面启动WebSocket连接</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-slate-600 bg-slate-800 px-4 py-3">
            <div class="text-sm">
              <div class="text-slate-300 mb-2">应用信息：</div>
              <div class="space-y-1 text-slate-400">
                <div>App ID: <span class="text-slate-200 font-mono">{{ savedFeishuConfig?.appId }}</span></div>
                <div>重定向URI: <span class="text-slate-200 font-mono">{{ savedFeishuConfig?.redirectUri }}</span></div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 pt-6">
          <button
            @click="closeFeishuActivationDialog"
            class="flex-1 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            稍后配置
          </button>
          <button
            @click="openFeishuEventSubscription"
            class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            🌐 打开飞书开放平台
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import ComponentManager from './components/ComponentManager.vue';
import TriggerManager from './components/TriggerManager.vue';
import SystemServices from './components/SystemServices.vue';
import SkeletonLoader from './components/SkeletonLoader.vue';
import { useDebounce } from './utils/debounce.js';

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
  components: false,
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

// 数据库管理相关状态
const feishuAuthStatus = ref({ authenticated: false, user: null });
const feishuConfigStatus = ref({ configured: false, hasAppId: false, hasAppSecret: false });
const feishuFiles = ref([]);
const feishuFilesLoading = ref(false);
const backupPlans = ref([]);
const backupPlansLoading = ref(false);

// 飞书配置相关
const showFeishuConfigDialog = ref(false);
const showFeishuActivationDialog = ref(false);
const feishuConfigForm = ref({
  appId: '',
  appSecret: '',
  redirectUri: 'http://localhost:3000/api/feishu/auth/callback'
});
const feishuConfigLoading = ref(false);
const feishuConfigError = ref('');
const savedFeishuConfig = ref(null);

// 飞书WebSocket相关
const feishuWebSocketStatus = ref({
  connected: false,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5
});
const feishuWebSocketLoading = ref(false);

// 容器管理相关状态
const containerServiceStatus = ref(null);
const containerServiceLoading = ref(false);
const containers = ref([]);
const containersLoading = ref(false);

// 容器备份相关状态
const showBackupDialog = ref(false);
const backupWorkflows = ref([]);
const backupForm = reactive({
  containerId: '',
  cronExpression: '0 2 * * *',
  backupPath: '/tmp/backups',
  includeVolumes: true,
  includeConfig: true,
  compress: true,
  uploadToFeishu: false
});

// AI Cron助手相关状态
const showCronHelper = ref(false);
const cronHelperInput = ref('');
const cronHelperResult = ref(null);
const cronSuggestions = ref([]);

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
      component: step.component || '',
      inputs: step.inputs || {}
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
      component: step.component,
      inputs: step.inputs || {},
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
    // 确保每个步骤都有输入对象
    normalized.steps.forEach((step) => {
      if (!step.inputs || typeof step.inputs !== 'object') {
        step.inputs = {};
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
    component: '',
    inputs: {},
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

function getStepComponentType(componentValue) {
  if (!componentValue) return '未选择组件';
  const [type] = componentValue.split(':');
  return type === 'local' ? '本地组件' : '用户组件';
}

function getStepComponentInputs(step) {
  if (!step.component) return [];
  
  const [type, name] = step.component.split(':');
  const components = type === 'local' ? systemComponents.value : userComponents.value;
  const component = components.find(c => c.name === name);
  
  return component?.inputs || [];
}

function onStepComponentChange(step) {
  // 当组件改变时，清空输入参数并重新初始化
  step.inputs = {};
  
  // 如果有组件清单定义的输入，初始化默认值
  const inputs = getStepComponentInputs(step);
  inputs.forEach(input => {
    if (input.default !== undefined) {
      step.inputs[input.id] = input.default;
    }
  });
}

function showVariableSelector(step, inputId) {
  // TODO: 实现变量选择器弹窗
  setStatus('info', '变量选择器功能开发中...');
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

// 防抖的保存函数
const debouncedSaveWorkflow = useDebounce(async () => {
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
    
    // 如果工作流启用了Cron触发器，创建或更新触发器
    if (currentWorkflow.value.enabled && currentWorkflow.value.trigger.type === 'cron' && currentWorkflow.value.trigger.cronExpression) {
      try {
        await updateCronTrigger(currentWorkflow.value.id, currentWorkflow.value.trigger.cronExpression);
      } catch (triggerErr) {
        console.warn('Failed to update cron trigger:', triggerErr);
        setStatus('warning', '工作流已保存，但触发器更新失败');
      }
    } else if (currentWorkflow.value.trigger.type === 'cron') {
      // 如果工作流被禁用或没有Cron表达式，删除触发器
      try {
        await removeCronTrigger(currentWorkflow.value.id);
      } catch (triggerErr) {
        console.warn('Failed to remove cron trigger:', triggerErr);
      }
    }
    
    await fetchWorkflowsList();
    setStatus('success', '工作流已保存到 GitHub');
  } catch (err) {
    console.error(err);
    setStatus('error', err.message || '保存失败');
  } finally {
    loadingStates.saving = false;
  }
}, 1000);

// 包装的保存函数
async function saveCurrentWorkflow() {
  await debouncedSaveWorkflow();
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

// 防抖的手动触发函数
const debouncedTriggerManualRun = useDebounce(async () => {
  if (!currentWorkflow.value) {
    return;
  }
  
  try {
    const res = await fetch(`/api/triggers/trigger/${currentWorkflow.value.id}`, {
      method: 'POST'
    });
    
    if (!res.ok) {
      throw new Error('手动触发失败');
    }
    
    setStatus('success', '工作流已手动触发执行');
  } catch (err) {
    setStatus('error', '手动触发失败: ' + err.message);
  }
}, 500);

// 包装的手动触发函数
async function triggerManualRun() {
  await debouncedTriggerManualRun();
}

async function updateCronTrigger(workflowId, cronExpression) {
  const res = await fetch(`/api/triggers/cron/${workflowId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cronExpression })
  });
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '更新触发器失败');
  }
  
  return await res.json();
}

async function removeCronTrigger(workflowId) {
  const res = await fetch(`/api/triggers/cron/${workflowId}`, {
    method: 'DELETE'
  });
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '删除触发器失败');
  }
  
  return await res.json();
}

function copyWebhookUrl() {
  if (!currentWorkflow.value) return;
  
  const webhookUrl = `${window.location.origin}/api/webhook/${currentWorkflow.value.id}`;
  navigator.clipboard.writeText(webhookUrl).then(() => {
    setStatus('success', 'Webhook URL已复制到剪贴板');
  }).catch(() => {
    setStatus('error', '复制失败，请手动复制');
  });
}

async function testWebhook(method) {
  if (!currentWorkflow.value) return;
  
  try {
    const webhookUrl = `/api/webhook/${currentWorkflow.value.id}`;
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (method === 'POST') {
      options.body = JSON.stringify({
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Webhook测试请求'
      });
    }
    
    const res = await fetch(webhookUrl, options);
    const data = await res.json();
    
    if (res.ok) {
      setStatus('success', `Webhook测试成功！任务ID: ${data.taskId}`);
    } else {
      setStatus('error', `Webhook测试失败: ${data.error}`);
    }
  } catch (err) {
    setStatus('error', `Webhook测试失败: ${err.message}`);
  }
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
  loadingStates.components = true;
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
  } finally {
    loadingStates.components = false;
  }
}

// 数据库管理相关方法
async function checkFeishuAuthStatus() {
  try {
    const res = await fetch('/api/feishu/auth/status');
    if (res.ok) {
      const data = await res.json();
      feishuAuthStatus.value = data;
    }
  } catch (err) {
    console.error('检查飞书认证状态失败:', err);
  }
}

async function checkFeishuConfigStatus() {
  try {
    const res = await fetch('/api/feishu/config/status');
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        feishuConfigStatus.value = data.data;
      }
    }
  } catch (err) {
    console.error('获取飞书配置状态失败:', err);
  }
}

async function connectFeishu() {
  try {
    // 显示长连接中状态
    setStatus('info', '正在建立长连接...');
    
    // 首先尝试启动WebSocket连接
    const webSocketStarted = await startFeishuWebSocket();
    
    if (webSocketStarted) {
      setStatus('success', '长连接已建立，正在启动OAuth认证...');
      
      const res = await fetch('/api/feishu/auth/start');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data.authUrl) {
          // 打开新窗口进行OAuth认证
          const authWindow = window.open(
            data.data.authUrl,
            'feishu_auth',
            'width=600,height=700,scrollbars=yes,resizable=yes'
          );
          
          // 监听窗口关闭事件
          const checkClosed = setInterval(() => {
            if (authWindow.closed) {
              clearInterval(checkClosed);
              // 重新检查认证状态
              checkFeishuAuthStatus();
            }
          }, 1000);
          
          setStatus('info', '请在弹窗中完成飞书登录');
        } else {
          setStatus('error', data.error || '启动飞书认证失败');
        }
      } else {
        setStatus('error', '启动飞书认证失败');
      }
    } else {
      setStatus('error', '长连接建立失败，请检查飞书配置');
    }
  } catch (err) {
    console.error('启动飞书认证失败:', err);
    setStatus('error', '启动飞书认证失败: ' + err.message);
  }
}

async function saveFeishuConfig() {
  feishuConfigLoading.value = true;
  feishuConfigError.value = '';
  
  try {
    const res = await fetch('/api/feishu/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(feishuConfigForm.value)
    });
    
    const data = await res.json();
    
    if (res.ok && data.success) {
      setStatus('success', '飞书配置保存成功！');
      showFeishuConfigDialog.value = false;
      
      // 保存配置信息用于激活对话框
      savedFeishuConfig.value = { ...feishuConfigForm.value };
      
      // 显示激活配置对话框
      showFeishuActivationDialog.value = true;
      
      // 重新检查认证状态
      await checkFeishuAuthStatus();
    } else {
      feishuConfigError.value = data.error || '保存配置失败';
    }
  } catch (err) {
    console.error('保存飞书配置失败:', err);
    feishuConfigError.value = '保存配置失败: ' + err.message;
  } finally {
    feishuConfigLoading.value = false;
  }
}

function openFeishuEventSubscription() {
  if (savedFeishuConfig.value?.appId) {
    const eventUrl = `https://open.feishu.cn/app/${savedFeishuConfig.value.appId}/event?tab=callback`;
    window.open(eventUrl, '_blank');
    setStatus('info', '已打开飞书开放平台事件订阅页面，请配置长连接回调');
  }
}

function closeFeishuActivationDialog() {
  showFeishuActivationDialog.value = false;
  savedFeishuConfig.value = null;
}

async function checkFeishuWebSocketStatus() {
  try {
    const res = await fetch('/api/feishu/websocket/status');
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        feishuWebSocketStatus.value = data.data;
      }
    }
  } catch (err) {
    console.error('获取飞书WebSocket状态失败:', err);
  }
}

async function startFeishuWebSocket() {
  feishuWebSocketLoading.value = true;
  try {
    const res = await fetch('/api/feishu/websocket/start', {
      method: 'POST'
    });
    
    const data = await res.json();
    
    if (res.ok && data.success) {
      setStatus('success', '飞书WebSocket长连接启动成功');
      await checkFeishuWebSocketStatus();
      
      // 连接成功后自动刷新文件列表
      await refreshFeishuFiles();
      return true;
    } else {
      setStatus('error', data.error || '启动WebSocket连接失败');
      return false;
    }
  } catch (err) {
    console.error('启动飞书WebSocket失败:', err);
    setStatus('error', '启动WebSocket连接失败: ' + err.message);
    return false;
  } finally {
    feishuWebSocketLoading.value = false;
  }
}

async function stopFeishuWebSocket() {
  feishuWebSocketLoading.value = true;
  try {
    const res = await fetch('/api/feishu/websocket/stop', {
      method: 'POST'
    });
    
    const data = await res.json();
    
    if (res.ok && data.success) {
      setStatus('success', '飞书WebSocket连接已停止');
      await checkFeishuWebSocketStatus();
    } else {
      setStatus('error', data.error || '停止WebSocket连接失败');
    }
  } catch (err) {
    console.error('停止飞书WebSocket失败:', err);
    setStatus('error', '停止WebSocket连接失败: ' + err.message);
  } finally {
    feishuWebSocketLoading.value = false;
  }
}

async function openFeishuLongConnectionConfig() {
  try {
    // 获取飞书配置状态
    const res = await fetch('/api/feishu/config/status');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data.hasAppId) {
        const eventUrl = `https://open.feishu.cn/app/${data.data.appId}/event?tab=callback`;
        window.open(eventUrl, '_blank');
        setStatus('info', '已打开飞书开放平台长连接配置页面');
      } else {
        setStatus('error', '请先配置飞书App ID');
      }
    } else {
      setStatus('error', '获取飞书配置状态失败');
    }
  } catch (err) {
    console.error('打开飞书长连接配置失败:', err);
    setStatus('error', '打开飞书长连接配置失败');
  }
}

async function refreshFeishuFiles() {
  if (!feishuConfigStatus.value.configured) {
    setStatus('error', '请先配置飞书应用');
    return;
  }

  feishuFilesLoading.value = true;
  try {
    const res = await fetch('/api/feishu/fs/list');
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        feishuFiles.value = data.data || [];
        setStatus('success', '文件列表刷新成功');
      } else {
        setStatus('error', data.error || '获取文件列表失败');
      }
    } else {
      setStatus('error', '获取文件列表失败');
    }
  } catch (err) {
    console.error('刷新文件列表失败:', err);
    setStatus('error', '刷新文件列表失败');
  } finally {
    feishuFilesLoading.value = false;
  }
}

async function downloadFile(file) {
  try {
    const res = await fetch(`/api/feishu/fs/download/${file.token}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setStatus('success', '文件下载成功');
    } else {
      setStatus('error', '文件下载失败');
    }
  } catch (err) {
    console.error('下载文件失败:', err);
    setStatus('error', '下载文件失败');
  }
}

async function deleteFile(file) {
  if (!confirm(`确定要删除文件 "${file.name}" 吗？`)) {
    return;
  }

  try {
    const res = await fetch(`/api/feishu/fs/${file.token}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        setStatus('success', '文件删除成功');
        await refreshFeishuFiles();
      } else {
        setStatus('error', data.error || '文件删除失败');
      }
    } else {
      setStatus('error', '文件删除失败');
    }
  } catch (err) {
    console.error('删除文件失败:', err);
    setStatus('error', '删除文件失败');
  }
}

async function refreshBackupPlans() {
  backupPlansLoading.value = true;
  try {
    // 这里应该调用备份计划API，暂时使用模拟数据
    await new Promise(resolve => setTimeout(resolve, 1000));
    backupPlans.value = [
      {
        id: '1',
        name: '每日备份',
        description: '每天凌晨2点自动备份重要文件',
        schedule: '0 2 * * *',
        enabled: true
      },
      {
        id: '2',
        name: '每周备份',
        description: '每周日晚上10点备份所有文件',
        schedule: '0 22 * * 0',
        enabled: false
      }
    ];
  } catch (err) {
    console.error('获取备份计划失败:', err);
    setStatus('error', '获取备份计划失败');
  } finally {
    backupPlansLoading.value = false;
  }
}

function createBackupPlan() {
  setStatus('info', '创建备份计划功能开发中...');
}

function editBackupPlan(plan) {
  setStatus('info', `编辑备份计划 "${plan.name}" 功能开发中...`);
}

function deleteBackupPlan(plan) {
  if (!confirm(`确定要删除备份计划 "${plan.name}" 吗？`)) {
    return;
  }
  setStatus('info', `删除备份计划 "${plan.name}" 功能开发中...`);
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 容器管理相关方法
async function checkContainerServiceStatus() {
  containerServiceLoading.value = true;
  try {
    const res = await fetch('/api/containers/status');
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        containerServiceStatus.value = data.data;
        setStatus('success', '容器服务状态检查完成');
      } else {
        setStatus('error', data.error || '检查容器服务状态失败');
      }
    } else {
      setStatus('error', '检查容器服务状态失败');
    }
  } catch (err) {
    console.error('检查容器服务状态失败:', err);
    setStatus('error', '检查容器服务状态失败');
  } finally {
    containerServiceLoading.value = false;
  }
}

async function refreshContainers() {
  containersLoading.value = true;
  try {
    const res = await fetch('/api/containers');
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        containers.value = data.data || [];
        setStatus('success', '容器列表刷新成功');
      } else {
        setStatus('error', data.error || '获取容器列表失败');
      }
    } else {
      setStatus('error', '获取容器列表失败');
    }
  } catch (err) {
    console.error('获取容器列表失败:', err);
    setStatus('error', '获取容器列表失败');
  } finally {
    containersLoading.value = false;
  }
}

async function startContainer(containerId) {
  try {
    const res = await fetch(`/api/containers/${containerId}/start`, {
      method: 'POST'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        setStatus('success', `容器 ${containerId} 启动成功`);
        await refreshContainers();
      } else {
        setStatus('error', data.error || '启动容器失败');
      }
    } else {
      setStatus('error', '启动容器失败');
    }
  } catch (err) {
    console.error('启动容器失败:', err);
    setStatus('error', '启动容器失败');
  }
}

async function stopContainer(containerId) {
  try {
    const res = await fetch(`/api/containers/${containerId}/stop`, {
      method: 'POST'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        setStatus('success', `容器 ${containerId} 停止成功`);
        await refreshContainers();
      } else {
        setStatus('error', data.error || '停止容器失败');
      }
    } else {
      setStatus('error', '停止容器失败');
    }
  } catch (err) {
    console.error('停止容器失败:', err);
    setStatus('error', '停止容器失败');
  }
}

async function removeContainer(containerId) {
  if (!confirm(`确定要删除容器 ${containerId} 吗？`)) {
    return;
  }

  try {
    const res = await fetch(`/api/containers/${containerId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        setStatus('success', `容器 ${containerId} 删除成功`);
        await refreshContainers();
      } else {
        setStatus('error', data.error || '删除容器失败');
      }
    } else {
      setStatus('error', '删除容器失败');
    }
  } catch (err) {
    console.error('删除容器失败:', err);
    setStatus('error', '删除容器失败');
  }
}

async function viewContainerLogs(containerId) {
  try {
    const res = await fetch(`/api/containers/${containerId}/logs?lines=100`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        // 在新窗口中显示日志
        const logsWindow = window.open('', '_blank', 'width=800,height=600');
        logsWindow.document.write(`
          <html>
            <head>
              <title>容器日志 - ${containerId}</title>
              <style>
                body { font-family: monospace; background: #1e293b; color: #e2e8f0; padding: 20px; }
                pre { white-space: pre-wrap; word-wrap: break-word; }
              </style>
            </head>
            <body>
              <h2>容器日志: ${containerId}</h2>
              <pre>${data.data.logs || '暂无日志'}</pre>
            </body>
          </html>
        `);
      } else {
        setStatus('error', data.error || '获取容器日志失败');
      }
    } else {
      setStatus('error', '获取容器日志失败');
    }
  } catch (err) {
    console.error('获取容器日志失败:', err);
    setStatus('error', '获取容器日志失败');
  }
}

function getContainerStatus(status) {
  if (!status) return '未知';
  if (status.includes('Up') || status.includes('running')) return '运行中';
  if (status.includes('Exited') || status.includes('stopped')) return '已停止';
  return status;
}

function getContainerStatusClass(status) {
  const statusText = getContainerStatus(status);
  switch (statusText) {
    case '运行中':
      return 'bg-emerald-500/20 text-emerald-300';
    case '已停止':
      return 'bg-red-500/20 text-red-300';
    default:
      return 'bg-slate-500/20 text-slate-300';
  }
}

function formatDate(dateString) {
  if (!dateString) return '未知';
  try {
    return new Date(dateString).toLocaleString('zh-CN');
  } catch (err) {
    return dateString;
  }
}

// 容器备份相关方法
async function createBackupWorkflow() {
  if (!backupForm.containerId) {
    setStatus('error', '请选择要备份的容器');
    return;
  }

  try {
    const res = await fetch('/api/container-backup/workflows', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(backupForm)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        setStatus('success', '容器备份工作流创建成功');
        showBackupDialog.value = false;
        await loadBackupWorkflows();
        // 重置表单
        Object.assign(backupForm, {
          containerId: '',
          cronExpression: '0 2 * * *',
          backupPath: '/tmp/backups',
          includeVolumes: true,
          includeConfig: true,
          compress: true,
          uploadToFeishu: false
        });
      } else {
        setStatus('error', data.error || '创建备份工作流失败');
      }
    } else {
      setStatus('error', '创建备份工作流失败');
    }
  } catch (err) {
    console.error('创建备份工作流失败:', err);
    setStatus('error', '创建备份工作流失败');
  }
}

async function loadBackupWorkflows() {
  try {
    // 获取所有工作流，然后过滤出备份工作流
    const res = await fetch('/api/workflows');
    if (res.ok) {
      const data = await res.json();
      backupWorkflows.value = data.workflows.filter(workflow => 
        workflow.metadata?.createdBy === 'container-backup-service'
      );
    }
  } catch (err) {
    console.error('加载备份工作流失败:', err);
  }
}

async function deleteBackupWorkflow(workflowId) {
  if (!confirm('确定要删除这个备份工作流吗？')) {
    return;
  }

  try {
    const res = await fetch(`/api/container-backup/workflows/${workflowId}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        setStatus('success', '备份工作流删除成功');
        await loadBackupWorkflows();
      } else {
        setStatus('error', data.error || '删除备份工作流失败');
      }
    } else {
      setStatus('error', '删除备份工作流失败');
    }
  } catch (err) {
    console.error('删除备份工作流失败:', err);
    setStatus('error', '删除备份工作流失败');
  }
}

// AI Cron助手相关方法
async function generateCronExpression() {
  if (!cronHelperInput.value.trim()) {
    setStatus('error', '请输入定时需求描述');
    return;
  }

  try {
    const res = await fetch('/api/ai-cron/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: cronHelperInput.value
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        cronHelperResult.value = data.data;
        setStatus('success', 'Cron表达式生成成功');
      } else {
        setStatus('error', data.error || '生成Cron表达式失败');
      }
    } else {
      setStatus('error', '生成Cron表达式失败');
    }
  } catch (err) {
    console.error('生成Cron表达式失败:', err);
    setStatus('error', '生成Cron表达式失败');
  }
}

async function loadCronSuggestions() {
  try {
    const res = await fetch('/api/ai-cron/suggestions');
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        cronSuggestions.value = data.data;
      }
    }
  } catch (err) {
    console.error('加载Cron建议失败:', err);
  }
}

function selectCronSuggestion(suggestion) {
  cronHelperResult.value = {
    cron: suggestion.cron,
    explanation: suggestion.explanation,
    confidence: 0.9
  };
}

function applyCronExpression() {
  if (cronHelperResult.value) {
    // 如果当前在工作流编辑页面
    if (currentWorkflow.value && currentWorkflow.value.trigger.type === 'cron') {
      currentWorkflow.value.trigger.cronExpression = cronHelperResult.value.cron;
    }
    // 如果当前在备份对话框
    if (showBackupDialog.value) {
      backupForm.cronExpression = cronHelperResult.value.cron;
    }
    
    setStatus('success', 'Cron表达式已应用');
    showCronHelper.value = false;
  }
}

function copyCronExpression(cron) {
  navigator.clipboard.writeText(cron).then(() => {
    setStatus('success', 'Cron表达式已复制到剪贴板');
  }).catch(() => {
    setStatus('error', '复制失败');
  });
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
  currentComponentType.value = componentId.startsWith('local-') ? 'local' : 'user';
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
  checkFeishuAuthStatus();
  checkFeishuConfigStatus();
  checkFeishuWebSocketStatus();
  refreshBackupPlans();
  loadBackupWorkflows();
  loadCronSuggestions();
});
</script>

<style scoped>
ul {
  list-style: none;
  padding: 0;
}
</style>
