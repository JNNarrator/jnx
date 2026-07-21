<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import { darkTheme, lightTheme, NConfigProvider, NMessageProvider } from 'naive-ui'
import TopBar from './components/TopBar.vue'
import Sidebar from './components/Sidebar.vue'
import CommandPalette from './components/CommandPalette.vue'
import HomeView from './views/HomeView.vue'
import ToolConverter from './views/ToolConverter.vue'
import ToolJson from './views/ToolJson.vue'
import ToolCurl from './views/ToolCurl.vue'
import ToolClipboard from './views/ToolClipboard.vue'
import ToolSettings from './views/ToolSettings.vue'
import ToolShortcuts from './views/ToolShortcuts.vue'
import { useToolsStore } from './stores/tools'
import { useSettingsStore } from './stores/settings'
import { useShortcutBindingsStore } from './stores/shortcutBindings'
import { useAppShortcuts, useCommandPaletteActions } from './composables/useAppShortcuts'
import { usePlatform } from './composables/usePlatform'

const tools = useToolsStore()
const settings = useSettingsStore()
const bindings = useShortcutBindingsStore()
const { isWin } = usePlatform()

const loaded = ref(false)

onMounted(async () => {
  try {
    await settings.load()
    await bindings.load()
  } catch (_) { console.warn('后端不可用') }
  document.documentElement.setAttribute('data-platform', isWin.value ? 'windows' : 'macos')
  try { useCommandPaletteActions() } catch (_) { /* 非组件作用域兜底 */ }
  loaded.value = true
})

// ─── 全局快捷键（统一注册中心，路由切换不丢失）───
useAppShortcuts()
// ─── 命令面板动作注册 ───
useCommandPaletteActions()

// ─── Theme: CSS vars on :root ───
watchEffect(() => {
  const t = settings.values.theme

  let bg='', surface='', sidebar='', topbar='', text1='', text2='', text3=''
  let accent='', accentLight='', accentGlow='', border='', shadow='', cardHover='', grid='', inputBg=''
  let elevBg=''

  if (t === 'dark') {
    bg = '#161618'; surface = '#1E1E20'; sidebar = '#1A1A1C'; topbar = 'rgba(22,22,24,0.85)'
    text1 = '#E4E4E7'; text2 = '#A1A1AA'; text3 = '#71717A'
    text1 = '#E4E4E7'; text2 = '#A1A1AA'; text3 = '#71717A'
    accent = '#6A8EBF'; accentLight = '#8AACD8'; accentGlow = 'rgba(106,142,191,0.08)'
    border = 'rgba(255,255,255,0.08)'; shadow = 'rgba(0,0,0,0.2)'
    cardHover = 'rgba(255,255,255,0.04)'; grid = 'rgba(255,255,255,0.02)'; inputBg = 'rgba(255,255,255,0.04)'
    elevBg = '#3D3D3D'
  } else if (t === 'light') {
    bg = '#FFF5F7'; surface = '#FFFFFF'; sidebar = '#FFFFFF'; topbar = 'rgba(255,245,247,0.85)'
    text1 = '#2D2528'; text2 = '#555555'; text3 = '#777777'
    accent = '#E85D75'; accentLight = '#FF8C9E'; accentGlow = 'rgba(232,93,117,0.06)'
    border = 'rgba(232,93,117,0.1)'; shadow = 'rgba(232,93,117,0.06)'
    cardHover = 'rgba(232,93,117,0.03)'; grid = 'rgba(232,93,117,0.03)'; inputBg = 'rgba(0,0,0,0.02)'
    elevBg = '#FFF7F8'
  }

  const r = document.documentElement
  r.style.setProperty('--color-bg', bg)
  r.style.setProperty('--color-surface', surface)
  r.style.setProperty('--color-sidebar', sidebar)
  r.style.setProperty('--color-topbar', topbar)
  r.style.setProperty('--color-text-primary', text1)
  r.style.setProperty('--color-text-secondary', text2)
  r.style.setProperty('--color-text-tertiary', text3)
  r.style.setProperty('--color-accent', accent)
  r.style.setProperty('--color-accent-light', accentLight)
  r.style.setProperty('--color-accent-glow', accentGlow)
  r.style.setProperty('--color-border', border)
  r.style.setProperty('--color-shadow', shadow)
  r.style.setProperty('--color-card-hover', cardHover)
  r.style.setProperty('--color-grid', grid)
  r.style.setProperty('--color-input-bg', inputBg)
  r.style.setProperty('--text-1', text1)
  r.style.setProperty('--text-2', text2)
  r.style.setProperty('--text-3', text3)
  r.style.setProperty('--bg-app', bg)
  r.style.setProperty('--bg-card', surface)
  r.style.setProperty('--brand', accent)
  r.style.setProperty('--success', '#2EAB67')
  r.style.setProperty('--warning', '#E8A817')
  r.style.setProperty('--danger', '#E84C6F')
  r.style.setProperty('--info', '#3B82F6')
  r.style.setProperty('--border-strong', 'rgba(255,140,158,0.3)')
  r.style.setProperty('--bg-elev', elevBg)
  r.setAttribute('data-theme', t)
})

