<template>
  <div v-if="component" class="modal-overlay" @click="onCancel">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>执行组件: {{ component.manifest.displayName || component.name }}</h3>
        <button class="close-btn" @click="onCancel">×</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="onSubmit">
          <div v-if="component.manifest.inputs && Object.keys(component.manifest.inputs).length > 0">
            <div v-for="(input, key) in component.manifest.inputs" :key="key" class="form-group">
              <label :for="`input-${key}`">{{ input.description || key }}:</label>
              <input 
                v-if="input.type === 'string' || input.type === 'number' || input.type === 'boolean'"
                :type="input.type === 'boolean' ? 'checkbox' : 'text'"
                :id="`input-${key}`"
                v-model="inputs[key]"
                :default-value="input.default"
              />
              <textarea 
                v-else-if="input.type === 'object' || input.type === 'array'"
                :id="`input-${key}`"
                v-model="inputs[key]"
                rows="4"
                placeholder="请输入JSON格式的内容"
              ></textarea>
            </div>
          </div>
          <div v-else class="no-inputs">
            <p>该组件无需输入参数</p>
          </div>
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="onCancel">取消</button>
            <button type="submit" class="submit-btn">执行</button>
          </div>
        </form>
        
        <div v-if="result" class="execution-result">
          <h4>执行结果:</h4>
          <pre>{{ JSON.stringify(result, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ExecutionModal',
  props: {
    component: {
      type: Object,
      default: null
    },
    initialInputs: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      inputs: { ...this.initialInputs },
      result: null
    };
  },
  emits: ['cancel', 'submit'],
  watch: {
    initialInputs: {
      handler(newVal) {
        this.inputs = { ...newVal };
        this.result = null;
      },
      deep: true
    }
  },
  methods: {
    onCancel() {
      this.$emit('cancel');
    },
    onSubmit() {
      this.$emit('submit', this.inputs);
    },
    setResult(result) {
      this.result = result;
    },
    resetResult() {
      this.result = null;
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

.no-inputs {
  color: #64748b;
  font-style: italic;
  padding: 16px;
  background: #f8fafc;
  border-radius: 4px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-group input, .form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.cancel-btn, .submit-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn {
  background: #f1f5f9;
  color: #334155;
}

.submit-btn {
  background: #10b981;
  color: white;
}

.execution-result {
  margin-top: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 4px;
}

.execution-result pre {
  background: #1e293b;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}
</style>