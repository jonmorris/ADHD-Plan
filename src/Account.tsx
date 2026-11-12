import { useState } from 'preact/hooks'
import { Analytics, Cash, DayChart, Stats, WeeklyBonuses } from './Analytics'
import { useBack } from './back'
import type { CashOut, Tracking } from './money'
import type { Plan } from './plans'
import type { Focus } from './priorities'
import type { Log, Task } from './tasks'

export type Theme = 'system' | 'light' | 'dark'
const THEMES: Record<Theme, string> = { system: 'System', light: 'Light', dark: 'Dark' }

export type Accent = 'blue' | 'teal' | 'purple' | 'coral'
// Swatch colours match --accent-light in index.css
const ACCENTS: Record<Accent, [string, string]> = {
  blue: ['Blue', '#2f6fde'],
  teal: ['Teal', '#0f766e'],
  purple: ['Purple', '#6b4fd8'],
  coral: ['Coral', '#c4472b'],
}

type Props = {
  tasks: Task[]
  plans: Plan[]
  log: Log
  today: string
  cashOuts: CashOut[]
  saveCashOuts: (cashOuts: CashOut[]) => void
  tracking: Tracking
  saveTracking: (tracking: Tracking) => void
  focus: Focus
  saveFocus: (focus: Focus) => void
  theme: Theme
  saveTheme: (theme: Theme) => void
  accent: Accent
  saveAccent: (accent: Accent) => void
}

// A setting: a label and a row of options, one picked
function Choice<T extends string>({ label, options, value, save }: { label: string; options: Record<T, preact.ComponentChildren>; value: T; save: (v: T) => void }) {
  return (
    <div class="setting">
      <span class="setting-label">{label}</span>
      <div class="ranges" role="group" aria-label={label}>
        {(Object.keys(options) as T[]).map((v) => (
          <button class={value === v ? 'on' : ''} aria-pressed={value === v} onClick={() => save(v)}>
            {options[v]}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Account(props: Props) {
  const { tracking, saveTracking, focus, saveFocus, theme, saveTheme, accent, saveAccent } = props
  const [full, setFull] = useState(false)
  useBack(full, () => setFull(false))

  function openFull() {
    setFull(true)
    window.scrollTo(0, 0)
  }

  if (full) {
    return (
      <article class="page">
        <div class="page-bar">
          <button onClick={() => setFull(false)}>‹ Account</button>
        </div>
        <Analytics {...props} />
      </article>
    )
  }

  return (
    <>
      <h1>Account</h1>

      <section>
        <h2>Last 7 days</h2>
        <Stats {...props} days={7} />
      </section>
      <DayChart {...props} days={7} />
      <WeeklyBonuses {...props} />
      <Cash {...props} />
      <button class="view-more" onClick={openFull}>
        View all analytics ›
      </button>

      <section>
        <h2>Settings</h2>
        <Choice label="Track" options={{ count: 'Count', dollars: 'Dollars' }} value={tracking} save={saveTracking} />
        <Choice label="Focus" options={{ doNext: 'Do next', top3: 'Top 3' }} value={focus} save={saveFocus} />
        <Choice label="Theme" options={THEMES} value={theme} save={saveTheme} />
        <Choice
          label="Accent"
          options={Object.fromEntries(
            (Object.keys(ACCENTS) as Accent[]).map((a) => [
              a,
              <>
                <span class="swatch" style={{ background: ACCENTS[a][1] }} />
                {ACCENTS[a][0]}
              </>,
            ]),
          ) as Record<Accent, preact.ComponentChildren>}
          value={accent}
          save={saveAccent}
        />
      </section>
    </>
  )
}