// ─── Naive UI theme overrides for fonts ───
const themeOverrides = computed(() => ({
  common: {
    fontFamily: "'JetBrains Mono', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
    fontFamilyMono: "'JetBrains Mono', 'Cascadia Code', 'SF Mono', Menlo, Consolas, monospace",
    // 与本应用文本色阶对齐，避免控件内文字与外层割裂；light/dark 两套都覆盖
    textColor1: settings.values.theme === 'dark' ? '#E4E4E7' : '#2D2528',
    textColor2: settings.values.theme === 'dark' ? '#A1A1AA' : '#555555',
    textColor3: settings.values.theme === 'dark' ? '#71717A' : '#777777',
    placeholderColor: settings.values.theme === 'dark' ? '#71717A' : '#777777',
  },
}))

// ─── Naive UI base theme ───
const naiveTheme = computed(() => settings.values.theme === 'dark' ? darkTheme : lightTheme)

const componentMap: Record<string, any> = {
  HomeView, ToolJson, ToolCurl, ToolClipboard, ToolSettings, ToolShortcuts,
  ToolConverter,
}
</script>

<template>
  <NConfigProvider :theme="naiveTheme" :theme-overrides="themeOverrides">
    <NMessageProvider>
      <div class="app-shell" :class="{ loaded }">
        <TopBar />
        <div class="app-body">
          <Sidebar />
          <main class="content-area">
            <KeepAlive>
              <component :is="componentMap[tools.getActiveTab()?.component || 'HomeView']" />
            </KeepAlive>
          </main>
        </div>
        <CommandPalette />
      </div>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style>
:root {
  --font-sans: 'JetBrains Mono', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Cascadia Code', 'SF Mono', Menlo, Consolas, monospace;
  --color-bg: #FFF5F7;
  --color-surface: #FFFFFF;
  --color-sidebar: #FFFFFF;
  --color-topbar: rgba(255,245,247,0.85);
  --color-text-primary: #2D2528;
  --color-text-secondary: #6A5A60;
  --color-text-tertiary: #A8989E;
  --color-accent: #E85D75;
  --color-accent-light: #FF8C9E;
  --color-accent-glow: rgba(232,93,117,0.06);
  --color-border: rgba(232,93,117,0.1);
  --color-shadow: rgba(232,93,117,0.06);
  --color-card-hover: rgba(232,93,117,0.03);
  --color-grid: rgba(232,93,117,0.03);
  --color-input-bg: rgba(0,0,0,0.02);
  --text-1: #F0E2E6;
  --text-2: #B8A6AC;
  --text-3: #8A7A80;
  --bg-app: #1C1517;
  --bg-card: #2A1F22;
  --bg-elev: #333;
  --brand: #E85D75;
  --border: rgba(255,140,158,0.12);
  --border-strong: rgba(255,140,158,0.25);
  --success: #2EAB67;
  --warning: #E8A817;
  --danger: #E84C6F;
  --info: #3B82F6;
}

* { margin:0; padding:0; box-sizing:border-box; }

html, body, #app {
  height: 100vh; min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-text-primary);
  font-family: var(--font-sans);

}

/* Scrollbar */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--color-text-tertiary); }

body { overflow: hidden; }
/* Font smoothing — Windows override via data-platform */
:root[data-platform='windows'] html,
:root[data-platform='windows'] body,
:root[data-platform='windows'] #app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Code / Mono elements */
code, pre, textarea, input[type='text'], input[type='search'], .code-area, .mono {
  font-family: var(--font-mono);
  font-feature-settings: 'liga' 1, 'calt' 1;
  line-height: 1.6;
}


/* Layout */
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.app-shell.loaded { opacity: 1; }

.app-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.content-area {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: var(--color-bg);
}
</style>
