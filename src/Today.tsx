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
  oneAtATime,
  sortTasks,
  stateOn,
  type Log,
  type State,
  type Task,
} from './tasks'
import { dayProgress, dollars, valueOf, weekProgress, type Tracking } from './money'
import { MoveButtons } from './MoveButtons'
import { itemIndex, type Plan } from './plans'
import { remindersOn, toggleDismissed, type Dismissed, type Reminder } from './reminders'
import { TaskForm } from './TaskForm'

type Props = {
  tasks: Task[]
  plans: Plan[]
  tracking: Tracking
  reminders: Reminder[]
  dismissed: Dismissed
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
  saveReminders: (reminders: Reminder[]) => void
  saveDismissed: (dismissed: Dismissed) => void
}

const LABELS: Record<State, string> = { [-1]: 'Marked not done', 0: 'Not done', 0.5: 'Half done', 1: 'Done' }
const CHECK_CLASS: Record<State, string> = { [-1]: 'sx', 0: 's0', 0.5: 's1', 1: 's2' }

// Arrow to the next day, for deferring a one-off task
const DEFER = (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path
      d="M5 12h12M12 6l6 6-6 6M21 5v14"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
)

const CLOSE = (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
  </svg>
)

// Curved arrow back, for restoring a dismissed reminder
const RESTORE = (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path
      d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
)

// Key in `collapsed` for the reminders section (can't clash with a group name)
const REMINDERS = '\u0000reminders'

function dayLabel(date: string, today: string) {
  if (date === today) return 'Today'
  if (date === addDays(today, -1)) return 'Yesterday'
  if (date === addDays(today, 1)) return 'Tomorrow'
  return fromDateKey(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

export function Today({
  tasks,
  plans,
  tracking,
  reminders,
  dismissed,
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
  saveReminders,
  saveDismissed,
}: Props) {
  const [date, setDate] = useState(today)
  const [editing, setEditing] = useState<Task>()
  const [editingReminder, setEditingReminder] = useState(false)
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
  const money = tracking === 'dollars' ? dollars(tasks, plans, log, date, today) : undefined
  const future = date > today
  const dayReminders = remindersOn(reminders, dismissed, date)
  const remindersCollapsed = collapsed.includes(REMINDERS)

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

  function save(task: Task, asReminder: boolean) {
    if (asReminder) {
      const { id, title, notes, start, repeat, end } = task
      const reminder: Reminder = { id, title, notes, start, repeat, end }
      const known = reminders.some((r) => r.id === id)
      saveReminders(known ? reminders.map((r) => (r.id === id ? reminder : r)) : [...reminders, reminder])
      return setEditing(undefined)
    }
    const exists = tasks.some((t) => t.id === task.id)
    saveTasks(exists ? tasks.map((t) => (t.id === task.id ? task : t)) : [...tasks, task])
    // New tasks go to the top of their list
    if (!exists) saveOrder([task.id, ...order])
    setEditing(undefined)
  }

  // Moves a one-off task to the day after the one shown
  function defer(task: Task) {
    saveTasks(tasks.map((t) => (t.id === task.id ? { ...t, start: addDays(date, 1) } : t)))
  }

  function remove(task: Task) {
    if (editingReminder) {
      if (!confirm(`Remove the reminder "${task.title}"?`)) return
      saveReminders(reminders.map((r) => (r.id === task.id ? { ...r, removedOn: today } : r)))
      return setEditing(undefined)
    }
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
    setEditingReminder(false)
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
        {money ? `$${money.earned} of $${money.possible} earned` : `${done} of ${due.length} done`}
        {money && money.bonusPossible > 0 && ` · Bonuses $${money.bonusEarned} of $${money.bonusPossible}`}
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

      <section class="reminders">
        <div class="group-head">
          <h2>
            <button
              class="group-toggle"
              aria-expanded={!remindersCollapsed}
              onClick={() => toggleCollapsed(REMINDERS)}
            >
              <span class="chevron" aria-hidden="true">
                {remindersCollapsed ? '▸' : '▾'}
              </span>
              Reminders
              <span class="group-count">{dayReminders.active.length}</span>
            </button>
          </h2>
        </div>
        <div hidden={remindersCollapsed}>
          {dayReminders.active.length === 0 && <p class="reminders-empty">No reminders</p>}
          <ul class="tasks">
            {dayReminders.active.map((r) => (
              <li key={r.id}>
                <button
                  class="title"
                  onClick={() => {
                    setEditingReminder(true)
                    setEditing(r)
                  }}
                >
                  <span class="name">{r.title}</span>
                  {r.notes && <span class="notes">{r.notes}</span>}
                </button>
                <button
                  class="defer"
                  aria-label={`Dismiss ${r.title}`}
                  onClick={() => saveDismissed(toggleDismissed(dismissed, date, r.id))}
                >
                  {CLOSE}
                </button>
              </li>
            ))}
          </ul>
          {dayReminders.dismissed.length > 0 && (
            <>
              <h3 class="reminders-sub">Dismissed</h3>
              <ul class="tasks dismissed-reminders">
                {dayReminders.dismissed.map((r) => (
                  <li key={r.id}>
                    <span class="title">
                      <span class="name">{r.title}</span>
                      {r.notes && <span class="notes">{r.notes}</span>}
                    </span>
                    <button
                      class="defer"
                      aria-label={`Restore ${r.title}`}
                      onClick={() => saveDismissed(toggleDismissed(dismissed, date, r.id))}
                    >
                      {RESTORE}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

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
        // All the group's tasks, not just today's, so its weekly bonus can count the whole week
        const groupMoney = money && dollars(tasks.filter((t) => groupOf(t) === section.group), plans, log, date, today)
        const dailyPlan = money && plans.find((p) => p.bonus && p.title === section.group)
        const day = dailyPlan && dayProgress(dailyPlan, tasks, log, date, today)
        const weeklyPlan = money && plans.find((p) => p.weeklyBonus && p.title === section.group)
        const week = weeklyPlan && weekProgress(weeklyPlan, tasks, log, date, today)
        const sequential = plans.some((p) => p.sequential && p.title === section.group)
        const shown = sequential && !reordering ? oneAtATime(section.tasks, date, log) : section.tasks
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
                      {groupMoney
                        ? `$${groupMoney.earned}/$${groupMoney.possible}`
                        : `${groupDone}/${section.tasks.length}`}
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
            {dailyPlan && day && (
              <p class="week-bonus">
                Day bonus ${dailyPlan.bonus} · {day.done} of {day.due} done
              </p>
            )}
            {weeklyPlan && week && (
              <p class="week-bonus">
                Week bonus ${weeklyPlan.weeklyBonus} · {week.done} of {week.due} done
              </p>
            )}
            <ul class="tasks" hidden={isCollapsed}>
              {shown.map((t, i) => {
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
                        {money && ` · $${valueOf(t)}`}
                        {source && <span class="tag">{source}</span>}
                      </span>
                      {t.notes && <span class="notes">{t.notes}</span>}
                    </button>
                    {!reordering && t.repeat.kind === 'none' && date >= today && state !== 1 && (
                      <button class="defer" aria-label={`Defer ${t.title} to the next day`} onClick={() => defer(t)}>
                        {DEFER}
                      </button>
                    )}
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
          isNew={!(editingReminder ? reminders : tasks).some((t) => t.id === editing.id)}
          isReminder={editingReminder}
          canBeReminder={!editingReminder && !tasks.some((t) => t.id === editing.id)}
          onSave={save}
          onRemove={() => remove(editing)}
          onClose={() => setEditing(undefined)}
        />
      )}
    </>
  )
}
