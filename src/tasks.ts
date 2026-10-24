import { addDays, daysBetween, fromDateKey } from './dates'

export type Repeat =
  | { kind: 'none' }
  | { kind: 'daily'; every: number }
  | { kind: 'weekly'; every: number; days: number[] } // 0 = Sunday
  | { kind: 'monthly'; every: number }
  | { kind: 'yearly'; every: number }

export type Task = {
  id: string
  title: string
  start: string
  repeat: Repeat
  end?: string // last day a repeating task can occur
  notes?: string
  allowHalf?: boolean // tap once for half done, twice for done
  plan?: string // id of the built-in plan that added it
  source?: string // name of the plan or Playbook page it came from
  group?: string // '' = no group (see groups.ts)
  dismissed?: boolean // removed by the user, so turning its plan back on won't re-add it
  removedOn?: string
}

// 0 = not done, 0.5 = half done, 1 = done, -1 = marked as not done (✗)
export type State = -1 | 0 | 0.5 | 1

// log[date][taskId] = state that day. Nothing is ever deleted from it.
export type Log = Record<string, Record<string, State>>

export function nextState(s: State, allowHalf: boolean): State {
  if (!allowHalf) return s === 1 ? 0 : 1
  return s === 0 || s === -1 ? 0.5 : s === 0.5 ? 1 : 0
}

// How much a state counts towards totals: ✗ counts the same as not done.
export function credit(s: State): number {
  return Math.max(s, 0)
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function ordinal(n: number): string {
  const suffix = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'
  return n + suffix
}

function schedule(r: Exclude<Repeat, { kind: 'none' }>, s: Date): string {
  const every = (one: string, unit: string) => (r.every === 1 ? one : `Every ${r.every} ${unit}s`)
  switch (r.kind) {
    case 'daily':
      return every('Daily', 'day')
    case 'weekly':
      return `${every('Weekly', 'week')} on ${[...r.days].sort().map((d) => DAYS[d]).join(', ')}`
    case 'monthly':
      return `${every('Monthly', 'month')} on the ${ordinal(s.getDate())}`
    case 'yearly':
      return `${every('Yearly', 'year')} on ${s.getDate()} ${MONTHS[s.getMonth()]}`
  }
}

// Short description of a schedule, e.g. "Every 2 weeks on Mon, Thu until 31 Dec".
export function describeRepeat(r: Repeat, start: string, end?: string): string {
  if (r.kind === 'none') return 'One-off'
  const s = fromDateKey(start)
  if (!end) return schedule(r, s)
  const e = fromDateKey(end)
  const year = e.getFullYear() === s.getFullYear() ? '' : ` ${e.getFullYear()}`
  return `${schedule(r, s)} until ${e.getDate()} ${MONTHS[e.getMonth()]}${year}`
}

// Rough days between occurrences, for sorting: one-off first, then daily, then longer cycles.
function cadenceDays(r: Repeat): number {
  const unit = { none: 0, daily: 1, weekly: 7, monthly: 30, yearly: 365 }[r.kind]
  return r.kind === 'none' ? 0 : unit * r.every
}

export function byCadence(a: Task, b: Task): number {
  return cadenceDays(a.repeat) - cadenceDays(b.repeat)
}

// Tasks in the user's saved order. Tasks not in it yet (e.g. newly added) go after, by cadence.
export function sortTasks(tasks: Task[], order: string[]): Task[] {
  const pos = (t: Task) => {
    const i = order.indexOf(t.id)
    return i === -1 ? Infinity : i
  }
  return [...tasks].sort((a, b) => pos(a) - pos(b) || byCadence(a, b))
}

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

// Whether a repeating schedule lands on date `key`.
export function occursOn(r: Repeat, start: string, key: string): boolean {
  if (key < start) return false
  const s = fromDateKey(start)
  const d = fromDateKey(key)
  // Monthly/yearly dates past the end of a month fall on its last day
  const sameDayOfMonth = d.getDate() === Math.min(s.getDate(), daysInMonth(d))
  switch (r.kind) {
    case 'none':
      return key === start
    case 'daily':
      return daysBetween(s, d) % r.every === 0
    case 'weekly': {
      const weeks = daysBetween(s, d) + s.getDay() - d.getDay()
      return r.days.includes(d.getDay()) && (weeks / 7) % r.every === 0
    }
    case 'monthly': {
      const months = (d.getFullYear() - s.getFullYear()) * 12 + d.getMonth() - s.getMonth()
      return months % r.every === 0 && sameDayOfMonth
    }
    case 'yearly':
      return d.getMonth() === s.getMonth() && (d.getFullYear() - s.getFullYear()) % r.every === 0 && sameDayOfMonth
  }
}

// One-off tasks: the first day they were marked done, if any.
export function doneOn(task: Task, log: Log): string | undefined {
  return Object.keys(log)
    .sort()
    .find((d) => log[d][task.id] === 1)
}

export function isDueOn(task: Task, key: string, log: Log, today: string): boolean {
  if (key < task.start || (task.removedOn && key >= task.removedOn)) return false
  if (task.repeat.kind !== 'none') return !(task.end && key > task.end) && occursOn(task.repeat, task.start, key)
  // One-off tasks carry over each day until done (a future one shows on its own date)
  const done = doneOn(task, log)
  return done ? key <= done : key <= (task.start > today ? task.start : today)
}

export function stateOn(task: Task, key: string, log: Log): State {
  if (task.repeat.kind !== 'none') return log[key]?.[task.id] ?? 0
  // One-off tasks keep their latest state (e.g. half done) on later days
  const latest = Object.keys(log)
    .filter((d) => d <= key && log[d][task.id] !== undefined)
    .sort()
    .pop()
  if (!latest) return 0
  // ✗ only applies to the day it was given
  const state = log[latest][task.id]
  return state === -1 && latest !== key ? 0 : state
}

export function dayStats(tasks: Task[], log: Log, key: string, today: string) {
  const due = tasks.filter((t) => isDueOn(t, key, log, today))
  return { due: due.length, done: due.reduce((sum, t) => sum + credit(stateOn(t, key, log)), 0) }
}

// Consecutive scheduled days fully done, ending today (or yesterday if today isn't done yet).
export function streak(task: Task, log: Log, today: string): number {
  let count = 0
  for (let d = today; d >= task.start; d = addDays(d, -1)) {
    if (!isDueOn(task, d, log, today)) continue
    if (log[d]?.[task.id] === 1) count++
    else if (d !== today) break
  }
  return count
}

// Totals for the `days` days ending today.
export function summarize(tasks: Task[], log: Log, today: string, days: number) {
  const dates = Array.from({ length: days }, (_, i) => addDays(today, i - days + 1))
  const perDay = dates.map((date) => ({ date, ...dayStats(tasks, log, date, today) }))
  const repeating = tasks
    .filter((t) => t.repeat.kind !== 'none')
    .map((task) => {
      const due = dates.filter((d) => isDueOn(task, d, log, today))
      const done = due.reduce((sum, d) => sum + credit(stateOn(task, d, log)), 0)
      return { task, due: due.length, done, streak: streak(task, log, today) }
    })
    .filter((r) => r.due > 0)
  const oneOffsDone = tasks.filter((t) => {
    const d = t.repeat.kind === 'none' && doneOn(t, log)
    return d && d >= dates[0]
  }).length
  return { perDay, repeating, oneOffsDone }
}
