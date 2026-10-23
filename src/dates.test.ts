import { describe, expect, it } from 'vitest'
import { weekNumber } from './dates'

describe('weekNumber', () => {
  it('counts Sunday-start weeks, with week 1 holding 1 January', () => {
    // 1 Jan 2026 is a Thursday
    expect(weekNumber(new Date(2026, 0, 1))).toBe(1)
    expect(weekNumber(new Date(2026, 0, 3))).toBe(1) // Sat
    expect(weekNumber(new Date(2026, 0, 4))).toBe(2) // Sun
    expect(weekNumber(new Date(2026, 9, 23))).toBe(43) // Fri 23 Oct
    expect(weekNumber(new Date(2026, 9, 25))).toBe(44) // Sun 25 Oct
    expect(weekNumber(new Date(2026, 11, 31))).toBe(53)
  })
})
