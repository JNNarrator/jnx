<script setup lang="ts">
import { ref } from 'vue'
import { useToolsStore } from '../stores/tools'
import { ICONS } from '../theme/icons'

const tools = useToolsStore()

const sidebarCollapsed = ref(false)

const navItems = [
  { id: 'home', label: '首页', iconKey: 'home' },
  { id: 'json', label: 'JSON 工具', iconKey: 'brackets' },
  { id: 'converter', label: '格式互转', iconKey: 'convert' },
  { id: 'curl', label: 'HTTP 请求', iconKey: 'terminal' },
  { id: 'clipboard', label: '剪贴板', iconKey: 'clipboard' },
  { id: 'settings', label: '设置', iconKey: 'settings' },
  { id: 'shortcuts', label: '快捷键', iconKey: 'command' },
]

function navigate(id: string) {
  tools.setActiveTab(id)
}
</script>

<template>
  <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
    <!-- Navigation items -->
    <nav class="nav-list">
      <button
        v-for="item in navItems"
        :key="item.id"
        class="nav-item"
        :class="{ active: tools.activeTabId === item.id }"
        @click="navigate(item.id)"
        :title="sidebarCollapsed ? item.label : ''"
      >
        <span class="nav-icon" v-html="ICONS[item.iconKey]"></span>
        <span class="nav-label" v-show="!sidebarCollapsed">{{ item.label }}</span>
      </button>
    </nav>

    <!-- Collapse toggle at bottom -->
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
