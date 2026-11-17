import { describe, expect, it } from 'vitest'
import { isReminderOn, remindersOn, toggleDismissed, type Reminder } from './reminders'

const day = '2026-11-06' // a Friday
const reminder = (id: string, extra: Partial<Reminder> = {}): Reminder => ({
  id,
  title: id,
  start: day,
  repeat: { kind: 'none' },
  ...extra,
})

describe('reminders', () => {
  it('shows a one-off reminder only on its own date', () => {
    const r = reminder('r')
    expect(isReminderOn(r, day)).toBe(true)
    expect(isReminderOn(r, '2026-11-05')).toBe(false)
    expect(isReminderOn(r, '2026-11-07')).toBe(false)
  })

  it('shows a repeating reminder on its days until its end or removal', () => {
    const r = reminder('r', { repeat: { kind: 'weekly', every: 1, days: [5] }, end: '2026-11-20' })
    expect(isReminderOn(r, '2026-11-13')).toBe(true)
    expect(isReminderOn(r, '2026-11-12')).toBe(false)
    expect(isReminderOn(r, '2026-11-27')).toBe(false)
    expect(isReminderOn({ ...r, removedOn: '2026-11-10' }, '2026-11-13')).toBe(false)
  })

  it('splits the day into active and dismissed, and dismissing can be undone', () => {
    const all = [reminder('a'), reminder('b')]
    const dismissed = toggleDismissed({}, day, 'a')
    expect(remindersOn(all, dismissed, day)).toEqual({ active: [all[1]], dismissed: [all[0]] })
    expect(remindersOn(all, toggleDismissed(dismissed, day, 'a'), day).dismissed).toEqual([])
  })
})

describe('kept until dismissed', () => {
  it('shows a one-off reminder every day from its date until a day it is dismissed', () => {
    const r = reminder('r', { persistent: true })
    expect(isReminderOn(r, '2026-11-05')).toBe(false)
    expect(isReminderOn(r, '2026-11-09')).toBe(true)
    const dismissed = { '2026-11-08': ['r'] }
    expect(remindersOn([r], dismissed, '2026-11-08').dismissed).toEqual([r])
    expect(isReminderOn(r, '2026-11-09', dismissed)).toBe(false)
  })

  it('brings a repeating one back on its next day', () => {
    const r = reminder('r', { persistent: true, repeat: { kind: 'weekly', every: 1, days: [5] } })
    const dismissed = { '2026-11-07': ['r'] }
    expect(isReminderOn(r, '2026-11-07')).toBe(true)
    expect(isReminderOn(r, '2026-11-10', dismissed)).toBe(false)
    expect(isReminderOn(r, '2026-11-13', dismissed)).toBe(true)
    expect(isReminderOn(r, '2026-11-15', dismissed)).toBe(true)
  })
})
