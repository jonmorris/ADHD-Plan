import { describe, expect, it } from 'vitest'
import { dollars } from './money'
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
const plan = (bonus?: number): Plan => ({ id: 'p', title: 'P', summary: '', tips: [], items: [], bonus })

describe('dollars', () => {
  const a = task('a') // $1 by default
  const b = task('b', { value: 5, plan: 'p' })
  const c = task('c', { value: 2, plan: 'p' })

  it('earns each fully done task its value; half done and ✕ earn nothing', () => {
    const log: Log = { [day]: { a: 1, b: 0.5, c: -1 } }
    expect(dollars([a, b, c], [], log, day, day)).toEqual({ earned: 1, possible: 8 })
  })

  it("adds a plan's bonus only when all its tasks that day are done", () => {
    expect(dollars([a, b, c], [plan(10)], { [day]: { b: 1 } }, day, day)).toEqual({ earned: 5, possible: 18 })
    expect(dollars([a, b, c], [plan(10)], { [day]: { b: 1, c: 1 } }, day, day)).toEqual({ earned: 17, possible: 18 })
  })

  it('has no bonus by default, or for a plan with nothing on that day', () => {
    expect(dollars([b, c], [plan()], { [day]: { b: 1, c: 1 } }, day, day)).toEqual({ earned: 7, possible: 7 })
    expect(dollars([a], [plan(10)], { [day]: { a: 1 } }, day, day)).toEqual({ earned: 1, possible: 1 })
  })
})
