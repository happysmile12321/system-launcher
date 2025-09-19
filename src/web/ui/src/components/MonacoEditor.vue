<template>
  <div ref="editorContainer" class="monaco-editor-container"></div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as monaco from 'monaco-editor';

export default {
  name: 'MonacoEditor',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    language: {
      type: String,
      default: 'javascript'
    },
    theme: {
      type: String,
      default: 'vs-dark'
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    height: {
      type: String,
      default: '400px'
    },
    options: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const editorContainer = ref(null);
    let editor = null;

    const defaultOptions = {
      value: props.modelValue,
      language: props.language,
      theme: props.theme,
      readOnly: props.readOnly,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        useShadows: false,
        verticalHasArrows: false,
        horizontalHasArrows: false
      },
      folding: true,
      wordWrap: 'on',
      ...props.options
    };

    onMounted(async () => {
      await nextTick();
      
      if (editorContainer.value) {
        editor = monaco.editor.create(editorContainer.value, defaultOptions);
        
        // 监听内容变化
        editor.onDidChangeModelContent(() => {
          const value = editor.getValue();
          emit('update:modelValue', value);
          emit('change', value);
        });

        // 设置容器高度
        editorContainer.value.style.height = props.height;
      }
    });

    onUnmounted(() => {
      if (editor) {
        editor.dispose();
      }
    });

    // 监听props变化
    watch(() => props.modelValue, (newValue) => {
      if (editor && editor.getValue() !== newValue) {
        editor.setValue(newValue || '');
      }
    });

    watch(() => props.language, (newLanguage) => {
      if (editor) {
        monaco.editor.setModelLanguage(editor.getModel(), newLanguage);
      }
    });

    watch(() => props.theme, (newTheme) => {
      if (editor) {
        monaco.editor.setTheme(newTheme);
      }
    });

    watch(() => props.readOnly, (newReadOnly) => {
      if (editor) {
        editor.updateOptions({ readOnly: newReadOnly });
      }
    });

    watch(() => props.height, (newHeight) => {
      if (editorContainer.value) {
        editorContainer.value.style.height = newHeight;
        if (editor) {
          editor.layout();
        }
      }
    });

    return {
      editorContainer
    };
  }
};
</script>

<style scoped>
.monaco-editor-container {
  width: 100%;
  border: 1px solid #374151;
  border-radius: 0.5rem;
  overflow: hidden;
}

.monaco-editor-container:focus-within {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 1px #0ea5e9;
}
</style>
