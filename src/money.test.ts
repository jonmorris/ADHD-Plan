import { describe, expect, it } from 'vitest'
import { allTimeEarned, balance, dollars, weekProgress } from './money'
import type { Plan } from './plans'
import type { Log, Task } from './tasks'

const day = '2026-11-05'
const task = (id: string, extra: Partial<Task> = {}): Task => ({
  id,
  title: id,
  start: '2026-11-01',
  repeat: { kind: 'daily', every: 1 },
  ...extra,
})
const plan = (bonus?: number, weeklyBonus?: number): Plan => ({
  id: 'p',
  title: 'P',
  summary: '',
  tips: [],
  items: [],
  bonus,
  weeklyBonus,
})

describe('dollars', () => {
  const a = task('a') // $1 by default
  const b = task('b', { value: 5, plan: 'p' })
  const c = task('c', { value: 2, plan: 'p' })

  it('earns each fully done task its value; half done and ✕ earn nothing', () => {
    const log: Log = { [day]: { a: 1, b: 0.5, c: -1 } }
    expect(dollars([a, b, c], [], log, day, day)).toMatchObject({ earned: 1, possible: 8 })
  })

  it('takes away the penalty of a task marked ✕, and only then', () => {
    const p = task('p', { value: 2, penalty: 2 })
    expect(dollars([a, p], [], { [day]: { a: 1, p: -1 } }, day, day)).toMatchObject({ earned: -1, possible: 3 })
    expect(dollars([a, p], [], { [day]: { a: 1, p: 0.5 } }, day, day)).toMatchObject({ earned: 1 })
    expect(dollars([a, p], [], { [day]: { a: 1 } }, day, day)).toMatchObject({ earned: 1 })
  })

  it("adds a plan's daily bonus only when all its daily tasks that day are done", () => {
    expect(dollars([a, b, c], [plan(10)], { [day]: { b: 1 } }, day, day)).toEqual({
      earned: 5,
      possible: 8,
      bonusEarned: 0,
      bonusPossible: 10,
    })
    expect(dollars([a, b, c], [plan(10)], { [day]: { b: 1, c: 1 } }, day, day)).toEqual({
      earned: 7,
      possible: 8,
      bonusEarned: 10,
      bonusPossible: 10,
    })
  })

  it('has no bonus by default, or for a plan with nothing on that day', () => {
    expect(dollars([b, c], [plan()], { [day]: { b: 1, c: 1 } }, day, day)).toMatchObject({ bonusPossible: 0 })
    expect(dollars([a], [plan(10)], { [day]: { a: 1 } }, day, day)).toMatchObject({ bonusPossible: 0 })
  })
})

describe('weekly bonus', () => {
  // Thu 5 Nov 2026; that week runs Sun 1 to Sat 7 Nov
  const weekly = (id: string, day: number) =>
    task(id, { plan: 'p', repeat: { kind: 'weekly', every: 1, days: [day] } })
  const lifts = [weekly('a', 1), weekly('b', 3), weekly('c', 5)] // Mon 2, Wed 4, Fri 6
  const all: Log = { '2026-11-02': { a: 1 }, '2026-11-04': { b: 1 }, '2026-11-06': { c: 1 } }

  it("tracks the week's weekly tasks and the last day one is due", () => {
    const { '2026-11-06': _, ...twoDone } = all
    expect(weekProgress(plan(), lifts, twoDone, day, day)).toEqual({ due: 3, done: 2, lastDay: '2026-11-06' })
  })

  it('counts the bonus on the last day, only when every one is done', () => {
    expect(dollars(lifts, [plan(0, 10)], all, '2026-11-06', day)).toEqual({
      earned: 1,
      possible: 1,
      bonusEarned: 10,
      bonusPossible: 10,
    })
    const missed = { ...all, '2026-11-04': { b: 0.5 as const } }
    expect(dollars(lifts, [plan(0, 10)], missed, '2026-11-06', day)).toMatchObject({ bonusEarned: 0, bonusPossible: 10 })
    expect(dollars(lifts, [plan(0, 10)], all, '2026-11-04', day)).toMatchObject({ bonusPossible: 0 })
  })

  it('keeps weekly tasks out of the daily bonus', () => {
    expect(dollars(lifts, [plan(5)], all, '2026-11-02', day)).toMatchObject({ bonusPossible: 0 })
    expect(weekProgress(plan(), [task('d', { plan: 'p' })], {}, day, day)).toBeUndefined()
  })
})

describe('cash', () => {
  const a = task('a', { value: 2 })
  const log: Log = { '2026-11-03': { a: 1 }, '2026-11-04': { a: 0.5 }, [day]: { a: 1 } }

  it('adds up everything earned from the first logged day to today', () => {
    expect(allTimeEarned([a], [], log, day)).toBe(4)
    expect(allTimeEarned([a], [], {}, day)).toBe(0)
  })

  it('takes cash-outs off the balance but not off the all-time total', () => {
    expect(balance(10, [])).toBe(10)
    expect(balance(10, [{ date: '2026-11-03', amount: 6 }, { date: day, amount: 4 }])).toBe(0)
  })
})
