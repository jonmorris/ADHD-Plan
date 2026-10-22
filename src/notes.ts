export type Page = { id: string; title: string; body: string }

export type Block =
  | { type: 'heading'; level: 1 | 2; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'paragraph'; text: string }

// Minimal formatting for Playbook pages: "# " and "## " headings, "- " list items,
// blank lines between paragraphs.
export function parseNote(body: string): Block[] {
  const blocks: Block[] = []
  for (const raw of body.split('\n')) {
    const line = raw.trim()
    const last = blocks[blocks.length - 1]
    if (!line) {
      blocks.push({ type: 'paragraph', text: '' })
    } else if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', level: 2, text: line.slice(3) })
    } else if (line.startsWith('# ')) {
      blocks.push({ type: 'heading', level: 1, text: line.slice(2) })
    } else if (line.startsWith('- ')) {
      if (last?.type === 'list') last.items.push(line.slice(2))
      else blocks.push({ type: 'list', items: [line.slice(2)] })
    } else if (last?.type === 'paragraph' && last.text) {
      last.text += '\n' + line
    } else {
      blocks.push({ type: 'paragraph', text: line })
    }
  }
  return blocks.filter((b) => b.type !== 'paragraph' || b.text)
}
