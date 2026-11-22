// The backlog: when it's on, Today shows only the first few of your own one-off tasks (the
// ungrouped ones under "Tasks"), in their saved order. The rest wait, hidden, and the list is
// managed in Manage. A task done today keeps its place until tomorrow, when the next one moves up.
import { groupOf } from './groups'
import type { Task } from './tasks'

export type Backlog = { on: boolean; limit: number }

export const DEFAULT_BACKLOG: Backlog = { on: false, limit: 3 }

// Your own one-off tasks: no plan, no group, no repeat
export function inBacklog(t: Task): boolean {
  return !t.plan && !groupOf(t) && t.repeat.kind === 'none'
}

// Ids of the day's backlog tasks to hide: those after the first `limit`, given the day's due
// tasks in order.
export function hiddenByBacklog(due: Task[], backlog: Backlog): Set<string> {
  if (!backlog.on) return new Set()
  return new Set(due.filter(inBacklog).slice(backlog.limit).map((t) => t.id))
}
