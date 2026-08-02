export function splitOnFirstHr(markdown: string): { before: string; after: string } {
  const lines = markdown.split('\n')
  const idx = lines.findIndex(l => l.trim() === '---')
  if (idx === -1) return { before: markdown.trim(), after: '' }
  return {
    before: lines.slice(0, idx).join('\n').trim(),
    after: lines.slice(idx + 1).join('\n').trim(),
  }
}
