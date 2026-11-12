import { useState } from 'preact/hooks'
import { fromDateKey } from './dates'
import { allTimeEarned, balance, dollars, usd, weekProgress, type CashOut } from './money'
import type { Plan } from './plans'
import { summarize, type Log, type Task } from './tasks'

const RANGES = [7, 30, 90]

type Data = { tasks: Task[]; plans: Plan[]; log: Log; today: string }
type CashProps = Data & { cashOuts: CashOut[]; saveCashOuts: (cashOuts: CashOut[]) => void }

function formatDay(key: string) {
  return fromDateKey(key).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

// Headline numbers for the last `days` days
export function Stats({ tasks, plans, log, today, days, full }: Data & { days: number; full?: boolean }) {
  const { perDay, oneOffsDone } = summarize(tasks, log, today, days)
  const totalDone = perDay.reduce((sum, d) => sum + d.done, 0)
  const totalDue = perDay.reduce((sum, d) => sum + d.due, 0)
  const perDayMoney = perDay.map((d) => dollars(tasks, plans, log, d.date, today))
  const totalEarned = perDayMoney.reduce((sum, m) => sum + m.earned, 0)
  const totalBonuses = perDayMoney.reduce((sum, m) => sum + m.bonusEarned, 0)
  return (
    <div class={full ? 'stats' : 'stats three'}>
      <div class="stat">
        <span class="label">Completion</span>
        <span class="value">{totalDue ? Math.round((totalDone / totalDue) * 100) : 0}%</span>
      </div>
      <div class="stat">
        <span class="label">Tasks done</span>
        <span class="value">{totalDone}</span>
      </div>
      {full && (
        <div class="stat">
          <span class="label">One-offs finished</span>
          <span class="value">{oneOffsDone}</span>
        </div>
      )}
      <div class="stat">
        <span class="label">Dollars earned</span>
        <span class="value">{usd(totalEarned)}</span>
      </div>
      {full && (
        <div class="stat">
          <span class="label">Bonuses earned</span>
          <span class="value">${totalBonuses}</span>
        </div>
      )}
    </div>
  )
}

export function DayChart({ tasks, plans, log, today, days }: Data & { days: number }) {
  const [selected, setSelected] = useState(today)
  const { perDay } = summarize(tasks, log, today, days)
  const maxDue = Math.max(1, ...perDay.map((d) => d.due))
  const readout = perDay.find((d) => d.date === selected) ?? perDay[perDay.length - 1]
  const readoutMoney = dollars(tasks, plans, log, readout.date, today)
  return (
    <section>
      <h2>Done per day</h2>
      <p class="readout" aria-live="polite">
        <strong>
          {readout.done} of {readout.due} done
        </strong>{' '}
        · {usd(readoutMoney.earned)} earned
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
  )
}

export function WeeklyBonuses({ tasks, plans, log, today }: Data) {
  const weeklyBonuses = plans.flatMap((plan) => {
    const week = plan.weeklyBonus ? weekProgress(plan, tasks, log, today, today) : undefined
    return week ? [{ plan, week }] : []
  })
  if (weeklyBonuses.length === 0) return null
  return (
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
  )
}

export function Cash({ tasks, plans, log, today, cashOuts, saveCashOuts, history }: CashProps & { history?: boolean }) {
  const earnedAllTime = allTimeEarned(tasks, plans, log, today)
  const cash = balance(earnedAllTime, cashOuts)

  function cashOut() {
    if (!confirm(`Cash out $${cash}? The balance goes back to $0.`)) return
    saveCashOuts([...cashOuts, { date: today, amount: cash }])
  }

  return (
    <section>
      <h2>Cash</h2>
      <div class="stats">
        <div class="stat">
          <span class="label">Balance</span>
          <span class="value">{usd(cash)}</span>
        </div>
        <div class="stat">
          <span class="label">Earned all time</span>
          <span class="value">{usd(earnedAllTime)}</span>
        </div>
      </div>
      <button class="primary cash-out" disabled={cash <= 0} onClick={cashOut}>
        Cash out ${Math.max(cash, 0)}
      </button>
      {history && cashOuts.length > 0 && (
        <ul class="cash-outs">
          {[...cashOuts].reverse().map((c) => (
            <li>
              <span>{formatDay(c.date)}</span>
              <span>${c.amount}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// The full analytics view, opened from the Account dashboard
export function Analytics(props: CashProps) {
  const { tasks, log, today } = props
  const [days, setDays] = useState(7)
  const { repeating } = summarize(tasks, log, today, days)

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

      <Stats {...props} days={days} full />
      <Cash {...props} history />
      <DayChart {...props} days={days} />
      <WeeklyBonuses {...props} />

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
