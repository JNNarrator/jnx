<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useCommandPaletteStore } from '../stores/commandPalette'

const store = useCommandPaletteStore()
const inputRef = ref<HTMLInputElement | null>(null)

watch(() => store.open, (val) => {
  if (val) nextTick(() => { inputRef.value?.focus(); store.selectedIndex = 0 })
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') { e.preventDefault(); store.selectedIndex = Math.min(store.selectedIndex + 1, store.filtered.length - 1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); store.selectedIndex = Math.max(store.selectedIndex - 1, 0) }
  else if (e.key === 'Enter' && store.filtered[store.selectedIndex]) { store.filtered[store.selectedIndex].action(); store.close() }
  else if (e.key === 'Escape') { store.close() }
}

function select(idx: number) { store.selectedIndex = idx }
function exec(idx: number) { store.filtered[idx]?.action(); store.close() }
</script>

<template>
  <Teleport to="body">
    <div v-if="store.open" class="cp-overlay" @click.self="store.close()" @keydown="onKeydown">
      <div class="cp-panel">
        <div class="cp-search-wrap">
          <svg class="cp-search-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M12.5 12.5L16 16"/></svg>
          <input ref="inputRef" v-model="store.query" class="cp-input" placeholder="搜索功能、工具…" @keydown="onKeydown" />
          <kbd class="cp-kbd">Esc</kbd>
        </div>
        <div class="cp-results">
          <div v-if="!store.filtered.length" class="cp-empty">无匹配结果</div>
          <div v-for="(act, i) in store.filtered" :key="act.id"
            class="cp-item"
            :class="{ active: i === store.selectedIndex }"
            @click="exec(i)"
            @mouseenter="select(i)"
          >
            <div class="cp-item-label">{{ act.label }}</div>
            <div v-if="act.category" class="cp-item-cat">{{ act.category }}</div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.cp-overlay {
  position: fixed; inset: 0; z-index: 99999;
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: 12vh;
  background: rgba(0,0,0,0.3); backdrop-filter: blur(3px);
}
.cp-panel {
  width: 520px; max-width: 90vw;
  background: var(--color-surface, #2A1F22);
  border-radius: 14px;
  box-shadow: 0 16px 60px rgba(0,0,0,0.3);
  overflow: hidden;
}
.cp-search-wrap {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--color-border, rgba(255,140,158,0.1));
}
.cp-search-icon { width: 18px; height: 18px; flex-shrink: 0; color: var(--color-text-tertiary, #8A7A80); }
.cp-input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: 16px; color: var(--color-text-primary, #F0E2E6); font-family: inherit;
}
.cp-input::placeholder { color: var(--color-text-tertiary, #8A7A80); }
.cp-kbd {
  font-size: 11px; padding: 2px 7px; border-radius: 4px;
  background: var(--color-border, rgba(255,140,158,0.1));
  color: var(--color-text-tertiary, #8A7A80); font-family: inherit;
}
.cp-results { max-height: 320px; overflow-y: auto; padding: 6px; }
.cp-empty { text-align: center; padding: 24px; color: var(--color-text-tertiary, #8A7A80); font-size: 14px; }
.cp-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; border-radius: 8px; cursor: pointer;
  transition: background 0.1s;
  color: var(--color-text-primary, #F0E2E6);
}
.cp-item:hover, .cp-item.active { background: var(--color-card-hover, rgba(255,140,158,0.08)); }
.cp-item-label { font-size: 14px; font-weight: 500; }
.cp-item-cat { font-size: 11px; color: var(--color-text-tertiary, #8A7A80); }
</style>
