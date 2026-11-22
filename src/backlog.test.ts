import { describe, expect, it } from 'vitest'
import { hiddenByBacklog, inBacklog } from './backlog'
import type { Task } from './tasks'

const task = (id: string, extra: Partial<Task> = {}): Task => ({ id, title: id, start: '2026-11-22', repeat: { kind: 'none' }, ...extra })

describe('backlog', () => {
  it('holds only your own ungrouped one-off tasks', () => {
    expect(inBacklog(task('a'))).toBe(true)
    expect(inBacklog(task('b', { group: 'Garage' }))).toBe(false)
    expect(inBacklog(task('c', { plan: 'p', group: 'P' }))).toBe(false)
    expect(inBacklog(task('d', { repeat: { kind: 'daily', every: 1 } }))).toBe(false)
  })

  it('hides the backlog tasks after the first few, in order, leaving the rest of the list alone', () => {
    const due = [task('a'), task('g', { group: 'Garage' }), task('b'), task('c'), task('d')]
    expect([...hiddenByBacklog(due, { on: true, limit: 2 })]).toEqual(['c', 'd'])
    expect(hiddenByBacklog(due, { on: false, limit: 2 }).size).toBe(0)
    expect([...hiddenByBacklog(due, { on: true, limit: 0 })]).toEqual(['a', 'b', 'c', 'd'])
  })
})
