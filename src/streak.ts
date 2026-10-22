export function toDateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// Consecutive ticked days ending today, or ending yesterday if today isn't ticked yet.
export function currentStreak(done: string[], today: Date): number {
  const ticked = new Set(done)
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (!ticked.has(toDateKey(day))) day.setDate(day.getDate() - 1)
  let streak = 0
  while (ticked.has(toDateKey(day))) {
    streak++
    day.setDate(day.getDate() - 1)
  }
  return streak
}
