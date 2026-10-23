import { useState } from 'preact/hooks'
import { fromDateKey } from './dates'
import type { Repeat, Task } from './tasks'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const UNITS = { daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year' }

type Props = {
  task: Task
  isNew: boolean
  onSave: (task: Task) => void
  onRemove: () => void
  onClose: () => void
}

export function TaskForm({ task, isNew, onSave, onRemove, onClose }: Props) {
  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes ?? '')
  const [start, setStart] = useState(task.start)
  const [kind, setKind] = useState<Repeat['kind']>(task.repeat.kind)
  const [every, setEvery] = useState(task.repeat.kind === 'none' ? 1 : task.repeat.every)
  const [days, setDays] = useState(
    task.repeat.kind === 'weekly' ? task.repeat.days : [fromDateKey(task.start).getDay()],
  )

  function submit(e: Event) {
    e.preventDefault()
    const repeat: Repeat =
      kind === 'none' ? { kind } : kind === 'weekly' ? { kind, every, days } : { kind, every }
    onSave({ ...task, title: title.trim(), notes: notes.trim() || undefined, start, repeat })
  }

  function toggleDay(day: number) {
    setDays(days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort())
  }

  return (
    <div class="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form class="sheet" onSubmit={submit}>
        <h2>{isNew ? 'New task' : 'Edit task'}</h2>

        <label class="field">
          Task
          <input value={title} onInput={(e) => setTitle(e.currentTarget.value)} required autoFocus />
        </label>

        <label class="field">
          Notes
          <textarea value={notes} onInput={(e) => setNotes(e.currentTarget.value)} rows={2} />
        </label>

        <label class="field">
          {kind === 'none' ? 'Date' : 'Starts'}
          <input type="date" value={start} onInput={(e) => setStart(e.currentTarget.value)} required />
        </label>

        <label class="field">
          Repeat
          <select value={kind} onChange={(e) => setKind(e.currentTarget.value as Repeat['kind'])}>
            <option value="none">Doesn't repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </label>

        {kind !== 'none' && (
          <label class="field inline">
            Every
            <input
              type="number"
              min={1}
              value={every}
              onInput={(e) => setEvery(Math.max(1, Number(e.currentTarget.value) || 1))}
            />
            {UNITS[kind]}
            {every > 1 && 's'}
          </label>
        )}

        {kind === 'weekly' && (
          <div class="weekdays" role="group" aria-label="On these days">
            {WEEKDAYS.map((label, day) => (
              <button
                type="button"
                class={days.includes(day) ? 'on' : ''}
                aria-pressed={days.includes(day)}
                onClick={() => toggleDay(day)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div class="actions">
          {!isNew && (
            <button type="button" class="danger" onClick={onRemove}>
              Remove
            </button>
          )}
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" class="primary" disabled={kind === 'weekly' && days.length === 0}>
            Save
          </button>
        </div>
      </form>
    </div>
  )
}
