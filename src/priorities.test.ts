import { describe, expect, it } from 'vitest'
import { toggleDoNext, togglePriority } from './priorities'

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
    expect(toggleDoNext(a, day, 'a')).toEqual({})
  })
})
