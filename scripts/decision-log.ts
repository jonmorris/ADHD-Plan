// npm run decision-log             checks every pending entry and prints the rows
// npm run decision-log -- --fold   appends them to docs/DECISION-LOG.md and deletes the files (on main)
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { appendRows, readEntries, type Entry } from './decision-log-lib.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const dir = join(root, 'docs', 'decision-log')
const logFile = join(root, 'docs', 'DECISION-LOG.md')

let entries: Entry[]
try {
  entries = readEntries(dir)
} catch (e) {
  console.error((e as Error).message)
  process.exit(1)
}

for (const entry of entries) console.log(entry.row)
console.log(`${entries.length} pending ${entries.length === 1 ? 'entry' : 'entries'}`)

if (process.argv.includes('--fold') && entries.length > 0) {
  writeFileSync(logFile, appendRows(readFileSync(logFile, 'utf8'), entries.map((e) => e.row)))
  for (const entry of entries) unlinkSync(join(dir, entry.file))
  console.log(`Folded into docs/DECISION-LOG.md and deleted ${entries.length} file${entries.length === 1 ? '' : 's'}.`)
}
