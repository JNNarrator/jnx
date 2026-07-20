# 快捷键系统使用指南

## Composable：useKeyboardShortcut

```typescript
useKeyboardShortcut(
  { key: 'Enter', mod: true, skipWhenEditing: false },
  () => executeJson()
)
```

### ShortcutDef 字段

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `key` | `string` | 必填 | `'Enter'` `'k'` `'ArrowLeft'` `'Escape'` |
| `mod` | `boolean` | `undefined` | `true`=必需 ⌘/Ctrl, `false`=禁止, `undefined`=无关 |
| `alt` | `boolean` | `undefined` | 同上，Option/Alt |
| `shift` | `boolean` | `undefined` | 同上 |
| `skipWhenEditing` | `boolean` | `true` | 焦点在 Input/Textarea 时是否跳过 |

返回一个 `unregister` 函数可手动注销。

### 与旧用法的对照

| 意图 | 旧（useShortcuts） | 新（useKeyboardShortcut） |
|------|-------------------|--------------------------|
| ⌘K | `'global.search'` | `{ key: 'k', mod: true }` |
| ⌘↵ | `'json.run'` | `{ key: 'Enter', mod: true }` |
| ⌘⇧F | `'json.format'` | `{ key: 'f', mod: true, shift: true }` |
| ⌘D 切主题 | `'theme.cycle'` | `{ key: 'd', mod: true }` |

## Tauri 配置文件（tauri.conf.json）

Tauri v2 的 `tauri.conf.json` **没有** menu 配置段。
菜单和全局快捷键均在 Rust 中声明。

### Rust 端：创建菜单（示例）

```rust
// src-tauri/src/lib.rs 或新文件 menu.rs
use tauri::menu::{MenuBuilder, SubmenuBuilder};

pub fn build_app_menu(app: &tauri::AppHandle) -> Result<()> {
    let json_sub = SubmenuBuilder::new(app, "JSON")
        .text("format-json", "格式化 JSON")
        .accelerator("CmdOrCtrl+Shift+F")  // ← 跨平台
        .text("run-json", "执行 JSON")
        .accelerator("CmdOrCtrl+Enter")
        .separator()
        .text("shortcuts-panel", "快捷键面板")
        .accelerator("CmdOrCtrl+/")
        .build()?;

    let menu = MenuBuilder::new(app)
        .item(&json_sub)
        .build()?;

    app.set_menu(menu)?;
    Ok(())
}
```

### Rust 端：全局快捷键

```rust
use tauri_plugin_global_shortcut::GlobalShortcutExt;

// 在 setup 或命令中
app.global_shortcut().register("CmdOrCtrl+Shift+Space", |_, _, event| {
    if let tauri_plugin_global_shortcut::ShortcutEvent::Pressed = event {
        // 唤起窗口
        let _ = app.get_webview_window("main").map(|w| w.set_focus());
    }
})?;
```

### accelerator 跨平台占位符

| 占位符 | Mac | Windows |
|--------|-----|---------|
| `CmdOrCtrl` | ⌘ | Ctrl |
| `Cmd` | ⌘ | — |
| `Ctrl` | ⌃ | Ctrl |
| `Option` | ⌥ | Alt |
| `Shift` | ⇧ | Shift |
| `CmdOrCtrl+Shift+F` | ⌘⇧F | Ctrl+Shift+F |

## 调试清单（5 个常见坑）

### 1. DevTools 抢占焦点
**症状**：快捷键只在 DevTools 打开时失效，关闭后恢复。
**原因**：DevTools（F12 / ⌘⌥I）捕获了 WebView 的键盘事件。
**解决**：在 Tauri 配置中禁止 DevTools 快捷键：
```json
// tauri.conf.json
{
  "app": {
    "security": {
      "devCsp": null
    }
  }
}
```
或发布版本中 DevTools 默认禁用。

### 2. IME / 中文输入法
**症状**：打拼音时误触快捷键（如按 "j" 时跳转到 JSON 工具）。
**原因**：`keydown` 事件在 IME 合成过程中也会触发。
**解决**：代码中已包含 `e.isComposing` 检查。若仍误触，确认环境是否支持 `isComposing`。
```typescript
if (e.isComposing) return  // ← 已内置
```

### 3. Macro 快捷键的 skipWhenEditing 误判
**症状**：在 JSON 编辑器的 textarea 中按下 ⌘Enter 本应格式化，但无反应。
**原因**：`skipWhenEditing: true`（默认值）跳过了 textarea 中的快捷键。
**解决**：注册编辑器快捷键时显式设置 `skipWhenEditing: false`：
```typescript
useKeyboardShortcut(
  { key: 'Enter', mod: true, skipWhenEditing: false },
  () => formatEditor()
)
```

### 4. `global-shortcut` 缺少权限
**症状**：`import('@tauri-apps/plugin-global-shortcut')` 报错或注册无反应。
**原因**：Tauri v2 必须同时满足：
- Rust 侧已 `Builder::default().plugin(tauri_plugin_global_shortcut::Builder::new().build())`
- capabilities 配置包含：
```json
"permissions": [
  "global-shortcut:default",
  "global-shortcut:allow-register",
  "global-shortcut:allow-unregister",
  "global-shortcut:allow-is-registered"
]
```

### 5. 同一组合在 menu 和 keydown 中重复注册
**症状**：快捷键触发两次或触发后菜单栏闪动。
**原因**：原生 menu accelerator 和 WebView keydown 监听器同时捕获了同一组合。
**解决**：二选一策略：页面内快捷键用 `useKeyboardShortcut`，全局命令用 RUST menu accelerator。
不要对同一组合同时使用两种方式。如需跳过 menu 的处理，可在 Rust handler 中判断焦点：
```rust
// Rust menu handler 中判断 WebView 是否聚焦
app.on_menu_event(|app, event| {
    if let Some(webview) = app.get_webview_window("main") {
        if webview.is_focused().unwrap_or(false) {
            return; // 让 WebView 内的 JS 处理
        }
    }
    // 菜单项默认行为
})
```
