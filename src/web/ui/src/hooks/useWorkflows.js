import { ref, reactive, computed } from 'vue';
import { useDebounce } from '../utils/debounce.js';

export function useWorkflows() {
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

  const components = ref([]);
  const selectedComponent = ref(null);
  const showComponentModal = ref(false);
  const showExecutionModal = ref(false);
  const executionResult = ref(null);

  // 计算属性
  const selectedWorkflow = computed(() => {
    return workflows.value.find(w => w.id === selectedWorkflowId.value);
  });

  const hasUnsavedChanges = computed(() => {
    if (!currentWorkflow.value || !originalWorkflowSnapshot.value) return false;
    return JSON.stringify(currentWorkflow.value) !== JSON.stringify(originalWorkflowSnapshot.value);
  });

  const canSave = computed(() => {
    return currentWorkflow.value && 
           currentWorkflow.value.name && 
           currentWorkflow.value.name.trim() !== '' &&
           hasUnsavedChanges.value;
  });

  // 防抖保存
  const debouncedSave = useDebounce(async () => {
    if (canSave.value) {
      await saveWorkflow();
    }
  }, 1000);

  // 获取工作流列表
  async function fetchWorkflows() {
    loadingStates.list = true;
    try {
      const response = await fetch('/api/workflows');
      const data = await response.json();
      
      if (data.success) {
        workflows.value = data.data || [];
        if (workflows.value.length > 0 && !selectedWorkflowId.value) {
          selectWorkflow(workflows.value[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      loadingStates.list = false;
    }
  }

  // 选择工作流
  async function selectWorkflow(workflowId) {
    if (hasUnsavedChanges.value) {
      if (!confirm('当前工作流有未保存的更改，是否保存？')) {
        return;
      }
      await saveWorkflow();
    }

    selectedWorkflowId.value = workflowId;
    await fetchWorkflowDetail(workflowId);
  }

  // 获取工作流详情
  async function fetchWorkflowDetail(workflowId) {
    loadingStates.detail = true;
    try {
      const response = await fetch(`/api/workflows/${workflowId}`);
      const data = await response.json();
      
      if (data.success) {
        currentWorkflow.value = data.data;
        originalWorkflowSnapshot.value = JSON.parse(JSON.stringify(data.data));
      }
    } catch (error) {
      console.error('Failed to fetch workflow detail:', error);
    } finally {
      loadingStates.detail = false;
    }
  }

  // 保存工作流
  async function saveWorkflow() {
    if (!currentWorkflow.value) return;

    loadingStates.saving = true;
    try {
      const response = await fetch(`/api/workflows/${currentWorkflow.value.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentWorkflow.value),
      });

      const data = await response.json();
      
      if (data.success) {
        originalWorkflowSnapshot.value = JSON.parse(JSON.stringify(currentWorkflow.value));
        await fetchWorkflows(); // 刷新列表
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
    } finally {
      loadingStates.saving = false;
    }
  }

  // 创建工作流
  async function createWorkflow() {
    const newWorkflow = {
      name: '新工作流',
      description: '',
      enabled: false,
      steps: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    };

    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newWorkflow),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchWorkflows();
        selectWorkflow(data.data.id);
      }
    } catch (error) {
      console.error('Failed to create workflow:', error);
    }
  }

  // 删除工作流
  async function deleteWorkflow(workflowId) {
    if (!confirm('确定要删除这个工作流吗？')) return;

    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchWorkflows();
        if (selectedWorkflowId.value === workflowId) {
          selectedWorkflowId.value = '';
          currentWorkflow.value = null;
          originalWorkflowSnapshot.value = null;
        }
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error);
    }
  }

  // 更新工作流
  function updateWorkflow(updates) {
    if (currentWorkflow.value) {
      Object.assign(currentWorkflow.value, updates);
      currentWorkflow.value.metadata.updatedAt = new Date().toISOString();
      debouncedSave();
    }
  }

  // 添加步骤
  function addStep(step) {
    if (currentWorkflow.value) {
      currentWorkflow.value.steps.push(step);
      updateWorkflow({});
    }
  }

  // 删除步骤
  function removeStep(stepIndex) {
    if (currentWorkflow.value) {
      currentWorkflow.value.steps.splice(stepIndex, 1);
      updateWorkflow({});
    }
  }

  // 更新步骤
  function updateStep(stepIndex, updates) {
    if (currentWorkflow.value && currentWorkflow.value.steps[stepIndex]) {
      Object.assign(currentWorkflow.value.steps[stepIndex], updates);
      updateWorkflow({});
    }
  }

  return {
    // 状态
    workflows,
    selectedWorkflowId,
    currentWorkflow,
    originalWorkflowSnapshot,
    scripts,
    loadingStates,
    components,
    selectedComponent,
    showComponentModal,
    showExecutionModal,
    executionResult,

    // 计算属性
    selectedWorkflow,
    hasUnsavedChanges,
    canSave,

    // 方法
    fetchWorkflows,
    selectWorkflow,
    fetchWorkflowDetail,
    saveWorkflow,
    createWorkflow,
    deleteWorkflow,
    updateWorkflow,
    addStep,
    removeStep,
    updateStep,
  };
}
