import { useState } from 'preact/hooks'
import { addDays, fromDateKey } from './dates'
import {
  byCadence,
  dayStats,
  describeRepeat,
  isDueOn,
  nextState,
  stateOn,
  type Log,
  type State,
  type Task,
} from './tasks'
import { TaskForm } from './TaskForm'

type Props = {
  tasks: Task[]
  log: Log
  today: string
  saveTasks: (tasks: Task[]) => void
  saveLog: (log: Log) => void
}

const LABELS: Record<State, string> = { 0: 'Not done', 0.5: 'Half done', 1: 'Done' }

function dayLabel(date: string, today: string) {
  if (date === today) return 'Today'
  if (date === addDays(today, -1)) return 'Yesterday'
  return fromDateKey(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

export function Today({ tasks, log, today, saveTasks, saveLog }: Props) {
  const [date, setDate] = useState(today)
  const [editing, setEditing] = useState<Task>()

  const due = tasks.filter((t) => isDueOn(t, date, log, today)).sort(byCadence)
  const { done } = dayStats(tasks, log, date, today)

  function tap(task: Task) {
    saveLog({ ...log, [date]: { ...log[date], [task.id]: nextState(stateOn(task, date, log)) } })
  }

  function save(task: Task) {
    const exists = tasks.some((t) => t.id === task.id)
    saveTasks(exists ? tasks.map((t) => (t.id === task.id ? task : t)) : [...tasks, task])
    setEditing(undefined)
  }

  function remove(task: Task) {
    if (!confirm(`Remove "${task.title}"? Its history stays in Analytics.`)) return
    saveTasks(tasks.map((t) => (t.id === task.id ? { ...t, removedOn: today } : t)))
    setEditing(undefined)
  }

  function addTask() {
    setEditing({ id: crypto.randomUUID(), title: '', start: date, repeat: { kind: 'none' } })
  }

  return (
    <>
      <header class="today-header">
        <button class="day-step" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}>
          ‹
        </button>
        <h1>{dayLabel(date, today)}</h1>
        <button
          class="day-step"
          aria-label="Next day"
          disabled={date >= today}
          onClick={() => setDate(addDays(date, 1))}
        >
          ›
        </button>
      </header>
      <p class="count">
        {done} of {due.length} done
        {date !== today && (
          <button class="link" onClick={() => setDate(today)}>
            Back to today
          </button>
        )}
      </p>

      {due.length === 0 && (
        <p class="empty">
          {date === today ? 'Nothing on today. Add a task to get started.' : 'Nothing was on this day.'}
        </p>
      )}

      <ul class="tasks">
        {due.map((t) => {
          const state = stateOn(t, date, log)
          return (
            <li key={t.id} class={`c-${t.repeat.kind}${state === 1 ? ' done' : ''}`}>
              <button
                role="checkbox"
                class={`check s${state * 2}`}
                aria-checked={state === 1 ? 'true' : state === 0.5 ? 'mixed' : 'false'}
                aria-label={`${t.title}: ${LABELS[state]}`}
                onClick={() => tap(t)}
              />
              <button class="title" onClick={() => setEditing(t)}>
                <span class="name">{t.title}</span>
                <span class="repeat">{describeRepeat(t.repeat, t.start)}</span>
                {t.notes && <span class="notes">{t.notes}</span>}
              </button>
            </li>
          )
        })}
      </ul>

      <button class="primary add" onClick={addTask}>
        + Add task
      </button>

      {editing && (
        <TaskForm
          task={editing}
          isNew={!tasks.some((t) => t.id === editing.id)}
          onSave={save}
          onRemove={() => remove(editing)}
          onClose={() => setEditing(undefined)}
        />
      )}
    </>
  )
}
