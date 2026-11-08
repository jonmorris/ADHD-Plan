import { useState } from 'preact/hooks'
import { fromDateKey } from './dates'
import { dollars, weekProgress } from './money'
import type { Plan } from './plans'
import type { Focus } from './priorities'
import { summarize, type Log, type Task } from './tasks'

const RANGES = [7, 30, 90]

export type Theme = 'system' | 'light' | 'dark'
const THEMES: Record<Theme, string> = { system: 'System', light: 'Light', dark: 'Dark' }
const FOCUS: Record<Focus, string> = { doNext: 'Do next', top3: 'Top 3 priorities' }

type Props = { tasks: Task[]; plans: Plan[]; log: Log; today: string; theme: Theme; saveTheme: (theme: Theme) => void; focus: Focus; saveFocus: (focus: Focus) => void }

function formatDay(key: string) {
  return fromDateKey(key).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

export function Analytics({ tasks, plans, log, today, theme, saveTheme, focus, saveFocus }: Props) {
  const [days, setDays] = useState(7)
  const [selected, setSelected] = useState(today)

  const { perDay, repeating, oneOffsDone } = summarize(tasks, log, today, days)
  const totalDone = perDay.reduce((sum, d) => sum + d.done, 0)
  const totalDue = perDay.reduce((sum, d) => sum + d.due, 0)
  const maxDue = Math.max(1, ...perDay.map((d) => d.due))
  const readout = perDay.find((d) => d.date === selected) ?? perDay[perDay.length - 1]
  const moneyOn = (date: string) => dollars(tasks, plans, log, date, today)
  const perDayMoney = perDay.map((d) => moneyOn(d.date))
  const totalEarned = perDayMoney.reduce((sum, m) => sum + m.earned, 0)
  const totalBonuses = perDayMoney.reduce((sum, m) => sum + m.bonusEarned, 0)
  const readoutMoney = moneyOn(readout.date)
  const weeklyBonuses = plans.flatMap((plan) => {
    const week = plan.weeklyBonus ? weekProgress(plan, tasks, log, today, today) : undefined
    return week ? [{ plan, week }] : []
  })

  return (
    <>
      <h1>Analytics</h1>

      <div class="ranges" role="group" aria-label="Time range">
        {RANGES.map((n) => (
          <button class={days === n ? 'on' : ''} aria-pressed={days === n} onClick={() => setDays(n)}>
            {n} days
          </button>
        ))}
      </div>

      <div class="stats">
        <div class="stat">
          <span class="label">Completion</span>
          <span class="value">{totalDue ? Math.round((totalDone / totalDue) * 100) : 0}%</span>
        </div>
        <div class="stat">
          <span class="label">Tasks done</span>
          <span class="value">{totalDone}</span>
        </div>
        <div class="stat">
          <span class="label">One-offs finished</span>
          <span class="value">{oneOffsDone}</span>
        </div>
        <div class="stat">
          <span class="label">Dollars earned</span>
          <span class="value">${totalEarned}</span>
        </div>
        <div class="stat">
          <span class="label">Bonuses earned</span>
          <span class="value">${totalBonuses}</span>
        </div>
      </div>

      <section>
        <h2>Done per day</h2>
        <p class="readout" aria-live="polite">
          <strong>
            {readout.done} of {readout.due} done
          </strong>{' '}
          · ${readoutMoney.earned} earned
          {readoutMoney.bonusEarned > 0 && ` + $${readoutMoney.bonusEarned} bonus`} · {formatDay(readout.date)}
        </p>
        <div class="chart">
          {perDay.map((d) => (
            <button
              class={`col${d.date === readout.date ? ' on' : ''}`}
              aria-label={`${formatDay(d.date)}: ${d.done} of ${d.due} done`}
              onPointerEnter={() => setSelected(d.date)}
              onFocus={() => setSelected(d.date)}
              onClick={() => setSelected(d.date)}
            >
              <span class="track" style={{ height: `${(d.due / maxDue) * 100}%` }}>
                <span class="fill" style={{ height: d.due ? `${(d.done / d.due) * 100}%` : 0 }} />
              </span>
            </button>
          ))}
        </div>
        <div class="chart-axis">
          <span>{formatDay(perDay[0].date)}</span>
          <span>Today</span>
        </div>
      </section>

      {weeklyBonuses.length > 0 && (
        <section>
          <h2>Weekly bonuses this week</h2>
          <table class="task-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Bonus</th>
                <th>Done</th>
              </tr>
            </thead>
            <tbody>
              {weeklyBonuses.map(({ plan, week }) => (
                <tr key={plan.id}>
                  <td>{plan.title}</td>
                  <td>${plan.weeklyBonus}</td>
                  <td>
                    {week.done} of {week.due}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section>
        <h2>Repeating tasks</h2>
        {repeating.length === 0 ? (
          <p class="empty">No repeating tasks were scheduled in this period.</p>
        ) : (
          <table class="task-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Done</th>
                <th>Streak</th>
              </tr>
            </thead>
            <tbody>
              {repeating.map((r) => (
                <tr key={r.task.id}>
                  <td>{r.task.title}</td>
                  <td>
                    {r.done} of {r.due}
                  </td>
                  <td>{r.streak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Focus</h2>
        <div class="ranges" role="group" aria-label="Focus">
          {(Object.keys(FOCUS) as Focus[]).map((f) => (
            <button class={focus === f ? 'on' : ''} aria-pressed={focus === f} onClick={() => saveFocus(f)}>
              {FOCUS[f]}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>Theme</h2>
        <div class="ranges" role="group" aria-label="Theme">
          {(Object.keys(THEMES) as Theme[]).map((t) => (
            <button class={theme === t ? 'on' : ''} aria-pressed={theme === t} onClick={() => saveTheme(t)}>
              {THEMES[t]}
            </button>
          ))}
        </div>
      </section>
    </>
  )
}
