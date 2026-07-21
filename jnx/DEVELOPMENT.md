# jnx 开发指南

jnx 是一个基于 Tauri v2 + Vue 3 + TypeScript 的桌面开发者工具箱，提供 JSON 工具、HTTP 请求、剪贴板历史等功能。仓库根在 `jnx/` 的上层目录（即 Git 仓库根），实际应用源码在 `jnx/` 子目录内。

仓库地址：<https://github.com/JNNarrator/jnx>

---

## 技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| 桌面壳 | **Tauri v2** | Rust 后端 + WebView 前端，跨平台（macOS / Windows） |
| 前端框架 | **Vue 3** (Composition API + `<script setup>`) | SFC 组件 |
| 语言 | **TypeScript** ~5.6 | 全栈类型安全 |
| 构建 | **Vite 6** + **vue-tsc** | 开发服务器 `:1420`，Tauri 定制配置 |
| 状态管理 | **Pinia** | 6 个 Store 各司其职 |
| UI 组件库 | **Naive UI** | `NConfigProvider` + `NMessageProvider`，主题与字体通过 `themeOverrides` 注入 |
| CSS 变量 | 自定义主题系统 | **light / dark 两套**（已移除 pink / system） |
| 持久化 | SQLite (`tauri-plugin-sql`) | `settings` 表（KV）+ `clipboard_history` 表 |
| 包管理 | npm | node >=18 |
| Rust 依赖 | reqwest 0.12, serde, tauri-plugin-* | HTTP 请求、快捷键、系统信息等 |
| 快捷键 | 自研 `useKeyboardShortcut` 系统 | 平台感知（mod = ⌘/Ctrl）、可自定义覆盖、冲突检测 |
| 字体 | **JetBrains Mono**（本地 woff2 自托管） | `@font-face` 在 `assets/styles/fonts.css` 声明，`main.ts` 引入；Naive UI themeOverrides 同步注入 |
| CI/CD | **GitHub Actions** | macOS（aarch64 + x86_64）与 Windows（x86_64）两条流水线，`tauri-action` 构建并发布草稿 Release |

---

## 仓库布局

```
jnx/                           # Git 仓库根
├── .github/workflows/         # CI 流水线
│   ├── build-macos.yml        # macOS aarch64 + x86_64 双架构构建
│   └── build-windows.yml      # Windows x86_64 构建
├── .gitignore                 # 根级忽略（排除截图、node_modules、target、移动端图标等）
└── jnx/                       # Tauri + Vue 应用源码（所有开发都在这里）
    ├── src/                   # 前端源码
    └── src-tauri/             # Rust 后端
```

### 应用目录结构

