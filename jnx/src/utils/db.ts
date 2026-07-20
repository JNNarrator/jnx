import Database from '@tauri-apps/plugin-sql'

let db: Database | null = null

export async function getDb(): Promise<Database> {
  try {
  if (!db) {
    db = await Database.load('sqlite:jnx.db')
  }
  return db
  } catch (e) {
    throw new Error('Database unavailable outside Tauri runtime')
  }
}

export async function getSetting(key: string): Promise<string | null> {
  const d = await getDb()
  const rows = await d.select<{ value: string }[]>('SELECT value FROM settings WHERE key = $1', [key])
  return rows.length > 0 ? rows[0].value : null
}

export async function setSetting(key: string, value: string): Promise<void> {
  const d = await getDb()
  await d.execute(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2',
    [key, value]
  )
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const d = await getDb()
  const rows = await d.select<{ key: string; value: string }[]>('SELECT key, value FROM settings')
  const result: Record<string, string> = {}
  for (const row of rows) {
    result[row.key] = row.value
  }
  return result
}

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export async function getClipboardHistory(limit = 100, offset = 0): Promise<{ id: number; content: string; source: string; created_at: string }[]> {
  const d = await getDb()
  return d.select(
    'SELECT id, content, source, created_at FROM clipboard_history ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  )
}

export async function addClipboardEntry(content: string, source = ''): Promise<void> {
  const d = await getDb()
  // avoid duplicate consecutive entries
  const last = await d.select<{ content: string }[]>(
    'SELECT content FROM clipboard_history ORDER BY created_at DESC LIMIT 1'
  )
  if (last.length > 0 && last[0].content === content) return
  await d.execute(
    'INSERT INTO clipboard_history (content, source) VALUES ($1, $2)',
    [content, source]
  )
}

export async function deleteClipboardEntry(id: number): Promise<void> {
  const d = await getDb()
  await d.execute('DELETE FROM clipboard_history WHERE id = $1', [id])
}

export async function clearClipboardHistory(): Promise<void> {
  const d = await getDb()
  await d.execute('DELETE FROM clipboard_history')
}
