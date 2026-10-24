import { useState } from 'preact/hooks'
import { Analytics } from './Analytics'
import { toDateKey } from './dates'
import type { Page } from './notes'
import { Playbook } from './Playbook'
import { seedPlans, type Plan } from './plans'
import { usePersisted } from './store'
import type { Log, Task } from './tasks'
import { Today } from './Today'

const TABS = { today: 'Today', playbook: 'Playbook', analytics: 'Analytics' }

export function App() {
  const [tab, setTab] = useState<keyof typeof TABS>('today')
  const [tasks, saveTasks] = usePersisted<Task[]>('tasks', [])
  const [log, saveLog] = usePersisted<Log>('log', {})
  const [pages, savePages] = usePersisted<Page[]>('pages', [])
  const [order, saveOrder] = usePersisted<string[]>('order', [])
  const [groupOrder, saveGroupOrder] = usePersisted<string[]>('groupOrder', [])
  const [collapsed, saveCollapsed] = usePersisted<string[]>('collapsed', [])
  const today = toDateKey(new Date())
  // The built-in plans, until the user's own copies are saved
  const [plans, savePlans] = usePersisted<Plan[]>('plans', seedPlans(today))

  if (!tasks || !log || !pages || !order || !groupOrder || !collapsed || !plans) return null

  function exportData() {
    const blob = new Blob([JSON.stringify({ tasks, log, pages, plans, order, groupOrder }, null, 2)], { type: 'application/json' })
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
          />
        )}
        {tab === 'playbook' && (
          <Playbook
            pages={pages}
            savePages={savePages}
            plans={plans}
            savePlans={savePlans}
            tasks={tasks} saveTasks={saveTasks} today={today} />
        )}
        {tab === 'analytics' && <Analytics tasks={tasks} log={log} today={today} />}
        <button class="export" onClick={exportData}>
          Export backup
        </button>
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