```
jnx/
├── src/                        # 前端源码
│   ├── main.ts                 # 入口：创建 Vue 应用，挂载 Pinia，引入 fonts.css
│   ├── App.vue                 # 根组件：布局 + 主题 + 字体 + 快捷键注册
│   ├── components/             # 可复用 UI 组件
│   │   ├── TopBar.vue          # 顶栏（搜索框接 openPalette、主题切换、版本号）
│   │   ├── Sidebar.vue         # 侧边栏导航（可折叠）
│   │   ├── CommandPalette.vue  # 命令面板（Teleport 到 body，Esc/遮罩关闭，键盘可导航）
│   │   ├── JsonEditor.vue      # JSON 代码编辑器
│   │   ├── JsonTree.vue        # JSON 树形浏览器 + 搜索
│   │   ├── HeaderEditor.vue    # HTTP 请求头编辑器
│   │   ├── DraggableSplitter.vue # 可拖拽分隔条
│   │   └── Kbd.vue             # 快捷键展示组件（读运行时真实绑定）
│   ├── views/                  # 页面视图
│   │   ├── HomeView.vue        # 首页（快捷入口 + 快捷键速查，速查读真实键位）
│   │   ├── ToolJson.vue        # JSON 工具
│   │   ├── ToolCurl.vue        # HTTP 请求工具
│   │   ├── ToolClipboard.vue   # 剪贴板历史
│   │   ├── ToolSettings.vue    # 设置页（主题/标签栏/剪贴板）
│   │   └── ToolShortcuts.vue   # 快捷键自定义页（录制/冲突检测/恢复默认）
│   ├── stores/                 # Pinia 状态管理
│   │   ├── tools.ts            # 工具标签管理（打开/关闭/激活）
│   │   ├── settings.ts         # 应用设置（从 SQLite 读写）
│   │   ├── clipboard.ts        # 剪贴板历史（轮询 + 持久化）
│   │   ├── http.ts             # HTTP 请求/响应状态
│   │   ├── shortcutBindings.ts # 快捷键绑定（平台感知 + 用户覆盖 + 冲突检测）
│   │   └── commandPalette.ts   # 命令面板状态与过滤
│   ├── composables/            # Vue 组合式函数
│   │   ├── useAppShortcuts.ts  # 应用级快捷键注册 + 命令面板动作注册
│   │   ├── useHttpSend.ts      # HTTP 发送（invoke custom_fetch）
│   │   ├── useKeyboardShortcut.ts # 快捷键引擎（注册中心/分发/更新/调试日志）
│   │   └── usePlatform.ts      # 平台检测（mac/win，UA 兜底 + Tauri OS 插件修正）
│   ├── shortcuts/              # 快捷键定义
│   │   ├── index.ts            # SHORTCUTS 映射表 + 分组 + HOME_CHEATSHEET
│   │   └── types.ts            # Chord / PlatformChords / Mod 类型
│   ├── types/                  # TypeScript 类型定义
│   │   └── index.ts            # ToolTab, Settings, ClipboardItem, FlatJsonNode 等
│   ├── utils/                  # 工具函数
│   │   ├── db.ts               # SQLite 数据库操作（设置/剪贴板 CRUD）
│   │   └── parseCurl.ts        # cURL 命令解析器
│   ├── assets/                 # 静态资源
│   │   ├── fonts/              # JetBrains Mono woff2 字体文件（SIL Open Font License 1.1，自托管）
│   │   └── styles/
│   │       └── fonts.css       # @font-face 声明 + --font-mono/--font-sans 变量
│   ├── theme/                  # 主题配置
│   │   └── icons.ts            # SVG 图标集合
│   └── vite-env.d.ts           # Vite 类型声明
├── src-tauri/                  # Rust 后端
│   ├── src/
│   │   ├── main.rs             # 入口（windows_subsystem）
│   │   └── lib.rs              # Tauri Builder + 插件注册 + custom_fetch
│   ├── capabilities/
│   │   └── default.json        # 权限配置（sql, clipboard, shortcut, os）
│   ├── icons/                  # 应用图标（用 `npx @tauri-apps/cli icon` 重新生成）
│   └── tauri.conf.json         # Tauri 配置（窗口、构建、安全）
├── package.json                # npm 依赖与脚本
├── vite.config.ts              # Vite 配置（Tauri 定制）
└── tsconfig.json               # TypeScript 配置
```

---

## 6 个 Pinia Store 详解

| Store | 职责 | 关键状态 | 持久化 |
|-------|------|---------|--------|
| **tools** | 标签页管理 | activeTabId, openTabIds | 否（内存） |
| **settings** | 应用设置 | values (reactive) | SQLite settings 表 |
| **clipboard** | 剪贴板历史 | items[], watching | SQLite clipboard_history 表 |
| **http** | HTTP 请求构建 | request, response | 否（内存） |
| **shortcutBindings** | 快捷键覆盖 | overrides | SQLite settings 表（`shortcuts.overrides` 键，JSON） |
| **commandPalette** | 命令面板 | open, query, actions[] | 否（内存） |

**数据流模式**：
- 各 View 通过 `useXxxStore()` 获取 Store 实例
- Store 通过 `utils/db.ts` 与 SQLite 交互
- 设置变更通过 `settings.update()` → `setSetting()` 自动持久化
- 剪贴板轮询在 Tauri 环境下自动启动，通过 `setInterval` 调用 `@tauri-apps/plugin-clipboard-manager`
- HTTP 请求通过 `invoke('custom_fetch')` 调用 Rust 后端，绕过 CORS

