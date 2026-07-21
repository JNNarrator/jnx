<script setup lang="ts">
/* ─── 语法高亮编辑器 ───
 * 复用现有 JsonEditor 的 textarea+gutter 模式，追加同步滚动的 <pre><code> 高亮覆盖层。
 * 轻量 tokenizer（JSON / Java），零额外依赖，与现有「无高亮库」技术栈一致。
 * Java 高亮通过另一套 tokenizer rules 补齐。
 */

import { ref, computed, nextTick } from 'vue'

const props = defineProps<{
  modelValue: string
  language: 'json' | 'java'
  placeholder?: string
  readonly?: boolean
  errorLine?: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const highlightRef = ref<HTMLDivElement | null>(null)
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
  if (highlightRef.value && textareaRef.value) {
    highlightRef.value.scrollTop = textareaRef.value.scrollTop
    highlightRef.value.scrollLeft = textareaRef.value.scrollLeft
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

/* ─── 语法高亮 tokenizer ─── */
function highlight(text: string): string {
  if (!text) return ''
  // Escape HTML first
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  if (props.language === 'json') {
    return highlightJson(escaped)
  }
  return highlightJava(escaped)
}

function highlightJson(escaped: string): string {
  // Strings (key or value)
  escaped = escaped.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, '<span class="hl-string">"$1"</span>')
  // Numbers
  escaped = escaped.replace(/\b(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g, '<span class="hl-number">$1</span>')
  // Booleans and null
  escaped = escaped.replace(/\b(true|false|null)\b/g, '<span class="hl-keyword">$1</span>')
  // Keys (after ":" or at start of line)
  escaped = escaped.replace(/(\{|\[|,)\s*$/gm, '$1')
  return escaped
}

function highlightJava(escaped: string): string {
  // Keywords
  const keywords = /\b(abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while|true|false|null|var)\b/g
  escaped = escaped.replace(keywords, '<span class="hl-keyword">$1</span>')

  // Annotations
  escaped = escaped.replace(/@[a-zA-Z_$][a-zA-Z0-9_$.]*/g, '<span class="hl-annotation">$&</span>')

  // Strings
  escaped = escaped.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, '<span class="hl-string">"$1"</span>')
  // Char literals
  escaped = escaped.replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, '<span class="hl-string">$&</span>')

  // Numbers
  escaped = escaped.replace(/\b(-?\d+(?:\.\d+)?[lLfFdD]?)\b/g, '<span class="hl-number">$1</span>')

  // Types (PascalCase)
  escaped = escaped.replace(/\b([A-Z][a-zA-Z0-9_<>]+)\b/g, (m) => {
    if (m === 'String' || m === 'Integer' || m === 'Boolean' || m === 'Long' || m === 'Double' ||
        m === 'Float' || m === 'Byte' || m === 'Short' || m === 'Character' || m === 'Void' ||
        m === 'Object' || m === 'List' || m === 'Map' || m === 'Set' || m === 'Collection' ||
        m === 'BigDecimal' || m === 'BigInteger' || m === 'Date') {
      return `<span class="hl-type">${m}</span>`
    }
    return m
  })

  // Comments (line)
  escaped = escaped.replace(/(\/\/.*)/g, '<span class="hl-comment">$1</span>')
  // Comments (block)
  escaped = escaped.replace(/\/\*[\s\S]*?\*\//g, '<span class="hl-comment">$&</span>')

  return escaped
}

const highlighted = computed(() => highlight(props.modelValue))

// DefineExpose
defineExpose({ charCount, lineCount, cursorLine, textareaRef })

function handlePaste() {
  navigator.clipboard.readText().then(t => emit('update:modelValue', t))
}
</script>

<template>
  <div class="editor-wrap" :class="{ focused, readonly, error: errorLine !== null }">
    <!-- Header bar -->
    <div class="editor-header">
      <div class="header-left">
        <span class="header-label">{{ language === 'json' ? 'JSON' : 'Java' }}</span>
        <span v-if="!readonly" class="header-meta">{{ charCount }} 字符 · {{ lineCount }} 行</span>
        <span v-else class="header-meta">输出</span>
      </div>
      <div class="header-right">
        <button class="icon-btn" v-if="!readonly" title="粘贴" @click="handlePaste">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M8 2H5a1 1 0 00-1 1v14a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1h-3"/>
            <rect x="8" y="2" width="4" height="3" rx="1"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Editor body -->
    <div class="editor-body">
      <!-- Gutter -->
      <div class="gutter" ref="gutterRef">
        <div v-for="(n, i) in lines" :key="i" class="line-num"
          :class="{ current: n === cursorLine, error: n === errorLine }">
          <template v-if="errorLine && n === errorLine">✗ {{ n }}</template>
          <template v-else>{{ n }}</template>
        </div>
      </div>
      <!-- Highlight overlay -->
      <div class="highlight-layer" ref="highlightRef" :class="{ 'is-readonly': readonly }">
        <pre class="highlight-pre"><code class="highlight-code" v-html="highlighted"></code></pre>
      </div>
      <!-- Textarea -->
      <textarea v-if="!readonly" ref="textareaRef" :value="modelValue"
        class="editor-textarea" spellcheck="false"
        @input="onInput" @keydown="onKeydown"
        @scroll="syncScroll"
        @focus="focused = true" @blur="focused = false"
        @click="onCursorMove" @keyup="onCursorMove"
        :placeholder="placeholder || '粘贴或输入…'" />
    </div>
  </div>
</template>

<style scoped>
.editor-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  transition: border-color 0.2s, box-shadow 0.2s;
  overflow: hidden;
}
.editor-wrap.focused { border-color: var(--color-accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 15%, transparent); }
.editor-wrap.error { border-color: var(--danger); }

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  background: var(--color-surface-2);
}
.header-left { display: flex; align-items: center; gap: 10px; }
.header-label { font-size: 12px; font-weight: 600; color: var(--color-text); text-transform: uppercase; letter-spacing: 0.4px; }
.header-meta { font-size: 11px; color: var(--color-text-secondary); }
.header-right { display: flex; gap: 4px; }

.icon-btn {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border: none; border-radius: 6px;
  background: transparent; color: var(--color-text-secondary);
  cursor: pointer; transition: all 0.15s;
}
.icon-btn:hover { background: color-mix(in srgb, var(--color-accent) 10%, transparent); color: var(--color-accent); }
.icon-btn svg { width: 16px; height: 16px; }

.editor-body {
  display: flex;
  flex: 1; min-height: 0;
  overflow: hidden;
  position: relative;
}

.gutter {
  width: 44px; flex-shrink: 0;
  background: var(--color-surface-2);
  overflow: hidden;
  padding: 8px 0;
  text-align: right;
  border-right: 1px solid var(--color-border);
  z-index: 2;
}
.line-num {
  height: 22px; line-height: 22px;
  padding-right: 8px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
}
.line-num.current { color: var(--color-accent); font-weight: 600; }
.line-num.error { color: var(--danger); font-weight: 700; background: color-mix(in srgb, var(--danger) 8%, transparent); }

.highlight-layer {
  position: absolute;
  top: 0; left: 44px; right: 0; bottom: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
}
.highlight-layer.is-readonly {
  position: relative;
  left: 0;
  pointer-events: auto;
}

.highlight-pre {
  font-family: var(--font-mono);
  font-size: 13px; line-height: 22px;
  padding: 8px 14px;
  margin: 0;
  tab-size: 2;
  white-space: pre-wrap;
  word-wrap: break-word;
  min-height: 100%;
  color: transparent;
}

.highlight-code { color: var(--color-text); }

/* Syntax highlighting tokens */
.highlight-code :deep(.hl-string) { color: var(--color-accent); }
.highlight-code :deep(.hl-number) { color: var(--color-success); }
.highlight-code :deep(.hl-keyword) { color: var(--color-info); font-weight: 500; }
.highlight-code :deep(.hl-annotation) { color: var(--color-syn-annotation); }
.highlight-code :deep(.hl-type) { color: var(--color-syn-type); }
.highlight-code :deep(.hl-comment) { color: var(--color-text-tertiary); font-style: italic; }

.editor-textarea {
  position: absolute;
  top: 0; left: 44px; right: 0; bottom: 0;
  padding: 8px 14px;
  border: none; outline: none; resize: none;
  font-family: var(--font-mono);
  font-size: 13px; line-height: 22px;
  color: transparent;
  caret-color: var(--color-text);
  background: transparent;
  tab-size: 2;
  overflow-y: auto;
  z-index: 3;
}
.editor-textarea::selection { background: color-mix(in srgb, var(--color-accent) 30%, transparent); }
.editor-textarea::placeholder { color: var(--color-text-tertiary); }
.editor-textarea::-webkit-scrollbar { width: 5px; }
.editor-textarea::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 3px; }
</style>
