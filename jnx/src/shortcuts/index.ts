import type { PlatformChords } from './types'

/* ─── 按意图定义的快捷键映射表 ───
 * 默认键已全部避开 macOS 系统/webview 冲突组合（⌘H/⌘J/⌘D/⌘1 等）：
 * - mac: ⌘+Option/Shift 组合
 * - win/linux: Ctrl+Shift 组合
 * 数字键导航一律加 Option/Shift，避免与 webview 标签页快捷键撞车。
 */
export const SHORTCUTS = {
  /* 全局 */
  'global.search':         { mac: { mods: ['mod'], key: 'k' },           win: { mods: ['mod'], key: 'k' } },
  'global.palette':        { mac: { mods: ['mod','shift'], key: 'p' },   win: { mods: ['mod','shift'], key: 'p' } },
  'app.settings':          { mac: { mods: ['mod'], key: ',' },           win: { mods: ['mod'], key: ',' } },
  'app.shortcutsPanel':    { mac: { mods: ['mod'], key: '/' },           win: { mods: ['mod'], key: '/' } },
  'nav.toHome':            { mac: { mods: ['mod','shift'], key: '1' },   win: { mods: ['mod','shift'], key: '1' } },
  'nav.toJson':            { mac: { mods: ['mod','shift'], key: 'j' },   win: { mods: ['mod','shift'], key: 'j' } },
  'nav.toHttp':            { mac: { mods: ['mod','shift'], key: 'h' },   win: { mods: ['mod','shift'], key: 'h' } },
  'nav.toClipboard':       { mac: { mods: ['mod','shift'], key: 'b' },   win: { mods: ['mod','shift'], key: 'b' } },
  'nav.toSettings':        { mac: { mods: ['mod','shift'], key: 's' },   win: { mods: ['mod','shift'], key: 's' } },
  'nav.toShortcuts':       { mac: { mods: ['mod','shift'], key: '/' },   win: { mods: ['mod','shift'], key: '/' } },
  'nav.toggleSidebar':     { mac: { mods: ['mod'], key: '\\' },          win: { mods: ['mod'], key: '\\' } },

  /* 主题：避开 ⌘D（加书签/分屏），用 ⌘Shift+T 或 ⌘Option+T */
  'theme.cycle':           { mac: { mods: ['mod','shift'], key: 't' },   win: { mods: ['mod','shift'], key: 't' } },

  /* jnx 业务：编辑器内快捷键 */
  'json.run':              { mac: { mods: ['mod'], key: 'Enter' },        win: { mods: ['mod'], key: 'Enter' } },
  'json.format':           { mac: { mods: ['mod','shift'], key: 'f' },    win: { mods: ['mod','shift'], key: 'f' } },
  'clipboard.pin':         { mac: { mods: ['mod','shift'], key: 'c' },    win: { mods: ['mod','shift'], key: 'c' } },
} as const satisfies Record<string, PlatformChords>

export type ShortcutAction = keyof typeof SHORTCUTS

/* ─── 分组（用于速查表与设置页） ─── */
export const SHORTCUT_GROUPS = [
  {
    name: '全局',
    items: [
      { action: 'global.search',      label: '全局搜索' },
      { action: 'global.palette',     label: '命令面板' },
      { action: 'app.settings',       label: '打开设置' },
      { action: 'app.shortcutsPanel', label: '快捷键面板' },
      { action: 'nav.toggleSidebar',  label: '切换侧栏' },
    ],
  },
  {
    name: '导航',
    items: [
      { action: 'nav.toHome',      label: '返回首页' },
      { action: 'nav.toJson',      label: 'JSON 工具' },
      { action: 'nav.toHttp',      label: 'HTTP 请求' },
      { action: 'nav.toClipboard', label: '剪贴板' },
      { action: 'nav.toSettings',  label: '设置页' },
      { action: 'nav.toShortcuts', label: '快捷键页' },
      { action: 'theme.cycle',     label: '切换主题' },
    ],
  },
  {
    name: '工具内动作',
    items: [
      { action: 'json.run',      label: '执行 JSON' },
      { action: 'json.format',   label: '美化 JSON' },
      { action: 'clipboard.pin', label: '固定剪贴板条目' },
    ],
  },
]

/* 速查表首屏展示项（首页「快捷键速查」用） */
export const HOME_CHEATSHEET: { action: ShortcutAction; desc: string }[] = [
  { action: 'global.search', desc: '全局搜索' },
  { action: 'nav.toJson',    desc: 'JSON 工具' },
  { action: 'nav.toHttp',    desc: 'HTTP 请求' },
  { action: 'theme.cycle',   desc: '切换主题' },
  { action: 'nav.toHome',    desc: '返回首页' },
]

/* 编辑类保留组合：即使焦点在输入框也允许透传给浏览器原生编辑行为，不打断 */
export const EDIT_RESERVED_KEYS = new Set([
  'c', 'v', 'x', 'z', 'a', 's',
])