---

## 快捷键系统

完全自研，不依赖第三方库。核心文件：`composables/useKeyboardShortcut.ts` 与 `shortcuts/index.ts`。

### 设计要点

- **避开系统/webview 冲突**：默认键不再使用 `⌘H`（macOS 隐藏窗口）、`⌘J`（webview 下载管理）、`⌘D`（加书签/分屏）、`⌘1`（切标签）等冲突组合；导航类统一为 `mod+Shift+X`（mac = ⌘⇧X，win = Ctrl+Shift+X）。
- **mod 抽象**：chord 用 `mod` 表示主修饰键，运行时按平台展开（mac → ⌘/meta，win → Ctrl）。
- **输入框聚焦时不一刀切**：导航/全局类键（`skipWhenEditing=false`）在 input/textarea 聚焦时仍生效；仅 `⌘C/⌘V/⌘X/⌘Z/⌘A/⌘S` 等编辑保留组合透传给浏览器原生编辑行为。
- **调试日志**：`localStorage.setItem('jnx.kbd.debug','1')` 打开后，每次按键在 console 打印 `{code, key, metaKey, ctrlKey, altKey, shiftKey, activeElementTag, editing, hitAction}`，用于区分「没收到事件」还是「收到但被默认动作覆盖」。
- **ToolCurl 仍有 `useLegacyShortcut`**：JSON 工具用新的 action 注册，HTTP 工具的部分键（`Cmd+I`/`Cmd+L`）暂走 legacy 形态以便快速调整，不进注册中心。

### 架构

1. **定义层** `shortcuts/index.ts`：
   - `SHORTCUTS` 对象：每个 action 定义 `mac`/`win` 两套 `Chord`
   - `Chord = { mods: Mod[]; key: string }`，`Mod = 'mod' | 'opt' | 'alt' | 'shift'`
   - `SHORTCUT_GROUPS`：设置页展示分组
   - `HOME_CHEATSHEET`：首页速查表展示项
   - `EDIT_RESERVED_KEYS`：输入框内透传的编辑类组合

2. **引擎层** `composables/useKeyboardShortcut.ts`：
   - 全局 `window.addEventListener('keydown', dispatch, true)` 单例（捕获阶段）
   - `registry` 数组存储所有注册的 `action → chord → handler`
   - `useKeyboardShortcut(action, handler, opts)` 注册，组件卸载时自动移除同一条目
   - `updateShortcutChord(action, chord)`：运行时注入用户自定义 chord
   - `useLegacyShortcut(def, handler)`：兼容旧形态，不进注册中心

3. **应用层** `composables/useAppShortcuts.ts`：
   - `useAppShortcuts()` 在 `App.vue` 调用，注册全局/导航/主题键（路由切换不丢失）
   - `useCommandPaletteActions()` 注册命令面板可搜索动作（页面导航 + 主题切换）
   - `watch(bindings.overrides)` 变化时调用 `updateShortcutChord` 动态更新

4. **自定义** `stores/shortcutBindings.ts`：
   - 用户在设置页覆盖任何键位
   - 覆盖值以 JSON 存储在 SQLite settings 表的 `shortcuts.overrides` 键
   - 按平台分组（`{ mac: {...}, win: {...} }`）
   - 冲突检测：同一组合不可绑两个动作；macOS 系统/webview 冲突组合给警告

### 默认快捷键（速查）

