<template>
  <div class="skeleton-loader" :class="containerClass">
    <!-- 文本骨架 -->
    <div v-if="type === 'text'" class="skeleton-text" :style="textStyle"></div>
    
    <!-- 按钮骨架 -->
    <div v-else-if="type === 'button'" class="skeleton-button" :style="buttonStyle"></div>
    
    <!-- 卡片骨架 -->
    <div v-else-if="type === 'card'" class="skeleton-card" :style="cardStyle">
      <div class="skeleton-card-header">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-text-group">
          <div class="skeleton-text skeleton-text--title"></div>
          <div class="skeleton-text skeleton-text--subtitle"></div>
        </div>
      </div>
      <div class="skeleton-card-content">
        <div class="skeleton-text" v-for="i in lines" :key="i"></div>
      </div>
    </div>
    
    <!-- 列表骨架 -->
    <div v-else-if="type === 'list'" class="skeleton-list">
      <div v-for="i in count" :key="i" class="skeleton-list-item">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-text-group">
          <div class="skeleton-text skeleton-text--title"></div>
          <div class="skeleton-text skeleton-text--subtitle"></div>
        </div>
      </div>
    </div>
    
    <!-- 表格骨架 -->
    <div v-else-if="type === 'table'" class="skeleton-table">
      <div class="skeleton-table-header">
        <div v-for="i in columns" :key="i" class="skeleton-text"></div>
      </div>
      <div v-for="i in rows" :key="i" class="skeleton-table-row">
        <div v-for="j in columns" :key="j" class="skeleton-text"></div>
      </div>
    </div>
    
    <!-- 自定义骨架 -->
    <div v-else class="skeleton-custom">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'SkeletonLoader',
  props: {
    type: {
      type: String,
      default: 'text',
      validator: (value) => ['text', 'button', 'card', 'list', 'table', 'custom'].includes(value)
    },
    width: {
      type: [String, Number],
      default: '100%'
    },
    height: {
      type: [String, Number],
      default: '1rem'
    },
    lines: {
      type: Number,
      default: 3
    },
    count: {
      type: Number,
      default: 5
    },
    columns: {
      type: Number,
      default: 4
    },
    rows: {
      type: Number,
      default: 5
    },
    animated: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    const containerClass = computed(() => ({
      'skeleton-loader--animated': props.animated
    }));

    const textStyle = computed(() => ({
      width: typeof props.width === 'number' ? `${props.width}px` : props.width,
      height: typeof props.height === 'number' ? `${props.height}px` : props.height
    }));

    const buttonStyle = computed(() => ({
      width: typeof props.width === 'number' ? `${props.width}px` : props.width,
      height: typeof props.height === 'number' ? `${props.height}px` : props.height
    }));

    const cardStyle = computed(() => ({
      width: typeof props.width === 'number' ? `${props.width}px` : props.width,
      height: typeof props.height === 'number' ? `${props.height}px` : props.height
    }));

    return {
      containerClass,
      textStyle,
      buttonStyle,
      cardStyle
    };
  }
};
</script>

<style scoped>
.skeleton-loader {
  display: inline-block;
}

.skeleton-loader--animated .skeleton-text,
.skeleton-loader--animated .skeleton-button,
.skeleton-loader--animated .skeleton-avatar,
.skeleton-loader--animated .skeleton-card {
  background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-text {
  background-color: #374151;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.skeleton-text--title {
  height: 1.25rem;
  width: 60%;
}

.skeleton-text--subtitle {
  height: 1rem;
  width: 40%;
}

.skeleton-button {
  background-color: #374151;
  border-radius: 6px;
  display: inline-block;
}

.skeleton-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #374151;
  flex-shrink: 0;
}

.skeleton-card {
  background-color: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 1rem;
}

.skeleton-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.skeleton-text-group {
  flex: 1;
}

.skeleton-card-content {
  space-y: 0.5rem;
}

.skeleton-list {
  space-y: 0.75rem;
}

.skeleton-list-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
}

.skeleton-table {
  background-color: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  overflow: hidden;
}

.skeleton-table-header {
  display: grid;
  grid-template-columns: repeat(var(--columns, 4), 1fr);
  gap: 1rem;
  padding: 1rem;
  background-color: #111827;
  border-bottom: 1px solid #374151;
}

.skeleton-table-row {
  display: grid;
  grid-template-columns: repeat(var(--columns, 4), 1fr);
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #374151;
}

.skeleton-table-row:last-child {
  border-bottom: none;
}

.skeleton-custom {
  /* 自定义骨架样式 */
}
</style>
