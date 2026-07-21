<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { NSelect, NSwitch, NButton, NInput, useMessage } from 'naive-ui'
import { convert, FORMAT_META, lossyHint, type ConvertResult, type DataFormat } from '../utils/converter'

const msg = useMessage()
const FORMATS = Object.keys(FORMAT_META) as DataFormat[]
const fmtOptions = FORMATS.map(f => ({ label: FORMAT_META[f].displayName, value: f }))

const fromFmt = ref<DataFormat>('json')
const toFmt = ref<DataFormat>('yaml')
const input = ref('')
const output = shallowRef('')
const parseErr = ref<ConvertResult | null>(null)
const stringifyErr = ref<ConvertResult | null>(null)
const liveMode = ref(true)
const autoFlatten = ref(false)
const elapsed = ref(0)
const busy = ref(false)

const lossy = computed(() => lossyHint(fromFmt.value, toFmt.value))
const inputCount = computed(() => input.value.length)

let timer: ReturnType<typeof setTimeout> | null = null

function runConvert() {
  if (!input.value.trim()) { output.value = ''; parseErr.value = null; stringifyErr.value = null; return }
  busy.value = true
  const start = performance.now()
  const res = convert(input.value, fromFmt.value, toFmt.value, { autoFlatten: autoFlatten.value })
  elapsed.value = Math.round((performance.now() - start) * 1000) / 1000
  busy.value = false
  if (res.ok) {
    output.value = res.text; parseErr.value = null; stringifyErr.value = null
  } else if (res.stage === 'parse') {
    parseErr.value = res; stringifyErr.value = null; output.value = ''
  } else {
    stringifyErr.value = res; parseErr.value = null; output.value = ''
  }
}

function scheduleRun() {
  if (!liveMode.value) return
  if (timer) clearTimeout(timer)
  timer = setTimeout(runConvert, 300)
}

watch([input, fromFmt, toFmt, autoFlatten], scheduleRun, { flush: 'post' })

function manualConvert() { runConvert() }
function swap() {
  const tmpF = fromFmt.value; fromFmt.value = toFmt.value; toFmt.value = tmpF
  if (output.value) { input.value = output.value; output.value = '' }
  runConvert()
}
function clearAll() { input.value = ''; output.value = ''; parseErr.value = null; stringifyErr.value = null }
function formatInput() {
  const res = convert(input.value, fromFmt.value, fromFmt.value, { autoFlatten: autoFlatten.value })
  if (res.ok) { input.value = res.text; parseErr.value = null }
  else { parseErr.value = res; msg.warning('格式化失败：' + res.message) }
}
function fillSample() { input.value = FORMAT_META[fromFmt.value].sample; runConvert() }
function copyOut() {
  if (!output.value) { msg.info('暂无输出可复制'); return }
  navigator.clipboard.writeText(output.value).then(() => msg.success('已复制')).catch(() => msg.error('复制失败'))
}
function errText(e: ConvertResult): string {
  if (!e.ok) {
    const pos = e.line != null ? `（行 ${e.line}${e.col != null ? `·列 ${e.col}` : ''}）` : ''
    return `${e.fmt.toUpperCase()} ${e.stage} 错误${pos}：${e.message}`
  }
  return ''
}
</script>

<template>
  <div class="cv-panel">
    <div class="cv-toolbar">
      <div class="cv-toolbar-left">
        <span class="cv-title">格式互转</span>
        <NSelect v-model:value="fromFmt" :options="fmtOptions" size="small" style="width: 100px" />
        <button class="cv-arrow" @click="swap" title="交换源/目标">⇄</button>
        <NSelect v-model:value="toFmt" :options="fmtOptions" size="small" style="width: 100px" />
      </div>
      <div class="cv-toolbar-right">
        <label class="cv-flip"><NSwitch v-model:value="autoFlatten" size="small" /><span class="cv-flip-l">自动扁平化（CSV）</span></label>
        <label class="cv-flip"><NSwitch v-model:value="liveMode" size="small" /><span class="cv-flip-l">实时转换</span></label>
        <NButton size="small" tertiary @click="formatInput">格式化输入</NButton>
        <NButton size="small" tertiary @click="fillSample">示例</NButton>
        <NButton size="small" tertiary @click="clearAll">清空</NButton>
        <NButton size="small" type="primary" :disabled="busy" @click="manualConvert">转换</NButton>
      </div>
    </div>

    <p v-if="lossy" class="cv-lossy">⚠ {{ lossy }}</p>

    <div class="cv-pair">
      <div class="cv-col">
        <div class="cv-col-h">
          <span>输入 · {{ FORMAT_META[fromFmt].displayName }}</span>
          <span class="cv-meta">{{ inputCount }} 字符</span>
        </div>
        <NInput v-model:value="input" type="textarea" :rows="20" class="cv-ta" placeholder="粘贴或在此输入…" />
        <div v-if="parseErr" class="cv-err">{{ errText(parseErr!) }}</div>
      </div>
      <div class="cv-col">
        <div class="cv-col-h">
          <span>输出 · {{ FORMAT_META[toFmt].displayName }}</span>
          <span class="cv-meta">
            <NButton v-if="output" size="tiny" tertiary @click="copyOut">复制</NButton>
            {{ elapsed }} ms
          </span>
        </div>
        <NInput :value="output" type="textarea" :rows="20" readonly class="cv-ta" placeholder="转换结果…" />
        <div v-if="stringifyErr" class="cv-err">{{ errText(stringifyErr!) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cv-panel { padding: 12px 20px; height: 100%; display: flex; flex-direction: column; gap: 10px; overflow: hidden; }
.cv-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }
.cv-toolbar-left, .cv-toolbar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.cv-title { font-size: 16px; font-weight: 700; color: var(--color-text-primary); }
.cv-arrow { width: 28px; height: 26px; display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid var(--color-border); border-radius: 6px; background: transparent; color: var(--color-text-secondary);
  cursor: pointer; font-size: 16px; transition: all .15s; }
.cv-arrow:hover { color: var(--color-accent); border-color: var(--color-accent); }
.cv-flip { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
.cv-flip-l { font-size: 12px; color: var(--color-text-secondary); user-select: none; }
.cv-lossy { font-size: 12px; color: var(--warning); margin: 0; padding: 6px 10px;
  background: rgba(232,168,23,0.08); border-radius: 8px; flex-shrink: 0; }
.cv-pair { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 720px) { .cv-pair { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; } }
.cv-col { display: flex; flex-direction: column; min-height: 0; gap: 6px; }
.cv-col-h { display: flex; align-items: center; justify-content: space-between; font-size: 12px;
  color: var(--color-text-secondary); padding: 0 2px; }
.cv-meta { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; color: var(--color-text-tertiary); }
.cv-ta :deep(textarea) { font-family: var(--font-mono); font-size: 13px; line-height: 1.6; }
.cv-err { font-size: 12px; color: var(--danger); padding: 6px 10px;
  background: rgba(232,76,111,0.08); border-radius: 8px; }
</style>
