<script setup lang="ts">
import { computed } from 'vue'
import { useToolsStore } from '../stores/tools'
import { ALL_TOOLS } from '../types'
import { ICONS } from '../theme/icons'
import { HOME_CHEATSHEET } from '../shortcuts'
import Kbd from '../components/Kbd.vue'

const tools = useToolsStore()

// 系统项 ID（不混入工具分区）
const SYSTEM_IDS = ['settings', 'shortcuts']

// ─── 从 ALL_TOOLS 全量派生首页卡片分组，禁止手写工具条目 ───
// 工具分区：ALL_TOOLS 中非系统项全量，保留原始顺序
const toolCards = computed(() =>
  ALL_TOOLS
    .filter(t => !SYSTEM_IDS.includes(t.id))
    .map(t => ({ id: t.id, label: t.label, icon: t.icon, desc: t.desc || '' }))
)

// 系统分区：设置/快捷键等路由页，单独成组
const systemCards = computed(() =>
  ALL_TOOLS
    .filter(t => SYSTEM_IDS.includes(t.id))
    .map(t => ({ id: t.id, label: t.label, icon: t.icon, desc: t.desc || '' }))
)

function openTool(id: string) { tools.setActiveTab(id) }
</script>

<template>
  <div class="home-view">
    <!-- 装饰层：全视口背景网格 + 辉光 -->
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <!-- 统一内容容器：slogan → 分区网格 → 速查，共用同一 max-width + margin auto -->
    <div class="home-inner">
      <!-- slogan：流式标题，与网格同宽同左边界，禁止独立定位 -->
      <div class="brand-area">
        <h1 class="brand-logo">✦ JNX</h1>
        <p class="brand-subtitle">JNX · 开发者的随身工具箱</p>
      </div>

      <!-- 工具分区 -->
      <section v-if="toolCards.length > 0" class="section">
        <h2 class="section-title">工具</h2>
        <div class="card-grid">
          <div v-for="card in toolCards" :key="card.id" class="tool-card" @click="openTool(card.id)">
            <div class="card-icon-wrap">
              <span class="card-icon" v-html="ICONS[card.icon]"></span>
            </div>
            <div class="card-body">
              <div class="card-title">{{ card.label }}</div>
              <div class="card-desc">{{ card.desc }}</div>
            </div>
            <span class="card-chevron" v-html="ICONS.chevronRight"></span>
          </div>
        </div>
      </section>

      <!-- 系统分区 -->
      <section v-if="systemCards.length > 0" class="section">
        <h2 class="section-title">系统</h2>
        <div class="card-grid">
          <div v-for="card in systemCards" :key="card.id" class="tool-card" @click="openTool(card.id)">
            <div class="card-icon-wrap">
              <span class="card-icon" v-html="ICONS[card.icon]"></span>
            </div>
            <div class="card-body">
              <div class="card-title">{{ card.label }}</div>
              <div class="card-desc">{{ card.desc }}</div>
            </div>
            <span class="card-chevron" v-html="ICONS.chevronRight"></span>
          </div>
        </div>
      </section>

      <!-- 快捷键速查 -->
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
/* ─── 外层容器：唯一滚动容器，flex 撑满父级给定高度 ─── */
.home-view {
  height: 100%;
  overflow-y: auto;
  position: relative;
}

/* ─── 装饰层（全视口，不干扰内容流） ─── */
.bg-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 39px, var(--color-grid, rgba(232,93,117,0.03)) 40px),
    repeating-linear-gradient(90deg, transparent, transparent 39px, var(--color-grid, rgba(232,93,117,0.03)) 40px);
}

.bg-glow {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 400px;
  pointer-events: none;
  background: radial-gradient(circle at center, var(--color-accent-glow, rgba(232,93,117,0.08)) 0%, transparent 60%);
}

/* ─── 统一内容容器 ───
  * 所有内容块共用该容器：slogan 入流不再独立定位，
  * 网格与标题同宽同边界，禁止 slogan 与网格不同 max-width。
  * 超宽由 max-width 封顶不再加列，窄屏由 padding-inline 收敛。
  * ─── */
.home-inner {
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;
  padding: 40px 24px 56px;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* ─── slogan：流式标题，与网格同容器，禁止脱离文档流 ─── */
.brand-area {
  text-align: center;
}

.brand-logo {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 0.5px;
  margin: 0 0 6px;
  line-height: 1.2;
  background: linear-gradient(135deg, var(--color-accent, #E85D75), var(--color-accent-light, #FFB6C1));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary, #6A5A60);
  font-weight: 400;
  margin: 0;
}

/* ─── 分区 ─── */
.section {
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-secondary);
  margin: 0 0 12px;
}

/* ─── 卡片网格 ───
  * auto-fit + minmax 自收敛列数，窄屏单列 / 宽屏多列 / 超宽由 max-width 封顶。
  * 禁止写死 repeat(2)/1fr 1fr。
  * ─── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

/* ─── 工具卡片 ───
  * min-width:0 防溢出铁律；
  * 等高由 grid row stretch 保证；
  * ─── */
.tool-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: var(--color-surface, #FFF);
  border: 1px solid var(--color-border, rgba(232,93,117,0.12));
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px var(--color-shadow, rgba(232,93,117,0.06));
  min-width: 0;
}

.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px var(--color-shadow, rgba(232,93,117,0.15));
  border-color: var(--color-accent-light, #FFB6C1);
}

.tool-card:hover .card-icon-wrap {
  transform: translateY(-2px) scale(1.05);
}

.card-icon-wrap {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-accent, #E85D75), var(--color-accent-light, #FFB6C1));
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-icon {
  width: 22px;
  height: 22px;
  color: #FFF;
  display: flex;
}

.card-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.card-body {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary, #2D2528);
  margin-bottom: 3px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 描述文字 line-clamp：保证卡片等高、信息密度均匀 */
.card-desc {
  font-size: 13px;
  color: var(--color-text-secondary, #6A5A60);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-chevron {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: var(--color-text-tertiary, #A8989E);
  display: flex;
  transition: transform 0.2s;
}

.tool-card:hover .card-chevron {
  transform: translateX(3px);
  color: var(--color-accent, #E85D75);
}

.card-chevron :deep(svg) {
  width: 100%;
  height: 100%;
}

/* ─── 快捷键速查区 ─── */
.shortcuts-section {
  width: 100%;
  padding: 20px;
  background: var(--color-surface, #FFF);
  border: 1px solid var(--color-border, rgba(232,93,117,0.08));
  border-radius: 14px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.section-icon {
  width: 18px;
  height: 18px;
  color: var(--color-accent, #E85D75);
  display: flex;
}

.section-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.shortcuts-section .section-title {
  margin: 0;
}

.shortcuts-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.shortcut-desc {
  font-size: 13px;
  color: var(--color-text-secondary, #6A5A60);
}
</style>
