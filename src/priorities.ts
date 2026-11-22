// Priorities: tasks picked out at the top of the list (one "do next", up to three, or any number).
// They are copies; the task itself stays in its home group.
import { addDays } from './dates'

// priorities[date] = ids of that day's priority tasks, in the order they were picked
export type Priorities = Record<string, string[]>

export const MAX_PRIORITIES = 3

// Which focus list Today shows: one "do next" task, up to three priorities, or any number.
export type Focus = 'doNext' | 'top3' | 'all'

// doNext[date] = id of that day's do-next task ('' = cleared that day)
export type DoNext = Record<string, string>

// A day's list: its own if one was saved, else the ones carried over from the last day that had
// one, dropping any that drop out on a day in between (done, or not meant to carry).
export function carryOver(lists: Record<string, string[]>, key: string, dropsOut: (id: string, day: string) => boolean): string[] {
  if (lists[key]) return lists[key]
  const last = Object.keys(lists)
    .filter((d) => d < key)
    .sort()
    .pop()
  if (!last) return []
  let ids = lists[last]
  for (let d = last; d < key; d = addDays(d, 1)) ids = ids.filter((id) => !dropsOut(id, d))
  return ids
}

// The day's do-next task, carried over the same way.
export function doNextOn(doNext: DoNext, key: string, dropsOut: (id: string, day: string) => boolean): string | undefined {
  const lists = Object.fromEntries(Object.entries(doNext).map(([d, id]) => [d, id ? [id] : []]))
  return carryOver(lists, key, dropsOut)[0]
}

// Picks the day's do-next task. Picking it again clears it; picking another replaces it.
export function toggleDoNext(doNext: DoNext, key: string, id: string, current = doNext[key]): DoNext {
  return { ...doNext, [key]: current === id ? '' : id }
}

// Adds or removes a priority for the day. Undefined when the day is already full.
export function togglePriority(
  priorities: Priorities,
  key: string,
  id: string,
  current = priorities[key] ?? [],
  max = MAX_PRIORITIES,
): Priorities | undefined {
  if (current.includes(id)) return { ...priorities, [key]: current.filter((p) => p !== id) }
  if (current.length >= max) return undefined
  return { ...priorities, [key]: [...current, id] }
}
