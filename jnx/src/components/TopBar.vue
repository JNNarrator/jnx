<script setup lang="ts">
import { useSettingsStore } from '../stores/settings'
import { useCommandPaletteStore } from '../stores/commandPalette'
import { ICONS } from '../theme/icons'
import { computed } from 'vue'
import Kbd from './Kbd.vue'

const settings = useSettingsStore()
const palette = useCommandPaletteStore()

const isDark = computed(() => settings.values.theme === 'dark')

function toggleTheme() {
  settings.update('theme', isDark.value ? 'light' : 'dark')
}

function openSearch() { palette.openPalette() }
</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <!-- Optional breadcrumb / page indicator -->
    </div>
    <div class="topbar-right">
      <!-- Global search -->
      <div class="search-box" @click="openSearch" role="button" tabindex="0" @keydown.enter="openSearch" title="打开全局搜索">
        <span class="search-icon" v-html="ICONS.search"></span>
        <span class="search-input">全局搜索…</span>
        <Kbd action="global.search" />
      </div>

      <!-- Theme toggle -->
      <button class="theme-btn" @click="toggleTheme" :title="isDark ? '切换浅色' : '切换深色'">
        <span class="theme-icon" v-html="ICONS[isDark ? 'sun' : 'moon']"></span>
      </button>

      <!-- Version -->
      <span class="version">v0.1.0</span>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: var(--color-topbar, rgba(255,255,255,0.85));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border, rgba(232,93,117,0.1));
  z-index: 20;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Search */
.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 32px;
  background: var(--color-input-bg, rgba(0,0,0,0.03));
  border: 1px solid var(--color-border, rgba(232,93,117,0.12));
  border-radius: 8px;
  transition: border-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
  user-select: none;
}

.search-box:hover {
  border-color: var(--color-accent, #E85D75);
  box-shadow: 0 0 0 3px rgba(232,93,117,0.1);
}

.search-icon {
  width: 16px;
  height: 16px;
  color: var(--color-text-tertiary, #A8989E);
  flex-shrink: 0;
  display: flex;
}

.search-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  color: var(--color-text-primary, #2D2528);
  font-family: inherit;
  width: 120px;
  display: inline-flex;
  align-items: center;
  pointer-events: none;
}

.search-input::placeholder {
  color: var(--color-text-tertiary, #A8989E);
}

/* Theme button */
.theme-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border, rgba(232,93,117,0.12));
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary, #6A5A60);
  cursor: pointer;
  transition: all 0.15s;
}

.theme-btn:hover {
  background: var(--color-card-hover, rgba(232,93,117,0.04));
  color: var(--color-accent, #E85D75);
}

.theme-icon {
  width: 18px;
  height: 18px;
  display: flex;
}

.theme-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

/* Version */
.version {
  font-size: 12px;
  color: var(--color-text-tertiary, #A8989E);
  font-variant-numeric: tabular-nums;
  user-select: none;
}
</style>
