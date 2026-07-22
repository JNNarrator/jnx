<script setup lang="ts">
import { useSettingsStore } from '../stores/settings'
import { NSelect, NInputNumber, NDivider, NSwitch, NButton, useMessage } from 'naive-ui'
import { clearAllToolStates } from '../utils/db'

const settings = useSettingsStore()
const msg = useMessage()

function save(key: string, value: string | number) {
  settings.update(key, value as string | number | boolean)
  msg.success('已保存')
}

async function clearAllMemory() {
  await clearAllToolStates()
  msg.success('已清除所有工具记忆')
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-header">
      <h2>设置</h2>
    </div>

    <div class="settings-section">
      <h3>外观</h3>
      <div class="setting-row">
        <label>主题</label>
        <NSelect
          :value="settings.values.theme"
          :options="[
            { label: '浅色', value: 'light' },
            { label: '深色', value: 'dark' },
          ]"
          size="small"
          style="width: 160px"
          @update:value="(val: string) => save('theme', val)"
        />
      </div>
    </div>

    <NDivider :style="{ '--n-color': 'var(--color-border)' }" />

    <div class="settings-section">
      <h3>标签栏</h3>
      <div class="setting-row">
        <label>最大标签行数</label>
        <NInputNumber
          :value="settings.values.tab_max_rows"
          :min="1"
          :max="6"
          size="small"
          style="width: 100px"
          @update:value="(val: number | null) => val && save('tab_max_rows', val)"
        />
      </div>
      <div class="setting-row">
        <label>每行标签数</label>
        <NInputNumber
          :value="settings.values.tabs_per_row"
          :min="2"
          :max="20"
          size="small"
          style="width: 100px"
          @update:value="(val: number | null) => val && save('tabs_per_row', val)"
        />
      </div>
    </div>

    <NDivider :style="{ '--n-color': 'var(--color-border)' }" />

    <div class="settings-section">
      <h3>剪贴板</h3>
      <div class="setting-row">
        <label>轮询间隔 (毫秒)</label>
        <NInputNumber
          :value="settings.values.clipboard_poll_interval"
          :min="500"
          :max="30000"
          :step="500"
          size="small"
          style="width: 120px"
          @update:value="(val: number | null) => val && save('clipboard_poll_interval', val)"
        />
      </div>
      <p class="setting-hint">间隔越小响应越快，但 CPU 占用稍高。</p>
    </div>

    <NDivider :style="{ '--n-color': 'var(--color-border)' }" />

    <div class="settings-section">
      <h3>工具记忆</h3>
      <div class="setting-row">
        <label>自动记忆工具状态</label>
        <NSwitch
          :value="settings.values.tool_memory_enabled"
          @update:value="(val: boolean) => save('tool_memory_enabled', val ? 'true' : 'false')"
          size="small"
        />
      </div>
      <div class="setting-row" style="flex-direction: column; align-items: flex-start; gap: 8px;">
        <p class="setting-hint">启用后会自动记住各工具的最后状态（输入内容、选项位置等），重启后恢复。</p>
        <NButton size="small" tertiary @click="clearAllMemory">清除所有已记忆的状态</NButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-panel {
  padding: 16px 20px;
  height: 100%;
  overflow-y: auto;
}

.tool-header h2 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.settings-section h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.setting-row label {
  font-size: 14px;
  color: var(--color-text-primary);
}

.setting-hint {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 4px 0 0;
}
</style>
