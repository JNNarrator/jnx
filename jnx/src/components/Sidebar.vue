<script setup lang="ts">
import { ref, onBeforeUnmount, watch } from 'vue'
import { useToolsStore } from '../stores/tools'
import { useSettingsStore } from '../stores/settings'
import { ICONS } from '../theme/icons'
import { ALL_TOOLS, HOME_TAB } from '../types'

/* ─── 宽度常量 ─── */
const DEFAULT_WIDTH = 220       // 与当前固定宽一致（零回归）
const MIN_WIDTH = 180            // 保证最长导航文字不截断
const MAX_WIDTH = 480            // JS 侧硬上限；CSS 侧再加 min(40vw) 兜底
const COLLAPSED_WIDTH = 60       // 折叠图标条宽
const SNAP_THRESHOLD = 140       // 展开态拖到该值以下松手则折叠
const KEYBOARD_STEP = 8          // ←/→ 步长 px

const tools = useToolsStore()
const settings = useSettingsStore()

/* ─── 拖拽状态（不触发响应式重渲染的拖拽中变量） ─── */
let _startX = 0
let _startWidth = DEFAULT_WIDTH
let _rafId: number | null = null
let _overlayEl: HTMLDivElement | null = null
let _pointerId = 0
let _isDragging = false

/* ─── 响应式状态（仅在 mouseup/键盘时写入） ─── */
const sidebarWidth = ref(DEFAULT_WIDTH)
const isCollapsed = ref(false)
const isResizing = ref(false)
const willCollapse = ref(false)

/* ─── 从 settings store 加载初值 ─── */
watch(() => settings.loaded, (loaded) => {
  if (!loaded) return
  const w = settings.values.sidebarWidth as number || DEFAULT_WIDTH
  const c = settings.values.sidebarCollapsed as boolean || false
  sidebarWidth.value = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, w))
  isCollapsed.value = c
  syncCSS(c, sidebarWidth.value, false)
}, { immediate: true })

/* ─── CSS 变量同步 ───
 * 参数：
 *   collapsed – 折叠态
 *   width     – 展开态宽度（仅 collapsed=false 时生效）
 *   transition – 是否允许 CSS transition（离散动作=true,拖拽中=false）
 */
function syncCSS(collapsed: boolean, width: number, transition: boolean) {
  const w = collapsed ? COLLAPSED_WIDTH : width
  const root = document.documentElement
  if (!transition) root.style.setProperty('transition', 'none')
  root.style.setProperty('--sidebar-w', `${w}px`)
  if (!transition) {
    root.offsetHeight
    root.style.removeProperty('transition')
  }
}

/* ─── Nav items  ─── */
const navItems = [
  HOME_TAB,
  ...ALL_TOOLS.filter(t => !t.isSystem).slice().sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
  ...ALL_TOOLS.filter(t => t.isSystem).slice().sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
]

function navigate(id: string) {
  tools.setActiveTab(id)
}

/* ─── 折叠按钮 ─── */
function toggleCollapse() {
  const next = !isCollapsed.value
  isCollapsed.value = next
  syncCSS(next, sidebarWidth.value, true)
  void settings.update('sidebarCollapsed', next)
}

/* ─── 拖拽 ─── */
function startResize(e: PointerEvent) {
  if (isCollapsed.value) return
  if (e.button !== 0) return

  _startX = e.clientX
  _startWidth = parseSidebarWidth() || sidebarWidth.value
  _pointerId = e.pointerId
  _isDragging = true

  isResizing.value = true
  willCollapse.value = false
  syncCSS(false, _startWidth, false)

  _overlayEl = document.createElement('div')
  _overlayEl.className = 'resize-overlay'
  document.body.appendChild(_overlayEl)
  document.body.classList.add('is-resizing')

  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  ;(e.target as HTMLElement).addEventListener('pointermove', onPointerMove)
  ;(e.target as HTMLElement).addEventListener('pointerup', onPointerUp)
  ;(e.target as HTMLElement).addEventListener('pointercancel', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  if (!_isDragging) return
  if (_rafId !== null) return
  _rafId = requestAnimationFrame(() => {
    _rafId = null
    if (!_isDragging) return

    const max = Math.min(MAX_WIDTH, window.innerWidth * 0.4)
    const raw = _startWidth + (e.clientX - _startX)
    const w = Math.max(SNAP_THRESHOLD, Math.min(max, raw))
    willCollapse.value = raw < SNAP_THRESHOLD
    syncCSS(false, w, false)
  })
}

function onPointerUp(_e: PointerEvent) {
  if (!_isDragging) return
  endResize()
}

function endResize() {
  _isDragging = false

  if (_rafId !== null) { cancelAnimationFrame(_rafId); _rafId = null }

  if (_overlayEl && _overlayEl.parentNode) {
    _overlayEl.parentNode.removeChild(_overlayEl)
  }
  _overlayEl = null

  document.body.classList.remove('is-resizing')

  ;(document.querySelectorAll('.resize-handle') as NodeListOf<HTMLElement>).forEach(el => {
    el.removeEventListener('pointermove', onPointerMove)
    el.removeEventListener('pointerup', onPointerUp)
    el.removeEventListener('pointercancel', onPointerUp)
    try { el.releasePointerCapture(_pointerId) } catch {}
  })

  const finalWidth = parseSidebarWidth() || sidebarWidth.value

  if (willCollapse.value || finalWidth < SNAP_THRESHOLD) {
    isCollapsed.value = true
    willCollapse.value = false
    syncCSS(true, sidebarWidth.value, true)
    void settings.update('sidebarCollapsed', true)
  } else {
    const clamped = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, finalWidth))
    sidebarWidth.value = clamped
    isCollapsed.value = false
    syncCSS(false, clamped, true)
    void settings.update('sidebarWidth', clamped)
    void settings.update('sidebarCollapsed', false)
  }

  isResizing.value = false
}

