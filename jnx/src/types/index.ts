export interface ToolTab {
  id: string
  label: string
  icon: string
  component: string
  pinned: boolean
  desc?: string
  /** 所属分类：format / network / efficiency / other */
  category?: CategoryId
  /** 分类内排序权重（小在前） */
  order?: number
  /** 搜索关键词扩充 */
  keywords?: string[]
  /** true=系统工具（设置/快捷键），不展示在首页工具网格，移至 footer */
  isSystem?: boolean
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
  tool_memory_enabled: boolean
  sidebarWidth: number
  sidebarCollapsed: boolean
  [key: string]: string | number | boolean
}

/* ─── 首页分类系统 ─── */
export type CategoryId = 'format' | 'network' | 'efficiency' | 'other'

export interface CategoryMeta {
  id: CategoryId
  label: string
  icon: string
  color: string
}

export const CATEGORY_META: Record<CategoryId, CategoryMeta> = {
  format: { id: 'format', label: '格式处理', icon: 'brackets', color: 'var(--color-accent)' },
  network: { id: 'network', label: '网络工具', icon: 'terminal', color: 'var(--color-info)' },
  efficiency: { id: 'efficiency', label: '效率工具', icon: 'clock', color: 'var(--color-success)' },
  other: { id: 'other', label: '系统工具', icon: 'command', color: 'var(--color-text-secondary)' },
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
  { id: 'json', label: 'JSON 工具', icon: 'brackets', component: 'ToolJson', pinned: true, desc: 'JSON 格式化、校验与树形浏览', category: 'format', order: 0, keywords: ['json','格式化','校验','树形'] },
  { id: 'converter', label: '格式互转', icon: 'convert', component: 'ToolConverter', pinned: false, desc: 'JSON / YAML / TOML / XML / CSV 互转', category: 'format', order: 1, keywords: ['converter','格式','转换','yaml','toml','xml','csv'] },
  { id: 'curl', label: 'HTTP 请求', icon: 'terminal', component: 'ToolCurl', pinned: true, desc: '构造与发送 HTTP 请求', category: 'network', order: 0, keywords: ['http','curl','请求','发送'] },
  { id: 'clipboard', label: '剪贴板', icon: 'clipboard', component: 'ToolClipboard', pinned: false, desc: '剪贴板历史记录', category: 'efficiency', order: 0, keywords: ['clipboard','剪贴板','复制'] },
  { id: 'cron', label: 'Cron 表达式', icon: 'clock', component: 'ToolCron', pinned: false, desc: 'Cron 表达式可视化生成 / 反解析 / 人话翻译 / 运行时间预览', category: 'efficiency', order: 1, keywords: ['cron','Cron','表达式','定时','计划'] },
  { id: 'json-javabean', label: 'JSON ⇄ JavaBean', icon: 'bean', component: 'JsonJavabean', pinned: false, desc: 'JSON 与 Java Bean 互转，支持内部类 / Lombok / 多序列化框架', category: 'format', order: 2, keywords: ['json','java','javabean','pojo','class','bean','lombok','jackson','gson','fastjson','内部类','转换','生成','to json','to java','pojo生成','代码生成','javabean'], isSystem: false },
  { id: 'ddl-java', label: 'DDL ⇄ Java', icon: 'database', component: 'ToolDdlJava', pinned: false, desc: 'DDL 与 Java 实体类双向转换（MySQL / PostgreSQL / OceanBase）', category: 'format', order: 3, keywords: ['ddl','sql','java','entity','实体','表','数据库','mysql','postgresql','oceanbase','生成','转换','mybatis','mybatis-plus','jpa','lombok','逆向'], isSystem: false },
 { id: 'settings', label: '设置', icon: 'settings', component: 'ToolSettings', pinned: false, desc: '应用偏好设置', category: 'other', order: 0, keywords: ['settings','设置','配置'], isSystem: true },
  { id: 'shortcuts', label: '快捷键', icon: 'command', component: 'ToolShortcuts', pinned: false, desc: '键盘快捷键速查', category: 'other', order: 1, keywords: ['shortcuts','快捷键','按键'], isSystem: true },
]

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  tab_max_rows: 3,
  tabs_per_row: 6,
  clipboard_poll_interval: 2000,
  tool_memory_enabled: true,
  sidebarWidth: 220,
  sidebarCollapsed: false,
}
