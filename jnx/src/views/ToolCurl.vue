<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useHttpStore } from '../stores/http'
import { useHttpSend } from '../composables/useHttpSend'
import { useLegacyShortcut } from '../composables/useKeyboardShortcut'
import { parseCurl } from '../utils/parseCurl'
import Kbd from '../components/Kbd.vue'
import HeaderEditor from '../components/HeaderEditor.vue'

const store = useHttpStore()
const { send, cancel, loading } = useHttpSend()
const msg = useMessage()
const urlInput = ref<HTMLInputElement | null>(null)
const curlDialogOpen = ref(false)
const curlInput = ref('')
const curlError = ref('')
const responseTab = ref<'pretty' | 'raw' | 'headers'>('pretty')
const dragOver = ref(false)

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

const methodColors: Record<string, string> = {
  GET: 'var(--info, #3B82F6)', POST: 'var(--success, #2EAB67)',
  PUT: 'var(--warning, #E8A817)', PATCH: 'var(--info, #3B82F6)',
  DELETE: 'var(--danger, #E84C6F)', HEAD: 'var(--text-3, #8A7A80)',
  OPTIONS: 'var(--text-3, #8A7A80)',
}

const statusColor = computed(() => {
  if (!store.response) return ''
  const s = store.response.status
  if (s >= 200 && s < 300) return 'var(--success, #2EAB67)'
  if (s >= 300 && s < 400) return 'var(--info, #3B82F6)'
  if (s >= 400 && s < 500) return 'var(--warning, #E8A817)'
  return 'var(--danger, #E84C6F)'
})

const responseSize = computed(() => {
  if (!store.response) return ''
  const b = store.response.sizeBytes
  return b >= 1024 ? (b / 1024).toFixed(1) + ' KB' : b + ' B'
})

const prettyBody = computed(() => {
  if (!store.response) return ''
  try { return JSON.stringify(JSON.parse(store.response.body), null, 2) }
  catch { return store.response.body }
})

const resHeaders = computed(() => {
  if (!store.response) return []
  return Object.entries(store.response.headers).map(([k, v]) => ({ k, v }))
})

async function doSend() {
  if (!store.request.url.trim()) { msg.warning('请输入 URL'); return }
  await send(store.request).then(r => { store.response = r })
}

function handlePaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData('text') || ''
  if (text.trim().toLowerCase().startsWith('curl ')) {
    e.preventDefault()
    if (confirm('检测到 cURL 命令，是否导入？')) {
      const parsed = parseCurl(text)
      if (parsed.error) { msg.error(parsed.error); return }
      store.setFromParsed(parsed)
      msg.success(`已导入 ${parsed.method} ${parsed.url.slice(0, 40)}…`)
    }
  }
}

function openCurlDialog() {
  curlInput.value = ''
  curlError.value = ''
  curlDialogOpen.value = true
}

function doCurlParse() {
  curlError.value = ''
  if (!curlInput.value.trim()) { curlError.value = '请输入 cURL 命令'; return }
  const parsed = parseCurl(curlInput.value)
  if (parsed.error) { curlError.value = parsed.error; return }
  store.setFromParsed(parsed)
  curlDialogOpen.value = false
  msg.success(`已导入 ${parsed.method} ${parsed.url.slice(0, 50)}`)
}

function onDragOver(e: DragEvent) {
  e.preventDefault(); dragOver.value = true
}
function onDragLeave() { dragOver.value = false }
function onDrop(e: DragEvent) {
  e.preventDefault(); dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file || !file.name.match(/\.(txt|sh|curl)$/i)) { msg.warning('请拖入 .txt / .sh / .curl 文件'); return }
  const reader = new FileReader()
  reader.onload = () => {
    const text = reader.result as string
    const parsed = parseCurl(text)
    if (parsed.error) { msg.error(parsed.error); return }
    store.setFromParsed(parsed)
    msg.success(`已从文件导入 ${parsed.method} ${parsed.url.slice(0, 40)}…`)
  }
  reader.readAsText(file)
}

function focusUrl() { urlInput.value?.focus() }
function copyResponse() {
  if (store.response) navigator.clipboard.writeText(store.response.body).catch(() => {})
}

// ─── 快捷键 ───
useLegacyShortcut({ key: 'Enter', mod: true, skipWhenEditing: false }, () => doSend())
useLegacyShortcut({ key: 'i', mod: true, shift: true, skipWhenEditing: true }, () => openCurlDialog())
useLegacyShortcut({ key: 'l', mod: true, skipWhenEditing: false }, () => focusUrl())

