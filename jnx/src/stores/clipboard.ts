import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readText } from '@tauri-apps/plugin-clipboard-manager'
import { getClipboardHistory, addClipboardEntry, deleteClipboardEntry, clearClipboardHistory } from '../utils/db'
import { useSettingsStore } from './settings'
import { isTauri } from '../utils/db'
import type { ClipboardItem } from '../types'

export const useClipboardStore = defineStore('clipboard', () => {
  const items = ref<ClipboardItem[]>([])
  const loading = ref(false)
  const watching = ref(false)
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let lastContent = ''

  async function loadHistory() {
    loading.value = true
    try {
      const rows = await getClipboardHistory(200)
      items.value = rows.map(r => ({
        id: r.id,
        content: r.content,
        source: r.source,
        created_at: r.created_at,
      }))
    } finally {
      loading.value = false
    }
  }

  function startWatching() {
    if (!isTauri()) return
    if (watching.value || pollTimer) return
    watching.value = true
    const settings = useSettingsStore()
    const interval = (settings.values.clipboard_poll_interval as number) || 2000

    pollTimer = setInterval(async () => {
      try {
        const text = await readText()
        if (text && text !== lastContent) {
          lastContent = text
          await addClipboardEntry(text)
          await loadHistory()
        }
      } catch {
        // ignore clipboard read errors
      }
    }, interval)
  }

  function stopWatching() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    watching.value = false
  }

  async function removeItem(id: number) {
    await deleteClipboardEntry(id)
    await loadHistory()
  }

  async function clearAll() {
    await clearClipboardHistory()
    items.value = []
  }

  return {
    items,
    loading,
    watching,
    loadHistory,
    startWatching,
    stopWatching,
    removeItem,
    clearAll,
  }
})
