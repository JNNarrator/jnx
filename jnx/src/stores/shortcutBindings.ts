import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { SHORTCUTS, SHORTCUT_GROUPS, type ShortcutAction } from '../shortcuts'
import type { Chord } from '../shortcuts/types'
import { getPlatformSync } from '../composables/usePlatform'
import { getSetting, setSetting } from '../utils/db'

/* 平台分组：linux 复用 win 的 Ctrl 体系 */
type Platform = 'mac' | 'win'

function detectPlatform(): Platform {
  const { isWin } = getPlatformSync()
  return isWin ? 'win' : 'mac'
}

const STORAGE_KEY = 'shortcuts.overrides'

/* 文本编辑类保留组合，禁止把导航/全局键绑到这些上 */
const RESERVED_EDIT: Record<string, string> = {
  'mod|c': '复制', 'mod|v': '粘贴', 'mod|x': '剪切',
  'mod|z': '撤销', 'mod|shift|z': '重做', 'mod|a': '全选', 'mod|s': '保存',
}

/* 已知系统/webview 冲突组合（mac 为主），绑定时给警告 */
const SYSTEM_CONFLICTS_MAC: Record<string, string> = {
  'mod|h': 'macOS 隐藏当前窗口',
  'mod|j': 'webview 下载管理',
  'mod|d': '浏览器加书签 / macOS 分屏',
  'mod|w': '关闭窗口', 'mod|t': '新建标签', 'mod|r': '刷新',
  'mod|q': '退出', 'mod|m': '最小化', 'mod|l': '地址栏', 'mod|f': '查找',
}
for (let i = 1; i <= 9; i++) SYSTEM_CONFLICTS_MAC[`mod|${i}`] = `切到第 ${i} 个标签页`

function signature(c: Chord): string {
  const mods = [...c.mods].sort().join(',')
  return `${mods}|${c.key.toLowerCase()}`
}

const LABELS: Record<string, string> = (() => {
  const m: Record<string, string> = {}
  for (const g of SHORTCUT_GROUPS) for (const it of g.items) m[it.action] = it.label
  return m
})()

export const useShortcutBindingsStore = defineStore('shortcutBindings', () => {
  const platform = ref<Platform>(detectPlatform())
  const overrides = reactive<Record<string, Chord | undefined>>({})
  let loaded = false

  function chordFor(action: ShortcutAction): Chord {
    const ov = overrides[action]
    if (ov) return ov
    return SHORTCUTS[action][platform.value]
  }

  function accelerator(action: ShortcutAction): string {
    const c = chordFor(action)
    const parts: string[] = []
    for (const m of c.mods) {
      parts.push(
        m === 'mod' ? (platform.value === 'mac' ? 'Cmd' : 'Ctrl') :
        m === 'opt' ? (platform.value === 'mac' ? 'Option' : 'Alt') :
        m === 'alt' ? 'Alt' : 'Shift',
      )
    }
    parts.push(c.key.length === 1 ? c.key.toUpperCase() : c.key)
    return parts.join('+')
  }

  async function load() {
    if (loaded) return
    loaded = true
    try {
      const raw = await getSetting(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<Platform, Record<string, Chord>>>
        const plat = parsed[platform.value]
        if (plat) for (const [a, c] of Object.entries(plat)) overrides[a] = c
      }
    } catch { /* 非运行环境忽略 */ }
  }

  async function persist() {
    const payload: Record<Platform, Record<string, Chord>> = { mac: {}, win: {} }
    for (const a of Object.keys(overrides)) {
      const c = overrides[a]
      if (c) payload[platform.value][a] = c
    }
    try { await setSetting(STORAGE_KEY, JSON.stringify(payload)) } catch { /* ignore */ }
  }

  function setBinding(action: ShortcutAction, chord: Chord) {
    overrides[action] = chord
    void persist()
  }

  function reset(action: ShortcutAction) {
    delete overrides[action]
    void persist()
  }

  function resetAll() {
    for (const a of Object.keys(overrides)) delete overrides[a]
    void persist()
  }

  function isDefault(action: ShortcutAction): boolean {
    return !overrides[action]
  }

  function conflicts(action: ShortcutAction, chord: Chord): ShortcutAction | null {
    const sig = signature(chord)
    for (const a of Object.keys(SHORTCUTS) as ShortcutAction[]) {
      if (a === action) continue
      if (signature(chordFor(a)) === sig) return a
    }
    return null
  }

  function warn(action: ShortcutAction, chord: Chord): string | null {
    const sig = signature(chord)
    if (RESERVED_EDIT[sig]) return `与文本编辑冲突：${RESERVED_EDIT[sig]}`
    if (platform.value === 'mac' && SYSTEM_CONFLICTS_MAC[sig]) return `系统/webview 冲突：${SYSTEM_CONFLICTS_MAC[sig]}`
    const c = conflicts(action, chord)
    if (c) return `与「${LABELS[c] || c}」冲突`
    return null
  }

  const allActions = computed(() => Object.keys(SHORTCUTS) as ShortcutAction[])

  return {
    platform, overrides, chordFor, accelerator,
    load, setBinding, reset, resetAll, isDefault,
    conflicts, warn, allActions, labels: LABELS,
  }
})
