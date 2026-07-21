<script setup lang="ts">
import { useToolsStore } from '../stores/tools'
import { ALL_TOOLS } from '../types'
import { ICONS } from '../theme/icons'
import { HOME_CHEATSHEET } from '../shortcuts'
import Kbd from '../components/Kbd.vue'

const tools = useToolsStore()

const toolCards = ALL_TOOLS.map(t => ({
  id: t.id,
  label: t.label,
  iconKey: t.icon === 'brackets' ? 'brackets' : t.icon === 'terminal' ? 'terminal' : t.icon === 'clipboard' ? 'clipboard' : t.icon === 'convert' ? 'convert' : 'settings',
  desc: t.desc || '',
}))

function openTool(id: string) { tools.setActiveTab(id) }
</script>

<template>
  <div class="home-view">
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="home-content">
      <div class="brand-area">
        <h1 class="brand-logo">✦ jnx</h1>
        <p class="brand-subtitle">开发者的随身工具箱</p>
      </div>

      <div class="card-grid">
        <div v-for="card in toolCards" :key="card.id" class="tool-card" @click="openTool(card.id)">
          <div class="card-icon-wrap">
            <span class="card-icon" v-html="ICONS[card.iconKey]"></span>
          </div>
          <div class="card-body">
            <div class="card-title">{{ card.label }}</div>
            <div class="card-desc">{{ card.desc }}</div>
          </div>
          <span class="card-chevron" v-html="ICONS.chevronRight"></span>
        </div>
      </div>

      <!-- Shortcuts -->
      <div class="shortcuts-section">
        <div class="section-header">
          <span class="section-icon" v-html="ICONS.keyboard"></span>
          <span class="section-title">快捷键速查</span>
        </div>
        <div class="shortcuts-list">
          <div v-for="s in HOME_CHEATSHEET" :key="s.action" class="shortcut-item">
            <Kbd :action="s.action" />
            <span class="shortcut-desc">{{ s.desc }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  height: 100%; display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden; padding: 24px;
}
.bg-grid {
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 39px, var(--color-grid, rgba(232,93,117,0.03)) 40px),
    repeating-linear-gradient(90deg, transparent, transparent 39px, var(--color-grid, rgba(232,93,117,0.03)) 40px);
}
.bg-glow {
  position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: 600px; height: 400px; pointer-events: none;
  background: radial-gradient(circle at center, var(--color-accent-glow, rgba(232,93,117,0.08)) 0%, transparent 60%);
}
.home-content {
  position: relative; z-index: 1; display: flex; flex-direction: column;
  align-items: center; width: 100%; max-width: 600px; gap: 32px;
}
.brand-area { text-align: center; }
.brand-logo {
  font-size: 32px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 6px; line-height: 1.2;
  background: linear-gradient(135deg, var(--color-accent, #E85D75), var(--color-accent-light, #FFB6C1));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.brand-subtitle { font-size: 14px; color: var(--color-text-secondary, #6A5A60); font-weight: 400; margin: 0; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; width: 100%; }
.tool-card {
  display: flex; align-items: center; gap: 14px; padding: 18px 20px;
  background: var(--color-surface, #FFF);
  border: 1px solid var(--color-border, rgba(232,93,117,0.12));
  border-radius: 14px; cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  box-shadow: 0 1px 3px var(--color-shadow, rgba(232,93,117,0.06));
}
.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px var(--color-shadow, rgba(232,93,117,0.15));
  border-color: var(--color-accent-light, #FFB6C1);
}
.tool-card:hover .card-icon-wrap { transform: translateY(-2px) scale(1.05); }
.card-icon-wrap {
  width: 44px; height: 44px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-accent, #E85D75), var(--color-accent-light, #FFB6C1));
  transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
}
.card-icon { width: 22px; height: 22px; color: #FFF; display: flex; }
.card-icon :deep(svg) { width: 100%; height: 100%; }
.card-body { flex: 1; min-width: 0; }
.card-title { font-size: 16px; font-weight: 700; color: var(--color-text-primary, #2D2528); margin-bottom: 3px; line-height: 1.3; }
.card-desc { font-size: 13px; color: var(--color-text-secondary, #6A5A60); line-height: 1.4; }
.card-chevron { width: 18px; height: 18px; flex-shrink: 0; color: var(--color-text-tertiary, #A8989E); display: flex; transition: transform 0.2s; }
.tool-card:hover .card-chevron { transform: translateX(3px); color: var(--color-accent, #E85D75); }
.card-chevron :deep(svg) { width: 100%; height: 100%; }

.shortcuts-section {
  width: 100%; padding: 20px;
  background: var(--color-surface, #FFF);
  border: 1px solid var(--color-border, rgba(232,93,117,0.08));
  border-radius: 14px;
}
.section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.section-icon { width: 18px; height: 18px; color: var(--color-accent, #E85D75); display: flex; }
.section-icon :deep(svg) { width: 100%; height: 100%; }
.section-title { font-size: 13px; font-weight: 600; color: var(--color-text-primary, #2D2528); text-transform: uppercase; letter-spacing: 0.5px; }
.shortcuts-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
.shortcut-item { display: flex; align-items: center; gap: 10px; }
.shortcut-keys { display: flex; gap: 3px; }
.shortcut-keys kbd {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 22px; height: 22px; padding: 0 5px; font-size: 11px;
  font-family: inherit; font-weight: 500;
  background: var(--color-card-hover, rgba(232,93,117,0.06));
  border: 1px solid var(--color-border, rgba(232,93,117,0.12));
  border-radius: 5px; color: var(--color-text-secondary, #6A5A60);
}
.shortcut-desc { font-size: 13px; color: var(--color-text-secondary, #6A5A60); }
</style>
