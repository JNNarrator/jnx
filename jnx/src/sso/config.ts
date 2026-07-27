export const AUTH_URL = 'http://jiangnan.88933.vip/sso/login'
export const SSO_BASE = 'http://jiangnan.88933.vip/sso/api'
export const CALLBACK_URL = 'http://127.0.0.1:17320/sso/callback'
export const APP_CODE = 'jnx'

export const ENDPOINTS = {
  applyTicket: '/ticket/apply',
  refresh: '/user/refresh',
  userInfo: '/user/info',
  logout: '/user/logout',
} as const
