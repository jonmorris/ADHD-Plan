// Dollars: a separate tally from the task count. A task earns its value when fully done
// (half done earns nothing), and a plan earns its bonus on a day when all its tasks that day are done.
import type { Plan } from './plans'
import { isDueOn, stateOn, type Log, type Task } from './tasks'

export type Tracking = 'count' | 'dollars'

export const VALUES = [1, 2, 5, 10]
export const BONUSES = [0, 1, 2, 5, 10]

export const valueOf = (task: Task) => task.value ?? 1

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
    const planTasks = due.filter((t) => t.plan === plan.id)
    if (!plan.bonus || planTasks.length === 0) continue
    possible += plan.bonus
    if (planTasks.every(done)) earned += plan.bonus
  }
  return { earned, possible }
}
