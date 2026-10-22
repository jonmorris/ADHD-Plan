import { useEffect, useState } from 'preact/hooks'
import { get, set } from 'idb-keyval'
import { currentStreak, toDateKey } from './streak'

type Habit = { id: string; name: string; done: string[] }

export function App() {
  const [habits, setHabits] = useState<Habit[] | null>(null)
  const [name, setName] = useState('')

  useEffect(() => {
    get<Habit[]>('habits').then((saved) => setHabits(saved ?? []))
  }, [])

  function save(next: Habit[]) {
    setHabits(next)
    set('habits', next)
  }

  if (!habits) return null

  const now = new Date()
  const today = toDateKey(now)

  function add(e: Event) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    save([...habits!, { id: crypto.randomUUID(), name: trimmed, done: [] }])
    setName('')
  }

  function toggle(id: string) {
    save(
      habits!.map((h) =>
        h.id !== id
          ? h
          : { ...h, done: h.done.includes(today) ? h.done.filter((d) => d !== today) : [...h.done, today] },
      ),
    )
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(habits, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `habits-${today}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <main>
      <h1>Habits</h1>

      <form onSubmit={add}>
        <input
          value={name}
          onInput={(e) => setName(e.currentTarget.value)}
          placeholder="New habit"
          aria-label="New habit"
        />
        <button type="submit">Add</button>
      </form>

      <ul>
        {habits.map((h) => (
          <li key={h.id}>
            <label>
              <input type="checkbox" checked={h.done.includes(today)} onChange={() => toggle(h.id)} />
              <span>{h.name}</span>
            </label>
            <span class="streak">{currentStreak(h.done, now)} day streak</span>
          </li>
        ))}
      </ul>

      {habits.length > 0 && (
        <button class="export" onClick={exportData}>
          Export backup
        </button>
      )}
    </main>
  )
}
