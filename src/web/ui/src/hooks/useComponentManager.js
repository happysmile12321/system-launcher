import { ref, computed } from 'vue';

export function useComponentManager() {
  const components = ref([]);
  const loading = ref(false);
  const activeType = ref('all');
  const selectedComponent = ref(null);
  const executingComponent = ref(null);
  const executionInputs = ref({});
  const executionResult = ref(null);
  
  const componentTypes = [
    { label: '全部', value: 'all' },
    { label: '官方', value: 'official' },
    { label: '用户自定义', value: 'user' }
  ];

  const filteredComponents = computed(() => {
    if (activeType.value === 'all') {
      return components.value;
    }
    return components.value.filter(component => component.type === activeType.value);
  });

  const fetchComponents = async () => {
    loading.value = true;
    try {
      const response = await fetch('/api/components');
      const data = await response.json();
      if (data.success) {
        components.value = data.data;
      } else {
        alert('获取组件失败: ' + data.error);
      }
    } catch (err) {
      alert('获取组件失败: ' + err.message);
    } finally {
      loading.value = false;
    }
  };

  const refreshComponents = async () => {
    await fetchComponents();
  };

  const viewComponent = (component) => {
    selectedComponent.value = component;
  };

  const closeModal = () => {
    selectedComponent.value = null;
  };

  const executeComponent = (component) => {
    executingComponent.value = component;
    executionInputs.value = {};
    executionResult.value = null;
    
    // 初始化默认值
    if (component.manifest.inputs) {
      Object.keys(component.manifest.inputs).forEach(key => {
        if (component.manifest.inputs[key].default !== undefined) {
          executionInputs.value[key] = component.manifest.inputs[key].default;
        } else {
          executionInputs.value[key] = '';
        }
      });
    }
  };

  const cancelExecute = () => {
    executingComponent.value = null;
    executionInputs.value = {};
    executionResult.value = null;
  };

  const submitExecution = async () => {
    if (!executingComponent.value) return;
    
    try {
      // 处理JSON输入
      const processedInputs = {};
      Object.keys(executionInputs.value).forEach(key => {
        const inputDef = executingComponent.value.manifest.inputs[key];
        if (inputDef.type === 'object' || inputDef.type === 'array') {
          try {
            processedInputs[key] = JSON.parse(executionInputs.value[key]);
          } catch (e) {
            alert(`参数${key}不是有效的JSON格式`);
            return;
          }
        } else if (inputDef.type === 'number') {
          processedInputs[key] = parseFloat(executionInputs.value[key]);
        } else if (inputDef.type === 'boolean') {
          processedInputs[key] = !!executionInputs.value[key];
        } else {
          processedInputs[key] = executionInputs.value[key];
        }
      });
      
      const response = await fetch(`/api/components/execute/${executingComponent.value.type}/${executingComponent.value.name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: processedInputs, context: {} })
      });
      
      const data = await response.json();
      if (data.success) {
        executionResult.value = data.data;
      } else {
        alert('执行失败: ' + data.error);
      }
    } catch (err) {
      alert('执行失败: ' + err.message);
    }
  };

  const editComponent = (component) => {
    // 编辑组件的逻辑将在后续实现
    alert('编辑功能即将上线');
  };

  const deleteComponent = async (component) => {
    if (confirm(`确定要删除组件 ${component.name} 吗？`)) {
      try {
        const response = await fetch(`/api/components/user/${component.name}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
          alert('删除成功');
          await fetchComponents();
        } else {
          alert('删除失败: ' + data.error);
        }
      } catch (err) {
        alert('删除失败: ' + err.message);
      }
    }
  };

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
    fetchComponents,
    refreshComponents,
    viewComponent,
    closeModal,
    executeComponent,
    cancelExecute,
    submitExecution,
    editComponent,
    deleteComponent
  };
}