| 动作 | Mac | Windows | 说明 |
|------|-----|---------|------|
| `global.search` | ⌘K | Ctrl+K | 全局搜索面板（保留，已 preventDefault） |
| `nav.toHome` | ⌘⇧1 | Ctrl+Shift+1 | 避开 webview ⌘1 切标签 |
| `nav.toJson` | ⌘⇧J | Ctrl+Shift+J | 避开 webview ⌘J 下载页 |
| `nav.toHttp` | ⌘⇧H | Ctrl+Shift+H | 避开 macOS ⌘H 隐藏窗口 |
| `nav.toClipboard` | ⌘⇧B | Ctrl+Shift+B | |
| `nav.toSettings` | ⌘⇧S | Ctrl+Shift+S | |
| `nav.toShortcuts` | ⌘⇧/ | Ctrl+Shift+/ | |
| `theme.cycle` | ⌘⇧T | Ctrl+Shift+T | 二态切换（light↔dark） |
| `app.settings` | ⌘, | Ctrl+, | |
| `json.run` | ⌘↵ | Ctrl+Enter | |
| `json.format` | ⌘⇧F | Ctrl+Shift+F | |
| `clipboard.pin` | ⌘⇧C | Ctrl+Shift+C | |

### 添加新快捷键

1. 在 `shortcuts/index.ts` 的 `SHORTCUTS` 中定义 `mac`/`win` 两套 chord（避开冲突组合）
2. 在 `SHORTCUT_GROUPS` 中加展示分组
3. 在 `useAppShortcuts.ts` 注册 handler（全局/导航类设 `skipWhenEditing` 默认 false）
4. 首页速查若需展示，加入 `HOME_CHEATSHEET`

---

## 主题与字体

### 主题

**两套主题：light / dark**（已在 `refactor(theme)` 移除 pink 与 system）。

- 主题存储在 SQLite settings 表的 `theme` 键，值只能是 `'light' | 'dark'`
- 默认主题为 `dark`（见 `DEFAULT_SETTINGS`）
- `App.vue` 的 `watchEffect` 动态设置 `:root` 上的 CSS 变量
- Naive UI 的 `NConfigProvider` 根据 `settings.values.theme` 传入 `darkTheme`/`lightTheme`
- 组件内用 `var(--color-xxx)` 引用主题变量
- TopBar 的主题按钮为二态切换：`isDark ? 'light' : 'dark'`

### 字体

- **JetBrains Mono** 全场景使用（UI 与代码同字体），5 个字重本地 woff2 自托管（SIL Open Font License 1.1）
- `assets/styles/fonts.css` 中 `@font-face` 声明五种字重，并定义 `--font-sans`/`--font-mono`
- `main.ts` 引入 `fonts.css`
- `App.vue` 通过 `themeOverrides` 把 `fontFamily`/`fontFamilyMono` 注入 Naive UI
- `:root` 上的 `--font-sans`/`--font-mono` 供自定义组件使用
- 替换字体时把 woff2 放进 `assets/fonts/`，改 `fonts.css` 的 `@font-face` 与 `--font-*` 变量，并同步 `App.vue` 的 `themeOverrides`

---

## 命令面板 / 全局搜索

- `CommandPalette.vue` 在 `App.vue` 挂载（Teleport 到 body），不依赖条件渲染
- 三个入口都接同一个 `openPalette()`：`⌘K`/`Ctrl+K`、TopBar 搜索框 `@click`、命令面板 toggle
- 面板打开后自动 focus 输入框；`Esc` 关闭、遮罩点击关闭、`↑↓` 选择、`Enter` 执行
- z-index `99999`，`position: fixed` 居中
- `commandPalette` store 的 `register()` 在 `useAppShortcuts` 启动时填入可搜索动作
- 空查询显示全部；输入即过滤 `label`/`id`/`keywords`

---

## 数据库模式

