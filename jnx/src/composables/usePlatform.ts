/* ─── 一次性异步平台检测 + 全局缓存 ─── */
import { ref, readonly } from 'vue'

/** Tauri platform() 返回的原始值 */
type TauriPlatform = 'macos' | 'windows' | 'linux'

const isMac = ref(false)
const isWin = ref(false)
let resolved = false

export function usePlatform() {
  if (!resolved) {
    resolved = true
    // 先 UserAgent 同步兜底
    isMac.value = /mac/i.test(navigator.userAgent)
    isWin.value = /win/i.test(navigator.userAgent)

    // 尝试 Tauri API 插件，异步修正
    import('@tauri-apps/plugin-os')
      .then((m) => (m.platform() as unknown as Promise<TauriPlatform>))
      .then((p) => { isMac.value = p === 'macos'; isWin.value = p === 'windows' })
      .catch(() => console.warn('[usePlatform] Tauri OS plugin unavailable, keeping UA fallback'))
  }

  return { isMac: readonly(isMac), isWin: readonly(isWin) }
}

/** 单例同步读取（供非 composition 环境使用） */
export function getPlatformSync(): { isMac: boolean; isWin: boolean } {
  return {
    isMac: /mac/i.test(navigator.userAgent),
    isWin: /win/i.test(navigator.userAgent),
  }
}
