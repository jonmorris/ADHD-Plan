import { describe, expect, it } from 'vitest'
import { carryOver, doNextOn, toggleDoNext, togglePriority } from './priorities'

const day = '2026-11-06'

describe('togglePriority', () => {
  it('adds and removes a priority for the day', () => {
    const one = togglePriority({}, day, 'a')!
    expect(one).toEqual({ [day]: ['a'] })
    expect(togglePriority(one, day, 'a')).toEqual({ [day]: [] })
  })

  it('allows at most three a day', () => {
    const full = { [day]: ['a', 'b', 'c'] }
    expect(togglePriority(full, day, 'd')).toBeUndefined()
    expect(togglePriority(full, '2026-11-07', 'd')).toEqual({ ...full, '2026-11-07': ['d'] })
    expect(togglePriority(full, day, 'b')).toEqual({ [day]: ['a', 'c'] })
  })
})

describe('toggleDoNext', () => {
  it('picks one task a day, replaces it with another, and clears it when picked again', () => {
    const a = toggleDoNext({}, day, 'a')
    expect(a).toEqual({ [day]: 'a' })
    expect(toggleDoNext(a, day, 'b')).toEqual({ [day]: 'b' })
    expect(toggleDoNext(a, day, 'a')).toEqual({ [day]: '' })
  })
})

describe('carrying over', () => {
  const done = new Set(['b@2026-11-06', 'c@2026-11-07'])
  const isDone = (id: string, d: string) => done.has(`${id}@${d}`)

  it("carries the last day's unfinished priorities forward, dropping ones done since", () => {
    const lists = { [day]: ['a', 'b', 'c'] }
    expect(carryOver(lists, '2026-11-07', isDone)).toEqual(['a', 'c'])
    expect(carryOver(lists, '2026-11-09', isDone)).toEqual(['a'])
  })

  it("keeps a day's own list, even an empty one", () => {
    expect(carryOver({ [day]: ['a'], '2026-11-07': [] }, '2026-11-07', isDone)).toEqual([])
    expect(carryOver({ [day]: ['a'] }, '2026-11-05', isDone)).toEqual([])
  })

  it('allows any number when there is no limit', () => {
    expect(togglePriority({}, day, 'd', ['a', 'b', 'c'], Infinity)).toEqual({ [day]: ['a', 'b', 'c', 'd'] })
  })

  it('carries the do-next task until done, and not past a clear', () => {
    expect(doNextOn({ [day]: 'a' }, '2026-11-08', isDone)).toBe('a')
    expect(doNextOn({ [day]: 'b' }, '2026-11-07', isDone)).toBeUndefined()
    expect(doNextOn({ [day]: 'a', '2026-11-07': '' }, '2026-11-08', isDone)).toBeUndefined()
  })
})
