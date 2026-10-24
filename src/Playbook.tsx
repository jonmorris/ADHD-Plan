import { useState } from 'preact/hooks'
import { parseTaskLines } from './bulk'
import { BulkAdd } from './BulkAdd'
import { parseNote, type Page } from './notes'
import { PLANS, disablePlan, enablePlan, isPlanOn, type Plan } from './plans'
import { describeRepeat, type Task } from './tasks'

type Props = {
  pages: Page[]
  savePages: (pages: Page[]) => void
  tasks: Task[]
  saveTasks: (tasks: Task[]) => void
  today: string
}

export function Playbook({ pages, savePages, tasks, saveTasks, today }: Props) {
  const [openId, setOpenId] = useState<string>()
  const [draft, setDraft] = useState<Page>()
  const [openPlanId, setOpenPlanId] = useState<string>()

  const open = pages.find((p) => p.id === openId)
  const openPlan = PLANS.find((p) => p.id === openPlanId)
  // Tasks added to a plan since it was switched on (enablePlan skips ones already there or removed)
  const newTasks =
    openPlan && isPlanOn(openPlan.id, tasks) ? enablePlan(openPlan, tasks, today).length - tasks.length : 0

  function togglePlan(plan: Plan) {
    if (!isPlanOn(plan.id, tasks)) return saveTasks(enablePlan(plan, tasks, today))
    if (!confirm(`Turn off ${plan.title}? Its tasks leave your list from today. Their history stays in Analytics.`)) return
    saveTasks(disablePlan(plan.id, tasks, today))
  }

  function planSwitch(plan: Plan) {
    const on = isPlanOn(plan.id, tasks)
    return (
      <button
        role="switch"
        class="switch"
        aria-checked={on}
        aria-label={`${plan.title} plan`}
        onClick={() => togglePlan(plan)}
      />
    )
  }

  function save(e: Event) {
    e.preventDefault()
    const page = { ...draft!, title: draft!.title.trim() }
    const exists = pages.some((p) => p.id === page.id)
    savePages(exists ? pages.map((p) => (p.id === page.id ? page : p)) : [...pages, page])
    setOpenId(page.id)
    setDraft(undefined)
  }

  function remove(page: Page) {
    if (!confirm(`Delete "${page.title}"?`)) return
    savePages(pages.filter((p) => p.id !== page.id))
    setOpenId(undefined)
  }

  if (draft) {
    return (
      <form class="page-edit" onSubmit={save}>
        <input
          class="page-title"
          value={draft.title}
          onInput={(e) => setDraft({ ...draft, title: e.currentTarget.value })}
          placeholder="Page title"
          aria-label="Page title"
          required
        />
        <textarea
          value={draft.body}
          onInput={(e) => setDraft({ ...draft, body: e.currentTarget.value })}
          placeholder={'Write anything.\n\n# Heading\n- List item\n- [ ] A task to add — Daily'}
          aria-label="Page text"
          rows={16}
        />
        <div class="actions">
          <button type="button" onClick={() => setDraft(undefined)}>
            Cancel
          </button>
          <button type="submit" class="primary">
            Save
          </button>
        </div>
      </form>
    )
  }

  if (openPlan) {
    return (
      <article class="page">
        <div class="page-bar">
          <button onClick={() => setOpenPlanId(undefined)}>‹ Playbook</button>
        </div>
        <div class="plan-head">
          <h1>{openPlan.title}</h1>
          {planSwitch(openPlan)}
        </div>
        <p>{openPlan.summary}</p>
        {newTasks > 0 && (
          <p class="plan-update">
            This plan has {newTasks} task{newTasks === 1 ? '' : 's'} you don't have yet.{' '}
            <button class="primary" onClick={() => saveTasks(enablePlan(openPlan, tasks, today))}>
              Add {newTasks} new task{newTasks === 1 ? '' : 's'}
            </button>
          </p>
        )}
        <ul>
          {openPlan.tips.map((tip) => (
            <li>{tip}</li>
          ))}
        </ul>
        <h2>Tasks it adds</h2>
        <ul class="bulk-list">
          {parseTaskLines(openPlan.body, today).flatMap((item) =>
            'task' in item
              ? [
                  <li>
                    <span class="name">{item.task.title}</span>
                    <span class="detail">{describeRepeat(item.task.repeat, item.task.start, item.task.end)}</span>
                    {item.task.notes && <span class="detail">{item.task.notes}</span>}
                  </li>,
                ]
              : [],
          )}
        </ul>
        {openPlan.source && (
          <p class="source">
            Source:{' '}
            <a href={openPlan.source.url} target="_blank" rel="noopener">
              {openPlan.source.label}
            </a>
          </p>
        )}
      </article>
    )
  }

  if (open) {
    return (
      <article class="page">
        <div class="page-bar">
          <button onClick={() => setOpenId(undefined)}>‹ Playbook</button>
          <button onClick={() => setDraft(open)}>Edit</button>
        </div>
        <h1>{open.title}</h1>
        {parseNote(open.body).map((b) =>
          b.type === 'heading' ? (
            b.level === 1 ? <h2>{b.text}</h2> : <h3>{b.text}</h3>
          ) : b.type === 'list' ? (
            <ul>
              {b.items.map((item) => (
                <li>{item}</li>
              ))}
            </ul>
          ) : (
            <p>{b.text}</p>
          ),
        )}
        <BulkAdd title={open.title} body={open.body} tasks={tasks} today={today} saveTasks={saveTasks} />
        <button class="danger" onClick={() => remove(open)}>
          Delete page
        </button>
      </article>
    )
  }

  return (
    <>
      <h1>Playbook</h1>

      <h2>Plans</h2>
      <ul class="plans">
        {PLANS.map((plan) => (
          <li key={plan.id}>
            <button class="plan-open" onClick={() => setOpenPlanId(plan.id)}>
              <span class="name">{plan.title}</span>
              <span class="detail">{plan.summary}</span>
            </button>
            {planSwitch(plan)}
          </li>
        ))}
      </ul>

      <h2>Your pages</h2>
      {pages.length === 0 && <p class="empty">Write down what works for you, so it's here when you need it.</p>}
      <ul class="pages">
        {pages.map((p) => (
          <li key={p.id}>
            <button onClick={() => setOpenId(p.id)}>{p.title}</button>
          </li>
        ))}
      </ul>
      <button class="primary add" onClick={() => setDraft({ id: crypto.randomUUID(), title: '', body: '' })}>
        + New page
      </button>
    </>
  )
}
