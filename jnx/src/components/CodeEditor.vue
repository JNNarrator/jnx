<script setup lang="ts">
/* ─── CodeEditor 共享语法高亮编辑器 ───
 * 全项目唯一高亮栈。textarea + gutter + <pre><code> 高亮覆盖层，同步滚动。
 * 零外部高亮依赖，内建 tokenizer 覆盖：
 *   json / java / yaml / toml / xml / csv / properties / plaintext
 * 样式全部派生自 var(--color-xxx)，light/dark 双清晰。
 */

import { ref, computed, nextTick, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  language: 'json' | 'java' | 'yaml' | 'toml' | 'xml' | 'csv' | 'properties' | 'plaintext'
  placeholder?: string
  readonly?: boolean
  errorLine?: number | null
  lineNumbers?: boolean
  minHeight?: string
  wordWrap?: boolean
  fontSize?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

const _lineNumbers = computed(() => props.lineNumbers ?? true)
const _wordWrap = computed(() => props.wordWrap ?? true)
const _fontSize = computed(() => props.fontSize ?? 13)

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
    if (!_wordWrap.value) {
      highlightRef.value.scrollLeft = textareaRef.value.scrollLeft
    }
  }
}

function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

function onKeydown(e: KeyboardEvent) {
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

/* ─── 语法高亮：HTML 转义后 tokenize ─── */
function highlight(text: string): string {
  if (!text) return ''
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  if (props.language === 'json') return highlightJson(esc)
  if (props.language === 'java') return highlightJava(esc)
  if (props.language === 'yaml') return highlightYaml(esc)
  if (props.language === 'toml') return highlightToml(esc)
  if (props.language === 'xml') return highlightXml(esc)
  if (props.language === 'csv') return highlightCsv(esc)
  if (props.language === 'properties') return highlightProperties(esc)
  return esc
}

function highlightJson(s: string): string {
  s = s.replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class=&quot;hl-attr&quot;>$1</span>:')
  s = s.replace(/("(?:[^"\\]|\\.)*")/g, '<span class=&quot;hl-string&quot;>$1</span>')
  s = s.replace(/\b(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g, '<span class=&quot;hl-number&quot;>$1</span>')
  s = s.replace(/\b(true|false|null)\b/g, '<span class=&quot;hl-keyword&quot;>$1</span>')
  return s
}

function highlightJava(s: string): string {
  const kw = /\b(abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while|true|false|null|var)\b/g
  s = s.replace(kw, '<span class=&quot;hl-keyword&quot;>$1</span>')
  s = s.replace(/@[a-zA-Z_$][a-zA-Z0-9_$.]*/g, '<span class=&quot;hl-annotation&quot;>$&</span>')
  s = s.replace(/("(?:[^"\\]|\\.)*")/g, '<span class=&quot;hl-string&quot;>$1</span>')
  s = s.replace(/'(?:[^'\\]|\\.)*'/g, '<span class=&quot;hl-string&quot;>$&</span>')
  s = s.replace(/\b(-?\d+(?:\.\d+)?[lLfFdD]?)\b/g, '<span class=&quot;hl-number&quot;>$1</span>')
  s = s.replace(/\b([A-Z]\w+)\b/g, (m: string) => {
    if (/^(String|Integer|Boolean|Long|Double|Float|Byte|Short|Character|Void|Object|List|Map|Set|Collection|BigDecimal|BigInteger|Date|LocalDate|LocalDateTime|Instant|UUID)$/.test(m)) {
      return '<span class=&quot;hl-type&quot;>' + m + '</span>'
    }
    return m
  })
  s = s.replace(/(\/\/.*)/g, '<span class=&quot;hl-comment&quot;>$1</span>')
  s = s.replace(/\/\*[\s\S]*?\*\//g, '<span class=&quot;hl-comment&quot;>$&</span>')
  return s
}

function highlightYaml(s: string): string {
  s = s.replace(/(^|\s)(#[^\n]*)/gm, '$1<span class=&quot;hl-comment&quot;>$2</span>')
  s = s.replace(/([&*]\w[\w-]*)/g, '<span class=&quot;hl-annotation&quot;>$1</span>')
  s = s.replace(/(!!?\w+(?:[.\w]*)?)/g, '<span class=&quot;hl-keyword&quot;>$1</span>')
  s = s.replace(/("(?:[^"\\]|\\.)*")/g, '<span class=&quot;hl-string&quot;>$1</span>')
  s = s.replace(/('[^']*')/g, '<span class=&quot;hl-string&quot;>$1</span>')
  s = s.replace(/\b(true|false|yes|no|on|off|null|~)\b/g, '<span class=&quot;hl-keyword&quot;>$1</span>')
  s = s.replace(/\b(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g, '<span class=&quot;hl-number&quot;>$1</span>')
  s = s.replace(/^([ \t]*)([a-zA-Z_][\w .-]*?)(\s*:)/gm, '$1<span class=&quot;hl-attr&quot;>$2</span>$3')
  s = s.replace(/^([ \t]*)(- )(?!\s)/gm, '$1<span class=&quot;hl-punct&quot;>$2</span>')
  return s
}

function highlightToml(s: string): string {
  s = s.replace(/(#[^\n]*)/g, '<span class=&quot;hl-comment&quot;>$1</span>')
  s = s.replace(/(\[+[^\]]*\]+)/g, '<span class=&quot;hl-punct&quot;>$1</span>')
  s = s.replace(/("""[\s\S]*?""")/g, '<span class=&quot;hl-string&quot;>$1</span>')
  s = s.replace(/('''[\s\S]*?''')/g, '<span class=&quot;hl-string&quot;>$1</span>')
  s = s.replace(/("(?:[^"\\]|\\.)*")/g, '<span class=&quot;hl-string&quot;>$1</span>')
  s = s.replace(/('[^']*')/g, '<span class=&quot;hl-string&quot;>$1</span>')
  s = s.replace(/\b(true|false)\b/g, '<span class=&quot;hl-keyword&quot;>$1</span>')
  s = s.replace(/\b([+-]?\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?(?:[eE][+-]?\d+(?:_\d+)*)?)\b/g, '<span class=&quot;hl-number&quot;>$1</span>')
  s = s.replace(/\b(\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?)\b/g, '<span class=&quot;hl-string&quot;>$1</span>')
  s = s.replace(/([a-zA-Z_][\w.-]*)(\s*=)/g, '<span class=&quot;hl-attr&quot;>$1</span>$2')
  return s
}

function highlightXml(s: string): string {
  s = s.replace(/(&lt;\/?)([a-zA-Z_:][\w:.-]*)/g, '$1<span class=&quot;hl-tag&quot;>$2</span>')
  s = s.replace(/(\/?&gt;)/g, '<span class=&quot;hl-punct&quot;>$1</span>')
  s = s.replace(/\s([a-zA-Z_:][\w:.-]*)(=)/g, ' <span class=&quot;hl-attr&quot;>$1</span>$2')
  s = s.replace(/(="[^"]*")/g, '=<span class=&quot;hl-string&quot;>$1</span>')
  s = s.replace(/(='[^']*')/g, '=<span class=&quot;hl-string&quot;>$1</span>')
  s = s.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class=&quot;hl-comment&quot;>$1</span>')
  s = s.replace(/(&lt;!\[CDATA\[[\s\S]*?\]\]&gt;)/g, '<span class=&quot;hl-keyword&quot;>$1</span>')
  s = s.replace(/(&lt;\?[\s\S]*?\?&gt;)/g, '<span class=&quot;hl-keyword&quot;>$1</span>')
  return s
}

function highlightCsv(s: string): string {
  const lines = s.split('\n')
  if (lines.length > 0) {
    lines[0] = lines[0].replace(/([^,\n"]+|"[^"]*")/g, '<span class=&quot;hl-attr&quot;>$1</span>')
    for (let i = 1; i < lines.length; i++) {
      lines[i] = lines[i]
        .replace(/("[^"]*")/g, '<span class=&quot;hl-string&quot;>$1</span>')
        .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class=&quot;hl-number&quot;>$1</span>')
        .replace(/\b(true|false|null)\b/g, '<span class=&quot;hl-keyword&quot;>$1</span>')
    }
  }
  return lines.join('\n')
}

function highlightProperties(s: string): string {
  s = s.replace(/^([ \t]*[#!][^\n]*)/gm, '<span class=&quot;hl-comment&quot;>$1</span>')
  s = s.replace(/^([a-zA-Z0-9_.\[\]\\][\w.\[\]\\]*)(\s*[=:])/gm, '<span class=&quot;hl-attr&quot;>$1</span>$2')
  s = s.replace(/([=:]\s*)([^\n#]+)/g, '$1<span class=&quot;hl-string&quot;>$2</span>')
  return s
}

const highlighted = computed(() => highlight(props.modelValue))

/* ─── DEV 断言：highlight 后可见纯文本 === modelValue ─── */
/*      拦截「hl-attr 泄漏成文本/空格丢失」类 bug 回归    */
if (import.meta.env.DEV) {
  watch(highlighted, () => {
    nextTick(() => {
      const overlay = highlightRef.value?.querySelector('.highlight-code')
      if (overlay && overlay.textContent !== props.modelValue) {
        console.error(
          '[CodeEditor] HIGHLIGHT MISMATCH!',
          'Expected:', JSON.stringify(props.modelValue),
          'Actual:', JSON.stringify(overlay.textContent),
          'FirstDiff@:', [...props.modelValue].findIndex((c, i) => c !== [...(overlay.textContent || '')][i])
        )
      }
    })
  })
}

defineExpose({ charCount, lineCount, cursorLine, textareaRef })

async function handlePaste() {
  try { emit('update:modelValue', await navigator.clipboard.readText()) }
  catch { /* no permission */ }
}

const langLabel = computed(() => {
  const m: Record<string, string> = {
    json: 'JSON', java: 'Java', yaml: 'YAML', toml: 'TOML',
    xml: 'XML', csv: 'CSV', properties: 'Properties', plaintext: 'Text',
  }
  return m[props.language] || 'Text'
})
</script>

<template>
  <div class="editor-wrap" :class="{ focused, readonly, error: errorLine !== null }">
    <div class="editor-header">
      <div class="header-left">
        <span class="header-label">{{ langLabel }}</span>
        <span v-if="!readonly" class="header-meta">{{ charCount }} 字符 · {{ lineCount }} 行</span>
        <span v-else class="header-meta">输出</span>
        <span v-if="language === 'csv'" class="csv-note">该格式暂无完整语法高亮</span>
      </div>
      <div class="header-right" v-if="!readonly">
        <button class="icon-btn" title="粘贴" @click="handlePaste">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2H5a1 1 0 00-1 1v14a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1h-3"/><rect x="8" y="2" width="4" height="3" rx="1"/></svg>
        </button>
      </div>
    </div>

    <div class="editor-body">
      <div class="gutter" ref="gutterRef" v-if="_lineNumbers">
        <div v-for="(n, i) in lines" :key="i" class="line-num"
          :class="{ current: n === cursorLine, error: n === errorLine }">
          <template v-if="errorLine && n === errorLine">✗ {{ n }}</template>
          <template v-else>{{ n }}</template>
        </div>
      </div>
      <div class="highlight-layer" ref="highlightRef" :class="{ 'is-readonly': readonly }">
        <pre class="highlight-pre"><code class="highlight-code" v-html="highlighted"></code></pre>
      </div>
      <textarea v-if="!readonly" ref="textareaRef" :value="modelValue"
        class="editor-textarea" spellcheck="false"
        @input="onInput" @keydown="onKeydown"
        @scroll="syncScroll"
        @focus="focused = true" @blur="focused = false"
        @click="onCursorMove" @keyup="onCursorMove"
        :style="{ fontSize: _fontSize + 'px' }"
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
.header-label { font-size: 12px; font-weight: 600; color: var(--color-text-primary); text-transform: uppercase; letter-spacing: 0.4px; }
.header-meta { font-size: 11px; color: var(--color-text-secondary); }
.csv-note { font-size: 10px; color: var(--color-text-tertiary); font-style: italic; }
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
  top: 0; left: 0; right: 0; bottom: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
}
.highlight-layer:not(.is-readonly) { left: 44px; }
.highlight-layer.is-readonly {
  position: relative;
  left: 0;
  pointer-events: auto;
  min-height: 80px;
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

.highlight-code { color: var(--color-text-primary); }

/* Syntax highlighting tokens — all derived from shared CSS vars */
.highlight-code :deep(.hl-string) { color: var(--color-accent); }
.highlight-code :deep(.hl-number) { color: var(--color-syn-constant); }
.highlight-code :deep(.hl-keyword) { color: var(--color-syn-keyword); }
.highlight-code :deep(.hl-annotation) { color: var(--color-syn-decorator); }
.highlight-code :deep(.hl-type) { color: var(--color-syn-type); }
.highlight-code :deep(.hl-comment) { color: var(--color-text-tertiary); font-style: italic; }
.highlight-code :deep(.hl-attr) { color: var(--color-syn-attr); }
.highlight-code :deep(.hl-tag) { color: var(--color-syn-tag); }
.highlight-code :deep(.hl-punct) { color: var(--color-syn-punct); }

.editor-textarea {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  padding: 8px 14px;
  border: none; outline: none; resize: none;
  font-family: var(--font-mono);
  font-size: 13px; line-height: 22px;
  color: transparent;
  white-space: pre-wrap;
  caret-color: var(--color-text-primary);
  background: transparent;
  tab-size: 2;
  overflow-y: auto;
  z-index: 3;
}
.editor-textarea:not(.is-readonly) { left: 44px; }
.editor-textarea::selection { background: color-mix(in srgb, var(--color-accent) 30%, transparent); }
.editor-textarea::placeholder { color: var(--color-text-tertiary); }
.editor-textarea::-webkit-scrollbar { width: 5px; }
.editor-textarea::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 3px; }
</style>
