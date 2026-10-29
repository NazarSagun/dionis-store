// A game section body is plain text (rich-game-details-spec.md, Open decision 3):
// a blank line starts a paragraph, and lines that start with "- " form a list.
export type SectionBlock = { type: 'paragraph'; text: string } | { type: 'list'; items: string[] }

export function parseSectionBody(body: string): SectionBlock[] {
  return body
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((chunk) =>
      chunk
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .filter((lines) => lines.length > 0)
    .flatMap((lines): SectionBlock[] => {
      const blocks: SectionBlock[] = []
      for (const line of lines) {
        const last = blocks[blocks.length - 1]
        if (line.startsWith('- ')) {
          if (last?.type === 'list') last.items.push(line.slice(2).trim())
          else blocks.push({ type: 'list', items: [line.slice(2).trim()] })
        } else if (last?.type === 'paragraph') {
          last.text = `${last.text} ${line}`
        } else {
          blocks.push({ type: 'paragraph', text: line })
        }
      }
      return blocks
    })
}
