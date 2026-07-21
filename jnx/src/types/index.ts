export interface ToolTab {
  id: string
  label: string
  icon: string
  component: string
  pinned: boolean
  desc?: string
}

export interface ClipboardItem {
  id?: number
  content: string
  source: string
  created_at: string
}

export interface Settings {
  theme: 'light' | 'dark'
  tab_max_rows: number
  tabs_per_row: number
  clipboard_poll_interval: number
  [key: string]: string | number
}

export interface FlatJsonNode {
  id: string
  parentId: string | null
  key: string
  value: any
  valueType: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  depth: number
  expanded: boolean
  hasChildren: boolean
  childCount: number
  path: string
}

export interface JsonParseResult {
  nodes: FlatJsonNode[]
  rootId: string
  formatted: string
}

export const HOME_TAB: ToolTab = {
  id: 'home',
  label: '首页',
  icon: 'home',
  component: 'HomeView',
  pinned: true,
  desc: '工具启动器',
}

export const ALL_TOOLS: ToolTab[] = [
  { id: 'json', label: 'JSON 工具', icon: 'brackets', component: 'ToolJson', pinned: true, desc: 'JSON 格式化、校验与树形浏览' },
  { id: 'converter', label: '格式互转', icon: 'convert', component: 'ToolConverter', pinned: true, desc: 'JSON / YAML / TOML / XML / CSV 互转' },
  { id: 'curl', label: 'HTTP 请求', icon: 'terminal', component: 'ToolCurl', pinned: true, desc: '构造与发送 HTTP 请求' },
  { id: 'clipboard', label: '剪贴板', icon: 'clipboard', component: 'ToolClipboard', pinned: true, desc: '剪贴板历史记录' },
  { id: 'settings', label: '设置', icon: 'settings', component: 'ToolSettings', pinned: true, desc: '应用偏好设置' },
  { id: 'shortcuts', label: '快捷键', icon: 'command', component: 'ToolShortcuts', pinned: true, desc: '键盘快捷键速查' },
]

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  tab_max_rows: 3,
  tabs_per_row: 6,
  clipboard_poll_interval: 2000,
}
