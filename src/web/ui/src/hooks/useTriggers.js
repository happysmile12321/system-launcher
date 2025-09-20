import { ref, reactive } from 'vue';

export function useTriggers() {
  const triggers = ref([]);
  const loading = ref(false);

  // 获取触发器列表
  async function fetchTriggers() {
    loading.value = true;
    try {
      const response = await fetch('/api/triggers');
      const data = await response.json();
      
      if (data.success) {
        triggers.value = data.data || [];
      }
    } catch (error) {
      console.error('Failed to fetch triggers:', error);
    } finally {
      loading.value = false;
    }
  }

  // 创建触发器
  async function createTrigger(triggerData) {
    try {
      const response = await fetch('/api/triggers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(triggerData),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchTriggers();
        return data.data;
      }
    } catch (error) {
      console.error('Failed to create trigger:', error);
    }
  }

  // 更新触发器
  async function updateTrigger(triggerId, triggerData) {
    try {
      const response = await fetch(`/api/triggers/${triggerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(triggerData),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchTriggers();
        return data.data;
      }
    } catch (error) {
      console.error('Failed to update trigger:', error);
    }
  }

  // 删除触发器
  async function deleteTrigger(triggerId) {
    if (!confirm('确定要删除这个触发器吗？')) return;

    try {
      const response = await fetch(`/api/triggers/${triggerId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchTriggers();
      }
    } catch (error) {
      console.error('Failed to delete trigger:', error);
    }
  }

  // 启用/禁用触发器
  async function toggleTrigger(triggerId, enabled) {
    try {
      const response = await fetch(`/api/triggers/${triggerId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchTriggers();
      }
    } catch (error) {
      console.error('Failed to toggle trigger:', error);
    }
  }

  return {
    // 状态
    triggers,
    loading,

    // 方法
    fetchTriggers,
    createTrigger,
    updateTrigger,
    deleteTrigger,
    toggleTrigger,
  };
}
