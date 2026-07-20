import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'

export function useHttpSend() {
  const loading = ref(false)

  async function send(req: {
    method: string
    url: string
    headers: Array<{ key: string; value: string; enabled: boolean }>
    body: string
  }) {
    loading.value = true
    const start = performance.now()

    const headersArr: [string, string][] = []
    for (const h of req.headers) {
      if (h.enabled && h.key) headersArr.push([h.key, h.value])
    }

    const dump = [`${req.method} ${req.url}`, ...headersArr.map(([k, v]) => `${k}: ${v}`)]
    console.log('[HTTP] === CUSTOM FETCH DUMP ===\n' + dump.join('\n') + '\n==============================')

    try {
      const res = await invoke<{
        status: number
        status_text: string
        headers: [string, string][]
        body: string
        time_ms: number
        size_bytes: number
      }>('custom_fetch', {
        method: req.method,
        url: req.url,
        headers: headersArr,
        body: !['GET', 'HEAD'].includes(req.method) && req.body ? req.body : null,
      })

      const resHeaders: Record<string, string> = {}
      for (const [k, v] of res.headers) resHeaders[k] = v

      console.log(`[HTTP] custom ${res.status} | ${res.body.slice(0, 150)}`)

      return {
        status: res.status,
        statusText: res.status_text,
        ok: res.status >= 200 && res.status < 300,
        headers: resHeaders,
        body: res.body,
        timeMs: res.time_ms,
        sizeBytes: res.size_bytes,
      }
    } catch (err: any) {
      console.error('[HTTP] send error:', err)
      return {
        status: 0, statusText: 'Error', ok: false,
        headers: {}, body: '',
        timeMs: Math.round(performance.now() - start), sizeBytes: 0,
        error: err.message || err.toString?.() || '未知错误',
      }
    } finally {
      loading.value = false
    }
  }

  function cancel() { /* TODO: abort via invoke */ }

  return { send, cancel, loading }
}
