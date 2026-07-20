import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export interface HttpHeader {
  key: string
  value: string
  enabled: boolean
}

export interface HttpRequestData {
  method: string
  url: string
  headers: HttpHeader[]
  body: string
}

export interface HttpResponseData {
  status: number
  statusText: string
  ok: boolean
  headers: Record<string, string>
  body: string
  timeMs: number
  sizeBytes: number
  error?: string
}

export const useHttpStore = defineStore('http', () => {
  const request = reactive<HttpRequestData>({
    method: 'GET',
    url: '',
    headers: [],
    body: '',
  })

  const response = ref<HttpResponseData | null>(null)
  const loading = ref(false)

  function setFromParsed(p: { method: string; url: string; headers: Array<{ key: string; value: string }>; body: string }) {
    request.method = p.method
    request.url = p.url
    request.headers = p.headers.map(h => ({ ...h, enabled: true }))
    request.body = p.body
    if (!request.headers.length) {
      request.headers.push({ key: '', value: '', enabled: true })
    }
  }

  function reset() {
    request.method = 'GET'
    request.url = ''
    request.headers = []
    request.body = ''
    response.value = null
    loading.value = false
  }

  return { request, response, loading, setFromParsed, reset }
})
