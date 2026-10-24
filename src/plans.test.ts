import { describe, expect, it } from 'vitest'
import { parseTaskLines } from './bulk'
import { PLANS, disablePlan, enablePlan, isPlanOn, itemIndex, removeItem, renamePlan, seedPlans, updateItem } from './plans'
import { sortTasks, type Task } from './tasks'

const today = '2026-10-23'
const plans = seedPlans(today)
const cleanMama = plans.find((p) => p.id === 'clean-mama')!

describe('built-in plans', () => {
  it('every plan line reads without errors', () => {
    for (const plan of PLANS) {
      expect(parseTaskLines(plan.body, today).filter((i) => 'error' in i)).toEqual([])
    }
  })

  it('Clean Mama has five daily tasks and one task for each day Mon–Sat', () => {
    const tasks = enablePlan(cleanMama, [], today)
    expect(tasks.filter((t) => t.repeat.kind === 'daily')).toHaveLength(5)
    const weekly = tasks.flatMap((t) => (t.repeat.kind === 'weekly' ? t.repeat.days : []))
    expect(weekly.sort()).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('Morning routine adds six daily tasks in its own group', () => {
    const plan = plans.find((p) => p.id === 'morning-routine')!
    const tasks = enablePlan(plan, [], today)
    expect(tasks.map((t) => t.title)).toEqual(['Wake up at 5', 'Physical activity', 'Read', 'Journal', 'Meditate', 'No phone'])
    expect(tasks.every((t) => t.repeat.kind === 'daily' && t.group === 'Morning routine')).toBe(true)
  })

  it('ADHD protection has the Sunday planning tasks and the vices reminder', () => {
    const plan = plans.find((p) => p.id === 'adhd-protection')!
    const tasks = enablePlan(plan, [], today)
    const sunday = tasks.filter((t) => t.repeat.kind === 'weekly' && t.repeat.days.join() === '0')
    expect(sunday.map((t) => t.title)).toEqual(['Time block the week', 'Weekly review', 'Check bills and finances', 'Meal prep'])
    const vices = tasks.find((t) => t.title === 'ADHD Vices')!
    expect(vices.repeat.kind).toBe('daily')
    expect(vices.notes).toBe('No alcohol, no sugar, no scrolling, no dopamine')
    expect(tasks.find((t) => t.title === "Close loops, don't open new loops")?.repeat.kind).toBe('daily')
    expect(tasks).toHaveLength(13)
  })

  it('Lifting has lift A on Monday, B on Wednesday and C on Friday', () => {
    const plan = plans.find((p) => p.id === 'lifting')!
    const tasks = enablePlan(plan, [], today)
    expect(tasks.map((t) => [t.title, t.repeat.kind === 'weekly' && t.repeat.days])).toEqual([
      ['Lift A', [1]],
      ['Lift B', [3]],
      ['Lift C', [5]],
    ])
  })
})

describe('turning a plan on and off', () => {
  const mine: Task = { id: 'mine', title: 'Laundry load', start: today, repeat: { kind: 'daily', every: 1 } }

  it('adds the plan tasks tagged with the plan, skipping names already on the list', () => {
    const tasks = enablePlan(cleanMama, [mine], today)
    const added = tasks.filter((t) => t.plan === 'clean-mama')
    expect(added).toHaveLength(10)
    expect(added.every((t) => t.id && t.start === today)).toBe(true)
    expect(added.every((t) => t.group === 'Clean Mama' && t.source === 'Clean Mama')).toBe(true)
    expect(tasks.filter((t) => t.title === 'Laundry load')).toEqual([mine])
    expect(isPlanOn('clean-mama', tasks)).toBe(true)
  })

  it('turning off removes only that plan, from today, keeping the tasks for history', () => {
    const tasks = disablePlan('clean-mama', enablePlan(cleanMama, [mine], today), today)
    expect(tasks.filter((t) => t.plan === 'clean-mama').every((t) => t.removedOn === today)).toBe(true)
    expect(tasks.find((t) => t.id === 'mine')?.removedOn).toBeUndefined()
    expect(isPlanOn('clean-mama', tasks)).toBe(false)
  })

  it('can be turned back on, adding fresh tasks', () => {
    const off = disablePlan('clean-mama', enablePlan(cleanMama, [], today), today)
    const on = enablePlan(cleanMama, off, '2026-10-24')
    expect(on.filter((t) => t.plan === 'clean-mama' && !t.removedOn)).toHaveLength(11)
  })

  it('can add tasks added to a plan since it was turned on, without duplicating the rest', () => {
    const older = { ...cleanMama, items: cleanMama.items.slice(0, 2) }
    const on = enablePlan(older, [], today)
    expect(on).toHaveLength(2)
    const updated = enablePlan(cleanMama, on, today)
    expect(updated).toHaveLength(11)
    expect(updated.slice(0, 2)).toEqual(on)
  })

  it('does not bring back a task the user removed when the plan is turned off and on', () => {
    const on = enablePlan(cleanMama, [], today)
    const removed = on.map((t) => (t.title === 'Dusting' ? { ...t, removedOn: today, dismissed: true } : t))
    const again = enablePlan(cleanMama, disablePlan('clean-mama', removed, today), '2026-10-24')
    const active = again.filter((t) => !t.removedOn).map((t) => t.title)
    expect(active).toHaveLength(10)
    expect(active).not.toContain('Dusting')
  })
})

describe('editing a plan', () => {
  const lifting = plans.find((p) => p.id === 'lifting')!
  const liftA = lifting.items[0]

  it('links added tasks to their plan item', () => {
    const tasks = enablePlan(lifting, [], today)
    expect(tasks.map((t) => t.planItem)).toEqual(lifting.items.map((i) => i.id))
  })

  it('updates the task on the list when its item is edited, keeping its id and start', () => {
    const tasks = enablePlan(lifting, [], today)
    const edited = { ...liftA, title: 'Lift A (heavy)', repeat: { kind: 'weekly' as const, every: 1, days: [2] } }
    const updated = updateItem('lifting', liftA, edited, tasks)
    expect(updated[0]).toEqual({ ...tasks[0], title: 'Lift A (heavy)', repeat: edited.repeat })
    expect(updated.slice(1)).toEqual(tasks.slice(1))
  })

  it('matches tasks added before items had ids by title', () => {
    const old: Task = { id: 'old', title: 'Lift A', start: '2026-01-01', repeat: liftA.repeat, plan: 'lifting' }
    const [updated] = updateItem('lifting', liftA, { ...liftA, notes: 'Squat, bench' }, [old])
    expect(updated).toEqual({ ...old, notes: 'Squat, bench', planItem: liftA.id })
  })

  it('moves the start only when the item start date is changed to a later day', () => {
    const tasks = enablePlan(lifting, [], today)
    expect(updateItem('lifting', liftA, { ...liftA, start: '2026-11-02' }, tasks)[0].start).toBe('2026-11-02')
    expect(updateItem('lifting', liftA, { ...liftA, start: '2026-01-01' }, tasks)[0].start).toBe(today)
  })

  it('leaves removed tasks alone', () => {
    const tasks = disablePlan('lifting', enablePlan(lifting, [], today), today)
    expect(updateItem('lifting', liftA, { ...liftA, title: 'New' }, tasks)).toEqual(tasks)
  })

  it('removes the task from today on when its item is deleted', () => {
    const tasks = removeItem('lifting', liftA, enablePlan(lifting, [], today), '2026-10-24')
    expect(tasks.map((t) => t.removedOn)).toEqual(['2026-10-24', undefined, undefined])
  })

  it('renames the group and tag of its tasks with the plan', () => {
    const tasks = renamePlan(lifting, 'Gym', enablePlan(lifting, [], today))
    expect(tasks.every((t) => t.group === 'Gym' && t.source === 'Gym')).toBe(true)
  })

  it('does not re-add an item whose task was renamed on Today', () => {
    const tasks = enablePlan(lifting, [], today).map((t, i) => (i === 0 ? { ...t, title: 'Legs' } : t))
    expect(enablePlan(lifting, tasks, today)).toEqual(tasks)
  })

  it('orders plan tasks the way the plan lists them, ahead of cadence', () => {
    const reordered = { ...cleanMama, items: [...cleanMama.items].reverse() }
    const tasks = enablePlan(cleanMama, [], today)
    const sorted = sortTasks(tasks, [], itemIndex([reordered]))
    expect(sorted.map((t) => t.title)).toEqual(reordered.items.map((i) => i.title))
    expect(sortTasks(tasks, [tasks[3].id], itemIndex([reordered]))[0]).toBe(tasks[3])
  })
})
