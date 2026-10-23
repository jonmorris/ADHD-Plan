import { useState } from 'preact/hooks'
import { addDays, fromDateKey, weekNumber } from './dates'
import {
  dayStats,
  describeRepeat,
  isDueOn,
  nextState,
  sortTasks,
  stateOn,
  type Log,
  type State,
  type Task,
} from './tasks'
import { TaskForm } from './TaskForm'

type Props = {
  tasks: Task[]
  log: Log
  order: string[]
  today: string
  saveTasks: (tasks: Task[]) => void
  saveLog: (log: Log) => void
  saveOrder: (order: string[]) => void
}

const LABELS: Record<State, string> = { 0: 'Not done', 0.5: 'Half done', 1: 'Done' }

function dayLabel(date: string, today: string) {
  if (date === today) return 'Today'
  if (date === addDays(today, -1)) return 'Yesterday'
  if (date === addDays(today, 1)) return 'Tomorrow'
  return fromDateKey(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

export function Today({ tasks, log, order, today, saveTasks, saveLog, saveOrder }: Props) {
  const [date, setDate] = useState(today)
  const [editing, setEditing] = useState<Task>()
  const [reordering, setReordering] = useState(false)

  const sorted = sortTasks(tasks, order)
  const due = sorted.filter((t) => isDueOn(t, date, log, today))
  const { done } = dayStats(tasks, log, date, today)
  const future = date > today

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

  // Swap a task with its neighbour in this day's list, saving the order of every task.
  function move(index: number, step: -1 | 1) {
    const ids = sorted.map((t) => t.id)
    const a = ids.indexOf(due[index].id)
    const b = ids.indexOf(due[index + step].id)
    ;[ids[a], ids[b]] = [ids[b], ids[a]]
    saveOrder(ids)
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
        <div class="day-title">
          <h1>{dayLabel(date, today)}</h1>
          <p class="date-line">
            {fromDateKey(date).toLocaleDateString(undefined, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}{' '}
            · Week {weekNumber(fromDateKey(date))}
          </p>
        </div>
        <button class="day-step" aria-label="Next day" onClick={() => setDate(addDays(date, 1))}>
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

      <div class="list-tools">
        {!reordering && (
          <button class="primary add" onClick={addTask}>
            + Add task
          </button>
        )}
        {reordering && order.length > 0 && (
          <button class="link" onClick={() => saveOrder([])}>
            Reset to default order
          </button>
        )}
        {due.length > 1 && (
          <button class={reordering ? 'primary' : ''} onClick={() => setReordering(!reordering)}>
            {reordering ? 'Done' : 'Reorder'}
          </button>
        )}
      </div>

      {due.length === 0 && (
        <p class="empty">
          {date === today
            ? 'Nothing on today. Add a task to get started.'
            : future
              ? 'Nothing planned for this day yet.'
              : 'Nothing was on this day.'}
        </p>
      )}

      <ul class="tasks">
        {due.map((t, i) => {
          const state = stateOn(t, date, log)
          return (
            <li key={t.id} class={`c-${t.repeat.kind}${state === 1 ? ' done' : ''}`}>
              <button
                role="checkbox"
                class={`check s${state * 2}`}
                aria-checked={state === 1 ? 'true' : state === 0.5 ? 'mixed' : 'false'}
                aria-label={`${t.title}: ${LABELS[state]}`}
                disabled={reordering || future}
                onClick={() => tap(t)}
              />
              <button class="title" disabled={reordering} onClick={() => setEditing(t)}>
                <span class="name">{t.title}</span>
                <span class="repeat">{describeRepeat(t.repeat, t.start, t.end)}</span>
                {t.notes && <span class="notes">{t.notes}</span>}
              </button>
              {reordering && (
                <span class="move">
                  <button aria-label={`Move ${t.title} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                    ↑
                  </button>
                  <button
                    aria-label={`Move ${t.title} down`}
                    disabled={i === due.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    ↓
                  </button>
                </span>
              )}
            </li>
          )
        })}
      </ul>

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
