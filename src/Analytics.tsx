import { useState } from 'preact/hooks'
import { fromDateKey } from './dates'
import { summarize, type Log, type Task } from './tasks'

const RANGES = [7, 30, 90]

type Props = { tasks: Task[]; log: Log; today: string }

function formatDay(key: string) {
  return fromDateKey(key).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

export function Analytics({ tasks, log, today }: Props) {
  const [days, setDays] = useState(7)
  const [selected, setSelected] = useState(today)

  const { perDay, repeating, oneOffsDone } = summarize(tasks, log, today, days)
  const totalDone = perDay.reduce((sum, d) => sum + d.done, 0)
  const totalDue = perDay.reduce((sum, d) => sum + d.due, 0)
  const maxDue = Math.max(1, ...perDay.map((d) => d.due))
  const readout = perDay.find((d) => d.date === selected) ?? perDay[perDay.length - 1]

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
      </div>

      <section>
        <h2>Done per day</h2>
        <p class="readout" aria-live="polite">
          <strong>
            {readout.done} of {readout.due} done
          </strong>{' '}
          · {formatDay(readout.date)}
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
    </>
  )
}