```sql
-- 设置表（KV 存储）
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);

-- 剪贴板历史
CREATE TABLE clipboard_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    source TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

数据库初始化在 `src-tauri/src/lib.rs` 的 `Migration` 中完成。快捷键覆盖以 JSON 字符串存在 `settings.shortcuts.overrides`。

---

## Rust 后端

**入口** `src-tauri/src/main.rs` → `jnx_lib::run()`

`src-tauri/src/lib.rs` 注册的插件：

| 插件 | 用途 |
|------|------|
| `tauri-plugin-opener` | 打开外部链接 |
| `tauri-plugin-sql` | SQLite 数据库 |
| `tauri-plugin-clipboard-manager` | 剪贴板读写 |
| `tauri-plugin-os` | 操作系统信息（供 `usePlatform` 修正平台判定） |
| `tauri-plugin-global-shortcut` | 系统级快捷键（保留，当前默认键走 webview keydown） |

**自定义命令 `custom_fetch`**：
- 接收 `method, url, headers, body`
- 使用 `reqwest` 发送 HTTP 请求（绕过浏览器 CORS）
- 返回 `status, status_text, headers, body, time_ms, size_bytes`

---

## CI/CD

两条 GitHub Actions 流水线，位于仓库根 `.github/workflows/`：

| Workflow | Runner | 构建目标 | 产物 |
|----------|--------|---------|------|
| `build-macos.yml` | `macos-latest` | `aarch64-apple-darwin` + `x86_64-apple-darwin` | `.dmg` / `.app.tar.gz` |
| `build-windows.yml` | `windows-latest` | `x86_64-pc-windows-msvc` | `.msi` / `-setup.exe` |

- 触发：push 到 `master`/`main`、PR、`workflow_dispatch`
- 两条流水线均声明 `permissions: contents: write`（供 `tauri-action` 创建 Release）
- Rust target 显式列出（macOS 双架构）
- Cargo 与 npm 缓存
- 打 tag 时 `tauri-action` 自动创建草稿 Release 并挂载安装包；`upload-artifact` 同时把产物留一份在 Actions 页
- 产物路径含 target triple 层：`src-tauri/target/{triple}/release/bundle/...`，artifact globs 用 `target/*/release/bundle/**`

### 已踩过的坑

- **Windows `icon.ico` RC2176（old DIB）**：用 `npx @tauri-apps/cli icon <png>` 重新生成含 PNG 条目的 ico
- **macOS Release 创建失败 `Resource not accessible by integration`**：流水线需加 `permissions: contents: write`
- **macOS `Target x86_64-apple-darwin is not installed`**：`dtolnay/rust-toolchain` 需 `with: targets: aarch64-apple-darwin,x86_64-apple-darwin`
- **Windows artifact 路径漏 target triple**：用 `--target` 构建时产物在 `target/{triple}/release/`，不是 `target/release/`

---

## 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器 `:1420` |
| `npm run build` | TypeScript 检查（`vue-tsc --noEmit`）+ Vite 构建 |
| `npm run preview` | 预览构建产物 |
| `npm run tauri dev` | Tauri 开发模式（Vite + Rust 热重载） |
| `npm run tauri build` | 构建桌面安装包 |
| `npx @tauri-apps/cli icon <png>` | 从 PNG 重新生成全套图标（修复 ico 格式问题） |

---

## 添加新工具页

1. 在 `src/views/` 下创建 `ToolXxx.vue`
2. 在 `src/types/index.ts` 的 `ALL_TOOLS` 中添加 `ToolTab` 定义
3. 在 `src/App.vue` 的 `componentMap` 中注册组件
4. 在 `src/components/Sidebar.vue` 的 `navItems` 中添加导航项
5. 在 `src/composables/useAppShortcuts.ts` 中添加导航快捷键（可选）
6. 需要 Rust 侧依赖时编辑 `src-tauri/Cargo.toml`

---

## 编码约定

- Vue 组件使用 `<script setup lang="ts">` + Composition API
- Pinia Store 使用 `defineStore` + setup 函数风格
- CSS 变量 / 主题相关集中在 `App.vue` 的 `watchEffect`
- 组件内部样式优先 scoped，必要时用全局样式覆盖
- 快捷键一律走 `useKeyboardShortcut(action, handler)`，不直接 `addEventListener`
- 数据库操作统一通过 `utils/db.ts` 封装
- HTTP 请求用 `useHttpSend` composable，不直接前端 `fetch`
- 命名规范：PascalCase 组件/类型，camelCase 变量/函数，kebab-case CSS class
- 主题值只能是 `'light' | 'dark'`，新增主题需同步改 `Settings` 类型、`App.vue` 主题分支与 `ToolSettings` 选项，并删除对旧值的引用（避免 `cycleTheme`/命令面板写入失效值）
