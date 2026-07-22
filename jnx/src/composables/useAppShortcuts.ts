import { useKeyboardShortcut, updateShortcutChord } from './useKeyboardShortcut'
import { useToolsStore } from '../stores/tools'
import { useSettingsStore } from '../stores/settings'
import { useCommandPaletteStore } from '../stores/commandPalette'
import { useShortcutBindingsStore } from '../stores/shortcutBindings'
import type { ShortcutAction } from '../shortcuts'
import { watch } from 'vue'

/* 应用级快捷键统一注册入口：路由切换/组件卸载不丢失（挂在 App 根组件的 setup 里） */
export function useAppShortcuts() {
  const tools = useToolsStore()
  const settings = useSettingsStore()
  const palette = useCommandPaletteStore()
  const bindings = useShortcutBindingsStore()

  /* 全局/导航类：skipWhenEditing=false，输入框聚焦时仍生效 */
  useKeyboardShortcut('global.search',      () => palette.openPalette())
  useKeyboardShortcut('global.palette',     () => palette.toggle())
  useKeyboardShortcut('app.settings',       () => tools.setActiveTab('settings'))
  useKeyboardShortcut('app.shortcutsPanel', () => tools.setActiveTab('shortcuts'))
  useKeyboardShortcut('nav.toHome',         () => tools.setActiveTab('home'))
  useKeyboardShortcut('nav.toJson',         () => tools.setActiveTab('json'))
  useKeyboardShortcut('nav.toHttp',         () => tools.setActiveTab('curl'))
  useKeyboardShortcut('nav.toClipboard',    () => tools.setActiveTab('clipboard'))
  useKeyboardShortcut('nav.toSettings',     () => tools.setActiveTab('settings'))
  useKeyboardShortcut('nav.toShortcuts',    () => tools.setActiveTab('shortcuts'))
  useKeyboardShortcut('nav.toCron',          () => tools.setActiveTab('cron'))
  useKeyboardShortcut('nav.toConverter',    () => tools.setActiveTab('converter'))
  useKeyboardShortcut('theme.cycle',        () => cycleTheme(settings))

  /* 当用户在设置页改了绑定，把新 chord 注入到已注册的 entry */
  watch(
    () => bindings.overrides,
    () => {
      for (const action of bindings.allActions as ShortcutAction[]) {
        const chord = bindings.chordFor(action)
        updateShortcutChord(action, chord)
      }
    },
    { deep: true, immediate: true },
  )
}

function cycleTheme(settings: ReturnType<typeof useSettingsStore>) {
  const cycle = ['light', 'dark'] as const
  const cur = settings.values.theme as typeof cycle[number]
  const next = cycle[(cycle.indexOf(cur) + 1) % cycle.length]
  settings.update('theme', next)
}

/* 命令面板动作注册：页面切换 + 常用动作 */
export function useCommandPaletteActions() {
  const tools = useToolsStore()
  const settings = useSettingsStore()
  const palette = useCommandPaletteStore()

  palette.register([
    { id: 'nav.home',      label: '返回首页',    category: '导航', keywords: ['home', '首页'], action: () => tools.setActiveTab('home') },
    { id: 'nav.json',      label: 'JSON 工具',   category: '导航', keywords: ['json', '格式化'], action: () => tools.setActiveTab('json') },
    { id: 'nav.http',      label: 'HTTP 请求',    category: '导航', keywords: ['http', 'curl', '请求'], action: () => tools.setActiveTab('curl') },
    { id: 'nav.converter', label: '格式互转',     category: '导航', keywords: ['converter', '格式', '转换', 'yaml', 'toml', 'xml', 'csv'], action: () => tools.setActiveTab('converter') },
    { id: 'nav.clipboard', label: '剪贴板',       category: '导航', keywords: ['clipboard', '剪贴板'], action: () => tools.setActiveTab('clipboard') },
      { id: 'nav.cron',      label: 'Cron 表达式',   category: '导航', keywords: ['cron', 'Cron', '表达式', '定时'], action: () => tools.setActiveTab('cron') },
    { id: 'nav.settings',  label: '设置',         category: '导航', keywords: ['settings', '设置'], action: () => tools.setActiveTab('settings') },
    { id: 'nav.shortcuts', label: '快捷键',       category: '导航', keywords: ['shortcuts', '快捷键'], action: () => tools.setActiveTab('shortcuts') },
    { id: 'theme.light',   label: '主题：浅色',    category: '动作', keywords: ['theme', 'light', '浅色'], action: () => settings.update('theme', 'light') },
    { id: 'theme.dark',    label: '主题：深色',    category: '动作', keywords: ['theme', 'dark', '深色'], action: () => settings.update('theme', 'dark') },
    { id: 'theme.toggle',  label: '主题：切换',  category: '动作', keywords: ['theme', 'toggle', '切换'], action: () => cycleTheme(settings) },
  ])
}
