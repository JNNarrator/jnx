import { onScopeDispose } from 'vue'
import { SHORTCUTS, EDIT_RESERVED_KEYS, type ShortcutAction } from '../shortcuts'
import type { Chord } from '../shortcuts/types'
import { getPlatformSync } from './usePlatform'

/* ───── 调试开关：开发期可用 localStorage 打开 ─── window.localStorage.setItem('jnx.kbd.debug','1') */
const DEBUG = () => {
  try { return localStorage.getItem('jnx.kbd.debug') === '1' } catch { return false }
}

const DEBUG_TAG = 'jnx:kbd'

type PlatformKey = 'mac' | 'win'

function currentPlatformKey(): PlatformKey {
  return getPlatformSync().isWin ? 'win' : 'mac'
}

let customClasses: Map<ShortcutAction, boolean> = new Map()

function isEditing(target: EventTarget | null): boolean {
  const el = (target as HTMLElement | null)
  if (!el) return false
  if (el.isContentEditable) return true
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

function modsMatch(e: KeyboardEvent, chord: Chord, platform: PlatformKey): boolean {
  const modKey = platform === 'mac' ? e.metaKey : e.ctrlKey
  const reqMod = chord.mods.includes('mod')
  if (reqMod !== modKey) return false

  /* opt 与 alt 在 win 下同义；chord 里的 opt 在 win 映射为 alt 键 */
  const optReq = chord.mods.includes('opt') || chord.mods.includes('alt')
  if (optReq !== e.altKey) return false

  const shiftReq = chord.mods.includes('shift')
  if (shiftReq !== e.shiftKey) return false
  return true
}

function keyMatch(e: KeyboardEvent, chord: Chord): boolean {
  const def = chord.key
  if (def.length === 0) return false

  if (def.length !== 1) {
    return e.key === def
  }

  const key = def.toLowerCase()

  /* Option+键 在 macOS 上会生成特殊字符，e.key 可能是 'å'，但 e.code 仍是 KeyA；用 code 兜底 */
  if (e.key.length === 1) {
    if (e.key.toLowerCase() === key) return true
  }
  if (e.code === 'Key' + key.toUpperCase()) return true
  if (e.code === 'Digit' + key) return true
  return false
}

interface RegistryEntry {
  action: ShortcutAction
  handler: () => void
  chord: Chord
  skipWhenEditing: boolean
}

let registry: RegistryEntry[] = []
let attached = false

function dispatch(e: KeyboardEvent) {
  if (e.isComposing) return
  const platform = currentPlatformKey()
  const editing = isEditing(e.target)
  const el = e.target as HTMLElement | null
  const tag = el?.tagName ?? '(none)'
  const top = topMostKey(e)

  let firstHit: RegistryEntry | null = null
  let suppressed = false

  for (const entry of registry) {
    if (entry.skipWhenEditing && editing) continue
    if (!modsMatch(e, entry.chord, platform)) continue
    if (!keyMatch(e, entry.chord)) continue
    firstHit = entry
    break
  }

  const k = e.key
  if (DEBUG()) console.log(DEBUG_TAG, { code: e.code, key: k, metaKey: e.metaKey, ctrlKey: e.ctrlKey, altKey: e.altKey, shiftKey: e.shiftKey, activeElementTag: tag, editing, topMostMatch: top, hitAction: firstHit?.action ?? null })

  if (editing) {
    /* 编辑类保留键：cmd/ctrl + c/v/x/z/a/s/（shift+z 重做）等，放行给浏览器原生编辑，不拦截 */
    const mod = platform === 'mac' ? e.metaKey : e.ctrlKey
    if (mod && k.length === 1 && EDIT_RESERVED_KEYS.has(k.toLowerCase())) {
      /* 但若与某个自定义键撞了，则按自定义键处理；否则放行 */
      suppressed = firstHit !== null
    }
  }

  if (firstHit) {
    e.preventDefault()
    e.stopPropagation()
    firstHit.handler()
    if (DEBUG()) console.log(DEBUG_TAG, 'handled', firstHit.action, 'preventDefault=true')
    return
  }

  /* 未命中自定义键：若已落入编辑保留集则放行；其余情况不拦截（避免误伤系统快捷键/浏览器默认） */
  if (suppressed) return
  if (editing) return
  /* 命中系统冲突键却没在 registry 里：仍需阻止默认以防 webview 行为（如 ⌘H 隐藏窗口），
   * 但只在确实注册过该 modifier 体系时才干预。默认不做强制阻止，避免劫持过多系统键。 */
}

function topMostKey(e: KeyboardEvent): boolean {
  /* 检查事件是否已被阻止；用于日志 */
  return e.defaultPrevented
}

function attach() {
  if (attached) return
  attached = true
  window.addEventListener('keydown', dispatch, true)
}

function detach() {
  if (registry.length) return
  attached = false
  window.removeEventListener('keydown', dispatch, true)
}

/* 外部可更新自定义 action 的 chord（从绑定 store 注入覆盖，覆盖默认 SHORTCUTS） */
export function updateShortcutChord(action: ShortcutAction, chord: Chord | null) {
  for (const entry of registry) {
    if (entry.action !== action) continue
    if (chord) entry.chord = chord
    else entry.chord = SHORTCUTS[action][currentPlatformKey()]
  }
}

/* 注册一个快捷键动作；handler 在命中时执行。skipWhenEditing 默认为「全局/导航类」=false，「编辑类」=true */
export function useKeyboardShortcut(
  action: ShortcutAction,
  handler: () => void,
  opts: { skipWhenEditing?: boolean } = {},
) {
  const chord = SHORTCUTS[action][currentPlatformKey()]
  const entry: RegistryEntry = {
    action, handler, chord,
    skipWhenEditing: opts.skipWhenEditing ?? false,
  }
  if (customClasses.has(action)) console.warn('[kbd] duplicate registration for', action, 'last writer wins')
  registry.push(entry)
  const prev = customClasses.get(action)
  if (prev) {
    /* 同一 action 被多次注册：保留最后一次（常见于 KeepAlive 重挂载），但不重复触发 */
    registry = registry.filter(en => en !== registry.find(x => x.action === action && x !== entry))
  }
  customClasses.set(action, true)
  attach()
  onScopeDispose(() => {
    registry = registry.filter(en => en !== entry)
    if (!registry.some(en => en.action === action)) customClasses.delete(action)
    detach()
  })
}

/* 兼容旧签名（def: ShortcutDef）—— 仅在迁移期使用 */
export interface LegacyShortcutDef { key: string; mod?: boolean; alt?: boolean; shift?: boolean; skipWhenEditing?: boolean }
export function useLegacyShortcut(def: LegacyShortcutDef, handler: () => void) {
  const platform = currentPlatformKey()
  const mods: Chord['mods'] = []
  if (def.mod) mods.push('mod')
  if (def.alt) mods.push(platform === 'mac' ? 'opt' : 'alt')
  if (def.shift) mods.push('shift')
  /* 不入库到 registry，直接挂着原生 keydown */
  function g(e: KeyboardEvent) {
    if (e.isComposing) return
    const mac = platform === 'mac'
    const modKey = mac ? e.metaKey : e.ctrlKey
    if ((def.mod === true && !modKey) || (def.mod === false && modKey)) return
    if (def.alt === true && !e.altKey) return
    if (def.alt === false && e.altKey) return
    if (def.shift === true && !e.shiftKey) return
    if (def.shift === false && e.shiftKey) return
    if (def.key.length === 1) {
      if (e.key.toLowerCase() !== def.key.toLowerCase() && e.code !== 'Key' + def.key.toUpperCase() && e.code !== 'Digit' + def.key) return
    } else if (e.key !== def.key) return
    if (def.skipWhenEditing && isEditing(e.target)) return
    e.preventDefault(); e.stopPropagation(); handler()
  }
  window.addEventListener('keydown', g, true)
  onScopeDispose(() => window.removeEventListener('keydown', g, true))
}
