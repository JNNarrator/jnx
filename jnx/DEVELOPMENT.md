## jnx 开发指南

jnx 是一个基于 Tauri v2 + Vue 3 + TypeScript 的桌面开发者工具箱应用，提供 JSON 工具、HTTP 请求、剪贴板历史等功能。

---

### 技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| 桌面壳 | **Tauri v2** | Rust 后端，WebView 前端 |
| 前端框架 | **Vue 3** (Composition API + script setup) | SFC 组件 |
| 语言 | **TypeScript** ~5.6 | 全栈类型安全 |
| 构建 | **Vite 6** + **vue-tsc** | 开发服务器 :1420 |
| 状态管理 | **Pinia** | 6 个 Store 各司其职 |
| UI 组件库 | **Naive UI** | NConfigProvider + NMessageProvider |
| CSS 变量 | 自定义主题系统 | light / dark / system / pink 四套 |
| 持久化 | SQLite (tauri-plugin-sql) | 设置 + 剪贴板历史 |
| 包管理 | npm | node >=18 |
| Rust 依赖 | reqwest 0.12, serde, tauri-plugin-* | HTTP 请求、快捷键、系统信息等 |
| 快捷键 | 自研 useKeyboardShortcut 系统 | 平台感知、可自定义覆盖 |

---

### 目录结构

`
jnx/
├── src/                        # 前端源码
│   ├── main.ts                 # 入口：创建 Vue 应用，挂载 Pinia
│   ├── App.vue                 # 根组件：布局 + 主题 + 快捷键注册
│   ├── components/             # 可复用 UI 组件
│   │   ├── TopBar.vue          # 顶栏（搜索框、主题切换、版本号）
│   │   ├── Sidebar.vue         # 侧边栏导航（可折叠）
│   │   ├── CommandPalette.vue  # 命令面板（Ctrl+K 全局搜索）
│   │   ├── JsonEditor.vue      # JSON 代码编辑器
│   │   ├── JsonTree.vue        # JSON 树形浏览器 + 搜索
│   │   ├── HeaderEditor.vue    # HTTP 请求头编辑器
│   │   ├── DraggableSplitter.vue # 可拖拽分隔条
│   │   └── Kbd.vue             # 快捷键展示组件
│   ├── views/                  # 页面视图
│   │   ├── HomeView.vue        # 首页（快捷入口 + 快捷键速查）
│   │   ├── ToolJson.vue        # JSON 工具
│   │   ├── ToolCurl.vue        # HTTP 请求工具
│   │   ├── ToolClipboard.vue   # 剪贴板历史
│   │   ├── ToolSettings.vue    # 设置页
│   │   └── ToolShortcuts.vue   # 快捷键自定义页
│   ├── stores/                 # Pinia 状态管理
│   │   ├── tools.ts            # 工具标签管理（打开/关闭/激活）
│   │   ├── settings.ts         # 应用设置（从 SQLite 读写）
│   │   ├── clipboard.ts        # 剪贴板历史（轮询 + 持久化）
│   │   ├── http.ts             # HTTP 请求/响应状态
│   │   ├── shortcutBindings.ts # 快捷键绑定（平台感知 + 用户覆盖）
│   │   └── commandPalette.ts   # 命令面板状态与过滤
│   ├── composables/            # Vue 组合式函数
│   │   ├── useAppShortcuts.ts  # 应用级快捷键 + 命令面板动作
│   │   ├── useHttpSend.ts      # HTTP 发送（invoke custom_fetch）
│   │   ├── useKeyboardShortcut.ts # 快捷键引擎（注册/分发/更新）
│   │   └── usePlatform.ts      # 平台检测（mac/win）
│   ├── shortcuts/              # 快捷键定义
│   │   ├── index.ts            # SHORTCUTS 映射表 + 分组
│   │   └── types.ts            # Chord / PlatformChords 类型
│   ├── types/                  # TypeScript 类型定义
│   │   └── index.ts            # ToolTab, Settings, ClipboardItem, FlatJsonNode 等
│   ├── utils/                  # 工具函数
│   │   ├── db.ts               # SQLite 数据库操作（设置/剪贴板 CRUD）
│   │   └── parseCurl.ts        # cURL 命令解析器
│   ├── theme/                  # 主题配置
│   │   └── icons.ts            # SVG 图标集合
│   └── vite-env.d.ts           # Vite 类型声明
├── src-tauri/                  # Rust 后端
│   ├── src/
│   │   ├── main.rs             # 入口（windows_subsystem）
│   │   └── lib.rs              # Tauri Builder + 插件注册 + custom_fetch
│   ├── capabilities/
│   │   └── default.json        # 权限配置（sql, clipboard, shortcut, os）
│   ├── icons/                  # 应用图标
│   └── tauri.conf.json         # Tauri 配置（窗口、构建、安全）
├── package.json                # npm 依赖与脚本
├── vite.config.ts              # Vite 配置（Tauri 定制）
└── tsconfig.json               # TypeScript 配置
`

---

### 6 个 Pinia Store 详解

