import { describe, expect, it } from 'vitest'
import { byCadence, dayStats, describeRepeat, isDueOn, nextState, occursOn, stateOn, streak, summarize, type Log, type Repeat, type Task } from './tasks'

function task(repeat: Repeat, start = '2026-10-01', extra: Partial<Task> = {}): Task {
  return { id: 't', title: 'T', start, repeat, ...extra }
}

describe('occursOn', () => {
  it('never occurs before the start date', () => {
    expect(occursOn({ kind: 'daily', every: 1 }, '2026-10-05', '2026-10-04')).toBe(false)
  })

  it('daily every N days', () => {
    const r: Repeat = { kind: 'daily', every: 3 }
    expect(occursOn(r, '2026-10-01', '2026-10-01')).toBe(true)
    expect(occursOn(r, '2026-10-01', '2026-10-02')).toBe(false)
    expect(occursOn(r, '2026-10-01', '2026-10-04')).toBe(true)
  })

  it('weekly on chosen days', () => {
    const r: Repeat = { kind: 'weekly', every: 1, days: [1, 3] } // Mon, Wed
    expect(occursOn(r, '2026-10-01', '2026-10-05')).toBe(true) // Mon
    expect(occursOn(r, '2026-10-01', '2026-10-06')).toBe(false) // Tue
    expect(occursOn(r, '2026-10-01', '2026-10-07')).toBe(true) // Wed
  })

  it('every two weeks skips alternate weeks, counted from the start week', () => {
    const r: Repeat = { kind: 'weekly', every: 2, days: [1] }
    // Start Thu 1 Oct 2026, so the start week holds Mon 28 Sep (before start)
    expect(occursOn(r, '2026-10-01', '2026-10-05')).toBe(false)
    expect(occursOn(r, '2026-10-01', '2026-10-12')).toBe(true)
    expect(occursOn(r, '2026-10-01', '2026-10-19')).toBe(false)
    expect(occursOn(r, '2026-10-01', '2026-10-26')).toBe(true)
  })

  it('monthly on the start date, every N months', () => {
    const r: Repeat = { kind: 'monthly', every: 2 }
    expect(occursOn(r, '2026-10-15', '2026-11-15')).toBe(false)
    expect(occursOn(r, '2026-10-15', '2026-12-15')).toBe(true)
    expect(occursOn(r, '2026-10-15', '2026-12-16')).toBe(false)
  })

  it('monthly on the 31st falls on the last day of shorter months', () => {
    const r: Repeat = { kind: 'monthly', every: 1 }
    expect(occursOn(r, '2026-01-31', '2026-02-28')).toBe(true)
    expect(occursOn(r, '2026-01-31', '2026-04-30')).toBe(true)
    expect(occursOn(r, '2026-01-31', '2026-04-29')).toBe(false)
  })

  it('yearly on the same date, with 29 Feb falling on 28 Feb', () => {
    const r: Repeat = { kind: 'yearly', every: 1 }
    expect(occursOn(r, '2026-03-10', '2027-03-10')).toBe(true)
    expect(occursOn(r, '2026-03-10', '2027-03-11')).toBe(false)
    expect(occursOn(r, '2028-02-29', '2029-02-28')).toBe(true)
  })
})

describe('one-off tasks', () => {
  const t = task({ kind: 'none' }, '2026-10-10')

  it('carries over until done, then stays on the day it was done', () => {
    const log: Log = { '2026-10-12': { t: 1 } }
    expect(isDueOn(t, '2026-10-09', log, '2026-10-20')).toBe(false)
    expect(isDueOn(t, '2026-10-11', log, '2026-10-20')).toBe(true)
    expect(isDueOn(t, '2026-10-12', log, '2026-10-20')).toBe(true)
    expect(isDueOn(t, '2026-10-13', log, '2026-10-20')).toBe(false)
  })

  it('keeps a half-done state on later days', () => {
    const log: Log = { '2026-10-10': { t: 0.5 } }
    expect(stateOn(t, '2026-10-11', log)).toBe(0.5)
  })

  it('is not due after being removed', () => {
    const removed = task({ kind: 'daily', every: 1 }, '2026-10-01', { removedOn: '2026-10-05' })
    expect(isDueOn(removed, '2026-10-04', {}, '2026-10-20')).toBe(true)
    expect(isDueOn(removed, '2026-10-05', {}, '2026-10-20')).toBe(false)
  })
})

describe('nextState', () => {
  it('cycles empty → half → done → empty', () => {
    expect(nextState(0)).toBe(0.5)
    expect(nextState(0.5)).toBe(1)
    expect(nextState(1)).toBe(0)
  })
})

