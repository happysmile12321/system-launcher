import { ref, reactive } from 'vue';

export function useComponents() {
  const components = ref([]);
  const selectedComponent = ref(null);
  const showComponentModal = ref(false);
  const showExecutionModal = ref(false);
  const executionResult = ref(null);
  const loading = ref(false);

  // 获取组件列表
  async function fetchComponents() {
    loading.value = true;
    try {
      const response = await fetch('/api/components');
      const data = await response.json();
      
      if (data.success) {
        components.value = data.data || [];
      }
    } catch (error) {
      console.error('Failed to fetch components:', error);
    } finally {
      loading.value = false;
    }
  }

  // 选择组件
  function selectComponent(component) {
    selectedComponent.value = component;
    showComponentModal.value = true;
  }

  // 执行组件
  async function executeComponent(component, inputs = {}) {
    try {
      const response = await fetch(`/api/components/${component.name}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs }),
      });

      const data = await response.json();
      
      if (data.success) {
        executionResult.value = data.data;
        showExecutionModal.value = true;
      }
    } catch (error) {
      console.error('Failed to execute component:', error);
    }
  }

  // 创建用户组件
  async function createUserComponent(componentData) {
    try {
      const response = await fetch('/api/components/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(componentData),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchComponents();
        return data.data;
      }
    } catch (error) {
      console.error('Failed to create component:', error);
    }
  }

  // 更新用户组件
  async function updateUserComponent(componentName, componentData) {
    try {
      const response = await fetch(`/api/components/user/${componentName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(componentData),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchComponents();
        return data.data;
      }
    } catch (error) {
      console.error('Failed to update component:', error);
    }
  }

  // 删除用户组件
  async function deleteUserComponent(componentName) {
    if (!confirm('确定要删除这个组件吗？')) return;

    try {
      const response = await fetch(`/api/components/user/${componentName}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchComponents();
      }
    } catch (error) {
      console.error('Failed to delete component:', error);
    }
  }

  // 关闭模态框
  function closeComponentModal() {
    showComponentModal.value = false;
    selectedComponent.value = null;
  }

  function closeExecutionModal() {
    showExecutionModal.value = false;
    executionResult.value = null;
  }

  return {
    // 状态
    components,
    selectedComponent,
    showComponentModal,
    showExecutionModal,
    executionResult,
    loading,

    // 方法
    fetchComponents,
    selectComponent,
    executeComponent,
    createUserComponent,
    updateUserComponent,
    deleteUserComponent,
    closeComponentModal,
    closeExecutionModal,
  };
}
