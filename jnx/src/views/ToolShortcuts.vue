<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton, NTag, useMessage } from 'naive-ui'
import Kbd from '../components/Kbd.vue'
import { SHORTCUT_GROUPS, type ShortcutAction } from '../shortcuts'
import { useShortcutBindingsStore } from '../stores/shortcutBindings'
import type { Chord } from '../shortcuts/types'

const bindings = useShortcutBindingsStore()
const msg = useMessage()

const search = ref('')
const groups = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return SHORTCUT_GROUPS
  return SHORTCUT_GROUPS
    .map(g => ({ ...g, items: g.items.filter(i => i.label.toLowerCase().includes(q) || i.action.includes(q)) }))
    .filter(g => g.items.length > 0)
})

/* ─── 录制绑定 ─── */
const recording = ref<ShortcutAction | null>(null)
const recordingWarn = ref<string | null>(null)

function startRecord(action: ShortcutAction) {
  recording.value = action
  recordingWarn.value = null
  window.addEventListener('keydown', onRecordKey, { capture: true, once: true })
}

function cancelRecord() {
  recording.value = null
  recordingWarn.value = null
}

function onRecordKey(e: KeyboardEvent) {
  /* 只接受带修饰键的组合；单独按修饰键自身不作为绑定 */
  e.preventDefault()
  e.stopPropagation()

  if (e.key === 'Escape') { recording.value = null; recordingWarn.value = null; return }
  if (e.key === 'Meta' || e.key === 'Ctrl' || e.key === 'Alt' || e.key === 'Shift') {
    /* 修饰键单独按下，等待真正的主键 */
    window.addEventListener('keydown', onRecordKey, { capture: true, once: true })
    return
  }

  const platform = bindings.platform === 'mac' ? 'mac' : 'win'
  const mods: Chord['mods'] = []
  if (platform === 'mac' ? e.metaKey : e.ctrlKey) mods.push('mod')
  if (e.altKey) mods.push(platform === 'mac' ? 'opt' : 'alt')
  if (e.shiftKey) mods.push('shift')

  if (mods.length === 0) {
    recordingWarn.value = '需要至少一个修饰键（⌘/Ctrl、Option/Alt 或 Shift）'
    window.addEventListener('keydown', onRecordKey, { capture: true, once: true })
    return
  }

  let key: string
  if (e.key.length === 1) key = e.key.toLowerCase()
  else key = e.key
  const chord: Chord = { mods, key }

  const action = recording.value
  recording.value = null
  if (!action) return

  const warn = bindings.warn(action, chord)
  if (warn) {
    /* 冲突仍允许写入但给出警告，让用户知情 */
    recordingWarn.value = warn
  }
  bindings.setBinding(action, chord)
  msg.success(`已绑定 ${bindings.labels[action] || action}`)
}

function resetOne(action: ShortcutAction) {
  bindings.reset(action)
  msg.success(`已恢复默认 ${bindings.labels[action] || action}`)
}

function resetAll() {
  bindings.resetAll()
  msg.success('已恢复全部默认快捷键')
}
</script>

<template>
  <div class="panel">
    <div class="panel-header">
      <h2>键盘快捷键</h2>
      <div class="header-actions">
        <input v-model="search" placeholder="搜索快捷键…" class="search" />
        <NButton size="small" @click="resetAll">恢复全部默认</NButton>
      </div>
    </div>
    <p class="hint">点击右侧键位即可录制新绑定；冲突或与系统冲突会提示警告。按 Esc 取消录制。</p>
    <div class="groups">
      <div v-for="g in groups" :key="g.name" class="group">
        <h3 class="gt">{{ g.name }}</h3>
        <div v-for="item in g.items" :key="item.action" class="row">
          <span class="label">{{ item.label }}</span>
          <div class="binding">
            <template v-if="recording === item.action">
              <span class="recording">按键录入中…</span>
              <NButton size="tiny" @click="cancelRecord">取消</NButton>
            </template>
            <template v-else>
              <button class="kbd-btn" @click="startRecord(item.action as ShortcutAction)" :title="`点击修改「${item.label}」的快捷键`">
                <Kbd :action="item.action as ShortcutAction" />
              </button>
              <NTag v-if="!bindings.isDefault(item.action as ShortcutAction)" size="small" type="info" :bordered="false">自定义</NTag>
              <NButton v-if="!bindings.isDefault(item.action as ShortcutAction)" size="tiny" tertiary @click="resetOne(item.action as ShortcutAction)">重置</NButton>
            </template>
          </div>
        </div>
      </div>
    </div>
    <div v-if="recordingWarn" class="warn">{{ recordingWarn }}</div>
  </div>
</template>

<style scoped>
.panel { padding: 20px 24px; height: 100%; display: flex; flex-direction: column; overflow: hidden; }
.panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-shrink: 0; }
.panel-header h2 { margin: 0; font-size: 16px; font-weight: 700; color: var(--color-text-primary); }
.header-actions { display: flex; align-items: center; gap: 10px; }
.hint { margin: 0 0 14px; font-size: 12px; color: var(--color-text-secondary); }
.search {
  background: var(--color-input-bg, rgba(255,255,255,0.04));
  border: 1px solid var(--color-border, rgba(255,140,158,0.12));
  border-radius: 8px; padding: 6px 12px; font-size: 13px;
  color: var(--color-text-primary); outline: none; width: 200px; font-family: inherit;
}
.search:focus { border-color: var(--color-accent, #E85D75); }
.search::placeholder { color: var(--color-text-tertiary); }
.groups { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
.gt { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-tertiary); margin: 0 0 10px; }
.row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; gap: 12px; }
.label { font-size: 14px; color: var(--color-text-primary); }
.binding { display: flex; align-items: center; gap: 8px; }
.kbd-btn { background: none; border: none; padding: 2px 4px; cursor: pointer; border-radius: 6px; }
.kbd-btn:hover { background: var(--color-card-hover, rgba(255,140,158,0.06)); }
.recording { font-size: 12px; color: var(--color-accent, #E85D75); }
.warn { margin-top: 12px; padding: 8px 12px; font-size: 12px; color: var(--warning, #E8A817); background: rgba(232,168,23,0.08); border-radius: 8px; }
</style>
