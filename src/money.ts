// Dollars: a separate tally from the task count. A task earns its value when fully done
// (half done earns nothing). A plan can also earn a daily bonus on a day when all its daily
// tasks are done, and a weekly bonus when all its weekly tasks in a week (Sun–Sat) are done.
import { addDays, fromDateKey } from './dates'
import type { Plan } from './plans'
import { isDueOn, stateOn, type Log, type Task } from './tasks'

export type Tracking = 'count' | 'dollars'

export const VALUES = [1, 2, 5, 10]

export const valueOf = (task: Task) => task.value ?? 1

// The plan's weekly tasks in the week of `key`: how many are due, how many done,
// and the last day one is due (the day the weekly bonus counts on).
export function weekProgress(plan: Plan, tasks: Task[], log: Log, key: string, today: string) {
  const sunday = addDays(key, -fromDateKey(key).getDay())
  const weekly = tasks.filter((t) => t.plan === plan.id && t.repeat.kind === 'weekly' && !t.periodic)
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

// The plan's daily tasks on `key`: how many are due and how many done.
export function dayProgress(plan: Plan, tasks: Task[], log: Log, key: string, today: string) {
  const daily = tasks.filter((t) => t.plan === plan.id && t.repeat.kind === 'daily' && isDueOn(t, key, log, today))
  const done = daily.filter((t) => stateOn(t, key, log) === 1).length
  return daily.length ? { due: daily.length, done } : undefined
}

// Task values and plan bonuses are tallied separately.
export function dollars(tasks: Task[], plans: Plan[], log: Log, key: string, today: string) {
  let earned = 0
  let possible = 0
  for (const t of tasks.filter((t) => isDueOn(t, key, log, today))) {
    possible += valueOf(t)
    if (stateOn(t, key, log) === 1) earned += valueOf(t)
  }
  let bonusEarned = 0
  let bonusPossible = 0
  for (const plan of plans) {
    const day = plan.bonus ? dayProgress(plan, tasks, log, key, today) : undefined
    if (day) {
      bonusPossible += plan.bonus!
      if (day.done === day.due) bonusEarned += plan.bonus!
    }
    const week = plan.weeklyBonus ? weekProgress(plan, tasks, log, key, today) : undefined
    if (week && week.lastDay === key) {
      bonusPossible += plan.weeklyBonus!
      if (week.done === week.due) bonusEarned += plan.weeklyBonus!
    }
  }
  return { earned, possible, bonusEarned, bonusPossible }
}

// A cash-out: the balance on that day, taken as a real-life reward.
export type CashOut = { date: string; amount: number }

// Everything earned so far, task values and bonuses, from the first logged day to today.
export function allTimeEarned(tasks: Task[], plans: Plan[], log: Log, today: string): number {
  const first = Object.keys(log).sort()[0]
  let total = 0
  for (let day = first ?? today; day <= today; day = addDays(day, 1)) {
    const m = dollars(tasks, plans, log, day, today)
    total += m.earned + m.bonusEarned
  }
  return total
}

// What's left to cash out: all time earned minus everything already cashed out.
export function balance(earned: number, cashOuts: CashOut[]): number {
  return earned - cashOuts.reduce((sum, c) => sum + c.amount, 0)
}
