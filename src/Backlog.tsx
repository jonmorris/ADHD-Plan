import { useState } from 'preact/hooks'
import { useBack } from './back'
import { inBacklog, type Backlog } from './backlog'
import { MoveButtons } from './MoveButtons'
import { TaskForm } from './TaskForm'
import { doneOn, sortTasks, type Log, type Task } from './tasks'

type Props = {
  tasks: Task[]
  saveTasks: (tasks: Task[]) => void
  order: string[]
  saveOrder: (order: string[]) => void
  backlog: Backlog
  saveBacklog: (backlog: Backlog) => void
  log: Log
  today: string
  onClose: () => void
}

// The backlog page in Manage: your own one-off tasks waiting their turn, with the limit on how
// many show on Today at once.
export function BacklogPage({ tasks, saveTasks, order, saveOrder, backlog, saveBacklog, log, today, onClose }: Props) {
  const [editing, setEditing] = useState<Task>()
  const [reordering, setReordering] = useState(false)
  useBack(!!editing, () => setEditing(undefined))

  // Same order as Today: the saved order holds tasks that aren't from a plan
  const own = sortTasks(
    tasks.filter((t) => !t.plan),
    order,
  )
  const waiting = own.filter((t) => inBacklog(t) && !t.removedOn && !doneOn(t, log))
  // Done today still holds its place on Today until tomorrow
  const doneToday = own.filter((t) => inBacklog(t) && !t.removedOn && doneOn(t, log) === today).length
  const onToday = backlog.on ? Math.max(0, backlog.limit - doneToday) : waiting.length

  function move(index: number, step: -1 | 1) {
    const ids = own.map((t) => t.id)
    const i = ids.indexOf(waiting[index].id)
    const j = ids.indexOf(waiting[index + step].id)
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    saveOrder(ids)
  }

  function save(task: Task) {
    const exists = tasks.some((t) => t.id === task.id)
    saveTasks(exists ? tasks.map((t) => (t.id === task.id ? task : t)) : [...tasks, task])
    // New ones join the end of the line
    if (!exists) saveOrder([...order.filter((id) => id !== task.id), task.id])
    setEditing(undefined)
  }

  function remove(task: Task) {
    if (!confirm(`Remove "${task.title}"? Its history stays in Analytics.`)) return
    saveTasks(tasks.map((t) => (t.id === task.id ? { ...t, removedOn: today } : t)))
    setEditing(undefined)
  }

  return (
    <article class="page">
      <div class="page-bar">
        <button onClick={onClose}>‹ Manage</button>
      </div>
      <h1>Backlog</h1>
      <p>Your own one-off tasks. With a limit on, Today shows only the first few; the next moves up the day after you finish one.</p>
      <div class="plan-settings">
        <label class="check-field">
          <input type="checkbox" checked={backlog.on} onChange={(e) => saveBacklog({ ...backlog, on: e.currentTarget.checked })} />
          <span>
            Limit tasks on Today
            <small>The rest wait here, hidden from Today</small>
          </span>
        </label>
        {backlog.on && (
          <label class="field inline">
            Show at most
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={backlog.limit}
              onInput={(e) => saveBacklog({ ...backlog, limit: Math.max(0, Math.round(Number(e.currentTarget.value)) || 0) })}
            />
          </label>
        )}
      </div>

      <div class="plan-tasks-head">
        <h2>Tasks</h2>
        {waiting.length > 1 && (
          <button class={reordering ? 'primary' : ''} onClick={() => setReordering(!reordering)}>
            {reordering ? 'Done' : 'Reorder'}
          </button>
        )}
      </div>
      {!reordering && (
        <button class="primary add" onClick={() => setEditing({ id: crypto.randomUUID(), title: '', start: today, repeat: { kind: 'none' } })}>
          + Add task
        </button>
      )}
      {waiting.length === 0 && <p class="empty">No tasks waiting.</p>}
      <ul class="plan-items">
        {waiting.map((t, i) => (
          <li key={t.id}>
            <button class="plan-item" disabled={reordering} onClick={() => setEditing(t)}>
              <span class="name">{t.title}</span>
              <span class="detail">{i < onToday ? 'On Today' : 'Waiting'}</span>
              {t.notes && <span class="detail">{t.notes}</span>}
            </button>
            {reordering && <MoveButtons label={t.title} first={i === 0} last={i === waiting.length - 1} move={(step) => move(i, step)} />}
          </li>
        ))}
      </ul>

      {editing && (
        <TaskForm
          task={editing}
          oneOff
          isNew={!tasks.some((t) => t.id === editing.id)}
          onSave={save}
          onRemove={() => remove(editing)}
          onClose={() => setEditing(undefined)}
        />
      )}
    </article>
  )
}
