import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { appendRows, isEntryFileName, KINDS, parseEntry, readEntries, sortEntries } from './decision-log-lib.ts'

const file = '2026-11-19-adopt-decision-log.md'
const row = '| 2026-11-19 | Process | Decisions logged one file per entry | docs/DECISIONS.md → Decision log |'

describe('entry file names', () => {
  it('accepts YYYY-MM-DD-short-name.md, lowercase and hyphenated', () => {
    expect(isEntryFileName(file)).toBe(true)
    expect(isEntryFileName('2026-11-19-a.md')).toBe(true)
  })

  it('rejects anything else', () => {
    for (const bad of ['2026-11-19.md', '2026-11-19-Adopt.md', '2026-11-19-adopt_log.md', '2026-11-19-adopt-.md', '26-11-19-adopt.md', '2026-11-19-adopt.txt']) {
      expect(isEntryFileName(bad), bad).toBe(false)
    }
  })
})

describe('parseEntry', () => {
  it('reads the four cells of the one row', () => {
    expect(parseEntry(file, `\n${row}\n\n`)).toEqual({
      file,
      date: '2026-11-19',
      kind: 'Process',
      decision: 'Decisions logged one file per entry',
      ref: 'docs/DECISIONS.md → Decision log',
      row,
    })
  })

  const fails = (text: string, message: RegExp, name = file) => expect(() => parseEntry(name, text)).toThrow(message)

  it('names the file and the problem', () => {
    fails(row, /^bad\.md: the name must be/, 'bad.md')
    fails(`${row}\n${row}`, /2026-11-19-adopt-decision-log\.md: must hold exactly one table row, but has 2/)
    fails('', /exactly one table row, but has 0/)
    fails(row.slice(1), /must start and end with \|/)
    fails('| 2026-11-19 | Process | Only three |', /must have 4 cells .* but has 3/)
    fails(row.replace('2026-11-19', '2026-11-18'), /Date cell \(2026-11-18\) must match .*\(2026-11-19\)/)
    fails(row.replace('Process', 'Chore'), /Kind "Chore" must be one of: Product, Design/)
    fails('| 2026-11-19 | Process |  | x |', /Decision cell is empty/)
    fails('| 2026-11-19 | Process | x |  |', /Ref cell is empty/)
  })

  it('accepts every kind in the list', () => {
    for (const kind of KINDS) expect(parseEntry(file, row.replace('Process', kind)).kind).toBe(kind)
  })
})

describe('sortEntries', () => {
  it('orders by file name: date, then name', () => {
    const at = (name: string) => parseEntry(name, row.replace('2026-11-19', name.slice(0, 10)))
    const sorted = sortEntries([at('2026-11-20-a.md'), at('2026-11-19-b.md'), at('2026-11-19-a.md')])
    expect(sorted.map((e) => e.file)).toEqual(['2026-11-19-a.md', '2026-11-19-b.md', '2026-11-20-a.md'])
  })
})

describe('appendRows', () => {
  const doc = ['# Log', '', '## Log', '', '| Date | Kind | Decision | Ref |', '|---|---|---|---|', '| a |'].join('\n')

  it('adds rows after the last row of the table', () => {
    expect(appendRows(doc, ['| b |', '| c |'])).toBe(`${doc}\n| b |\n| c |`)
    expect(appendRows(`${doc}\n`, ['| b |'])).toBe(`${doc}\n| b |\n`)
    expect(appendRows(`${doc}\n\n## After`, ['| b |'])).toBe(`${doc}\n| b |\n\n## After`)
  })

  it('needs the Log table', () => {
    expect(() => appendRows('# Nothing', ['| b |'])).toThrow(/no "## Log" heading/)
    expect(() => appendRows('## Log\n\ntext', ['| b |'])).toThrow(/no table/)
  })
})

describe('docs/decision-log', () => {
  it('holds only valid pending entries', () => {
    expect(() => readEntries(fileURLToPath(new URL('../docs/decision-log', import.meta.url)))).not.toThrow()
  })
})
