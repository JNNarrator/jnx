import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ToolTab } from '../types'
import { ALL_TOOLS, HOME_TAB } from '../types'
import { useRecentTools } from '../composables/useRecentTools'

export const useToolsStore = defineStore('tools', () => {
  const allTabs = ref<ToolTab[]>([HOME_TAB, ...ALL_TOOLS])
  const tabs = ref<ToolTab[]>(ALL_TOOLS)
  const activeTabId = ref<string>('home')
  const openTabIds = ref<string[]>(['home'])
  const { recordToolUse } = useRecentTools()

  function setActiveTab(id: string) {
    activeTabId.value = id
    if (id !== 'home' && !openTabIds.value.includes(id)) {
      openTabIds.value.push(id)
    }
    // 记录工具使用（首页不记录）
    if (id !== 'home') {
      recordToolUse(id)
    }
  }

  function closeTab(id: string) {
    if (id === 'home') return
    const idx = openTabIds.value.indexOf(id)
    if (idx >= 0) {
      openTabIds.value.splice(idx, 1)
      if (activeTabId.value === id) {
        activeTabId.value = openTabIds.value[openTabIds.value.length - 1] || 'home'
      }
    }
  }

  function getVisibleTabs(): ToolTab[] {
    return allTabs.value.filter(t => openTabIds.value.includes(t.id))
  }

  function getActiveTab(): ToolTab | undefined {
    return allTabs.value.find(t => t.id === activeTabId.value)
  }

  return { tabs, allTabs, activeTabId, openTabIds, setActiveTab, closeTab, getVisibleTabs, getActiveTab }
})
