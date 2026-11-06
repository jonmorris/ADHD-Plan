// Reminders: notes to self that sit above the to-do list. No checkbox and no points;
// they are dismissed for the day instead. A one-off reminder only shows on its own date.
import { occursOn, type Task } from './tasks'

// Kinds of reminder, each shown with its own icon. Add new ones here.
export const REMINDER_TYPES = { reminder: 'Reminder', event: 'Event' } as const
export type ReminderType = keyof typeof REMINDER_TYPES

export type Reminder = Pick<Task, 'id' | 'title' | 'notes' | 'start' | 'repeat' | 'end' | 'removedOn'> & {
  type?: ReminderType // default 'reminder'
}

// dismissed[date] = ids of the reminders dismissed that day
export type Dismissed = Record<string, string[]>

export function isReminderOn(r: Reminder, key: string): boolean {
  if (key < r.start || (r.removedOn && key >= r.removedOn)) return false
  if (r.repeat.kind === 'none') return key === r.start
  return !(r.end && key > r.end) && occursOn(r.repeat, r.start, key)
}

// The reminders for a day, split into those still showing and those dismissed.
export function remindersOn(reminders: Reminder[], dismissed: Dismissed, key: string) {
  const on = reminders.filter((r) => isReminderOn(r, key))
  const gone = dismissed[key] ?? []
  return { active: on.filter((r) => !gone.includes(r.id)), dismissed: on.filter((r) => gone.includes(r.id)) }
}

export function toggleDismissed(dismissed: Dismissed, key: string, id: string): Dismissed {
  const day = dismissed[key] ?? []
  return { ...dismissed, [key]: day.includes(id) ? day.filter((d) => d !== id) : [...day, id] }
}
