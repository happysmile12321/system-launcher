<template>
  <div v-if="component" class="modal-overlay" @click="onClose">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ component.manifest.displayName || component.name }}详情</h3>
        <button class="close-btn" @click="onClose">×</button>
      </div>
      <div class="modal-body">
        <div class="component-info">
          <p><strong>名称:</strong> {{ component.name }}</p>
          <p><strong>类型:</strong> {{ component.type }}</p>
          <p><strong>版本:</strong> {{ component.manifest.version }}</p>
          <p><strong>描述:</strong> {{ component.manifest.description }}</p>
        </div>
        
        <div class="params-section">
          <h4>输入参数</h4>
          <div v-if="component.manifest.inputs && Object.keys(component.manifest.inputs).length > 0">
            <div v-for="(input, key) in component.manifest.inputs" :key="key" class="param-item">
              <div class="param-header">
                <strong>{{ key }}</strong>
                <span class="param-type">{{ input.type }}</span>
              </div>
              <p class="param-description">{{ input.description }}</p>
              <p v-if="input.default" class="param-default">默认值: {{ JSON.stringify(input.default) }}</p>
            </div>
          </div>
          <p v-else class="no-params">无输入参数</p>
        </div>

        <div class="params-section">
          <h4>输出参数</h4>
          <div v-if="component.manifest.outputs && Object.keys(component.manifest.outputs).length > 0">
            <div v-for="(output, key) in component.manifest.outputs" :key="key" class="param-item">
              <div class="param-header">
                <strong>{{ key }}</strong>
                <span class="param-type">{{ output.type }}</span>
              </div>
              <p class="param-description">{{ output.description }}</p>
            </div>
          </div>
          <p v-else class="no-params">无输出参数</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ComponentModal',
  props: {
    component: {
      type: Object,
      default: null
    }
  },
  emits: ['close'],
  methods: {
    onClose() {
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 20px;
}

.component-info p {
  margin-bottom: 8px;
}

.params-section {
  margin-top: 24px;
}

.params-section h4 {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.param-item {
  margin-bottom: 16px;
}

.param-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.param-type {
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.param-description {
  margin: 4px 0;
  color: #64748b;
  font-size: 14px;
}

.param-default {
  margin: 4px 0;
  color: #0ea5e9;
  font-size: 12px;
  font-style: italic;
}

.no-params {
  color: #64748b;
  font-style: italic;
  padding: 16px;
  background: #f8fafc;
  border-radius: 4px;
}
</style>