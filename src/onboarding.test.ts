import { describe, expect, it } from 'vitest'
import { onboardingPlan } from './onboarding'
import { enablePlan } from './plans'

describe('Getting started', () => {
  it('is a project of one-time tasks, all on the list from today', () => {
    const plan = onboardingPlan('2026-11-25')
    expect(plan.project).toBe(true)
    expect(plan.items.length).toBeGreaterThan(5)
    const tasks = enablePlan(plan, [], '2026-11-25')
    expect(tasks).toHaveLength(plan.items.length)
    expect(tasks.every((t) => t.repeat.kind === 'none' && t.group === 'Getting started' && t.start === '2026-11-25')).toBe(true)
  })
})
