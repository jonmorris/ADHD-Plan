import { useState } from 'preact/hooks'
import { useBack } from './back'
import type { Tracking } from './money'
import { MoveButtons } from './MoveButtons'
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
  plans: Plan[]
  savePlans: (plans: Plan[]) => void
  order: string[]
  saveOrder: (order: string[]) => void
  tracking: Tracking
  tasks: Task[]
  saveTasks: (tasks: Task[]) => void
  today: string
}

export function Playbook({ plans, savePlans, order, saveOrder, tracking, tasks, saveTasks, today }: Props) {
  const showDollars = tracking === 'dollars'
  const [openPlanId, setOpenPlanId] = useState<string>()
  const [planDraft, setPlanDraft] = useState<Plan>()
  const [editingItem, setEditingItem] = useState<PlanItem>()
  const [reordering, setReordering] = useState(false)

  const openPlan = plans.find((p) => p.id === openPlanId)
  useBack(!!openPlan, () => {
    setOpenPlanId(undefined)
    setReordering(false)
  })
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

  // The plan's settings, shown and changed right on its page
  function planSettings(plan: Plan) {
    const bonusInput = (label: string, key: 'bonus' | 'weeklyBonus') => (
      <label class="field">
        {label}
        <span class="money-input">
          $
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={plan[key] ?? 0}
            onInput={(e) => savePlan({ ...plan, [key]: Math.max(0, Math.round(Number(e.currentTarget.value))) || undefined })}
          />
        </span>
      </label>
    )
    return (
      <div class="plan-settings">
        <label class="check-field">
          <input
            type="checkbox"
            checked={!!plan.sequential}
            onChange={(e) => savePlan({ ...plan, sequential: e.currentTarget.checked || undefined })}
          />
          <span>
            Sequential
            <small>Show its tasks on Today one at a time, in order. The next appears once you tick or ✕ the one before.</small>
          </span>
        </label>
        <label class="check-field">
          <input
            type="checkbox"
            checked={!!plan.dismissable}
            onChange={(e) => savePlan({ ...plan, dismissable: e.currentTarget.checked || undefined })}
          />
          <span>
            Deferrable
            <small>Its repeating tasks get the → button on Today to push them to the next day. A deferred task doesn't count as done or not done.</small>
          </span>
        </label>
        {showDollars && (
          <>
            {bonusInput('Daily bonus: all its daily tasks done that day', 'bonus')}
            {bonusInput('Weekly bonus: all its weekly tasks done that week', 'weeklyBonus')}
          </>
        )}
      </div>
    )
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
      value: task.value,
      periodic: task.periodic,
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
    // Today's saved order would otherwise keep showing the plan's tasks the old way
    saveOrder(order.filter((id) => !tasks.some((t) => t.id === id && t.plan === plan.id)))
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
            ‹ Manage
          </button>
          <button onClick={() => setPlanDraft(openPlan)}>Edit</button>
        </div>
        <div class="plan-head">
          <h1>{openPlan.title}</h1>
          {planSwitch(openPlan)}
        </div>
        {openPlan.summary && <p>{openPlan.summary}</p>}
        {planSettings(openPlan)}
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
                <span class="detail">
                  {describeRepeat(item.repeat, item.start, item.end, item.periodic)}
                  {showDollars && ` · $${item.value ?? 1}`}
                </span>
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
            showValue={showDollars}
            isNew={!openPlan.items.some((i) => i.id === editingItem.id)}
            onSave={(task) => saveItem(openPlan, task)}
            onRemove={() => deleteItem(openPlan, editingItem)}
            onClose={() => setEditingItem(undefined)}
          />
        )}
      </article>
    )
  }

  return (
    <>
      <h1>Manage</h1>

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

    </>
  )
}
