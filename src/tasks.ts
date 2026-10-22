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
  removedOn?: string
}

// 0 = not done, 0.5 = half done, 1 = done
export type State = 0 | 0.5 | 1

// log[date][taskId] = state that day. Nothing is ever deleted from it.
export type Log = Record<string, Record<string, State>>

export function nextState(s: State): State {
  return s === 0 ? 0.5 : s === 0.5 ? 1 : 0
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
function doneOn(task: Task, log: Log): string | undefined {
  return Object.keys(log)
    .sort()
    .find((d) => log[d][task.id] === 1)
}

export function isDueOn(task: Task, key: string, log: Log, today: string): boolean {
  if (key < task.start || (task.removedOn && key >= task.removedOn)) return false
  if (task.repeat.kind !== 'none') return occursOn(task.repeat, task.start, key)
  // One-off tasks carry over each day until done
  const done = doneOn(task, log)
  return done ? key <= done : key <= today
}

export function stateOn(task: Task, key: string, log: Log): State {
  if (task.repeat.kind !== 'none') return log[key]?.[task.id] ?? 0
  // One-off tasks keep their latest state (e.g. half done) on later days
  const latest = Object.keys(log)
    .filter((d) => d <= key && log[d][task.id] !== undefined)
    .sort()
    .pop()
  return latest ? log[latest][task.id] : 0
}

export function dayStats(tasks: Task[], log: Log, key: string, today: string) {
  const due = tasks.filter((t) => isDueOn(t, key, log, today))
  return { due: due.length, done: due.reduce((sum, t) => sum + stateOn(t, key, log), 0) }
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