function statusTextClass(c: number): string {
  if (c >= 200 && c < 300) return 'suc'
  if (c >= 300 && c < 400) return 'inf'
  if (c >= 400 && c < 500) return 'war'
  return 'err'
}
</script>

<template>
  <div class="http-tool" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop" :class="{ 'drag-over': dragOver }">
    <!-- ─── Toolbar ─── -->
    <div class="toolbar">
      <select v-model="store.request.method" class="method-sel" aria-label="HTTP 方法">
        <option v-for="m in METHODS" :key="m" :value="m">{{ m }}</option>
      </select>
      <div class="url-wrap">
        <span class="method-dot" :style="{ background: methodColors[store.request.method] }"></span>
        <input
          ref="urlInput"
          v-model="store.request.url"
          class="url-input"
          placeholder="https://api.example.com/endpoint"
          @paste="handlePaste"
          aria-label="URL"
        />
      </div>
      <button class="btn-primary" :disabled="!store.request.url.trim() || loading" @click="doSend">
        <template v-if="loading">
          <span class="spinner"></span> 发送中…
        </template>
        <template v-else>发送 <Kbd :keys="['⌘↵']" /></template>
      </button>
      <button v-if="loading" class="btn-ghost" @click="cancel">取消</button>
      <button class="btn-ghost" @click="openCurlDialog" title="从 cURL 命令导入">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 10l-3 3 3 3M11 10l3 3-3 3"/><path d="M2 13h12M8 5v8"/></svg>
        cURL
      </button>
    </div>

    <!-- ─── Grid ─── -->
    <div class="grid">
      <!-- Left: Request -->
      <div class="req-col">
        <div class="card">
          <div class="card-header">
            <span class="card-label">请求头</span>
          </div>
          <div class="card-body no-pad">
            <HeaderEditor v-model:headers="store.request.headers" />
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <span class="card-label">请求体</span>
            <span v-if="['GET','HEAD'].includes(store.request.method)" class="card-hint">GET/HEAD 无请求体</span>
            <template v-else>
              <button class="card-btn" @click="store.request.body = JSON.stringify(JSON.parse(store.request.body || '{}'), null, 2)" :disabled="!store.request.body">格式化 JSON</button>
              <button class="card-btn" @click="store.request.body = ''">清空</button>
              <span class="card-meta">{{ store.request.body.length }} 字符</span>
            </template>
          </div>
          <div class="card-body">
            <textarea v-if="!['GET','HEAD'].includes(store.request.method)"
              v-model="store.request.body"
              class="body-ta"
              placeholder='{"key": "value"}'
              :disabled="['GET','HEAD'].includes(store.request.method)"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Right: Response -->
      <div class="res-col">
        <div class="card">
          <div class="card-header">
            <span class="card-label">响应</span>
          </div>

          <!-- Empty state -->
          <div v-if="!store.response" class="card-body empty">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--text-3)" stroke-width="1" opacity="0.35">
              <path d="M10 18h28M10 26h20M10 34h14"/><rect x="6" y="6" width="36" height="36" rx="4"/>
            </svg>
            <div class="empty-title">等待请求</div>
            <div class="empty-desc">填写 URL 后点击「发送」</div>
          </div>

          <template v-else>
            <!-- Status bar -->
            <div class="status-bar">
              <div class="status-left">
                <span class="status-badge" :class="statusTextClass(store.response.status)" :style="{ background: statusColor + '20', color: statusColor }">
                  {{ store.response.status }} {{ store.response.statusText }}
                </span>
                <span v-if="store.response.timeMs" class="stat">{{ store.response.timeMs }} ms</span>
                <span v-if="store.response.sizeBytes" class="stat">{{ responseSize }}</span>
              </div>
              <div class="status-right">
                <button class="card-btn" @click="copyResponse()" title="复制响应体">复制</button>
                <span v-if="store.response.error" class="error-tag">错误</span>
              </div>
            </div>

            <!-- Error banner -->
            <div v-if="store.response.error" class="err-banner">{{ store.response.error }}</div>

            <!-- Tabs -->
            <div class="tab-bar">
              <button class="tab" :class="{ active: responseTab === 'pretty' }" @click="responseTab = 'pretty'">Pretty</button>
              <button class="tab" :class="{ active: responseTab === 'raw' }" @click="responseTab = 'raw'">Raw</button>
              <button class="tab" :class="{ active: responseTab === 'headers' }" @click="responseTab = 'headers'">Headers</button>
            </div>

            <!-- Tab content -->
            <div class="tab-content">
              <pre v-if="responseTab === 'pretty'" class="res-pre">{{ prettyBody }}</pre>
              <pre v-else-if="responseTab === 'raw'" class="res-pre">{{ store.response.body }}</pre>
              <div v-else class="res-headers">
                <div v-for="h in resHeaders" :key="h.k" class="rh-row">
                  <span class="rh-key">{{ h.k }}</span>
                  <span class="rh-val">{{ h.v }}</span>
                </div>
                <div v-if="!resHeaders.length" class="empty-desc" style="padding:20px">无响应头</div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- ─── cURL 导入弹窗 ─── -->
    <Teleport to="body">
      <div v-if="curlDialogOpen" class="modal-overlay" @click.self="curlDialogOpen = false">
        <div class="modal-panel">
          <h3 class="modal-title">导入 cURL 命令</h3>
          <textarea v-model="curlInput" class="modal-ta" placeholder="粘贴 cURL 命令…&#10;curl https://api.example.com -H '...' -d '...'" rows="8"></textarea>
          <div v-if="curlError" class="modal-err">{{ curlError }}</div>
          <div class="modal-actions">
            <button class="btn-primary" @click="doCurlParse">解析并填充</button>
            <button class="btn-ghost" @click="curlDialogOpen = false">取消</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.http-tool { height: 100%; display: flex; flex-direction: column; gap: 8px; padding: 12px 16px; }