| Store | 职责 | 关键状态 | 持久化 |
|-------|------|---------|--------|
| **tools** | 标签页管理 | activeTabId, openTabIds | 否（内存） |
| **settings** | 应用设置 | values (reactive) | SQLite settings 表 |
| **clipboard** | 剪贴板历史 | items[], watching | SQLite clipboard_history 表 |
| **http** | HTTP 请求构建 | request, response | 否（内存） |
| **shortcutBindings** | 快捷键覆盖 | overrides | SQLite settings 表（JSON） |
| **commandPalette** | 命令面板 | open, query, actions[] | 否（内存） |

**数据流模式**：
- 各 View 通过 useXxxStore() 获取 Store 实例
- Store 通过 utils/db.ts 与 SQLite 交互
- 设置变更通过 settings.update() -> setSetting() 自动持久化
- 剪贴板轮询在 Tauri 环境下自动启动，通过 setInterval 调用 @tauri-apps/plugin-clipboard-manager
- HTTP 请求通过 invoke('custom_fetch') 调用 Rust 后端，绕过 CORS

---

### 快捷键系统

完全自研，不依赖第三方库。核心文件：composables/useKeyboardShortcut.ts

**架构**：

1. **定义层** shortcuts/index.ts：
   - SHORTCUTS 对象：每个 action 定义 mac/win 两套 Chord
   - Chord = { mods: Mod[], key: string }
   - 分组用于设置页展示

2. **引擎层** composables/useKeyboardShortcut.ts：
   - 全局 window.addEventListener('keydown', dispatch, true) 单例
   - egistry 数组存储所有注册的 action -> chord -> handler
   - useKeyboardShortcut(action, handler, opts) 注册快捷键，组件卸载时自动清理
   - 自动处理：编辑框内跳过、mac/win modifier 映射

3. **应用层** composables/useAppShortcuts.ts：
   - 在 App.vue 的 useAppShortcuts() 中注册全局/导航快捷键
   - 监听 indings.overrides 变化，动态更新 chord

4. **自定义** stores/shortcutBindings.ts：
   - 用户可在设置页覆盖任何快捷键
   - 覆盖值以 JSON 存储在 SQLite settings 表
   - 支持冲突检测 + 系统快捷键警告

**添加新快捷键**：
1. 在 shortcuts/index.ts 的 SHORTCUTS 中定义 mac/win 两套 chord
2. 在 SHORTCUT_GROUPS 中添加展示分组
3. 在需要响应快捷键的组件中使用 useKeyboardShortcut('your.action', handler)

---

### 主题系统

**4 套主题**：light / dark / system / pink

- 主题选择存储在 SQLite settings 表
- 通过 watchEffect 在 App.vue 中动态设置 CSS 变量（:root 上 20+ 个变量）
- Naive UI 的 NConfigProvider 根据主题传入 darkTheme / lightTheme
- data-theme 属性用于组件内 dark mode 覆盖
- 组件内使用 ar(--color-xxx) 引用主题变量
- 自定义图标组件 	heme/icons.ts（纯 SVG）

---

### 数据库模式

`sql
-- 设置表（key-value 存储）
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);

-- 剪贴板历史
CREATE TABLE clipboard_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    source TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`

数据库初始化在 src-tauri/src/lib.rs 的 Migration 中完成。

---

### Rust 后端

**入口** src-tauri/src/main.rs -> jnx_lib::run()

**src-tauri/src/lib.rs** 注册的插件：

| 插件 | 用途 |
|------|------|
| tauri-plugin-opener | 打开外部链接 |
| tauri-plugin-sql | SQLite 数据库 |
| tauri-plugin-clipboard-manager | 剪贴板读写 |
| tauri-plugin-os | 操作系统信息 |
| tauri-plugin-global-shortcut | 系统级快捷键 |

**自定义命令 custom_fetch**：
- 接收 method, url, headers, body
- 使用 reqwest 发送 HTTP 请求（绕过浏览器 CORS）
- 返回 status, status_text, headers, body, time_ms, size_bytes

---

### 开发命令

| 命令 | 说明 |
|------|------|
| npm run dev | 启动 Vite 开发服务器 :1420 |
| npm run build | TypeScript 检查 + Vite 构建 |
| npm run preview | 预览构建产物 |
| npm run tauri dev | Tauri 开发模式（Vite + Rust 热重载） |
| npm run tauri build | 构建桌面安装包 |

---

### 添加新工具页

1. 在 src/views/ 下创建 ToolXxx.vue
2. 在 src/types/index.ts 的 ALL_TOOLS 中添加 ToolTab 定义
3. 在 src/App.vue 的 componentMap 中注册组件
4. 在 src/components/Sidebar.vue 的 
avItems 中添加导航项
5. 在 src/composables/useAppShortcuts.ts 中添加导航快捷键（可选）
6. 安装 Rust 侧依赖时编辑 src-tauri/Cargo.toml

---

### 编码约定

- Vue 组件使用 <script setup lang="ts"> + Composition API
- Pinia Store 使用 defineStore + setup 函数风格
- CSS 变量 / 主题相关放在 App.vue 的 watchEffect 中
- 组件内部样式优先 scoped，必要时使用全局样式覆盖（如 dark mode）
- 快捷键使用 useKeyboardShortcut 而非原始 addEventListener
- 数据库操作统一通过 utils/db.ts 封装
- HTTP 请求使用 useHttpSend composable 而非前端 fetch
- 命名规范：PascalCase 组件/类型，camelCase 变量/函数，kebab-case CSS class
