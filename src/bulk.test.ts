import { describe, expect, it } from 'vitest'
import { parseTaskLines, planBulkAdd } from './bulk'
import type { Task } from './tasks'

const today = '2026-10-23' // Friday

function only(body: string) {
  const [item] = parseTaskLines(body, today)
  if ('error' in item) throw new Error(item.error)
  return item.task
}

describe('parseTaskLines', () => {
  it('only reads "- [ ]" lines, leaving the rest of the page alone', () => {
    const body = '# Morning\nSome text\n- a plain list item\n- [ ] Take meds — Daily\n- [x] Walk — Every 2 days'
    expect(parseTaskLines(body, today).map((i) => i.text)).toEqual(['Take meds — Daily', 'Walk — Every 2 days'])
  })

  it('reads every cadence the app shows', () => {
    expect(only('- [ ] A — One-off')).toMatchObject({ title: 'A', repeat: { kind: 'none' }, start: today })
    expect(only('- [ ] A — Daily').repeat).toEqual({ kind: 'daily', every: 1 })
    expect(only('- [ ] A — Every 3 days').repeat).toEqual({ kind: 'daily', every: 3 })
    expect(only('- [ ] A — Weekly on Mon, Thu').repeat).toEqual({ kind: 'weekly', every: 1, days: [1, 4] })
    expect(only('- [ ] A — Every 2 weeks on Monday and Friday').repeat).toEqual({
      kind: 'weekly',
      every: 2,
      days: [1, 5],
    })
    expect(only('- [ ] A — Monthly on the 1st')).toMatchObject({
      repeat: { kind: 'monthly', every: 1 },
      start: '2026-11-01',
    })
    expect(only('- [ ] A — Every 3 months on the 23rd')).toMatchObject({
      repeat: { kind: 'monthly', every: 3 },
      start: '2026-10-23',
    })
    expect(only('- [ ] A — Yearly on 1 Mar')).toMatchObject({ repeat: { kind: 'yearly', every: 1 }, start: '2027-03-01' })
    expect(only('- [ ] A — Yearly on 25 Dec')).toMatchObject({ start: '2026-12-25' })
  })

  it('defaults sensibly when details are left out', () => {
    expect(only('- [ ] Buy milk')).toMatchObject({ title: 'Buy milk', repeat: { kind: 'none' } })
    expect(only('- [ ] A — weekly').repeat).toEqual({ kind: 'weekly', every: 1, days: [5] }) // today's weekday
    expect(only('- [ ] A — monthly')).toMatchObject({ repeat: { kind: 'monthly', every: 1 }, start: today })
  })

  it('accepts a plain hyphen as the separator and keeps hyphens inside titles', () => {
    expect(only('- [ ] Check-in with Sam - Weekly on Tue')).toMatchObject({
      title: 'Check-in with Sam',
      repeat: { kind: 'weekly', every: 1, days: [2] },
    })
  })

  it('reads an end date, rolling into next year when needed', () => {
    expect(only('- [ ] A — Daily until 30 Oct').end).toBe('2026-10-30')
    expect(only('- [ ] A — Daily until 15 Mar').end).toBe('2027-03-15')
    expect(only('- [ ] A — Monthly on the 15th until 15 Mar 2028').end).toBe('2028-03-15')
  })

  it('reads indented lines under a task as its notes', () => {
    const [item] = parseTaskLines('- [ ] Meditate — Daily\n    Notes: 10 min\n    use the timer\n- [ ] Next', today)
    expect('task' in item && item.task.notes).toBe('10 min\nuse the timer')
  })

  it('flags lines it cannot read', () => {
    const items = parseTaskLines('- [ ] A — Fortnightly\n- [ ] B — Weekly on Funday\n- [ ] C — Every 0 days', today)
    expect(items.map((i) => ('error' in i ? i.error : 'ok'))).toEqual([
      'Couldn\'t read "Fortnightly"',
      'Unknown day "Funday"',
      'Couldn\'t read "Every 0 days"',
    ])
  })
})

describe('planBulkAdd', () => {
  const existing: Task[] = [
    { id: '1', title: 'Take meds', start: today, repeat: { kind: 'daily', every: 1 } },
    { id: '2', title: 'Old task', start: today, repeat: { kind: 'none' }, removedOn: today },
  ]

  it('skips names that already exist (ignoring case) or repeat within the page, but not removed tasks', () => {
    const items = parseTaskLines('- [ ] take meds — Daily\n- [ ] Old task\n- [ ] Walk\n- [ ] walk\n- [ ] X — Nope', today)
    expect(planBulkAdd(items, existing).map((p) => p.status)).toEqual(['exists', 'add', 'add', 'exists', 'error'])
  })
})
