import { describe, expect, it } from 'vitest'
import { parseNote } from './notes'

describe('parseNote', () => {
  it('parses headings, lists and paragraphs', () => {
    const body = '# Morning\nGet up.\nDrink water.\n\n## Steps\n- Meds\n- Breakfast\n\nThen go.'
    expect(parseNote(body)).toEqual([
      { type: 'heading', level: 1, text: 'Morning' },
      { type: 'paragraph', text: 'Get up.\nDrink water.' },
      { type: 'heading', level: 2, text: 'Steps' },
      { type: 'list', items: ['Meds', 'Breakfast'] },
      { type: 'paragraph', text: 'Then go.' },
    ])
  })

  it('returns nothing for an empty page', () => {
    expect(parseNote('\n\n')).toEqual([])
  })
})
