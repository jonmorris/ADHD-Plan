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
})

describe('turning a plan on and off', () => {
  const mine: Task = { id: 'mine', title: 'Laundry load', start: today, repeat: { kind: 'daily', every: 1 } }

  it('adds the plan tasks tagged with the plan, skipping names already on the list', () => {
    const tasks = enablePlan(cleanMama, [mine], today)
    const added = tasks.filter((t) => t.plan === 'clean-mama')
    expect(added).toHaveLength(10)
    expect(added.every((t) => t.id && t.start === today)).toBe(true)
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
})
