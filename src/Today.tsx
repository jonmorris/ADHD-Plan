import { useState } from 'preact/hooks'
import { dayStats, describeRepeat, isDueOn, nextState, stateOn, type Log, type State, type Task } from './tasks'
import { TaskForm } from './TaskForm'

type Props = {
  tasks: Task[]
  log: Log
  today: string
  saveTasks: (tasks: Task[]) => void
  saveLog: (log: Log) => void
}

const LABELS: Record<State, string> = { 0: 'Not done', 0.5: 'Half done', 1: 'Done' }

export function Today({ tasks, log, today, saveTasks, saveLog }: Props) {
  const [editing, setEditing] = useState<Task>()

  const due = tasks.filter((t) => isDueOn(t, today, log, today))
  const { done } = dayStats(tasks, log, today, today)

  function tap(task: Task) {
    saveLog({ ...log, [today]: { ...log[today], [task.id]: nextState(stateOn(task, today, log)) } })
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
    setEditing({ id: crypto.randomUUID(), title: '', start: today, repeat: { kind: 'none' } })
  }

  return (
    <>
      <header class="today-header">
        <h1>Today</h1>
        <p class="count">
          {done} of {due.length} done
        </p>
      </header>

      {due.length === 0 && <p class="empty">Nothing on today. Add a task to get started.</p>}

      <ul class="tasks">
        {due.map((t) => {
          const state = stateOn(t, today, log)
          return (
            <li key={t.id} class={state === 1 ? 'done' : ''}>
              <button
                role="checkbox"
                class={`check s${state * 2}`}
                aria-checked={state === 1 ? 'true' : state === 0.5 ? 'mixed' : 'false'}
                aria-label={`${t.title}: ${LABELS[state]}`}
                onClick={() => tap(t)}
              />
              <button class="title" onClick={() => setEditing(t)}>
                <span class="name">{t.title}</span>
                {t.repeat.kind !== 'none' && <span class="repeat">{describeRepeat(t.repeat, t.start)}</span>}
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
