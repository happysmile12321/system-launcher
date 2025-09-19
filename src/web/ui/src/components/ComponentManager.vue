<template>
  <div class="component-manager">
    <div class="header">
      <h2>组件管理</h2>
      <button class="refresh-btn" @click="refreshComponents">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 2v6h-6"></path>
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
          <path d="M3 22v-6h6"></path>
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
        </svg>
        刷新列表
      </button>
    </div>

    <div class="component-types">
      <button 
        v-for="type in componentTypes" 
        :key="type.value"
        :class="['type-btn', { active: activeType === type.value }]"
        @click="activeType = type.value"
      >
        {{ type.label }}
      </button>
    </div>

    <div class="component-list">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="components.length === 0" class="empty-state">
        <div class="empty-icon">📦</div>
        <p>暂无{{ componentTypes.find(t => t.value === activeType)?.label }}组件</p>
      </div>
      <div v-else class="grid">
        <ComponentCard
          v-for="component of filteredComponents"
          :key="`${component.type}-${component.name}`"
          :component="component"
          @click="viewComponent(component)"
          @execute="executeComponent(component)"
          @edit="editComponent(component)"
          @delete="deleteComponent(component)"
        />
      </div>
    </div>

    <!-- 组件详情模态框 -->
    <ComponentModal
      :component="selectedComponent"
      @close="closeModal"
    />

    <!-- 执行组件模态框 -->
    <ExecutionModal
      ref="executionModal"
      :component="executingComponent"
      :initial-inputs="executionInputs"
      @cancel="cancelExecute"
      @submit="handleSubmitExecution"
    />
  </div>
</template>

<script>
import { onMounted, ref } from 'vue';
import { useComponentManager } from '../hooks/useComponentManager.js';
import ComponentCard from './ComponentCard.vue';
import ComponentModal from './ComponentModal.vue';
import ExecutionModal from './ExecutionModal.vue';

export default {
  name: 'ComponentManager',
  components: {
    ComponentCard,
    ComponentModal,
    ExecutionModal
  },
  setup() {
    const executionModal = ref(null);
    
    // 使用hooks获取状态和方法
    const {
      components,
      loading,
      activeType,
      selectedComponent,
      executingComponent,
      executionInputs,
      executionResult,
      componentTypes,
      filteredComponents,
      fetchComponents,
      refreshComponents,
      viewComponent,
      closeModal,
      executeComponent,
      cancelExecute,
      submitExecution,
      editComponent,
      deleteComponent
    } = useComponentManager();
    
    // 处理执行提交，包含JSON解析逻辑
    const handleSubmitExecution = async (inputs) => {
      if (!executingComponent.value) return;
      
      try {
        // 处理JSON输入
        const processedInputs = {};
        Object.keys(inputs).forEach(key => {
          const inputDef = executingComponent.value.manifest.inputs[key];
          if (inputDef.type === 'object' || inputDef.type === 'array') {
            try {
              processedInputs[key] = JSON.parse(inputs[key]);
            } catch (e) {
              alert(`参数${key}不是有效的JSON格式`);
              return;
            }
          } else if (inputDef.type === 'number') {
            processedInputs[key] = parseFloat(inputs[key]);
          } else if (inputDef.type === 'boolean') {
            processedInputs[key] = !!inputs[key];
          } else {
            processedInputs[key] = inputs[key];
          }
        });
        
        // 调用hooks中的方法执行组件
        const result = await submitExecution(executingComponent.value, processedInputs);
        
        // 设置执行结果到模态框中
        if (executionModal.value && result) {
          executionModal.value.setResult(result);
        }
      } catch (err) {
        alert('执行失败: ' + err.message);
      }
    };
    
    // 组件挂载时获取组件列表
    onMounted(() => {
      fetchComponents();
    });
    
    return {
      components,
      loading,
      activeType,
      selectedComponent,
      executingComponent,
      executionInputs,
      executionResult,
      componentTypes,
      filteredComponents,
      executionModal,
      refreshComponents,
      viewComponent,
      closeModal,
      executeComponent,
      cancelExecute,
      handleSubmitExecution,
      editComponent,
      deleteComponent
    };
  }
};
</script>

<style scoped>
.component-manager {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #0ea5e9;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.refresh-btn:hover {
  background: #0284c7;
}

.component-types {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.type-btn {
  padding: 8px 16px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.type-btn.active {
  background: #0ea5e9;
  color: white;
  border-color: #0ea5e9;
}

.component-list {
  min-height: 400px;
}

.loading, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
</style>