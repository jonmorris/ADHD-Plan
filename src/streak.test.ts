import { describe, expect, it } from 'vitest'
import { currentStreak, toDateKey } from './streak'

const today = new Date(2026, 9, 22) // 22 Oct 2026, local time

describe('toDateKey', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('currentStreak', () => {
  it('is 0 with no ticks', () => {
    expect(currentStreak([], today)).toBe(0)
  })

  it('counts consecutive days ending today', () => {
    expect(currentStreak(['2026-10-20', '2026-10-21', '2026-10-22'], today)).toBe(3)
  })

  it('still counts up to yesterday when today is not ticked yet', () => {
    expect(currentStreak(['2026-10-20', '2026-10-21'], today)).toBe(2)
  })

  it('is 0 when the last tick was before yesterday', () => {
    expect(currentStreak(['2026-10-19', '2026-10-20'], today)).toBe(0)
  })

  it('stops at a gap', () => {
    expect(currentStreak(['2026-10-18', '2026-10-20', '2026-10-21', '2026-10-22'], today)).toBe(3)
  })

  it('crosses month and year boundaries', () => {
    expect(currentStreak(['2025-12-31', '2026-01-01'], new Date(2026, 0, 1))).toBe(2)
  })
})
