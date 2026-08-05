# JNX — 开发者桌面工具箱

> 一个基于 Tauri v2 的跨平台桌面工具集，为开发者日常工作中零散但高频的需求提供一站式解决方案。

---

## 功能一览

| 工具 | 说明 |
|------|------|
| **JSON 工具** | 格式化/压缩/校验 + 树形浏览、搜索、路径导航 |
| **HTTP 客户端** | 发送 HTTP 请求（支持 GET/POST/PUT/DELETE 等）、cURL 命令导入、响应预览 |
| **格式互转** | JSON / YAML / TOML / XML / CSV / Properties 双向转换，实时模式、自动扁平化 |
| **Cron 表达式** | 可视化构建 + 多方言支持 + 自然语言描述 + 最近运行时间推算 |
| **JSON ⇄ JavaBean** | JSON 生成 Java 类（支持 Lombok、多框架注解） / Java 源码生成示例 JSON |
| **剪贴板历史** | 监听系统剪贴板，保存历史记录，快速回贴 |
| **快捷键设置** | 所有工具快捷键可视化查看与自定义 |

所有代码输入框均支持**语法高亮**（JSON / Java / YAML / TOML / XML / CSV / Properties / SQL / Plaintext），行号显示，Tab 缩进，Enter 自动缩进。

---

## 技术栈

| 层 | 技术 |
|----|------|
| 桌面壳 | Tauri v2（Rust 后端 + WebView 前端） |
| 前端框架 | Vue 3 (Composition API + `<script setup>`) |
| 语言 | TypeScript |
| 构建 | Vite 6 |
| 状态管理 | Pinia |
| UI 组件库 | Naive UI（浅色/深色双主题） |
| 持久化 | SQLite |
| 字体 | JetBrains Mono |
| CI/CD | GitHub Actions（macOS + Windows） |

---

## 快速开始

```bash
# 1. 克隆并进入
git clone https://github.com/JNNarrator/jnx.git
cd jnx/jnx

# 2. 安装前端依赖
npm install

# 3. 启动开发模式（需要 Tauri 环境）
npm run tauri dev
```

### 构建生产版本

```bash
npm run tauri build
```

输出在 `src-tauri/target/release/bundle/` 下。

---

## 下载

前往 [Releases](https://github.com/JNNarrator/jnx/releases) 下载最新版本：

- macOS: `.dmg`（Apple Silicon / Intel 双架构）
- Windows: `.msi` / `.exe`

---

## 开发指南

详见 [DEVELOPMENT.md](./DEVELOPMENT.md)。

---

## License

MIT
