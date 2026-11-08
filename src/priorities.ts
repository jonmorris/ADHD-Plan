// Priorities: up to three of the day's tasks picked out at the top of the list.
// They are copies; the task itself stays in its home group.

// priorities[date] = ids of that day's priority tasks, in the order they were picked
export type Priorities = Record<string, string[]>

export const MAX_PRIORITIES = 3

// Which focus list Today shows: one "do next" task, or up to three priorities.
export type Focus = 'doNext' | 'top3'

// doNext[date] = id of that day's do-next task
export type DoNext = Record<string, string>

// Picks the day's do-next task. Picking it again clears it; picking another replaces it.
export function toggleDoNext(doNext: DoNext, key: string, id: string): DoNext {
  const next = { ...doNext }
  if (next[key] === id) delete next[key]
  else next[key] = id
  return next
}

// Adds or removes a priority for the day. Undefined when the day is already full.
export function togglePriority(priorities: Priorities, key: string, id: string): Priorities | undefined {
  const day = priorities[key] ?? []
  if (day.includes(id)) return { ...priorities, [key]: day.filter((p) => p !== id) }
  if (day.length >= MAX_PRIORITIES) return undefined
  return { ...priorities, [key]: [...day, id] }
}
