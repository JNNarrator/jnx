<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { NButton, NSpace, NEmpty, NSpin, useMessage } from 'naive-ui'
import { useClipboardStore } from '../stores/clipboard'

const clip = useClipboardStore()
const msg = useMessage()

onMounted(() => { clip.loadHistory(); clip.startWatching() })
onUnmounted(() => { clip.stopWatching() })

function copy(content: string) { navigator.clipboard.writeText(content); msg.success('已复制') }

function formatTime(ts: string) {
  const d = new Date(ts + 'Z')
  return d.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getPreview(text: string): string {
  const t = text.trim()
  return t.length <= 120 ? t : t.slice(0, 120) + '…'
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-header">
      <h2>剪贴板历史</h2>
      <NSpace>
        <span class="count-badge">{{ clip.items.length }} 条</span>
        <NButton size="tiny" :disabled="!clip.watching" @click="clip.stopWatching()">暂停</NButton>
        <NButton size="tiny" :disabled="clip.watching" @click="clip.startWatching()">监听</NButton>
        <NButton size="tiny" @click="clip.clearAll()">清空全部</NButton>
      </NSpace>
    </div>

    <div class="spin-wrap">
      <NSpin :show="clip.loading" style="height:100%;">
        <div v-if="clip.items.length === 0 && !clip.loading" class="empty-state">
          <NEmpty description="暂无剪贴板记录。复制一些内容即可自动记录。" />
        </div>
        <div v-else class="history-list">
          <div v-for="item in clip.items" :key="item.id" class="history-item" @click="copy(item.content)">
            <div class="item-content">{{ getPreview(item.content) }}</div>
            <div class="item-meta">
              <span class="item-time">{{ formatTime(item.created_at) }}</span>
              <span class="item-source">{{ item.source || '手动' }}</span>
            </div>
          </div>
        </div>
      </NSpin>
    </div>
  </div>
</template>

<style scoped>
.tool-panel {
  padding: 16px 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tool-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.tool-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-1);
}

.count-badge {
  font-size: 12px;
  color: var(--text-2);
  padding: 2px 10px;
  background: var(--hover);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.empty-state {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.spin-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.spin-wrap :deep(.n-spin-container) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.spin-wrap :deep(.n-spin-content) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.history-list {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  flex: 1;
}

.history-item {
  padding: 10px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.history-item:hover {
  background: var(--hover);
  border-color: color-mix(in srgb, var(--brand) 30%, transparent);
}

.item-content {
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.5;
  word-break: break-all;
  white-space: pre-wrap;
  color: var(--text-1);
}

.item-meta {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  font-size: 11px;
  color: var(--text-2);
}

.item-time {
  font-family: var(--font-mono);
}
</style>
