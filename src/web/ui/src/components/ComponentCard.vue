<template>
  <div class="component-card" @click="onClick">
    <div class="card-header">
      <h3>{{ component.manifest.displayName || component.name }}</h3>
      <span class="version">{{ component.manifest.version }}</span>
    </div>
    <p class="description">{{ component.manifest.description }}</p>
    <div class="tags">
      <span class="tag">{{ component.type }}</span>
      <span v-if="component.type === 'user'" class="tag user-tag">用户自定义</span>
    </div>
    <div class="actions">
      <button @click.stop="onExecute" class="execute-btn">
        执行
      </button>
      <button 
        @click.stop="onEdit" 
        class="edit-btn"
        v-if="component.type === 'user'"
      >
        编辑
      </button>
      <button 
        @click.stop="onDelete" 
        class="delete-btn"
        v-if="component.type === 'user'"
      >
        删除
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ComponentCard',
  props: {
    component: {
      type: Object,
      required: true
    }
  },
  emits: ['click', 'execute', 'edit', 'delete'],
  methods: {
    onClick() {
      this.$emit('click', this.component);
    },
    onExecute() {
      this.$emit('execute', this.component);
    },
    onEdit() {
      this.$emit('edit', this.component);
    },
    onDelete() {
      this.$emit('delete', this.component);
    }
  }
};
</script>

<style scoped>
.component-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.component-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
}

.version {
  font-size: 12px;
  color: #64748b;
  background: #f8fafc;
  padding: 2px 8px;
  border-radius: 4px;
}

.description {
  color: #64748b;
  margin-bottom: 16px;
  line-height: 1.5;
}

.tags {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #e2e8f0;
  color: #334155;
}

.user-tag {
  background: #fef3c7;
  color: #92400e;
}

.actions {
  display: flex;
  gap: 8px;
}

.execute-btn, .edit-btn, .delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.execute-btn {
  background: #10b981;
  color: white;
}

.execute-btn:hover {
  background: #059669;
}

.edit-btn {
  background: #f59e0b;
  color: white;
}

.edit-btn:hover {
  background: #d97706;
}

.delete-btn {
  background: #ef4444;
  color: white;
}

.delete-btn:hover {
  background: #dc2626;
}
</style>