// Built-in routines that can be switched on (adding their tasks) and off (removing them).
// Task lines use the same format as Playbook pages (see bulk.ts).
import { parseTaskLines, planBulkAdd } from './bulk'
import type { Task } from './tasks'

export type Plan = {
  id: string
  title: string
  summary: string
  tips: string[]
  source?: { label: string; url: string }
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
  {
    id: 'morning-routine',
    title: 'Morning routine',
    summary: 'An early start: up at 5, move, read, journal and meditate, with no phone.',
    tips: [],
    body: `- [ ] Wake up at 5 — Daily
- [ ] Physical activity — Daily
- [ ] Read — Daily
- [ ] Journal — Daily
- [ ] Meditate — Daily
- [ ] No phone — Daily`,
  },
  {
    id: 'adhd-protection',
    title: 'ADHD protection',
    summary: 'Guard rails for focus and energy: Sunday planning, daily habits that protect sleep and attention, and a reminder of the vices to avoid.',
    tips: [],
    body: `- [ ] Time block the week — Weekly on Sun
- [ ] Weekly review — Weekly on Sun
    Notes: clear inboxes, check the calendar, carry over loose ends
- [ ] Check bills and finances — Weekly on Sun
- [ ] Meal prep — Weekly on Sun
- [ ] ADHD Vices — Daily
    Notes: No alcohol, no sugar, no scrolling, no dopamine
- [ ] Close loops, don't open new loops — Daily
- [ ] Plan tomorrow's top 3 — Daily
- [ ] Brain dump — Daily
- [ ] Daylight within an hour of waking — Daily
- [ ] Screens off an hour before bed — Daily
- [ ] Protein with breakfast — Daily
- [ ] Drink water — Daily
- [ ] Reset the launch pad — Daily
    Notes: keys, wallet, bag and tomorrow's things by the door`,
  },
  {
    id: 'lifting',
    title: 'Lifting',
    summary: 'Three lifting sessions a week: lift A on Monday, lift B on Wednesday, lift C on Friday.',
    tips: [],
    body: `- [ ] Lift A — Weekly on Mon
- [ ] Lift B — Weekly on Wed
- [ ] Lift C — Weekly on Fri`,
  },
]

export function isPlanOn(planId: string, tasks: Task[]): boolean {
  return tasks.some((t) => t.plan === planId && !t.removedOn)
}

// Adds the plan's tasks in a group named after it, skipping names already on the list
// and tasks from this plan the user removed.
export function enablePlan(plan: Plan, tasks: Task[], today: string): Task[] {
  const dismissed = new Set(tasks.filter((t) => t.plan === plan.id && t.dismissed).map((t) => t.title))
  const added = planBulkAdd(parseTaskLines(plan.body, today), tasks).flatMap((p) =>
    p.status === 'add' && !dismissed.has(p.task.title)
      ? [{ id: crypto.randomUUID(), ...p.task, plan: plan.id, source: plan.title, group: plan.title }]
      : [],
  )
  return [...tasks, ...added]
}

// Removes the plan's tasks from today on. Their history stays in Analytics.
export function disablePlan(planId: string, tasks: Task[], today: string): Task[] {
  return tasks.map((t) => (t.plan === planId && !t.removedOn ? { ...t, removedOn: today } : t))
}
