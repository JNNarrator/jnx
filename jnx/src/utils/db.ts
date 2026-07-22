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

/* ══════════════════════════════════════════════════════════════
 * tool_state 表 — 工具状态记忆（L2 持久化层）
 * 各工具通过 useToolDraft composable 读写；本层只做 raw CRUD，
 * 序列化/防抖/生命周期由 composable 管理。
 * ══════════════════════════════════════════════════════════════ */

let _toolStateInited = false

async function ensureToolStateTable(): Promise<void> {
  if (_toolStateInited) return
  const d = await getDb()
  await d.execute(
    `CREATE TABLE IF NOT EXISTS tool_state (
      tool_id    TEXT PRIMARY KEY,
      payload    TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`
  )
  _toolStateInited = true
}

/**
 * 加载某个工具的已存储状态。未找到或出错返回 null。
 * 调用方负责校验形状（validate）。
 */
export async function loadToolState(toolId: string): Promise<string | null> {
  try {
    await ensureToolStateTable()
    const d = await getDb()
    const rows = await d.select<{ payload: string }[]>(
      'SELECT payload FROM tool_state WHERE tool_id = $1',
      [toolId]
    )
    return rows.length > 0 ? rows[0].payload : null
  } catch (e) {
    console.warn('[db] loadToolState failed:', toolId, e)
    return null /* 降级：不持久化但不影响工具使用 */
  }
}

/**
 * UPSERT 保存工具状态。
 * payload 应为 JSON.stringify 后的字符串。
 * 调用方负责防抖与大小保护。
 */
export async function saveToolState(toolId: string, payload: string): Promise<void> {
  try {
    await ensureToolStateTable()
    const d = await getDb()
    await d.execute(
      'INSERT INTO tool_state (tool_id, payload, updated_at) VALUES ($1, $2, $3) ' +
      'ON CONFLICT(tool_id) DO UPDATE SET payload = $2, updated_at = $3',
      [toolId, payload, Date.now()]
    )
  } catch (e) {
    console.warn('[db] saveToolState failed:', toolId, e)
    /* 降级，不抛错 */
  }
}

/** 清除单个工具记忆。 */
export async function clearToolState(toolId: string): Promise<void> {
  try {
    await ensureToolStateTable()
    const d = await getDb()
    await d.execute('DELETE FROM tool_state WHERE tool_id = $1', [toolId])
  } catch (e) {
    console.warn('[db] clearToolState failed:', toolId, e)
  }
}

/** 清除全部工具记忆（设置页"清除所有"用）。 */
export async function clearAllToolStates(): Promise<void> {
  try {
    await ensureToolStateTable()
    const d = await getDb()
    await d.execute('DELETE FROM tool_state')
  } catch (e) {
    console.warn('[db] clearAllToolStates failed:', e)
  }
}

/**
 * 清理过旧草稿。启动时调用一次。
 * @param maxAgeDays 超过此天数的记录将被删除（默认 30）
 */
export async function pruneToolStates(maxAgeDays = 30): Promise<void> {
  try {
    await ensureToolStateTable()
    const d = await getDb()
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000
    await d.execute('DELETE FROM tool_state WHERE updated_at < $1', [cutoff])
  } catch (e) {
    console.warn('[db] pruneToolStates failed:', e)
  }
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
