import { ref, watch, onMounted, onBeforeUnmount, onActivated, onDeactivated, type Ref, type WatchStopHandle } from 'vue'
import { loadToolState, saveToolState, clearToolState, pruneToolStates } from '../utils/db'

export interface UseToolDraftOptions<T> {
  /** 写盘防抖间隔（毫秒），默认 800 */
  debounceMs?: number
  /** 是否启用记忆。关闭时不 hydrate、不写盘。可传响应式 Ref。默认 true */
  enabled?: Ref<boolean> | boolean
  /** 存盘前脱敏/裁剪（剔除敏感字段、超大字段）。默认无操作 */
  sanitize?: (state: T) => T
  /** 读盘后校验形状，防止旧版本/脏数据 hydrate 出错。默认接受任意 JSON 对象 */
  validate?: (raw: unknown) => raw is T
  /** payload 大小保护阈值（字节），超过则拒存并 console.warn。默认 1 MB */
  maxPayloadBytes?: number
}

export interface UseToolDraftReturn<T> {
  /** 响应式状态，工具直接绑定这个对象（v-model 等） */
  state: Ref<T>
  /** 清空 state 回 initial 并清库 */
  resetDraft: () => void
  /** 是否已完成启动 hydrate（用于首屏 loading/防闪烁） */
  isRestored: Ref<boolean>
}

/* ─── Singleton: 启动时全局调用一次，清理过期草稿 ─── */
let _pruned = false
export function pruneAllDrafts(): void {
  if (_pruned) return
  _pruned = true
  pruneToolStates(30).catch(() => {})
}

/**
 * useToolDraft —— 工具状态记忆 composable
 *
 * 生命周期时序（顺序关键，三处 guard 位置已标注）：
 *   1. setup 同步：state = ref(structuredClone(initial)), isRestored=false, isHydrating=true
 *   2. setup 内 onMounted：加载 DB 草稿，若命中 → state = parsed ← 此时第1次state变更
 *        → 完成 → isRestored=true, isHydrating=false
 *   3. watch(state, deep)：仅在 isRestored && !isHydrating && enabled 时，
 *        debounce 后 sanitize → saveToolState
 *   4. onDeactivated / onBeforeUnmount：取消防抖定时器并立即 flush 写盘
 *   5. onActivated：仅恢复 watcher（不重新 hydrate）
 *   6. resetDraft：state = initial clone → clearToolState → 标记抑制下一次 watch
 *
 * @param toolId  对应 ALL_TOOLS 的 id（如 'json'/'converter'/'cron'）
 * @param initial 初始值，必须 JSON 可序列化
 * @param opts    可选参数
 */
export function useToolDraft<T extends Record<string, any>>(
  toolId: string,
  initial: T,
  opts: UseToolDraftOptions<T> = {},
): UseToolDraftReturn<T> {
  const {
    debounceMs = 800,
    enabled = true,
    sanitize,
    validate,
    maxPayloadBytes = 1_048_576, // 1 MB
  } = opts

  const enabledRef = typeof enabled === 'boolean' ? ref(enabled) : enabled

  // ─── 状态 ───
  const state = ref<T>(structuredClone(initial)) as Ref<T>
  const isRestored = ref(false)
  const isHydrating = ref(true) // guard 1：hydrate 期间抑制 watch 写盘

  // ─── 防抖 ───
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let flushing = false // guard 2：防止 flush 中写盘与 watch 互相触发
  let suppressNextWrite = false // guard 3：reset 后抑制一次 watch 写盘

  function writeNow(): void {
    if (flushing) return
    if (suppressNextWrite) { suppressNextWrite = false; return }
    if (!enabledRef.value) return
    flushing = true
    try {
      let payload = sanitize ? sanitize(state.value) : state.value
      const json = JSON.stringify(payload)
      if (json.length > maxPayloadBytes) {
        console.warn(`[useToolDraft] payload for "${toolId}" exceeds ${maxPayloadBytes} bytes (${json.length}), skipping save`)
        return
      }
      saveToolState(toolId, json).catch(() => {})
    } finally {
      flushing = false
    }
  }

  function scheduleWrite(): void {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(writeNow, debounceMs)
  }

  function cancelWrite(): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  // ─── hydrate：启动时从 DB 恢复 ───
  onMounted(async () => {
    isHydrating.value = true
    try {
      const raw = await loadToolState(toolId)
      if (raw !== null) {
        let parsed: unknown
        try { parsed = JSON.parse(raw) } catch { /* 非 JSON，忽略 */ }
        if (parsed && typeof parsed === 'object') {
          if (validate ? validate(parsed) : true) {
            // 合并读到的值到 state（保持结构完整，只覆盖存在的 key）
            state.value = { ...structuredClone(initial), ...parsed } as T
          }
        }
      }
    } catch {
      /* db 降级：内存态可用即可 */
    } finally {
      isHydrating.value = false
      isRestored.value = true
    }
  })

  // ─── 写盘 watch ───
  let watchStop: WatchStopHandle | null = null

  function startWatcher(): void {
    if (watchStop) return
    watchStop = watch(
      state,
      () => {
        // guard: hydrate 未完成 → 不写（避免 initial 覆盖磁盘草稿）
        if (!isRestored.value || isHydrating.value) return
        // guard: reset 后的写盘抑制
        if (suppressNextWrite) { suppressNextWrite = false; return }
        // guard: flush 中不重复调度
        if (flushing) return
        if (!enabledRef.value) return
        scheduleWrite()
      },
      { deep: true },
    )
  }

  function stopWatcher(): void {
    if (watchStop) {
      watchStop()
      watchStop = null
    }
  }

  // setup 阶段启动 watch
  startWatcher()

  // ─── 切走/卸载时 flush 写盘 ───
  function flushWrite(): void {
    cancelWrite()
    writeNow()
  }

  // KeepAlive 切走 → flush 兜底
  onDeactivated(() => {
    flushWrite()
    stopWatcher()
  })

  // KeepAlive 切回 → 重新启用 watch（不重新 hydrate）
  onActivated(() => {
    if (!watchStop) startWatcher()
  })

  // 组件卸载 → flush 兜底（非 KeepAlive 卸载路径）
  onBeforeUnmount(() => {
    flushWrite()
    stopWatcher()
  })

  // ─── resetDraft ───
  function resetDraft(): void {
    cancelWrite()
    suppressNextWrite = true // 避免 structuredClone 被 watch 写回
    state.value = structuredClone(initial) as T
    suppressNextWrite = false
    clearToolState(toolId).catch(() => {})
  }

  return { state, resetDraft, isRestored }
}
