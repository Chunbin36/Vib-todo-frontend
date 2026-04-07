import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import {
  createTodo,
  deleteTodo,
  fetchTodos,
  getTodoId,
  updateTodo,
  type Todo,
} from './api/todos'
import './App.css'

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [pending, setPending] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const list = await fetchTodos()
      setTodos(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    const t = newTitle.trim()
    if (!t || pending) return
    setPending(true)
    setError(null)
    try {
      const created = await createTodo(t)
      setTodos((prev) => [created, ...prev])
      setNewTitle('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '추가에 실패했습니다.')
    } finally {
      setPending(false)
    }
  }

  const startEdit = (todo: Todo) => {
    setEditingId(getTodoId(todo))
    setEditDraft(todo.title)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft('')
  }

  const saveEdit = async () => {
    if (!editingId || pending) return
    const t = editDraft.trim()
    if (!t) {
      setError('제목은 비어 있을 수 없습니다.')
      return
    }
    setPending(true)
    setError(null)
    try {
      const updated = await updateTodo(editingId, { title: t })
      const uid = getTodoId(updated)
      setTodos((prev) =>
        prev.map((x) => (getTodoId(x) === uid ? updated : x)),
      )
      cancelEdit()
    } catch (e) {
      setError(e instanceof Error ? e.message : '수정에 실패했습니다.')
    } finally {
      setPending(false)
    }
  }

  const onEditKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      void saveEdit()
    }
  }

  const toggleDone = async (todo: Todo) => {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      const updated = await updateTodo(getTodoId(todo), {
        completed: !todo.completed,
      })
      const uid = getTodoId(updated)
      setTodos((prev) =>
        prev.map((x) => (getTodoId(x) === uid ? updated : x)),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : '상태 변경에 실패했습니다.')
    } finally {
      setPending(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      await deleteTodo(id)
      setTodos((prev) => prev.filter((x) => getTodoId(x) !== id))
      if (editingId === id) cancelEdit()
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제에 실패했습니다.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">할 일</h1>
        <p className="app__subtitle">
          할 일 내용을 클릭하거나 <strong>수정</strong>을 눌러 바꿀 수 있습니다.
        </p>
      </header>

      {error && (
        <div className="app__banner" role="alert">
          {error}
        </div>
      )}

      <form className="app__form" onSubmit={handleAdd}>
        <label htmlFor="new-todo" className="visually-hidden">
          새 할 일
        </label>
        <input
          id="new-todo"
          className="app__input"
          type="text"
          placeholder="할 일을 입력하세요"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          disabled={pending}
          autoComplete="off"
        />
        <button type="submit" className="app__btn app__btn--primary" disabled={pending}>
          추가
        </button>
      </form>

      <section className="app__list-wrap" aria-label="할 일 목록">
        {loading ? (
          <p className="app__muted">불러오는 중…</p>
        ) : todos.length === 0 ? (
          <p className="app__muted">할 일이 없습니다. 위에서 추가해 보세요.</p>
        ) : (
          <ul className="app__list">
            {todos.map((todo) => {
              const tid = getTodoId(todo)
              const isEditing = editingId !== null && editingId === tid
              return (
                <li key={tid || todo.title} className="app__item">
                  <label className="app__check-label">
                    <input
                      type="checkbox"
                      className="app__checkbox"
                      checked={todo.completed}
                      onChange={() => void toggleDone(todo)}
                      disabled={pending || isEditing}
                      aria-label={`완료: ${todo.title}`}
                    />
                  </label>

                  {isEditing ? (
                    <div className="app__edit-row">
                      <input
                        className="app__input app__input--inline"
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onKeyDown={onEditKeyDown}
                        disabled={pending}
                        autoFocus
                        aria-label="할 일 내용 수정"
                      />
                      <button
                        type="button"
                        className="app__btn app__btn--primary app__btn--small"
                        onClick={() => void saveEdit()}
                        disabled={pending}
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        className="app__btn app__btn--small"
                        onClick={cancelEdit}
                        disabled={pending}
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <div className="app__title-row">
                      <button
                        type="button"
                        className={`app__title-btn ${todo.completed ? 'app__title-btn--done' : ''}`}
                        onClick={() => startEdit(todo)}
                        disabled={pending}
                        title="클릭하여 내용 수정"
                      >
                        {todo.title}
                      </button>
                      <button
                        type="button"
                        className="app__btn app__btn--ghost app__btn--small"
                        onClick={() => startEdit(todo)}
                        disabled={pending}
                        aria-label={`「${todo.title}」 수정`}
                      >
                        수정
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    className="app__btn app__btn--danger"
                    onClick={() => void handleDelete(tid)}
                    disabled={pending}
                    aria-label={`삭제: ${todo.title}`}
                  >
                    삭제
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
