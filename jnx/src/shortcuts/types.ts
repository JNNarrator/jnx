/* ─── 修饰键与和弦类型 ─── */
export type Mod = 'mod' | 'opt' | 'alt' | 'shift'

export interface Chord {
  mods: Mod[]
  key: string   // event.key 值，如 'k', 'Enter', 'ArrowLeft', 'z'
}

export interface PlatformChords {
  mac: Chord
  win: Chord
}

/** 快捷键分组（用于展示面板） */
export interface ShortcutGroup {
  name: string
  items: { action: string; label: string }[]
}
