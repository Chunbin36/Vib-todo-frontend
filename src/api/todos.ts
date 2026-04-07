const API_URL = import.meta.env.VITE_BACKEND_URL

export type Todo = {
  _id?: string
  id?: string
  title: string
  completed: boolean
  createdAt?: string
  updatedAt?: string
}

/** Mongo/Express 응답은 `_id` 또는 가상 필드 `id`로 올 수 있음 */
export function getTodoId(t: Todo): string {
  const raw = t._id ?? t.id
  if (raw == null) return ''
  return typeof raw === 'string' ? raw : String(raw)
}

function normalizeIdField(raw: unknown): string {
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  if (raw && typeof raw === 'object' && '$oid' in raw) {
    const oid = (raw as { $oid?: unknown }).$oid
    if (typeof oid === 'string') return oid
  }
  return ''
}

/** API 한 건을 화면용 Todo로 맞춤 (id 형태·필드명 차이 흡수) */
export function coerceTodo(raw: unknown): Todo {
  if (!raw || typeof raw !== 'object') {
    return { title: '', completed: false }
  }
  const o = raw as Record<string, unknown>
  const id =
    normalizeIdField(o._id) ||
    normalizeIdField(o.id) ||
    (typeof o.id === 'string' ? o.id.trim() : '')
  const title = typeof o.title === 'string' ? o.title : ''
  let completed = false
  if (typeof o.completed === 'boolean') completed = o.completed
  else if (o.completed === 'true' || o.completed === 1) completed = true
  return {
    ...(id ? { _id: id } : {}),
    title,
    completed,
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : undefined,
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : undefined,
  }
}

function apiBase(): string {
  const explicit = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '')
  if (explicit) return explicit
  const base = typeof API_URL === 'string' ? API_URL.trim().replace(/\/$/, '') : ''
  if (base) return `${base}/api/todos`
  if (import.meta.env.DEV) return '/api/todos'
  return 'http://localhost:5000/api/todos'
}

async function readError(res: Response): Promise<string> {
  try {
    const data: unknown = await res.json()
    if (
      data &&
      typeof data === 'object' &&
      'error' in data &&
      typeof (data as { error: unknown }).error === 'string'
    ) {
      return (data as { error: string }).error
    }
  } catch {
    /* ignore */
  }
  return res.statusText || '요청이 실패했습니다.'
}

export async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch(apiBase())
  if (!res.ok) throw new Error(await readError(res))
  const data: unknown = await res.json()
  if (!Array.isArray(data)) return []
  return data.map((item) => coerceTodo(item))
}

export async function createTodo(title: string): Promise<Todo> {
  const res = await fetch(apiBase(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error(await readError(res))
  const data: unknown = await res.json()
  return coerceTodo(data)
}

export async function updateTodo(
  id: string,
  body: { title?: string; completed?: boolean },
): Promise<Todo> {
  const res = await fetch(`${apiBase()}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await readError(res))
  const data: unknown = await res.json()
  return coerceTodo(data)
}

export async function deleteTodo(id: string): Promise<void> {
  const res = await fetch(`${apiBase()}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(await readError(res))
}
