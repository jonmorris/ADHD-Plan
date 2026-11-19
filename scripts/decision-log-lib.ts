// The decision log (docs/DECISION-LOG.md) and its pending entries (docs/decision-log/).
// Each pending entry is its own file holding one table row, so parallel branches never
// conflict; `npm run decision-log -- --fold` moves them into the table on main.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// The kinds of decision. This is the one place the list lives.
export const KINDS = ['Product', 'Design', 'Content', 'Engineering', 'Process', 'Deferred', 'Reversed'] as const
export type Kind = (typeof KINDS)[number]

export type Entry = { file: string; date: string; kind: Kind; decision: string; ref: string; row: string }

const FILE_NAME = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(-[a-z0-9]+)*\.md$/

// YYYY-MM-DD-short-name.md, lowercase and hyphenated
export function isEntryFileName(name: string): boolean {
  return FILE_NAME.test(name)
}

// Reads one entry file's text. Throws a plain message naming the file and the problem.
export function parseEntry(file: string, text: string): Entry {
  const fail = (problem: string): never => {
    throw new Error(`${file}: ${problem}`)
  }
  if (!isEntryFileName(file)) fail('the name must be YYYY-MM-DD-short-name.md (lowercase, hyphenated)')
  const lines = text.split('\n').filter((line) => line.trim())
  if (lines.length !== 1) fail(`must hold exactly one table row, but has ${lines.length} non-blank lines`)
  const row = lines[0].trim()
  if (!row.startsWith('|') || !row.endsWith('|')) fail('the row must start and end with |')
  const cells = row
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim())
  if (cells.length !== 4) fail(`the row must have 4 cells (Date | Kind | Decision | Ref), but has ${cells.length}`)
  const [date, kind, decision, ref] = cells
  const fileDate = file.slice(0, 10)
  if (date !== fileDate) fail(`the Date cell (${date}) must match the date in the file name (${fileDate})`)
  if (!(KINDS as readonly string[]).includes(kind)) fail(`Kind "${kind}" must be one of: ${KINDS.join(', ')}`)
  if (!decision) fail('the Decision cell is empty')
  if (!ref) fail('the Ref cell is empty')
  return { file, date, kind: kind as Kind, decision, ref, row }
}

// Filename order: date, then name
export function sortEntries(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0))
}

// Adds rows after the last row of the table under "## Log".
export function appendRows(markdown: string, rows: string[]): string {
  const lines = markdown.split('\n')
  const heading = lines.findIndex((line) => line.trim() === '## Log')
  if (heading === -1) throw new Error('DECISION-LOG.md has no "## Log" heading')
  const start = lines.findIndex((line, i) => i > heading && line.trim().startsWith('|'))
  if (start === -1) throw new Error('DECISION-LOG.md has no table under "## Log"')
  let end = start
  while (end + 1 < lines.length && lines[end + 1].trim().startsWith('|')) end++
  return [...lines.slice(0, end + 1), ...rows, ...lines.slice(end + 1)].join('\n')
}

// Every pending entry in a folder (README.md aside), checked and in filename order.
export function readEntries(dir: string): Entry[] {
  const files = readdirSync(dir).filter((file) => file !== 'README.md')
  return sortEntries(files.map((file) => parseEntry(file, readFileSync(join(dir, file), 'utf8'))))
}
