import { describe, expect, it } from 'vitest'
import { togglePriority } from './priorities'

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
