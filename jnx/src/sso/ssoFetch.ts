import { invoke } from '@tauri-apps/api/core'
import { SSO_BASE } from './config'
import type { R } from './types'

interface HttpResponse {
  status: number
  status_text: string
  headers: [string, string][]
  body: string
  time_ms: number
  size_bytes: number
}

export interface SsoResult<T> {
  ok: boolean
  data?: T
  error?: string
  code?: number
}

async function ssoFetch<T>(
  method: string,
  path: string,
  options?: { body?: string; token?: string },
): Promise<SsoResult<T>> {
  const headers: [string, string][] = [['Content-Type', 'application/x-www-form-urlencoded']]
  if (options?.token) {
    headers.push(['jn-token', options.token])
  }

  try {
    const res = await invoke<HttpResponse>('custom_fetch', {
      method,
      url: `${SSO_BASE}${path}`,
      headers,
      body: options?.body ?? null,
    })

    const parsed = tryParseR<T>(res.body)
    if (parsed) return parsed

    return { ok: false, error: '服务端异常', code: 500 }
  } catch (err: any) {
    return { ok: false, error: err.message || '网络错误' }
  }
}

function tryParseR<T>(body: string): SsoResult<T> | null {
  try {
    const r: R<T> = JSON.parse(body)
    if (r && typeof r.code === 'number') {
      if (r.code === 200) return { ok: true, data: r.data }
      return { ok: false, error: r.msg || '请求失败', code: r.code }
    }
  } catch {}
  return null
}

export { ssoFetch }
