// Built-in routines that can be switched on (adding their tasks) and off (removing them).
// Task lines use the same format as Playbook pages (see bulk.ts).
import { parseTaskLines, planBulkAdd } from './bulk'
import type { Task } from './tasks'

export type Plan = {
  id: string
  title: string
  summary: string
  tips: string[]
  source: { label: string; url: string }
  body: string
}

export const PLANS: Plan[] = [
  {
    id: 'clean-mama',
    title: 'Clean Mama',
    summary: 'Five quick jobs every day, plus one bigger job (10–30 minutes) for each day Monday to Saturday. Sunday is a rest day.',
    tips: [
      'Ease in by adding one daily job per week rather than all five at once.',
      'Missed a day? Catch up on Friday or let it come round next week.',
    ],
    source: { label: 'cleanmama.com', url: 'https://cleanmama.com/weekly-tasks/' },
    body: `- [ ] Make beds — Daily
- [ ] Check floors — Daily
    Notes: quick sweep or vacuum where needed
- [ ] Wipe counters — Daily
- [ ] Declutter — Daily
- [ ] Laundry load — Daily
- [ ] Bathrooms — Weekly on Mon
    Notes: sinks, mirrors, toilet, shower
- [ ] Dusting — Weekly on Tue
- [ ] Vacuuming — Weekly on Wed
- [ ] Wash floors — Weekly on Thu
- [ ] Catch-up — Weekly on Fri
    Notes: anything missed this week
- [ ] Sheets and towels — Weekly on Sat`,
  },
]

export function isPlanOn(planId: string, tasks: Task[]): boolean {
  return tasks.some((t) => t.plan === planId && !t.removedOn)
}

// Adds the plan's tasks, skipping names already on the list.
export function enablePlan(plan: Plan, tasks: Task[], today: string): Task[] {
  const added = planBulkAdd(parseTaskLines(plan.body, today), tasks).flatMap((p) =>
    p.status === 'add' ? [{ id: crypto.randomUUID(), ...p.task, plan: plan.id }] : [],
  )
  return [...tasks, ...added]
}

// Removes the plan's tasks from today on. Their history stays in Analytics.
export function disablePlan(planId: string, tasks: Task[], today: string): Task[] {
  return tasks.map((t) => (t.plan === planId && !t.removedOn ? { ...t, removedOn: today } : t))
}
