<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToolsStore } from '../stores/tools'
import { ALL_TOOLS } from '../types'
import { ICONS } from '../theme/icons'

const tools = useToolsStore()

const sidebarCollapsed = ref(false)

// 系统项 ID（设置/快捷键等路由页，不进入工具派生循环）
const SYSTEM_IDS = ['settings', 'shortcuts'] as const

interface SidebarItem {
  type: 'home' | 'tool' | 'system' | 'separator'
  id?: string
  label?: string
  icon?: string
}

// ─── 单一派生函数：从 ALL_TOOLS 全量派生 sidebar 条目 ───
// 首页固定置顶，工具项 = ALL_TOOLS 中非系统项全量，系统项单独追加在末尾
const sidebarItems = computed<SidebarItem[]>(() => {
  const items: SidebarItem[] = [
    { type: 'home', id: 'home', label: '首页', icon: 'home' },
    ...ALL_TOOLS
      .filter(t => !(SYSTEM_IDS as readonly string[]).includes(t.id))
      .map(t => ({ type: 'tool' as const, id: t.id, label: t.label, icon: t.icon })),
  ]

  // 系统项追加在工具项之后，通过 separator 视觉分隔
  const sysItems = ALL_TOOLS.filter(t => (SYSTEM_IDS as readonly string[]).includes(t.id))
  if (sysItems.length > 0) {
    items.push({ type: 'separator' })
    items.push(...sysItems.map(t => ({ type: 'system' as const, id: t.id, label: t.label, icon: t.icon })))
  }

  // 开发期完整性断言：ALL_TOOLS 每增/删工具，sidebar 自动同步（否则报警）
  if (import.meta.env.DEV) {
    const toolCount = items.filter(i => i.type === 'tool').length
    const expected = ALL_TOOLS.filter(t => !(SYSTEM_IDS as readonly string[]).includes(t.id)).length
    if (toolCount !== expected) {
      console.warn(
        `[Sidebar] 工具项数不一致：sidebar 渲染 ${toolCount} 项，` +
        `ALL_TOOLS 有 ${expected} 项。新增/删除了工具但 Sidebar 派生未同步。`
      )
    }
  }

  return items
})

function navigate(id: string) {
  tools.setActiveTab(id)
}
</script>

<template>
  <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
    <nav class="nav-list">
      <template v-for="item in sidebarItems" :key="item.type === 'separator' ? `sep` : item.id">
        <!-- 分隔线 -->
        <div v-if="item.type === 'separator'" class="nav-separator"></div>

        <!-- 首页 / 工具项 / 系统项 -->
        <button
          v-else
          class="nav-item"
          :class="{ active: tools.activeTabId === item.id }"
          @click="navigate(item.id!)"
          :title="sidebarCollapsed ? item.label : ''"
        >
          <span class="nav-icon" v-html="ICONS[item.icon!]"></span>
          <span class="nav-label" v-show="!sidebarCollapsed">{{ item.label }}</span>
        </button>
      </template>
    </nav>

    <!-- 折叠/展开按钮 -->
    <button class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed" :title="sidebarCollapsed ? '展开' : '折叠'">
      <span class="collapse-icon" v-html="ICONS[sidebarCollapsed ? 'collapseRight' : 'collapseLeft']"></span>
    </button>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-sidebar, #FFFFFF);
  border-right: 1px solid var(--color-border, rgba(232,93,117,0.1));
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  z-index: 10;
}

.sidebar.collapsed {
  width: 60px;
}

.nav-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 8px;
  overflow-y: auto;
}

.nav-separator {
  height: 1px;
  margin: 6px 12px;
  background: var(--color-border, rgba(232,93,117,0.1));
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
  color: var(--color-text-secondary, #6A5A60);
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  white-space: nowrap;
  min-width: 0;
  position: relative;
}

.nav-item:hover {
  background: var(--color-card-hover, rgba(232,93,117,0.04));
  color: var(--color-text-primary, #2D2528);
}

.nav-item.active {
  background: var(--color-card-hover, rgba(232,93,117,0.06));
  color: var(--color-accent, #E85D75);
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
  background: var(--color-accent, #E85D75);
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

.nav-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

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
  border-top: 1px solid var(--color-border, rgba(232,93,117,0.1));
  background: transparent;
  color: var(--color-text-tertiary, #A8989E);
  cursor: pointer;
  transition: color 0.15s;
  flex-shrink: 0;
}

.collapse-btn:hover {
  color: var(--color-accent, #E85D75);
}

.collapse-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
}

.collapse-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

/* Dark theme adjustments */
:root[data-theme="dark"] .sidebar {
  background: var(--color-sidebar, #22181B);
}
</style>
