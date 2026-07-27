import { defineStore } from 'pinia'
import { ref } from 'vue'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { Store } from '@tauri-apps/plugin-store'
import { AUTH_URL, CALLBACK_URL, ENDPOINTS, APP_CODE } from '../sso/config'
import { ssoFetch } from '../sso/ssoFetch'
import type { UserInfo, TokenResponse } from '../sso/types'

const STORE_FILE = 'sso.json'
const REFRESH_MS = 3 * 24 * 60 * 60 * 1000

export const useSsoStore = defineStore('sso', () => {
  const token = ref('')
  const user = ref<UserInfo | null>(null)
  const loginLoading = ref(false)
  const loggedIn = ref(false)
  const loginError = ref('')
  interface NavLog {
    time: string
    url: string
    matches: boolean
    ticket: string | null
  }
  const debugNavLogs = ref<NavLog[]>([])

  let fsStore: Store | null = null
  let refreshTimer: ReturnType<typeof setInterval> | null = null

  async function getFsStore(): Promise<Store> {
    if (!fsStore) fsStore = await Store.load(STORE_FILE)
    return fsStore
  }

  async function init() {
    await listen<any>('sso-debug-nav', (event) => {
      const d = event.payload
      debugNavLogs.value.unshift({
        time: new Date().toLocaleTimeString(),
        url: d.url,
        matches: d.matches,
        ticket: d.ticket || null,
      })
      if (debugNavLogs.value.length > 10) debugNavLogs.value.length = 10
      console.log('[SSO NAV]', d.url, 'matches:', d.matches, 'ticket:', d.ticket)
    })

    await listen<{ ticket: string }>('sso-ticket', (event) => {
      console.log('[SSO] received sso-ticket event, ticket:', event.payload.ticket)
      applyTicket(event.payload.ticket)
    })

    await listen('sso-login-cancelled', () => {
      console.log('[SSO] login cancelled (window closed)')
      loginLoading.value = false
    })

    const store = await getFsStore()
    const saved = await store.get<string>('jn-token')
    if (!saved) return

    const res = await ssoFetch<UserInfo>('GET', ENDPOINTS.userInfo, { token: saved })
    if (res.ok && res.data) {
      token.value = saved
      user.value = res.data
      loggedIn.value = true
      startRefreshTimer()
    } else {
      await store.delete('jn-token')
      await store.save()
    }
  }

  async function applyTicket(ticket: string) {
    if (!ticket) {
      console.warn('[SSO] applyTicket called with empty ticket')
      loginLoading.value = false
      return
    }
    console.log('[SSO] applying ticket:', ticket)
    try {
      const res = await ssoFetch<TokenResponse>('POST', ENDPOINTS.applyTicket, {
        body: `ticket=${encodeURIComponent(ticket)}`,
      })
      console.log('[SSO] applyTicket response:', res)
      if (!res.ok || !res.data?.token) {
        loginError.value = res.error || '换取 token 失败'
        console.error('[SSO] applyTicket failed:', res.error, 'code:', res.code)
        return
      }

      token.value = res.data.token
      const store = await getFsStore()
      await store.set('jn-token', token.value)
      await store.save()

      const userRes = await ssoFetch<UserInfo>('GET', ENDPOINTS.userInfo, { token: token.value })
      console.log('[SSO] userInfo response:', userRes)
      if (userRes.ok && userRes.data) {
        user.value = userRes.data
        loggedIn.value = true
        loginError.value = ''
        startRefreshTimer()
        console.log('[SSO] login successful! user:', userRes.data.username)
      } else {
        loginError.value = userRes.error || '获取用户信息失败'
        console.error('[SSO] userInfo failed:', userRes.error)
      }
    } catch (err: any) {
      loginError.value = err.message || '登录过程异常'
      console.error('[SSO] applyTicket exception:', err)
    } finally {
      loginLoading.value = false
    }
  }

  async function startLogin() {
    if (loginLoading.value) return
    loginLoading.value = true
    loginError.value = ''

    const fullUrl = `${AUTH_URL}?client=${APP_CODE}&redirect=${encodeURIComponent(CALLBACK_URL)}`
    console.log('[SSO] opening login window:', fullUrl)
    try {
      await invoke('open_sso_login', { authUrl: fullUrl, callbackUrl: CALLBACK_URL })
      // Don't reset loginLoading here — it will be reset by applyTicket or sso-login-cancelled
    } catch (err: any) {
      // Window creation failed — reset loading
      loginLoading.value = false
      loginError.value = '无法打开登录窗口'
      console.error('[SSO] open_sso_login failed:', err)
    }
  }

  async function logout() {
    if (token.value) {
      await ssoFetch('POST', ENDPOINTS.logout, { token: token.value })
    }
    clearState()
  }

  async function refreshToken() {
    if (!token.value) return
    await ssoFetch('POST', ENDPOINTS.refresh, { token: token.value })
  }

  function clearState() {
    token.value = ''
    user.value = null
    loggedIn.value = false
    loginError.value = ''
    stopRefreshTimer()
    getFsStore().then(async (store) => {
      await store.delete('jn-token')
      await store.save()
    })
  }

  function startRefreshTimer() {
    stopRefreshTimer()
    refreshTimer = setInterval(refreshToken, REFRESH_MS)
  }

  function stopRefreshTimer() {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  return {
    token, user, loginLoading, loggedIn, loginError, debugNavLogs,
    init, startLogin, logout, refreshToken,
  }
})
