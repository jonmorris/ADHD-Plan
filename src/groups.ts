import { PLANS } from './plans'
import type { Task } from './tasks'

const planTitle = (id?: string) => PLANS.find((p) => p.id === id)?.title

// '' means no group. Plan tasks added before groups existed fall back to the plan's name.
export function groupOf(task: Task): string {
  return task.group ?? planTitle(task.plan) ?? ''
}

// The plan or Playbook page a task came from, if any.
export function sourceOf(task: Task): string | undefined {
  return task.source ?? planTitle(task.plan)
}

// Groups in the saved order; any not in it yet go after, alphabetically.
export function sortGroups(names: string[], order: string[]): string[] {
  const unique = [...new Set(names.filter(Boolean))]
  const saved = order.filter((g) => unique.includes(g))
  return [...saved, ...unique.filter((g) => !saved.includes(g)).sort((a, b) => a.localeCompare(b))]
}

// Ungrouped tasks first, then each group in order. Task order within a group is kept.
export function sections(tasks: Task[], groupOrder: string[]): { group: string; tasks: Task[] }[] {
  const groups = ['', ...sortGroups(tasks.map(groupOf), groupOrder)]
  return groups
    .map((group) => ({ group, tasks: tasks.filter((t) => groupOf(t) === group) }))
    .filter((s) => s.tasks.length > 0)
}
