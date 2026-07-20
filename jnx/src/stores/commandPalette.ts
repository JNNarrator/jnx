import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface PaletteAction {
  id: string
  label: string
  category?: string
  keywords?: string[]
  action: () => void
}

export const useCommandPaletteStore = defineStore('commandPalette', () => {
  const open = ref(false)
  const query = ref('')
  const actions = ref<PaletteAction[]>([])
  const selectedIndex = ref(0)

  function register(as: PaletteAction[]) {
    for (const a of as) {
      if (!actions.value.find(x => x.id === a.id)) actions.value.push(a)
    }
  }

  const filtered = computed(() => {
    const q = query.value.trim().toLowerCase()
    if (!q) return actions.value
    return actions.value.filter(a =>
      a.label.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      a.keywords?.some(k => k.toLowerCase().includes(q))
    )
  })

  function toggle() { open.value = !open.value; if (!open.value) query.value = ''; selectedIndex.value = 0 }
  function openPalette() { open.value = true; query.value = ''; selectedIndex.value = 0 }
  function close() { open.value = false; query.value = '' }

  return { open, query, actions, selectedIndex, filtered, register, toggle, openPalette, close }
})
