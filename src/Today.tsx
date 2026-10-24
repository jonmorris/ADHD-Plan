import { useRef, useState } from 'preact/hooks'
import { useBack } from './back'
import { addDays, fromDateKey, weekNumber } from './dates'
import { groupOf, sections, sortGroups, sourceOf } from './groups'
import {
  credit,
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
import { MoveButtons } from './MoveButtons'
import { itemIndex, type Plan } from './plans'
import { TaskForm } from './TaskForm'

type Props = {
  tasks: Task[]
  plans: Plan[]
  log: Log
  order: string[]
  groupOrder: string[]
  collapsed: string[]
  today: string
  saveTasks: (tasks: Task[]) => void
  saveLog: (log: Log) => void
  saveOrder: (order: string[]) => void
  saveGroupOrder: (order: string[]) => void
  saveCollapsed: (groups: string[]) => void
}

const LABELS: Record<State, string> = { [-1]: 'Marked not done', 0: 'Not done', 0.5: 'Half done', 1: 'Done' }
const CHECK_CLASS: Record<State, string> = { [-1]: 'sx', 0: 's0', 0.5: 's1', 1: 's2' }

function dayLabel(date: string, today: string) {
  if (date === today) return 'Today'
  if (date === addDays(today, -1)) return 'Yesterday'
  if (date === addDays(today, 1)) return 'Tomorrow'
  return fromDateKey(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

export function Today({
  tasks,
  plans,
  log,
  order,
  groupOrder,
  collapsed,
  today,
  saveTasks,
  saveLog,
  saveOrder,
  saveGroupOrder,
  saveCollapsed,
}: Props) {
  const [date, setDate] = useState(today)
  const [editing, setEditing] = useState<Task>()
  const [reordering, setReordering] = useState(false)
  useBack(!!editing, () => setEditing(undefined))

  const sorted = sortTasks(tasks, order, itemIndex(plans))
  const due = sorted.filter((t) => isDueOn(t, date, log, today))
  const daySections = sections(due, groupOrder)
  const namedSections = daySections.filter((s) => s.group)
  const allGroups = sortGroups(
    tasks.filter((t) => !t.removedOn).map(groupOf),
    groupOrder,
  )
  const { done } = dayStats(tasks, log, date, today)
  const future = date > today

  function setState(task: Task, state: State) {
    saveLog({ ...log, [date]: { ...log[date], [task.id]: state } })
  }

  // Press and hold a checkbox to mark it ✗ (not done); hold again to clear it.
  const holdTimer = useRef<number>()
  const held = useRef(false)

  function startHold(task: Task) {
    held.current = false
    holdTimer.current = window.setTimeout(() => {
      held.current = true
      setState(task, stateOn(task, date, log) === -1 ? 0 : -1)
    }, 500)
  }

  function tap(task: Task) {
    if (held.current) return void (held.current = false)
    setState(task, nextState(stateOn(task, date, log), !!task.allowHalf))
  }

  function save(task: Task) {
    const exists = tasks.some((t) => t.id === task.id)
    saveTasks(exists ? tasks.map((t) => (t.id === task.id ? task : t)) : [...tasks, task])
    // New tasks go to the top of their list
    if (!exists) saveOrder([task.id, ...order])
    setEditing(undefined)
  }

  function remove(task: Task) {
    if (!confirm(`Remove "${task.title}"? Its history stays in Analytics.`)) return
    // A removed plan task stays removed if the plan is turned off and on again
    saveTasks(tasks.map((t) => (t.id === task.id ? { ...t, removedOn: today, dismissed: !!t.plan || undefined } : t)))
    setEditing(undefined)
  }

  // Swap two items in a full ordering, so the order of everything not shown today is kept.
  function swap<T>(all: T[], a: T, b: T): T[] {
    const next = [...all]
    const i = next.indexOf(a)
    const j = next.indexOf(b)
    ;[next[i], next[j]] = [next[j], next[i]]
    return next
  }

  function moveTask(list: Task[], index: number, step: -1 | 1) {
    const ids = sorted.map((t) => t.id)
    saveOrder(swap(ids, list[index].id, list[index + step].id))
  }

  function moveGroup(index: number, step: -1 | 1) {
    saveGroupOrder(swap(allGroups, namedSections[index].group, namedSections[index + step].group))
  }

  function toggleCollapsed(group: string) {
    saveCollapsed(collapsed.includes(group) ? collapsed.filter((g) => g !== group) : [...collapsed, group])
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
        {reordering && (order.length > 0 || groupOrder.length > 0) && (
          <button
            class="link"
            onClick={() => {
              saveOrder([])
              saveGroupOrder([])
            }}
          >
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

      {daySections.map((section) => {
        const g = namedSections.indexOf(section)
        const isCollapsed = collapsed.includes(section.group)
        const groupDone = section.tasks.reduce((sum, t) => sum + credit(stateOn(t, date, log)), 0)
        return (
          <section key={section.group || '(none)'}>
            {section.group && (
              <div class="group-head">
                <h2>
                  <button
                    class="group-toggle"
                    aria-expanded={!isCollapsed}
                    onClick={() => toggleCollapsed(section.group)}
                  >
                    <span class="chevron" aria-hidden="true">
                      {isCollapsed ? '▸' : '▾'}
                    </span>
                    {section.group}
                    <span class="group-count">
                      {groupDone}/{section.tasks.length}
                    </span>
                  </button>
                </h2>
                {reordering && (
                  <MoveButtons
                    label={`group ${section.group}`}
                    first={g === 0}
                    last={g === namedSections.length - 1}
                    move={(step) => moveGroup(g, step)}
                  />
                )}
              </div>
            )}
            <ul class="tasks" hidden={isCollapsed}>
              {section.tasks.map((t, i) => {
                const state = stateOn(t, date, log)
                const source = sourceOf(t)
                return (
                  <li
                    key={t.id}
                    class={`c-${t.repeat.kind}${state === 1 ? ' done' : state === -1 ? ' not-done' : ''}`}
                  >
                    <button
                      role="checkbox"
                      class={`check ${CHECK_CLASS[state]}`}
                      aria-checked={state === 1 ? 'true' : state === 0.5 ? 'mixed' : 'false'}
                      aria-label={`${t.title}: ${LABELS[state]}`}
                      disabled={reordering || future}
                      onClick={() => tap(t)}
                      onPointerDown={() => startHold(t)}
                      onPointerUp={() => clearTimeout(holdTimer.current)}
                      onPointerLeave={() => clearTimeout(holdTimer.current)}
                      onPointerCancel={() => clearTimeout(holdTimer.current)}
                      onContextMenu={(e) => e.preventDefault()}
                    />
                    <button class="title" disabled={reordering} onClick={() => setEditing(t)}>
                      <span class="name">{t.title}</span>
                      <span class="repeat">
                        {describeRepeat(t.repeat, t.start, t.end)}
                        {source && <span class="tag">{source}</span>}
                      </span>
                      {t.notes && <span class="notes">{t.notes}</span>}
                    </button>
                    {reordering && (
                      <MoveButtons
                        label={t.title}
                        first={i === 0}
                        last={i === section.tasks.length - 1}
                        move={(step) => moveTask(section.tasks, i, step)}
                      />
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}

      {due.length > 0 && !future && <p class="hint">Press and hold a box to mark it ✕ (didn't do it).</p>}

      {editing && (
        <TaskForm
          task={editing}
          groups={allGroups}
          isNew={!tasks.some((t) => t.id === editing.id)}
          onSave={save}
          onRemove={() => remove(editing)}
          onClose={() => setEditing(undefined)}
        />
      )}
    </>
  )
}
