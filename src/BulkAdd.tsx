import { useState } from 'preact/hooks'
import { parseTaskLines, planBulkAdd } from './bulk'
import { fromDateKey } from './dates'
import { describeRepeat, type Task } from './tasks'

type Props = {
  title: string
  body: string
  tasks: Task[]
  today: string
  saveTasks: (tasks: Task[]) => void
}

// Adds the page's "- [ ] Title — Cadence" lines as tasks in a group named after the page, after a preview.
export function BulkAdd({ title, body, tasks, today, saveTasks }: Props) {
  const [previewing, setPreviewing] = useState(false)
  const [added, setAdded] = useState<number>()

  const plan = planBulkAdd(parseTaskLines(body, today), tasks)
  const toAdd = plan.flatMap((p) => (p.status === 'add' ? [p.task] : []))
  if (plan.length === 0) return null

  function add() {
    saveTasks([...tasks, ...toAdd.map((t) => ({ id: crypto.randomUUID(), ...t, source: title, group: title }))])
    setAdded(toAdd.length)
    setPreviewing(false)
  }

  if (!previewing) {
    return (
      <div class="bulk">
        {added !== undefined && (
          <p class="bulk-done">
            Added {added} task{added === 1 ? '' : 's'} to Today.
          </p>
        )}
        <button
          onClick={() => {
            setAdded(undefined)
            setPreviewing(true)
          }}
        >
          Add tasks from this page…
        </button>
      </div>
    )
  }

  return (
    <div class="bulk">
      <h2>Add tasks from this page</h2>
      <ul class="bulk-list">
        {plan.map((p) => (
          <li class={p.status}>
            {p.status === 'add' ? (
              <>
                <span class="name">{p.task.title}</span>
                <span class="detail">
                  {describeRepeat(p.task.repeat, p.task.start, p.task.end)}
                  {p.task.start !== today &&
                    ` · starts ${fromDateKey(p.task.start).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                    })}`}
                </span>
                {p.task.notes && <span class="detail">{p.task.notes}</span>}
              </>
            ) : (
              <>
                <span class="name">{p.text}</span>
                <span class="detail">{p.status === 'exists' ? 'Already a task, skipped' : p.error}</span>
              </>
            )}
          </li>
        ))}
      </ul>
      <div class="actions">
        <button onClick={() => setPreviewing(false)}>Cancel</button>
        <button class="primary" disabled={toAdd.length === 0} onClick={add}>
          Add {toAdd.length} task{toAdd.length === 1 ? '' : 's'}
        </button>
      </div>
    </div>
  )
}
