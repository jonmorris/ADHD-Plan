import { describe, expect, it } from 'vitest'
import { groupOf, sections, sortGroups, sourceOf } from './groups'
import type { Task } from './tasks'

const task = (id: string, extra: Partial<Task> = {}): Task => ({
  id,
  title: id,
  start: '2026-10-01',
  repeat: { kind: 'daily', every: 1 },
  ...extra,
})

describe('groupOf and sourceOf', () => {
  it('uses the task group, falling back to the plan name for plan tasks added before groups existed', () => {
    expect(groupOf(task('a', { group: 'Work' }))).toBe('Work')
    expect(groupOf(task('a', { plan: 'clean-mama' }))).toBe('Clean Mama')
    expect(groupOf(task('a', { plan: 'clean-mama', group: '' }))).toBe('')
    expect(groupOf(task('a'))).toBe('')
  })

  it('tags tasks from the knowledge base with where they came from', () => {
    expect(sourceOf(task('a', { source: 'Morning routine' }))).toBe('Morning routine')
    expect(sourceOf(task('a', { plan: 'clean-mama' }))).toBe('Clean Mama')
    expect(sourceOf(task('a'))).toBeUndefined()
  })
})

describe('sortGroups', () => {
  it('is alphabetical until reordered, then puts new groups at the bottom', () => {
    expect(sortGroups(['Work', 'Home', 'Clean Mama'], [])).toEqual(['Clean Mama', 'Home', 'Work'])
    expect(sortGroups(['Work', 'Home', 'Clean Mama', 'Admin'], ['Work', 'Home'])).toEqual([
      'Work',
      'Home',
      'Admin',
      'Clean Mama',
    ])
  })
})

describe('sections', () => {
  it('puts ungrouped tasks first, then groups in order, keeping task order within each', () => {
    const tasks = [task('a', { group: 'Work' }), task('b'), task('c', { group: 'Home' }), task('d', { group: 'Work' })]
    expect(sections(tasks, ['Work']).map((s) => [s.group, s.tasks.map((t) => t.id)])).toEqual([
      ['', ['b']],
      ['Work', ['a', 'd']],
      ['Home', ['c']],
    ])
  })
})
