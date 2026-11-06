// Priorities: up to three of the day's tasks picked out at the top of the list.
// They are copies; the task itself stays in its home group.

// priorities[date] = ids of that day's priority tasks, in the order they were picked
export type Priorities = Record<string, string[]>

export const MAX_PRIORITIES = 3

// Adds or removes a priority for the day. Undefined when the day is already full.
export function togglePriority(priorities: Priorities, key: string, id: string): Priorities | undefined {
  const day = priorities[key] ?? []
  if (day.includes(id)) return { ...priorities, [key]: day.filter((p) => p !== id) }
  if (day.length >= MAX_PRIORITIES) return undefined
  return { ...priorities, [key]: [...day, id] }
}
