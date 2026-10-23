// Reads task lines from a Playbook page, written the way the app describes tasks:
//   - [ ] Bins out — Every 2 weeks on Mon, Thu until 31 Dec
//       Notes: green bin first
import { fromDateKey, toDateKey } from './dates'
import type { Repeat, Task } from './tasks'

export type Draft = Omit<Task, 'id'>
export type ParsedLine = { text: string } & ({ task: Draft } | { error: string })

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

const TASK_LINE = /^\s*[-*]\s*\[[ xX]?\]\s*(.+)$/
// Title and cadence are split at the last " — ", " – " or " - "
const SEPARATOR = /\s+[—–-]{1,2}\s+/g

type Schedule = { repeat: Repeat; start: string; end?: string } | { error: string }

function parseDays(text: string): number[] | string {
  const days: number[] = []
  for (const word of text.split(/[\s,]+|\band\b/).filter(Boolean)) {
    const day = DAYS.indexOf(word.slice(0, 3).toLowerCase())
    if (day === -1) return `Unknown day "${word}"`
    if (!days.includes(day)) days.push(day)
  }
  return days.sort()
}

// "1 Mar", "1 Mar 2027", "Mar 1" or "Mar 1, 2027" → [month, day, year?]
function parseDayMonth(text: string): [number, number, number?] | undefined {
  const m =
    text.match(/^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/i) ?? text.match(/^([a-z]+)\s+(\d{1,2})(?:,?\s+(\d{4}))?$/i)
  if (!m) return
  const [dayText, monthText] = /^\d/.test(m[1]) ? [m[1], m[2]] : [m[2], m[1]]
  const month = MONTHS.indexOf(monthText.slice(0, 3).toLowerCase())
  if (month === -1) return
  return [month, Number(dayText), m[3] ? Number(m[3]) : undefined]
}

// First valid date on or after `from` with this month (or any month) and day.
function nextDate(from: string, day: number, month?: number): string | undefined {
  const f = fromDateKey(from)
  for (let i = 0; i < 12 * 8; i++) {
    const d =
      month === undefined
        ? new Date(f.getFullYear(), f.getMonth() + i, day)
        : new Date(f.getFullYear() + i, month, day)
    const valid = d.getDate() === day && (month === undefined || d.getMonth() === month)
    if (valid && toDateKey(d) >= from) return toDateKey(d)
  }
}

function parseSchedule(cadence: string, today: string): Schedule {
  const couldNotRead = { error: `Couldn't read "${cadence}"` }
  let text = cadence.trim()
  let end: string | undefined
  const until = text.match(/^(.*?)\s+until\s+(.+)$/i)
  if (until) {
    text = until[1]
    const date = parseDayMonth(until[2].trim())
    if (!date) return { error: `Couldn't read the date "${until[2]}"` }
    const [month, day, year] = date
    end = year ? toDateKey(new Date(year, month, day)) : nextDate(today, day, month)
  }

  const every = (n: string | undefined) => (n ? Number(n) : 1)
  let m: RegExpMatchArray | null
  let schedule: Schedule = couldNotRead

  if (/^(one-?off|one off|once)$/i.test(text)) {
    schedule = { repeat: { kind: 'none' }, start: today }
  } else if ((m = text.match(/^(?:daily|every (\d+) days?)$/i))) {
    schedule = { repeat: { kind: 'daily', every: every(m[1]) }, start: today }
  } else if ((m = text.match(/^(?:weekly|every (\d+) weeks?)(?: on (.+))?$/i))) {
    const days = m[2] ? parseDays(m[2]) : [fromDateKey(today).getDay()]
    if (typeof days === 'string') return { error: days }
    schedule = { repeat: { kind: 'weekly', every: every(m[1]), days }, start: today }
  } else if ((m = text.match(/^(?:monthly|every (\d+) months?)(?: on the (\d{1,2})(?:st|nd|rd|th)?)?$/i))) {
    const start = m[2] ? nextDate(today, Number(m[2])) : today
    if (start) schedule = { repeat: { kind: 'monthly', every: every(m[1]) }, start }
  } else if ((m = text.match(/^(?:yearly|every (\d+) years?)(?: on (.+))?$/i))) {
    const date = m[2] ? parseDayMonth(m[2].trim()) : undefined
    const start = m[2] ? date && nextDate(today, date[1], date[0]) : today
    if (start) schedule = { repeat: { kind: 'yearly', every: every(m[1]) }, start }
  }

  if ('error' in schedule) return schedule
  if (schedule.repeat.kind !== 'none' && schedule.repeat.every < 1) return couldNotRead
  if (end) {
    if (end < schedule.start) return { error: 'The end date is before the start' }
    if (schedule.repeat.kind !== 'none') schedule.end = end
  }
  return schedule
}

export function parseTaskLines(body: string, today: string): ParsedLine[] {
  const items: ParsedLine[] = []
  const notes = new Map<ParsedLine, string[]>()
  let current: ParsedLine | undefined

  for (const raw of body.split('\n')) {
    const task = raw.match(TASK_LINE)
    if (task) {
      const text = task[1].trim()
      const separators = [...text.matchAll(SEPARATOR)]
      const last = separators[separators.length - 1]
      const title = last ? text.slice(0, last.index).trim() : text
      const schedule = parseSchedule(last ? text.slice(last.index! + last[0].length) : 'One-off', today)
      current = 'error' in schedule ? { text, error: schedule.error } : { text, task: { title, ...schedule } }
      items.push(current)
      notes.set(current, [])
    } else if (current && /^\s+\S/.test(raw)) {
      notes.get(current)!.push(raw.trim().replace(/^notes:\s*/i, ''))
    } else {
      current = undefined
    }
  }

  for (const [item, lines] of notes) {
    if ('task' in item && lines.length) item.task.notes = lines.join('\n')
  }
  return items
}

export type Planned = { text: string } & (
  | { status: 'add'; task: Draft }
  | { status: 'exists' }
  | { status: 'error'; error: string }
)

// Decide which parsed lines to add, skipping names that already exist.
export function planBulkAdd(items: ParsedLine[], tasks: Task[]): Planned[] {
  const seen = new Set(tasks.filter((t) => !t.removedOn).map((t) => t.title.trim().toLowerCase()))
  return items.map((item) => {
    if ('error' in item) return { text: item.text, status: 'error', error: item.error }
    const key = item.task.title.toLowerCase()
    if (seen.has(key)) return { text: item.text, status: 'exists' }
    seen.add(key)
    return { text: item.text, status: 'add', task: item.task }
  })
}
