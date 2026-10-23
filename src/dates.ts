// Dates are stored as local-time "YYYY-MM-DD" keys, which also sort correctly as strings.

export function toDateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, n: number): string {
  const d = fromDateKey(key)
  d.setDate(d.getDate() + n)
  return toDateKey(d)
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round(
    (Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) /
      86_400_000,
  )
}

// US week number: weeks start on Sunday and week 1 is the week containing 1 January.
export function weekNumber(d: Date): number {
  const jan1 = new Date(d.getFullYear(), 0, 1)
  return Math.floor((daysBetween(jan1, d) + jan1.getDay()) / 7) + 1
}
