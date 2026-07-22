import { ref, computed } from 'vue'
import { ALL_TOOLS } from '../types'

const STORAGE_KEY = 'jnx:recent-tools'
const MAX_ENTRIES = 8

export interface RecentToolEntry {
  toolId: string
  lastUsedAt: number
  useCount: number
}

function readStorage(): RecentToolEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as RecentToolEntry[]
  } catch {
    return []
  }
}

function writeStorage(entries: RecentToolEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // localStorage full — silently fail
  }
}

const recent = ref<RecentToolEntry[]>(readStorage())

export function useRecentTools() {
  const recentTools = computed(() => {
    const map = new Map(ALL_TOOLS.map(t => [t.id, t]))
    // Returns full tool entries sorted by lastUsedAt desc
    return recent.value
      .map(e => ({ ...e, tool: map.get(e.toolId) }))
      .filter(e => e.tool) // skip deleted tools
  })

  function recordToolUse(toolId: string) {
    const now = Date.now()
    const idx = recent.value.findIndex(e => e.toolId === toolId)
    if (idx >= 0) {
      recent.value[idx].lastUsedAt = now
      recent.value[idx].useCount++
    } else {
      recent.value.unshift({ toolId, lastUsedAt: now, useCount: 1 })
    }
    // sort by lastUsedAt desc
    recent.value.sort((a, b) => b.lastUsedAt - a.lastUsedAt)
    // trim
    if (recent.value.length > MAX_ENTRIES) recent.value.length = MAX_ENTRIES
    writeStorage(recent.value)
  }

  function clearRecent() {
    recent.value = []
    writeStorage([])
  }

  return { recentTools, recordToolUse, clearRecent }
}
