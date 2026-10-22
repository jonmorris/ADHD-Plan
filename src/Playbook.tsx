import { useState } from 'preact/hooks'
import { parseNote, type Page } from './notes'

type Props = {
  pages: Page[]
  savePages: (pages: Page[]) => void
}

export function Playbook({ pages, savePages }: Props) {
  const [openId, setOpenId] = useState<string>()
  const [draft, setDraft] = useState<Page>()

  const open = pages.find((p) => p.id === openId)

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
          placeholder={'Write anything.\n\n# Heading\n- List item'}
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
        <button class="danger" onClick={() => remove(open)}>
          Delete page
        </button>
      </article>
    )
  }

  return (
    <>
      <h1>Playbook</h1>
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
