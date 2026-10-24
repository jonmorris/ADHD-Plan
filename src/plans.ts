// Plans: routines that can be switched on (adding their tasks) and off (removing them).
// The built-in ones below are copied into the user's saved plans the first time the app runs,
// after which they can be edited like any plan. Their task lines use the Playbook page format (see bulk.ts).
import { parseTaskLines } from './bulk'
import type { Task } from './tasks'

// A plan item is the task it adds, minus what the plan decides (plan, source, group).
export type PlanItem = Pick<Task, 'id' | 'title' | 'start' | 'repeat' | 'end' | 'notes' | 'allowHalf'>

export type Plan = {
  id: string
  title: string
  summary: string
  tips: string[]
  source?: { label: string; url: string }
  items: PlanItem[]
}

type BuiltInPlan = Omit<Plan, 'items'> & { body: string }

export const PLANS: BuiltInPlan[] = [
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

// The built-in plans as saved plans, for a first run.
export function seedPlans(today: string): Plan[] {
  return PLANS.map(({ body, ...plan }) => ({
    ...plan,
    items: parseTaskLines(body, today).flatMap((line, i) => ('task' in line ? [{ id: `${plan.id}-${i}`, ...line.task }] : [])),
  }))
}

export function isPlanOn(planId: string, tasks: Task[]): boolean {
  return tasks.some((t) => t.plan === planId && !t.removedOn)
}

// Tasks added before items had ids are matched by title.
function isFrom(task: Task, planId: string, item: PlanItem): boolean {
  return task.plan === planId && (task.planItem ? task.planItem === item.id : task.title === item.title)
}

// Adds the plan's tasks in a group named after it, skipping names already on the list
// and tasks from this plan the user removed.
export function enablePlan(plan: Plan, tasks: Task[], today: string): Task[] {
  const active = tasks.filter((t) => !t.removedOn)
  const names = new Set(active.map((t) => t.title.trim().toLowerCase()))
  const added: Task[] = []
  for (const item of plan.items) {
    const key = item.title.trim().toLowerCase()
    const skip = names.has(key) || tasks.some((t) => (t.dismissed || !t.removedOn) && isFrom(t, plan.id, item))
    if (skip) continue
    names.add(key)
    const { id, start, ...rest } = item
    added.push({
      ...rest,
      id: crypto.randomUUID(),
      start: start > today ? start : today,
      plan: plan.id,
      planItem: id,
      source: plan.title,
      group: plan.title,
    })
  }
  return [...tasks, ...added]
}

// Removes the plan's tasks from today on. Their history stays in Analytics.
export function disablePlan(planId: string, tasks: Task[], today: string): Task[] {
  return tasks.map((t) => (t.plan === planId && !t.removedOn ? { ...t, removedOn: today } : t))
}

// Brings the tasks on the list from this item in line with its edit. History is kept.
export function updateItem(planId: string, before: PlanItem, after: PlanItem, tasks: Task[]): Task[] {
  return tasks.map((t) => {
    if (t.removedOn || !isFrom(t, planId, before)) return t
    const { id, start, ...rest } = after
    // Only a changed start date moves the task's start, and never back before it was added
    const moved = start !== before.start && start > t.start
    return { ...t, ...rest, planItem: id, start: moved ? start : t.start }
  })
}

// Removes the tasks on the list from this item, from today on.
export function removeItem(planId: string, item: PlanItem, tasks: Task[], today: string): Task[] {
  return tasks.map((t) => (!t.removedOn && isFrom(t, planId, item) ? { ...t, removedOn: today } : t))
}

// Keeps the group and tag of the plan's tasks on the list in step with a renamed plan.
export function renamePlan(plan: Plan, title: string, tasks: Task[]): Task[] {
  return tasks.map((t) =>
    t.plan === plan.id && !t.removedOn
      ? { ...t, source: title, group: t.group === plan.title ? title : t.group }
      : t,
  )
}

// Position of a task's item in its plan, for ordering plan tasks the way the plan lists them.
export function itemIndex(plans: Plan[]): (task: Task) => number | undefined {
  return (task) => {
    const plan = plans.find((p) => p.id === task.plan)
    const i = plan ? plan.items.findIndex((item) => isFrom(task, plan.id, item)) : -1
    return i === -1 ? undefined : i
  }
}
