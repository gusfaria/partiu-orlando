import type { Language } from './i18n/context'

// "::: English :::" / ":::: Português ::::" — 3+ colons, any spacing/case, accent optional.
const MARKER = /:{3,}\s*(english|portugu[eê]s)\s*:{3,}/gi

// Admins write both languages in one description, separated by markers.
// Show only the half for the current language; text without markers is
// returned as-is, and a missing/empty half falls back to the other one.
export function pickLanguage(text: string, lang: Language): string {
  const matches = [...text.matchAll(MARKER)]
  if (matches.length === 0) return text.trim()

  const halves: Record<Language, string> = { pt: '', en: '' }
  matches.forEach((m, i) => {
    const key: Language = m[1].toLowerCase() === 'english' ? 'en' : 'pt'
    const start = m.index! + m[0].length
    const end = i + 1 < matches.length ? matches[i + 1].index! : text.length
    halves[key] = [halves[key], text.slice(start, end).trim()].filter(Boolean).join('\n')
  })

  const preamble = text.slice(0, matches[0].index).trim()
  const other: Language = lang === 'pt' ? 'en' : 'pt'
  const body = halves[lang] || halves[other]
  return [preamble, body].filter(Boolean).join('\n')
}
