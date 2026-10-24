import { useState } from 'preact/hooks'
import { useBack } from './back'
import { BulkAdd } from './BulkAdd'
import { MoveButtons } from './MoveButtons'
import { parseNote, type Page } from './notes'
import {
  disablePlan,
  enablePlan,
  isPlanOn,
  removeItem,
  renamePlan,
  updateItem,
  type Plan,
  type PlanItem,
} from './plans'
import { TaskForm } from './TaskForm'
import { describeRepeat, type Task } from './tasks'

type Props = {
  pages: Page[]
  savePages: (pages: Page[]) => void
  plans: Plan[]
  savePlans: (plans: Plan[]) => void
  tasks: Task[]
  saveTasks: (tasks: Task[]) => void
  today: string
}

export function Playbook({ pages, savePages, plans, savePlans, tasks, saveTasks, today }: Props) {
  const [openId, setOpenId] = useState<string>()
  const [draft, setDraft] = useState<Page>()
  const [openPlanId, setOpenPlanId] = useState<string>()
  const [planDraft, setPlanDraft] = useState<Plan>()
  const [editingItem, setEditingItem] = useState<PlanItem>()
  const [reordering, setReordering] = useState(false)

  const open = pages.find((p) => p.id === openId)
  const openPlan = plans.find((p) => p.id === openPlanId)
  useBack(!!open, () => setOpenId(undefined))
  useBack(!!openPlan, () => {
    setOpenPlanId(undefined)
    setReordering(false)
  })
  useBack(!!draft, () => setDraft(undefined))
  useBack(!!planDraft, () => setPlanDraft(undefined))
  useBack(!!editingItem, () => setEditingItem(undefined))
  // Items on a switched-on plan that aren't on the list (enablePlan skips ones already there or removed)
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

  function savePlan(plan: Plan) {
    savePlans(plans.map((p) => (p.id === plan.id ? plan : p)))
  }

  function submitPlan(e: Event) {
    e.preventDefault()
    const plan = { ...planDraft!, title: planDraft!.title.trim(), summary: planDraft!.summary.trim() }
    const before = plans.find((p) => p.id === plan.id)
    if (!before) savePlans([...plans, plan])
    else {
      savePlan(plan)
      if (before.title !== plan.title) saveTasks(renamePlan(before, plan.title, tasks))
    }
    setOpenPlanId(plan.id)
    setPlanDraft(undefined)
  }

  function deletePlan(plan: Plan) {
    if (!confirm(`Delete ${plan.title}? Its tasks leave your list from today. Their history stays in Analytics.`)) return
    savePlans(plans.filter((p) => p.id !== plan.id))
    saveTasks(disablePlan(plan.id, tasks, today))
    setPlanDraft(undefined)
    setOpenPlanId(undefined)
  }

  // Edits show on the list straight away if the plan is on
  function saveItem(plan: Plan, task: Task) {
    const item: PlanItem = {
      id: task.id,
      title: task.title,
      start: task.start,
      repeat: task.repeat,
      end: task.end,
      notes: task.notes,
      allowHalf: task.allowHalf,
    }
    const before = plan.items.find((i) => i.id === item.id)
    const next = { ...plan, items: before ? plan.items.map((i) => (i.id === item.id ? item : i)) : [...plan.items, item] }
    savePlan(next)
    if (isPlanOn(plan.id, tasks)) saveTasks(before ? updateItem(plan.id, before, item, tasks) : enablePlan(next, tasks, today))
    setEditingItem(undefined)
  }

  function deleteItem(plan: Plan, item: PlanItem) {
    if (!confirm(`Remove "${item.title}" from ${plan.title}? Its history stays in Analytics.`)) return
    savePlan({ ...plan, items: plan.items.filter((i) => i.id !== item.id) })
    saveTasks(removeItem(plan.id, item, tasks, today))
    setEditingItem(undefined)
  }

  function moveItem(plan: Plan, index: number, step: -1 | 1) {
    const items = [...plan.items]
    ;[items[index], items[index + step]] = [items[index + step], items[index]]
    savePlan({ ...plan, items })
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

  if (planDraft) {
    const isNew = !plans.some((p) => p.id === planDraft.id)
    return (
      <form class="page-edit" onSubmit={submitPlan}>
        <input
          class="page-title"
          value={planDraft.title}
          onInput={(e) => setPlanDraft({ ...planDraft, title: e.currentTarget.value })}
          placeholder="Plan name"
          aria-label="Plan name"
          required
        />
        <textarea
          value={planDraft.summary}
          onInput={(e) => setPlanDraft({ ...planDraft, summary: e.currentTarget.value })}
          placeholder="What it's for (optional)"
          aria-label="Summary"
          rows={3}
        />
        <div class="actions">
          {!isNew && (
            <button type="button" class="danger" onClick={() => deletePlan(planDraft)}>
              Delete plan
            </button>
          )}
          <button type="button" onClick={() => setPlanDraft(undefined)}>
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
          <button
            onClick={() => {
              setOpenPlanId(undefined)
              setReordering(false)
            }}
          >
            ‹ Playbook
          </button>
          <button onClick={() => setPlanDraft(openPlan)}>Edit</button>
        </div>
        <div class="plan-head">
          <h1>{openPlan.title}</h1>
          {planSwitch(openPlan)}
        </div>
        {openPlan.summary && <p>{openPlan.summary}</p>}
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
        <div class="plan-tasks-head">
          <h2>Tasks it adds</h2>
          {openPlan.items.length > 1 && (
            <button class={reordering ? 'primary' : ''} onClick={() => setReordering(!reordering)}>
              {reordering ? 'Done' : 'Reorder'}
            </button>
          )}
        </div>
        {openPlan.items.length === 0 && <p class="empty">No tasks yet.</p>}
        <ul class="plan-items">
          {openPlan.items.map((item, i) => (
            <li key={item.id}>
              <button class="plan-item" disabled={reordering} onClick={() => setEditingItem(item)}>
                <span class="name">{item.title}</span>
                <span class="detail">{describeRepeat(item.repeat, item.start, item.end)}</span>
                {item.notes && <span class="detail">{item.notes}</span>}
              </button>
              {reordering && (
                <MoveButtons
                  label={item.title}
                  first={i === 0}
                  last={i === openPlan.items.length - 1}
                  move={(step) => moveItem(openPlan, i, step)}
                />
              )}
            </li>
          ))}
        </ul>
        {!reordering && (
          <button
            class="primary add"
            onClick={() => setEditingItem({ id: crypto.randomUUID(), title: '', start: today, repeat: { kind: 'daily', every: 1 } })}
          >
            + Add task
          </button>
        )}
        {openPlan.source && (
          <p class="source">
            Source:{' '}
            <a href={openPlan.source.url} target="_blank" rel="noopener">
              {openPlan.source.label}
            </a>
          </p>
        )}
        {editingItem && (
          <TaskForm
            task={editingItem}
            isNew={!openPlan.items.some((i) => i.id === editingItem.id)}
            onSave={(task) => saveItem(openPlan, task)}
            onRemove={() => deleteItem(openPlan, editingItem)}
            onClose={() => setEditingItem(undefined)}
          />
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
        {plans.map((plan) => (
          <li key={plan.id}>
            <button class="plan-open" onClick={() => setOpenPlanId(plan.id)}>
              <span class="name">{plan.title}</span>
              <span class="detail">{plan.summary}</span>
            </button>
            {planSwitch(plan)}
          </li>
        ))}
      </ul>
      <button
        class="primary add"
        onClick={() => setPlanDraft({ id: crypto.randomUUID(), title: '', summary: '', tips: [], items: [] })}
      >
        + New plan
      </button>

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
