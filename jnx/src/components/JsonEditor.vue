<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

const props = defineProps<{ modelValue: string; errorLine: number | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const gutterRef = ref<HTMLDivElement | null>(null)
const focused = ref(false)

const lines = computed(() => {
  const n = (props.modelValue.match(/\n/g) || []).length + 1
  return Array.from({ length: n }, (_, i) => i + 1)
})

const charCount = computed(() => props.modelValue.length)
const lineCount = computed(() => lines.value.length)

function syncScroll() {
  if (gutterRef.value && textareaRef.value) {
    gutterRef.value.scrollTop = textareaRef.value.scrollTop
  }
}

function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

function onKeydown(e: KeyboardEvent) {
  // Tab → 2 spaces
  if (e.key === 'Tab') {
    e.preventDefault()
    const ta = textareaRef.value!
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const val = props.modelValue
    const newVal = val.substring(0, start) + '  ' + val.substring(end)
    emit('update:modelValue', newVal)
    nextTick(() => {
      ta.selectionStart = ta.selectionEnd = start + 2
    })
  }
}

function getCursorLine(): number {
  const ta = textareaRef.value
  if (!ta) return 1
  return (props.modelValue.substring(0, ta.selectionStart).match(/\n/g) || []).length + 1
}

const cursorLine = ref(1)
function onCursorMove() {
  cursorLine.value = getCursorLine()
}

function handlePaste() {
  navigator.clipboard.readText().then(t => { emit('update:modelValue', t) })
}

defineExpose({ charCount, lineCount, cursorLine, textareaRef })
</script>

<template>
  <div class="editor-wrap" :class="{ focused, error: errorLine !== null }">
    <!-- Header bar -->
    <div class="editor-header">
      <div class="header-left">
        <span class="header-label">输入</span>
        <span class="header-meta">{{ charCount }} 字符 · {{ lineCount }} 行</span>
      </div>
      <div class="header-right">
        <button class="icon-btn" title="粘贴" @click="handlePaste">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M8 2H5a1 1 0 00-1 1v14a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1h-3"/>
            <rect x="8" y="2" width="4" height="3" rx="1"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Editor body -->
    <div class="editor-body">
      <div class="gutter" ref="gutterRef">
        <div
          v-for="(n, i) in lines"
          :key="i"
          class="line-num"
          :class="{
            current: n === cursorLine,
            error: n === errorLine,
          }"
        >{{ n }}</div>
      </div>
      <textarea
        ref="textareaRef"
        :value="modelValue"
        class="editor-textarea"
        spellcheck="false"
        @input="onInput"
        @keydown="onKeydown"
        @scroll="syncScroll"
        @focus="focused = true"
        @blur="focused = false"
        @click="onCursorMove"
        @keyup="onCursorMove"
        placeholder="粘贴或输入 JSON…"
      />
    </div>
  </div>
</template>

<style scoped>
.editor-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  border: 1px solid var(--json-border, rgba(232,76,111,0.12));
  border-radius: 10px;
  background: var(--json-bg, #FFFFFF);
  transition: border-color 0.2s, box-shadow 0.2s;
  overflow: hidden;
}
.editor-wrap.focused {
  border-color: var(--json-primary, #E84C6F);
  box-shadow: 0 0 0 3px var(--json-primary-light, rgba(232,76,111,0.08));
}
.editor-wrap.error {
  border-color: var(--json-error-wavy, #E84C6F);
}

/* Header */
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--json-border, rgba(232,76,111,0.08));
  flex-shrink: 0;
  background: var(--json-surface, #FAFAFA);
}
.header-left { display: flex; align-items: center; gap: 10px; }
.header-label {
  font-size: 12px; font-weight: 600;
  color: var(--json-text, #1A1A1A); text-transform: uppercase; letter-spacing: 0.4px;
}
.header-meta { font-size: 11px; color: var(--json-text-secondary, #6B6B6B); }
.header-right { display: flex; gap: 4px; }

.icon-btn {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border: none; border-radius: 6px;
  background: transparent; color: var(--json-text-secondary, #6B6B6B);
  cursor: pointer; transition: all 0.15s;
}
.icon-btn:hover { background: var(--json-primary-light, rgba(232,76,111,0.08)); color: var(--json-primary, #E84C6F); }
.icon-btn svg { width: 16px; height: 16px; }

/* Editor body */
.editor-body {
  display: flex;
  flex: 1; min-height: 0;
  overflow: hidden;
  position: relative;
}
/* Gutter */
.gutter {
  width: 44px; flex-shrink: 0;
  background: var(--json-gutter-bg, #F5F5F5);
  overflow: hidden;
  padding: 12px 0;
  text-align: right;
  border-right: 1px solid var(--json-border, rgba(232,76,111,0.08));
}
.line-num {
  height: 22px; line-height: 22px;
  padding-right: 10px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
  color: var(--json-line-num, #B8B8B8);
  transition: color 0.15s, background 0.15s;
}
.line-num.current { color: var(--json-primary, #E84C6F); font-weight: 600; }
.line-num.error {
  color: var(--json-error-wavy, #E84C6F);
  font-weight: 700;
  background: var(--json-error-line, rgba(232,76,111,0.06));
  position: relative;
}
.line-num.error::after {
  content: '✗';
  position: absolute; right: 2px; top: 0;
  font-size: 10px;
  color: var(--json-error-wavy, #E84C6F);
}

/* Textarea */
.editor-textarea {
  flex: 1; min-height: 0;
  padding: 12px 14px;
  border: none; outline: none; resize: none;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 13px; line-height: 22px;
  color: var(--json-text, #1A1A1A);
  background: transparent;
  tab-size: 2;
  overflow-y: auto;
}
.editor-textarea::placeholder { color: var(--json-text-secondary, #6B6B6B); }
.editor-textarea::-webkit-scrollbar { width: 5px; }
.editor-textarea::-webkit-scrollbar-thumb { background: var(--json-border); border-radius: 3px; }
</style>