function parseSidebarWidth(): number | null {
  const raw = document.documentElement.style.getPropertyValue('--sidebar-w')
  if (!raw) return null
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : null
}

/* ─── 键盘 ─── */
function keyboardAdjust(delta: number) {
  if (isCollapsed.value) return
  const max = Math.min(MAX_WIDTH, window.innerWidth * 0.4)
  const w = Math.max(MIN_WIDTH, Math.min(max, sidebarWidth.value + delta))
  sidebarWidth.value = w
  syncCSS(false, w, true)
  void settings.update('sidebarWidth', w)
  void settings.update('sidebarCollapsed', false)
}

function keyboardSet(w: number) {
  const max = Math.min(MAX_WIDTH, window.innerWidth * 0.4)
  const clamped = Math.max(MIN_WIDTH, Math.min(max, w))
  sidebarWidth.value = clamped
  syncCSS(false, clamped, true)
  void settings.update('sidebarWidth', clamped)
  void settings.update('sidebarCollapsed', false)
}

onBeforeUnmount(() => {
  if (_isDragging) endResize()
})
</script>

<template>
  <aside
    class="sidebar"
    :class="{
      collapsed: isCollapsed,
      'is-resizing': isResizing,
      'will-collapse': willCollapse,
    }"
  >
    <nav class="nav-list">
      <template v-for="item in navItems" :key="item.id">
        <div v-if="item.isSystem && item !== navItems[0]" class="nav-divider"></div>
        <button
          class="nav-item"
          :class="{ active: tools.activeTabId === item.id }"
          @click="navigate(item.id)"
          :title="isCollapsed ? item.label : ''"
        >
          <span class="nav-icon" v-html="ICONS[item.icon]"></span>
          <span class="nav-label" v-show="!isCollapsed">{{ item.label }}</span>
        </button>
      </template>
    </nav>

    <button
      class="collapse-btn"
      @click="toggleCollapse"
      :title="isCollapsed ? '展开侧栏' : '折叠侧栏'"
    >
      <span class="collapse-icon" v-html="ICONS[isCollapsed ? 'collapseRight' : 'collapseLeft']"></span>
    </button>

    <div
      v-show="!isCollapsed"
      class="resize-handle"
      role="separator"
      aria-orientation="vertical"
      :aria-valuenow="sidebarWidth"
      aria-valuemin="180"
      aria-valuemax="480"
      tabindex="0"
      @pointerdown="startResize"
      @keydown.left.prevent="keyboardAdjust(-KEYBOARD_STEP)"
      @keydown.right.prevent="keyboardAdjust(KEYBOARD_STEP)"
      @keydown.home.prevent="keyboardSet(MIN_WIDTH)"
      @keydown.end.prevent="keyboardSet(MAX_WIDTH)"
      title="拖拽调宽 / ←→ 键盘调宽"
    ></div>
  </aside>
</template>

<style scoped>
.sidebar {
  --sidebar-min: 180px;
  --sidebar-max: 480px;

  position: relative;
  min-width: 60px;
  width: min(var(--sidebar-w, 220px), 40vw, var(--sidebar-max));
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-sidebar);
  border-right: 1px solid var(--color-border);
  overflow: hidden;
  z-index: 10;

  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar.is-resizing {
  transition: none;
}
.sidebar.collapsed {
  width: 60px;
}
.sidebar.will-collapse .nav-label {
  opacity: 0;
  transition: opacity 0.15s;
}

@media (prefers-reduced-motion: reduce) {
  .sidebar {
    transition: none;
  }
}

.nav-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 8px;
  overflow-y: auto;
}
.nav-divider {
  height: 1px;
  background: var(--color-border);
  margin: 6px 12px;
  flex-shrink: 0;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  white-space: nowrap;
  position: relative;
  flex-shrink: 0;
}
.nav-item:hover {
  background: var(--color-card-hover);
  color: var(--color-text-primary);
}
.nav-item.active {
  background: var(--color-card-hover);
  color: var(--color-accent);
  font-weight: 600;
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  border-radius: 0 3px 3px 0;
  background: var(--color-accent);
}
.nav-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: currentColor;
}
.nav-icon :deep(svg) { width: 100%; height: 100%; }
.nav-label {
  font-size: 14px;
  line-height: 1;
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  border: none;
  border-top: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: color 0.15s;
  flex-shrink: 0;
}
.collapse-btn:hover { color: var(--color-accent); }
.collapse-icon { width: 20px; height: 20px; display: flex; align-items: center; }
.collapse-icon :deep(svg) { width: 100%; height: 100%; }

.resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  z-index: 15;
  background: transparent;
}
.resize-handle::before {
  content: '';
  position: absolute;
  left: -3px;
  right: -3px;
  top: 0;
  bottom: 0;
}
.resize-handle:hover::after,
.sidebar.is-resizing .resize-handle::after {
  content: '';
  position: absolute;
  left: 1px;
  right: 1px;
  top: 8px;
  bottom: 8px;
  border-radius: 2px;
  background: var(--color-accent);
  opacity: 0.4;
  transition: opacity 0.15s;
}
.sidebar.is-resizing .resize-handle::after {
  opacity: 0.7;
}
</style>
