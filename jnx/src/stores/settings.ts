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
        const num = Number(val)
        ;(values as any)[key] = Number.isNaN(num) ? val : num
      }
    }
    // Normalize theme value from string
    if (raw.theme && ['light', 'dark', 'system', 'pink'].includes(raw.theme)) {
      values.theme = raw.theme as Settings['theme']
    }
    loaded = true
  }

  async function update(key: string, value: string | number) {
    ;(values as any)[key] = value
    await setSetting(key, String(value))
  }

  return { values, loaded, load, update }
})
