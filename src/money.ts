// Dollars: a separate tally from the task count. A task earns its value when fully done
// (half done earns nothing). A plan can also earn a daily bonus on a day when all its daily
// tasks are done, and a weekly bonus when all its weekly tasks in a week (Sun–Sat) are done.
import { addDays, fromDateKey } from './dates'
import type { Plan } from './plans'
import { isDueOn, stateOn, type Log, type Task } from './tasks'

export type Tracking = 'count' | 'dollars'

export const VALUES = [1, 2, 5, 10]
export const BONUSES = [0, 1, 2, 5, 10]

export const valueOf = (task: Task) => task.value ?? 1

// The plan's weekly tasks in the week of `key`: how many are due, how many done,
// and the last day one is due (the day the weekly bonus counts on).
export function weekProgress(plan: Plan, tasks: Task[], log: Log, key: string, today: string) {
  const sunday = addDays(key, -fromDateKey(key).getDay())
  const weekly = tasks.filter((t) => t.plan === plan.id && t.repeat.kind === 'weekly')
  let due = 0
  let done = 0
  let lastDay: string | undefined
  for (let i = 0; i < 7; i++) {
    const day = addDays(sunday, i)
    for (const t of weekly) {
      if (!isDueOn(t, day, log, today)) continue
      due++
      if (stateOn(t, day, log) === 1) done++
      lastDay = day
    }
  }
  return lastDay ? { due, done, lastDay } : undefined
}

export function dollars(tasks: Task[], plans: Plan[], log: Log, key: string, today: string) {
  const due = tasks.filter((t) => isDueOn(t, key, log, today))
  const done = (t: Task) => stateOn(t, key, log) === 1
  let earned = 0
  let possible = 0
  for (const t of due) {
    possible += valueOf(t)
    if (done(t)) earned += valueOf(t)
  }
  for (const plan of plans) {
    const daily = due.filter((t) => t.plan === plan.id && t.repeat.kind === 'daily')
    if (plan.bonus && daily.length > 0) {
      possible += plan.bonus
      if (daily.every(done)) earned += plan.bonus
    }
    const week = plan.weeklyBonus ? weekProgress(plan, tasks, log, key, today) : undefined
    if (week && week.lastDay === key) {
      possible += plan.weeklyBonus!
      if (week.done === week.due) earned += plan.weeklyBonus!
    }
  }
  return { earned, possible }
}
