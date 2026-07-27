<script setup lang="ts">
import { useSsoStore } from '../stores/sso'
import { NPopover, NButton } from 'naive-ui'
import { ref, computed } from 'vue'

const sso = useSsoStore()
const showDebug = ref(false)

const hasError = computed(() => {
  const logs = sso.debugNavLogs
  return logs.length > 0 && logs[0].matches && !logs[0].ticket
})
</script>

<template>
  <div class="sso-avatar">
    <template v-if="sso.loggedIn && sso.user">
      <NPopover trigger="click" placement="bottom-end">
        <template #trigger>
          <button class="avatar-btn" :title="sso.user.nickname || sso.user.username">
            <img class="avatar-img" :src="sso.user.avatar" alt="" />
          </button>
        </template>
        <div class="user-popover">
          <img class="popover-avatar" :src="sso.user.avatar" alt="" />
          <div class="user-name">{{ sso.user.nickname || sso.user.username }}</div>
          <div class="user-detail">{{ sso.user.username }}</div>
          <div class="user-detail">{{ sso.user.email }}</div>
          <div class="user-actions">
            <NButton size="small" quaternary @click="sso.logout()">退出登录</NButton>
          </div>
        </div>
      </NPopover>
    </template>
    <template v-else>
      <button class="login-btn" :disabled="sso.loginLoading" @click="sso.startLogin()">
        {{ sso.loginLoading ? '...' : '登录' }}
      </button>
      <span v-if="sso.loginError" class="login-error" :title="sso.loginError">
        {{ sso.loginError }}
      </span>
    </template>

    <!-- Debug toggle: only visible when there are logs; click to toggle -->
    <button
      v-if="sso.debugNavLogs.length"
      class="debug-toggle"
      :class="{ alert: hasError }"
      @click="showDebug = !showDebug"
      title="SSO 调试日志"
    >
      {{ showDebug ? '✕' : '⚡' }}
    </button>

    <div v-if="showDebug && sso.debugNavLogs.length" class="sso-debug">
      <div class="sso-debug-title">SSO NAV</div>
      <div class="sso-debug-scroll">
        <div v-for="(log, i) in sso.debugNavLogs" :key="i" class="sso-debug-row">
          <span class="sso-debug-time">{{ log.time }}</span>
          <span :class="['sso-debug-match', log.matches ? 'match' : 'no-match']">
            {{ log.matches ? '✓' : '✗' }}
          </span>
          <span class="sso-debug-url" :title="log.url">{{ log.url.slice(0, 50) }}…</span>
          <span v-if="log.ticket" class="sso-debug-ticket">{{ log.ticket }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sso-avatar {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
}

.avatar-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--color-border, rgba(232,93,117,0.12));
  padding: 0;
  cursor: pointer;
  background: transparent;
  transition: border-color 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-btn:hover {
  border-color: var(--color-accent, #E85D75);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.login-btn {
  height: 30px;
  padding: 0 14px;
  border: 1px solid var(--color-border, rgba(232,93,117,0.12));
  border-radius: 8px;
  background: transparent;
  color: var(--color-accent, #E85D75);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  line-height: 1;
}

.login-btn:hover:not(:disabled) {
  background: var(--color-card-hover, rgba(232,93,117,0.04));
  border-color: var(--color-accent, #E85D75);
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-error {
  font-size: 11px;
  color: var(--danger, #E84C6F);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Debug toggle button */
.debug-toggle {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: 1px solid rgba(0,200,0,0.3);
  background: rgba(0,0,0,0.6);
  color: #0f0;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
}
.debug-toggle.alert {
  border-color: rgba(255,0,0,0.5);
  color: #f44;
}

/* Debug panel */
.sso-debug {
  position: fixed;
  bottom: 8px;
  right: 8px;
  width: 380px;
  max-height: 200px;
  background: rgba(0,0,0,0.9);
  color: #0f0;
  font: 11px/1.4 'JetBrains Mono', monospace;
  border-radius: 6px;
  padding: 6px 8px;
  z-index: 9999;
  overflow: hidden;
}
.sso-debug-title {
  font-weight: bold;
  margin-bottom: 4px;
  color: #fff;
}
.sso-debug-scroll {
  max-height: 170px;
  overflow-y: auto;
}
.sso-debug-row {
  display: flex;
  gap: 4px;
  align-items: center;
  white-space: nowrap;
}
.sso-debug-time { color: #888; flex-shrink: 0; }
.sso-debug-match { flex-shrink: 0; font-weight: bold; }
.sso-debug-match.match { color: #0f0; }
.sso-debug-match.no-match { color: #f00; }
.sso-debug-url { overflow: hidden; text-overflow: ellipsis; color: #aaa; }
.sso-debug-ticket { color: #ff0; }

.user-popover {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  min-width: 160px;
}

.popover-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-border, rgba(232,93,117,0.12));
}

.user-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary, #2D2528);
  text-align: center;
}

.user-detail {
  font-size: 12px;
  color: var(--color-text-tertiary, #A8989E);
  text-align: center;
  word-break: break-all;
}

.user-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}
</style>
