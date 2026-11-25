// The "Getting started" list a fresh install opens with: a project whose tasks show how the app works.
// Ticking them off completes it; it can be dropped or deleted like any plan.
import type { Plan } from './plans'

const STEPS: [string, string?][] = [
  ['Tick this box to mark a task done'],
  ['Tap a task’s name to see its actions', 'Defer, Not done, Edit and Drop live there'],
  ['Hold a task’s name to make it your Do next', 'Hold it again to take it off'],
  ['Hold a checkbox to mark a task ✕ (didn’t do it)'],
  ['Add a task of your own with + Add task'],
  ['Make a plan in Manage for a routine you repeat', 'Daily, weekly, or a one-off project like this one'],
  ['Hold this list’s heading to drop it for the day', 'Restore it from Dropped today at the bottom'],
  ['Pick a theme and accent colour in Account'],
  ['Export a backup from Account', 'Your data lives only on this device'],
]

export function onboardingPlan(today: string): Plan {
  return {
    id: 'getting-started',
    title: 'Getting started',
    summary: 'A few things to try, to learn how the app works.',
    tips: [],
    project: true,
    items: STEPS.map(([title, notes], i) => ({ id: `getting-started-${i}`, title, notes, start: today, repeat: { kind: 'none' } })),
  }
}
