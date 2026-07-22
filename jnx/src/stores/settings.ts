import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { getAllSettings, setSetting } from '../utils/db'
import { DEFAULT_SETTINGS } from '../types'
import type { Settings } from '../types'

export const useSettingsStore = defineStore('settings', () => {
  const values = reactive<Settings>({ ...DEFAULT_SETTINGS })

  let loaded = false

  async function load() {
    if (loaded) return
    const raw = await getAllSettings()
    for (const [key, val] of Object.entries(raw)) {
      if (key in values) {
        if (key === 'tool_memory_enabled' || key === 'sidebarCollapsed') {
          // 布尔值特殊处理
          ;(values as any)[key] = val === 'true'
        } else {
          const num = Number(val)
          ;(values as any)[key] = Number.isNaN(num) ? val : num
        }
      }
    }
    // Normalize theme value from string
    if (raw.theme && ['light', 'dark'].includes(raw.theme)) {
      values.theme = raw.theme as Settings['theme']
    }
    loaded = true
  }

  async function update(key: string, value: string | number | boolean) {
    ;(values as any)[key] = value
    await setSetting(key, String(value))
  }

  return { values, loaded, load, update }
})
