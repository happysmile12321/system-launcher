<template>
  <!-- 模态框遮罩层 -->
  <div 
    v-if="show" 
    class="modal-overlay" 
    @click="closeModal"
    style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center;"
  >
    <!-- 模态框内容 -->
    <div 
      class="modal-content" 
      @click.stop
      style="background: #1e293b; border: 1px solid #475569; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;"
    >
      <!-- 模态框头部 -->
      <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #475569;">
        <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #f1f5f9;">创建容器组</h3>
        <button 
          @click="closeModal"
          style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; font-size: 20px;"
        >
          ×
        </button>
      </div>
      
      <!-- 模态框主体 -->
      <div class="modal-body" style="padding: 20px;">
        <!-- 容器组名称 -->
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 14px; font-weight: 500; color: #e2e8f0; margin-bottom: 6px;">
            容器组名称 *
          </label>
          <input
            v-model="formData.name"
            type="text"
            placeholder="如：my-web-app"
            style="width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid #475569; border-radius: 6px; color: #e2e8f0; font-size: 14px; box-sizing: border-box;"
          />
        </div>
        
        <!-- 描述 -->
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 14px; font-weight: 500; color: #e2e8f0; margin-bottom: 6px;">
            描述
          </label>
          <textarea
            v-model="formData.description"
            rows="3"
            placeholder="描述这个容器组的用途"
            style="width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid #475569; border-radius: 6px; color: #e2e8f0; font-size: 14px; resize: vertical; box-sizing: border-box;"
          ></textarea>
        </div>
        
        <!-- Docker Compose 配置 -->
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 14px; font-weight: 500; color: #e2e8f0; margin-bottom: 6px;">
            Docker Compose 配置 *
          </label>
          <textarea
            v-model="formData.content"
            rows="10"
            placeholder="version: '3.8'&#10;&#10;services:&#10;  web:&#10;    image: nginx:latest&#10;    ports:&#10;      - '80:80'"
            style="width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid #475569; border-radius: 6px; color: #e2e8f0; font-size: 13px; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; line-height: 1.5; resize: vertical; box-sizing: border-box;"
          ></textarea>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">
            请输入完整的 Docker Compose YAML 配置
          </p>
        </div>
      </div>
      
      <!-- 模态框底部 -->
      <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 12px; padding: 20px; border-top: 1px solid #475569;">
        <button 
          @click="closeModal"
          style="background: transparent; color: #94a3b8; border: 1px solid #475569; padding: 8px 16px; border-radius: 6px; font-size: 14px; cursor: pointer;"
        >
          取消
        </button>
        <button 
          @click="handleSave"
          :disabled="!formData.name || !formData.content"
          style="background: #0ea5e9; color: #0f172a; border: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; opacity: 1;"
          :style="{ opacity: (!formData.name || !formData.content) ? '0.5' : '1', cursor: (!formData.name || !formData.content) ? 'not-allowed' : 'pointer' }"
        >
          保存
        </button>
        <button 
          @click="handleDeploy"
          :disabled="!formData.name || !formData.content"
          style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; opacity: 1;"
          :style="{ opacity: (!formData.name || !formData.content) ? '0.5' : '1', cursor: (!formData.name || !formData.content) ? 'not-allowed' : 'pointer' }"
        >
          保存并部署
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

// Props
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['close', 'saved', 'deployed']);

// 表单数据
const formData = ref({
  name: '',
  description: '',
  content: ''
});

// 监听show属性变化，重置表单
watch(() => props.show, (newValue) => {
  if (newValue) {
    // 重置表单数据
    formData.value = {
      name: '',
      description: '',
      content: ''
    };
  }
});

// 关闭模态框
function closeModal() {
  emit('close');
}

// 保存
async function handleSave() {
  if (!formData.value.name || !formData.value.content) {
    alert('请填写必要信息');
    return;
  }

  try {
    const response = await fetch('/api/compositions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: formData.value.name,
        description: formData.value.description,
        content: formData.value.content
      })
    });

    const data = await response.json();

    if (data.success) {
      emit('saved', formData.value);
      closeModal();
      alert('容器组保存成功！');
    } else {
      alert('保存失败：' + data.error);
    }
  } catch (error) {
    alert('保存失败：' + error.message);
  }
}

// 保存并部署
async function handleDeploy() {
  if (!formData.value.name || !formData.value.content) {
    alert('请填写必要信息');
    return;
  }

  try {
    // 先保存
    await handleSave();
    
    // 然后部署
    const response = await fetch('/api/containers/compose/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        composeContent: formData.value.content,
        projectName: formData.value.name
      })
    });

    const data = await response.json();

    if (data.success) {
      emit('deployed', formData.value);
      closeModal();
      alert('容器组部署成功！');
    } else {
      alert('部署失败：' + data.error);
    }
  } catch (error) {
    alert('部署失败：' + error.message);
  }
}
</script>

<style scoped>
/* 确保模态框在最顶层 */
.modal-overlay {
  z-index: 9999 !important;
}

/* 确保模态框内容可见 */
.modal-content {
  z-index: 10000 !important;
}

/* 输入框聚焦样式 */
input:focus,
textarea:focus {
  outline: none !important;
  border-color: #0ea5e9 !important;
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2) !important;
}

/* 按钮悬停效果 */
button:hover:not(:disabled) {
  transform: translateY(-1px);
  transition: transform 0.2s ease;
}
</style>