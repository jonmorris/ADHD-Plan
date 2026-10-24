import { describe, expect, it } from 'vitest'
import { parseTaskLines } from './bulk'
import { PLANS, disablePlan, enablePlan, isPlanOn } from './plans'
import type { Task } from './tasks'

const today = '2026-10-23'
const cleanMama = PLANS.find((p) => p.id === 'clean-mama')!

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
    const plan = PLANS.find((p) => p.id === 'morning-routine')!
    const tasks = enablePlan(plan, [], today)
    expect(tasks.map((t) => t.title)).toEqual(['Wake up at 5', 'Physical activity', 'Read', 'Journal', 'Meditate', 'No phone'])
    expect(tasks.every((t) => t.repeat.kind === 'daily' && t.group === 'Morning routine')).toBe(true)
  })

  it('ADHD protection has the Sunday planning tasks and the vices reminder', () => {
    const plan = PLANS.find((p) => p.id === 'adhd-protection')!
    const tasks = enablePlan(plan, [], today)
    const sunday = tasks.filter((t) => t.repeat.kind === 'weekly' && t.repeat.days.join() === '0')
    expect(sunday.map((t) => t.title)).toEqual(['Time block the week', 'Weekly review', 'Check bills and finances', 'Meal prep'])
    const vices = tasks.find((t) => t.title === 'ADHD Vices')!
    expect(vices.repeat.kind).toBe('daily')
    expect(vices.notes).toBe('No alcohol, no sugar, no scrolling, no dopamine')
    expect(tasks).toHaveLength(12)
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

  it('does not bring back a task the user removed when the plan is turned off and on', () => {
    const on = enablePlan(cleanMama, [], today)
    const removed = on.map((t) => (t.title === 'Dusting' ? { ...t, removedOn: today, dismissed: true } : t))
    const again = enablePlan(cleanMama, disablePlan('clean-mama', removed, today), '2026-10-24')
    const active = again.filter((t) => !t.removedOn).map((t) => t.title)
    expect(active).toHaveLength(10)
    expect(active).not.toContain('Dusting')
  })
})
