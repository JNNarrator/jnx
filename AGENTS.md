# JNX — AGENTS.md

## Repo layout

```
./              # Git repo root (CI workflows in .github/)
└── jnx/        # Tauri + Vue app source — all work happens here
```

`cd jnx` before any npm/tauri command.

## Commands (run from `jnx/`)

| Purpose | Command | Notes |
|---------|---------|-------|
| Dev server | `npm run tauri dev` | Vite on `:1420`, Tauri window opens automatically |
| Typecheck + build | `npm run build` | Runs `vue-tsc --noEmit && vite build` — always run before commit |
| Preview build | `npm run preview` | |
| CI build | `gh workflow run "Build (macOS)"` + `"Build (Windows)"` | Manual trigger; also triggers on push to `master` |

No test framework, no test files, no lint/formatter config.

## Architecture

- **No router**: App.vue uses `componentMap` + `<component :is>` + KeepAlive. Add new tool: create view → register in `ALL_TOOLS` (types/index.ts) → add to `componentMap` in App.vue.
- **State**: Pinia stores (6 total: tools/settings/clipboard/http/shortcutBindings/commandPalette). SQLite via `tauri-plugin-sql` for settings + clipboard.
- **Theme**: light/dark via CSS vars on `:root`. `App.vue` watchEffect sets vars. Naive UI `NConfigProvider` synced. Theme values only `'light' | 'dark'`.
- **Naive UI primary color**: Overridden to `#E85D75` via `themeOverrides` in App.vue. All `type="primary"` NButtons are pink.
- **Keyboard shortcuts**: Custom system in `composables/useKeyboardShortcut.ts`. Actions defined in `shortcuts/index.ts`. Use `useKeyboardShortcut(action, handler)` — never raw `addEventListener`. Legacy: `useLegacyShortcut()` for ToolCurl-only keys.
- **Platform detection**: `usePlatform()` async — Tauri OS plugin with UA fallback. Use `isMac`/`isWin` refs. Module-level singleton.
- **Tool draft persistence**: `useToolDraft` composable saves tool state across sessions. Uses SQLite. Each tool defines its own draft interface.
- **HTTP client**: Calls Rust backend via `invoke('custom_fetch')` — bypasses CORS. Use `useHttpSend` composable, never frontend `fetch`.

## CodeEditor conventions

All code inputs use `CodeEditor.vue` (8 languages: json/java/yaml/toml/xml/csv/properties/plaintext). Not textarea, not NInput.

- Tab → 2-space indent / block-indent. Shift+Tab → block-outdent. Enter → auto-indent (YAML colon detection).
- Language prop is typed — must match one of the 8 supported values.
- For readonly output, use `:model-value` + `readonly`.
- Highlighters are pure-function tokenizers: strings before keywords, full span closure, `escapeHtml` for non-string segments. No cross-line state.

## ToolBar button hints

Use `<Kbd :keys="['mod', 'Enter']" />` (not `['⌘↵']`). The Kbd component translates `mod` → ⌘ (mac) / Ctrl (win). Action-based hints use `action` prop directly.

## Sidebar

Resizable via drag handle on right edge. CSS `--sidebar-w` var controls width. `MIN_WIDTH=180`, `MAX_WIDTH=480`, `SNAP_THRESHOLD=140` (auto-collapse below this). Persisted to SQLite settings.

## Adding a new tool page

1. Create `src/views/ToolXxx.vue`
2. Add its `ToolTab` entry in `src/types/index.ts` `ALL_TOOLS` (specify `category`/`order`/`keywords`/`pinned`)
3. Register in `src/App.vue` `componentMap`
4. Sidebar + home grid auto-discover from `ALL_TOOLS`
5. Optional: add navigation shortcut in `useAppShortcuts.ts`

## CI

| Workflow | Target | Artifacts |
|----------|--------|-----------|
| macOS | aarch64 + x86_64 | `.dmg` |
| Windows | x86_64 | `.msi` / `.exe` |

Trigger: push to master, PR, or `workflow_dispatch`. Creates draft GitHub Release. Requires `permissions: contents: write`.