.http-tool.drag-over { outline: 2px dashed var(--brand, #E85D75); outline-offset: -4px; border-radius: 8px; background: var(--hover, rgba(232,76,111,0.03)); }

/* ─── Toolbar ─── */
.toolbar { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.method-sel {
  height: 36px; padding: 0 10px; border: 1px solid var(--border); border-radius: 8px;
  background: var(--bg-card, #FFF); color: var(--text-1, #2D2528); font-size: 13px;
  font-weight: 600; cursor: pointer; outline: none; font-family: inherit;
}
.url-wrap {
  flex: 1; display: flex; align-items: center; gap: 8px;
  height: 36px; padding: 0 12px;
  border: 1px solid var(--border); border-radius: 8px;
  background: var(--bg-elev, var(--input-bg, rgba(0,0,0,0.02)));
  transition: border-color 0.15s;
}
.url-wrap:focus-within { border-color: var(--brand, #E85D75); }
.method-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.url-input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: 13px; color: var(--text-1, #2D2528); font-family: inherit;
}
.url-input::placeholder { color: var(--text-3, #8A7A80); }

.btn-primary {
  display: inline-flex; align-items: center; gap: 4px; height: 36px; padding: 0 16px;
  border: none; border-radius: 8px;
  background: linear-gradient(135deg, var(--brand, #E85D75), var(--brand-hover, #FF8C9E));
  color: #FFF; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
  white-space: nowrap; transition: box-shadow 0.15s, transform 0.1s;
}
.btn-primary:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }
.spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #FFF; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.btn-ghost {
  display: inline-flex; align-items: center; gap: 4px; height: 36px; padding: 0 12px;
  border: 1px solid var(--border); border-radius: 8px;
  background: var(--bg-card, #FFF); color: var(--text-2, #6A5A60);
  font-size: 13px; cursor: pointer; font-family: inherit; transition: all 0.15s;
}
.btn-ghost:hover { border-color: var(--brand, #E85D75); color: var(--brand, #E85D75); }

/* ─── Grid ─── */
.grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; min-height: 0; }
.req-col, .res-col { display: flex; flex-direction: column; gap: 10px; min-height: 0; }

.card {
  display: flex; flex-direction: column;
  border: 1px solid var(--border); border-radius: 10px;
  background: var(--bg-card, #FFF);
  overflow: hidden;
}
.card-header {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 14px; flex-shrink: 0;
  border-bottom: 1px solid var(--border);
}
.card-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; color: var(--text-2, #6A5A60); }
.card-hint { font-size: 12px; color: var(--text-3, #8A7A80); margin-left: auto; }
.card-btn {
  font-size: 11px; padding: 2px 8px; border: 1px solid var(--border); border-radius: 5px;
  background: transparent; color: var(--text-2, #6A5A60); cursor: pointer; font-family: inherit;
  transition: all 0.15s;
}
.card-btn:hover { border-color: var(--brand, #E85D75); color: var(--brand, #E85D75); }
.card-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.card-meta { font-size: 11px; color: var(--text-3, #8A7A80); font-variant-numeric: tabular-nums; }
.card-body { flex: 1; padding: 8px 14px; min-height: 0; overflow-y: auto; }
.card-body.no-pad { padding: 0; }

/* Body textarea */
.body-ta {
  width: 100%; height: 100%; min-height: 60px;
  border: none; outline: none; resize: vertical;
  background: transparent; color: var(--text-1, #2D2528);
  font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 13px; line-height: 1.6;
}
.body-ta::placeholder { color: var(--text-3, #8A7A80); }
.body-ta:disabled { opacity: 0.35; }

/* Empty state */
.empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 40px 20px; }
.empty-title { font-size: 14px; font-weight: 600; color: var(--text-2, #6A5A60); }
.empty-desc { font-size: 13px; color: var(--text-3, #8A7A80); }

/* Response status bar */
.status-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 14px; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.status-left { display: flex; align-items: center; gap: 12px; }
.status-right { display: flex; align-items: center; gap: 6px; }
.status-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 10px; border-radius: 20px;
  font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums;
}
.status-badge.suc { background: rgba(46,171,103,0.12); color: #2EAB67; }
.status-badge.inf { background: rgba(59,130,246,0.12); color: #3B82F6; }
.status-badge.war { background: rgba(232,168,23,0.12); color: #E8A817; }
.status-badge.err { background: rgba(232,76,111,0.12); color: #E84C6F; }
.stat { font-size: 11px; color: var(--text-3, #8A7A80); font-variant-numeric: tabular-nums; }
.error-tag { font-size: 10px; padding: 1px 6px; border-radius: 4px; background: rgba(232,76,111,0.1); color: #E84C6F; }
.err-banner { padding: 8px 14px; font-size: 12px; color: #E84C6F; background: rgba(232,76,111,0.06); border-bottom: 1px solid var(--border); }

/* Tabs */
.tab-bar { display: flex; border-bottom: 1px solid var(--border); flex-shrink: 0; padding: 0 14px; }
.tab {
  padding: 8px 14px; font-size: 12px; font-weight: 500;
  border: none; background: transparent; color: var(--text-2, #6A5A60);
  cursor: pointer; position: relative; font-family: inherit;
  transition: color 0.15s;
}
.tab:hover { color: var(--text-1, #2D2528); }
.tab.active { color: var(--brand, #E85D75); }
.tab.active::after {
  content: ''; position: absolute; bottom: 0; left: 14px; right: 14px;
  height: 2px; background: var(--brand, #E85D75); border-radius: 2px;
}
.tab-content { flex: 1; overflow-y: auto; }
.res-pre {
  margin: 0; padding: 12px 14px; white-space: pre-wrap; word-break: break-all;
  font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px; line-height: 1.6;
  color: var(--text-1, #2D2528);
}
.res-headers { padding: 8px 14px; }
.rh-row { display: flex; gap: 12px; padding: 4px 0; font-size: 12px; font-family: 'JetBrains Mono', ui-monospace, monospace; }
.rh-key { flex-shrink: 0; font-weight: 600; color: var(--brand, #E85D75); }
.rh-val { color: var(--text-1, #2D2528); word-break: break-all; }

/* ─── cURL Import Modal ─── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 9998;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.35); backdrop-filter: blur(4px);
}
.modal-panel {
  width: 540px; max-width: 90vw; padding: 24px;
  background: var(--bg-card, #FFF); border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
.modal-title { margin: 0 0 14px; font-size: 16px; font-weight: 700; color: var(--text-1, #2D2528); }
.modal-ta {
  width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px;
  background: var(--bg-elev, var(--input-bg, rgba(0,0,0,0.02)));
  color: var(--text-1, #2D2528); font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 13px; line-height: 1.6; resize: vertical; outline: none;
}
.modal-ta:focus { border-color: var(--brand, #E85D75); }
.modal-err { font-size: 13px; color: var(--danger, #E84C6F); margin-top: 8px; }
.modal-actions { display: flex; gap: 8px; margin-top: 14px; justify-content: flex-end; }
</style>
