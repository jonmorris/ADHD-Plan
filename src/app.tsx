import { toDateKey } from './dates'
import { usePersisted } from './store'
import type { Log, Task } from './tasks'
import { Today } from './Today'

export function App() {
  const [tasks, saveTasks] = usePersisted<Task[]>('tasks', [])
  const [log, saveLog] = usePersisted<Log>('log', {})

  if (!tasks || !log) return null

  const today = toDateKey(new Date())

  function exportData() {
    const blob = new Blob([JSON.stringify({ tasks, log }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `adhd-plan-${today}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <main>
      <Today tasks={tasks} log={log} today={today} saveTasks={saveTasks} saveLog={saveLog} />
      <button class="export" onClick={exportData}>
        Export backup
      </button>
    </main>
  )
}
