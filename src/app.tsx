import { useEffect, useState } from 'preact/hooks'
import { Account, type Accent, type Theme } from './Account'
import { useBack } from './back'
import { toDateKey } from './dates'
import type { CashOut, Tracking } from './money'
import { Playbook } from './Playbook'
import { seedPlans, type Plan } from './plans'
import type { DoNext, Focus, Priorities } from './priorities'
import type { Dismissed, Reminder } from './reminders'
import { usePersisted } from './store'
import type { Log, Task } from './tasks'
import { Today } from './Today'

const TABS = { today: 'Today', playbook: 'Playbook', account: 'Account' }

export function App() {
  const [tab, setTab] = useState<keyof typeof TABS>('today')
  // Back from another tab returns to Today
  useBack(tab !== 'today', () => setTab('today'))
  const [tasks, saveTasks] = usePersisted<Task[]>('tasks', [])
  const [log, saveLog] = usePersisted<Log>('log', {})
  // Notes pages from before Playbook pages were removed; kept so they stay in the backup
  const [pages] = usePersisted<unknown[]>('pages', [])
  const [order, saveOrder] = usePersisted<string[]>('order', [])
  const [groupOrder, saveGroupOrder] = usePersisted<string[]>('groupOrder', [])
  const [collapsed, saveCollapsed] = usePersisted<string[]>('collapsed', [])
  const today = toDateKey(new Date())
  // The built-in plans, until the user's own copies are saved
  const [plans, savePlans] = usePersisted<Plan[]>('plans', seedPlans(today))
  const [tracking, saveTracking] = usePersisted<Tracking>('tracking', 'count')
  const [reminders, saveReminders] = usePersisted<Reminder[]>('reminders', [])
  const [dismissed, saveDismissed] = usePersisted<Dismissed>('dismissed', {})
  const [priorities, savePriorities] = usePersisted<Priorities>('priorities', {})
  const [focus, saveFocus] = usePersisted<Focus>('focus', 'doNext')
  const [doNext, saveDoNext] = usePersisted<DoNext>('doNext', {})
  const [cashOuts, saveCashOuts] = usePersisted<CashOut[]>('cashOuts', [])
  const [theme, saveTheme] = usePersisted<Theme>('theme', 'system')
  useEffect(() => {
    if (theme === 'system' || !theme) delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = theme
  }, [theme])
  const [accent, saveAccent] = usePersisted<Accent>('accent', 'blue')
  useEffect(() => {
    if (accent) document.documentElement.dataset.accent = accent
  }, [accent])

  if (!tasks || !log || !pages || !order || !groupOrder || !collapsed || !plans || !tracking || !reminders || !dismissed || !priorities || !theme || !focus || !doNext || !cashOuts || !accent) return null

  function exportData() {
    const blob = new Blob([JSON.stringify({ tasks, log, pages, plans, reminders, dismissed, priorities, doNext, cashOuts, order, groupOrder }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `adhd-plan-${today}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <main>
        {tab === 'today' && (
          <Today
            tasks={tasks}
            plans={plans}
            tracking={tracking}
            reminders={reminders}
            dismissed={dismissed}
            priorities={priorities}
            focus={focus}
            doNext={doNext}
            log={log}
            order={order}
            groupOrder={groupOrder}
            collapsed={collapsed}
            today={today}
            saveTasks={saveTasks}
            saveLog={saveLog}
            saveOrder={saveOrder}
            saveGroupOrder={saveGroupOrder}
            saveCollapsed={saveCollapsed}
            saveReminders={saveReminders}
            saveDismissed={saveDismissed}
            savePriorities={savePriorities}
            saveDoNext={saveDoNext}
          />
        )}
        {tab === 'playbook' && (
          <Playbook
            plans={plans}
            savePlans={savePlans}
            order={order}
            saveOrder={saveOrder}
            tracking={tracking}
            tasks={tasks} saveTasks={saveTasks} today={today} />
        )}
        {tab === 'account' && (
          <Account
            tasks={tasks}
            plans={plans}
            log={log}
            today={today}
            cashOuts={cashOuts}
            saveCashOuts={saveCashOuts}
            tracking={tracking}
            saveTracking={saveTracking}
            focus={focus}
            saveFocus={saveFocus}
            theme={theme}
            saveTheme={saveTheme}
            accent={accent}
            saveAccent={saveAccent}
          />
        )}
        <button class="export" onClick={exportData}>
          Export backup
        </button>
        <p class="version">Version {__BUILD__}</p>
      </main>

      <nav class="tabs">
        {Object.entries(TABS).map(([key, label]) => (
          <button
            class={tab === key ? 'on' : ''}
            aria-current={tab === key ? 'page' : undefined}
            onClick={() => setTab(key as keyof typeof TABS)}
          >
            {label}
          </button>
        ))}
      </nav>
    </>
  )
}
