<script setup lang="ts">
import { computed } from 'vue'
import { usePlatform } from '../composables/usePlatform'
import { SHORTCUTS, type ShortcutAction } from '../shortcuts'

const props = defineProps<{
  action?: ShortcutAction
  keys?: string[]
}>()
import { useShortcutBindingsStore } from '../stores/shortcutBindings'
import type { Chord } from '../shortcuts/types'

const { isMac } = usePlatform()
const bindings = useShortcutBindingsStore()

const GLYPH: Record<string, { mac: string; win: string }> = {
  mod:   { mac: '⌘', win: 'Ctrl' },
  shift: { mac: '⇧', win: 'Shift' },
  alt:   { mac: '⌥', win: 'Alt' },
  opt:   { mac: '⌥', win: 'Ctrl' },
}

function translateKey(k: string): string {
  if (k in GLYPH) return GLYPH[k][isMac.value ? 'mac' : 'win']
  return formatKey(k)
}

const parts = computed(() => {
  if (props.keys) return props.keys.map(k => translateKey(k))
  if (props.action) {
    let chord: Chord = SHORTCUTS[props.action][isMac.value ? 'mac' : 'win']
    try { chord = bindings.chordFor(props.action) } catch {}
    const mods = chord.mods.map(m => GLYPH[m][isMac.value ? 'mac' : 'win'])
    return [...mods, formatKey(chord.key)]
  }
  return []
})

function formatKey(k: string): string {
  const map: Record<string, string> = {
    ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
    Backspace: '⌫', Enter: '↵', Escape: 'Esc', Delete: '⌦',
    Home: 'Home', End: 'End', Tab: 'Tab', ' ': 'Space',
    '\\': '\\', ',': ',', '/': '/', '-': '-', '=': '=',
  }
  return map[k] || (k.length === 1 ? k.toUpperCase() : k)
}
</script>

<template>
  <span class="kbd-stack">
    <kbd v-for="(p, i) in parts" :key="i" class="kbd-part">{{ p }}</kbd>
  </span>
</template>

<style scoped>
.kbd-stack {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  vertical-align: middle;
  font-size: 0; /* remove inline gap */
}
.kbd-part {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  font-size: 11px;
  font-family: inherit;
  font-weight: 500;
  border: 1px solid var(--json-border, rgba(232,76,111,0.15));
  border-radius: 4px;
  background: var(--json-bg, #fff);
  color: var(--json-text-secondary, #6B6B6B);
  line-height: 1;
}
</style>
