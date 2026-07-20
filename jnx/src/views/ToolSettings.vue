<script setup lang="ts">
import { useSettingsStore } from '../stores/settings'
import { NSelect, NInputNumber, NDivider, useMessage } from 'naive-ui'

const settings = useSettingsStore()
const msg = useMessage()

function save(key: string, value: string | number) {
  settings.update(key, value)
  msg.success('已保存')
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
            { label: '粉色特别', value: 'pink' },
            { label: '浅色', value: 'light' },
            { label: '深色', value: 'dark' },
            { label: '跟随系统', value: 'system' },
          ]"
          size="small"
          style="width: 160px"
          @update:value="(val: string) => save('theme', val)"
        />
      </div>
    </div>

    <NDivider style="border-color: rgba(255, 140, 158, 0.1)" />

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

    <NDivider style="border-color: rgba(255, 140, 158, 0.1)" />

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
  font-weight: 600;
  color: #F0E2E6;
}

.settings-section h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: #B8A6AC;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.setting-row label {
  font-size: 14px;
  color: #F0E2E6;
}

.setting-hint {
  font-size: 12px;
  color: #B8A6AC;
  margin: 4px 0 0;
}
</style>