describe('dayStats', () => {
  it('counts half as 0.5', () => {
    const tasks = [task({ kind: 'daily', every: 1 }), { ...task({ kind: 'daily', every: 1 }), id: 'u' }]
    const log: Log = { '2026-10-05': { t: 1, u: 0.5 } }
    expect(dayStats(tasks, log, '2026-10-05', '2026-10-05')).toEqual({ due: 2, done: 1.5 })
  })
})

describe('streak', () => {
  const daily = task({ kind: 'daily', every: 1 })

  it('counts up to yesterday when today is not done yet', () => {
    const log: Log = { '2026-10-03': { t: 1 }, '2026-10-04': { t: 1 } }
    expect(streak(daily, log, '2026-10-05')).toBe(2)
  })

  it('stops at a missed day and ignores half-done days', () => {
    const log: Log = { '2026-10-02': { t: 1 }, '2026-10-03': { t: 0.5 }, '2026-10-04': { t: 1 }, '2026-10-05': { t: 1 } }
    expect(streak(daily, log, '2026-10-05')).toBe(2)
  })

  it('only counts the days a task is scheduled', () => {
    const mwf = task({ kind: 'weekly', every: 1, days: [1, 3, 5] })
    const log: Log = { '2026-10-02': { t: 1 }, '2026-10-05': { t: 1 } } // Fri, Mon
    expect(streak(mwf, log, '2026-10-06')).toBe(2) // Tue
  })
})

describe('summarize', () => {
  const daily = task({ kind: 'daily', every: 1 }, '2026-10-01', { id: 'd' })
  const oneOff = task({ kind: 'none' }, '2026-10-03', { id: 'o' })
  const log: Log = { '2026-10-04': { d: 1, o: 0.5 }, '2026-10-05': { d: 0.5, o: 1 } }
  const s = summarize([daily, oneOff], log, '2026-10-05', 3)

  it('gives due and done for each day in the range', () => {
    expect(s.perDay).toEqual([
      { date: '2026-10-03', due: 2, done: 0 },
      { date: '2026-10-04', due: 2, done: 1.5 },
      { date: '2026-10-05', due: 2, done: 1.5 },
    ])
  })

  it('totals each repeating task', () => {
    expect(s.repeating).toEqual([{ task: daily, due: 3, done: 1.5, streak: 1 }])
  })

  it('counts one-off tasks finished in the range', () => {
    expect(s.oneOffsDone).toBe(1)
    expect(summarize([oneOff], log, '2026-10-20', 7).oneOffsDone).toBe(0)
  })
})

describe('describeRepeat', () => {
  it('describes each kind of schedule', () => {
    expect(describeRepeat({ kind: 'none' }, '2026-10-22')).toBe('One-off')
    expect(describeRepeat({ kind: 'daily', every: 1 }, '2026-10-22')).toBe('Daily')
    expect(describeRepeat({ kind: 'daily', every: 3 }, '2026-10-22')).toBe('Every 3 days')
    expect(describeRepeat({ kind: 'weekly', every: 1, days: [4, 1] }, '2026-10-22')).toBe('Weekly on Mon, Thu')
    expect(describeRepeat({ kind: 'weekly', every: 2, days: [0] }, '2026-10-22')).toBe('Every 2 weeks on Sun')
    expect(describeRepeat({ kind: 'monthly', every: 1 }, '2026-10-22')).toBe('Monthly on the 22nd')
    expect(describeRepeat({ kind: 'monthly', every: 3 }, '2026-10-11')).toBe('Every 3 months on the 11th')
    expect(describeRepeat({ kind: 'yearly', every: 1 }, '2026-10-01')).toBe('Yearly on 1 Oct')
  })
})

describe('byCadence', () => {
  it('puts one-off tasks first, then shorter cycles before longer ones, keeping order within a cadence', () => {
    const t = (id: string, repeat: Repeat) => task(repeat, '2026-10-01', { id })
    const tasks = [
      t('yearly', { kind: 'yearly', every: 1 }),
      t('daily-a', { kind: 'daily', every: 1 }),
      t('fortnightly', { kind: 'weekly', every: 2, days: [1] }),
      t('one-off', { kind: 'none' }),
      t('monthly', { kind: 'monthly', every: 1 }),
      t('every-3-days', { kind: 'daily', every: 3 }),
      t('weekly', { kind: 'weekly', every: 1, days: [1] }),
      t('daily-b', { kind: 'daily', every: 1 }),
    ]
    expect([...tasks].sort(byCadence).map((x) => x.id)).toEqual([
      'one-off',
      'daily-a',
      'daily-b',
      'every-3-days',
      'weekly',
      'fortnightly',
      'monthly',
      'yearly',
    ])
  })
})
