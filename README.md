# JNX

开发者桌面工具箱 —— 一站式解决 JSON、HTTP、格式转换、Cron 表达式等日常高频需求。

**应用源码在 [`jnx/`](./jnx) 目录下**，详细说明请参阅 [jnx/README.md](./jnx/README.md)。

---

## 仓库结构

```
.
├── .github/workflows/    # CI 流水线（macOS + Windows）
└── jnx/                  # Tauri + Vue 应用源码
    ├── src/              # Vue 前端
    └── src-tauri/        # Rust 后端
```

## 快速开始

```bash
cd jnx
npm install
npm run tauri dev
```

## 下载

前往 [Releases](https://github.com/JNNarrator/jnx/releases) 获取最新构建版本。
