import { describe, it, expect } from 'vitest'
import { pickLanguage } from './bilingual'

// Real shapes from the activities table (marker spacing/colon counts vary).
const OUTLET =
  '::::::::::::::: English::::::::::::::: For shopping, we have two great outlet options.\n\n' +
  ':::::::::::::: Português:::::::::::::::  Para as compras, temos duas ótimas opções de outlet.'
const COCOA =
  '::::::::::::::: English ::::::::::::::: Cocoa Beach is a laid-back beach town.\n\n' +
  '::::::::::::::: Português :::::::::::::::: Cocoa Beach é uma cidade praiana descontraída.'

describe('pickLanguage', () => {
  it('returns only the Portuguese half for pt', () => {
    expect(pickLanguage(OUTLET, 'pt')).toBe('Para as compras, temos duas ótimas opções de outlet.')
  })

  it('returns only the English half for en', () => {
    expect(pickLanguage(OUTLET, 'en')).toBe('For shopping, we have two great outlet options.')
  })

  it('handles spaces around the language name', () => {
    expect(pickLanguage(COCOA, 'pt')).toBe('Cocoa Beach é uma cidade praiana descontraída.')
    expect(pickLanguage(COCOA, 'en')).toBe('Cocoa Beach is a laid-back beach town.')
  })

  it('text without markers is returned as-is (trimmed) for both languages', () => {
    expect(pickLanguage('Halloween 👻🎃 ', 'pt')).toBe('Halloween 👻🎃')
    expect(pickLanguage('Dinner at Columbia Restaurant \nhttps://x.com', 'en'))
      .toBe('Dinner at Columbia Restaurant \nhttps://x.com')
  })

  it('empty description stays empty', () => {
    expect(pickLanguage('', 'en')).toBe('')
  })

  it('falls back to the other language when the requested half is missing or empty', () => {
    expect(pickLanguage('::: English ::: Only English here.', 'pt')).toBe('Only English here.')
    expect(pickLanguage('::: English ::: \n::: Português ::: Só português.', 'en')).toBe('Só português.')
  })

  it('accepts "Portugues" without accent, any case, and markers on their own line', () => {
    const text = ':::PORTUGUES:::\nOlá pessoal\n:::english:::\nHello folks'
    expect(pickLanguage(text, 'pt')).toBe('Olá pessoal')
    expect(pickLanguage(text, 'en')).toBe('Hello folks')
  })

  it('text before the first marker is kept for both languages', () => {
    const text = '📍 Kissimmee\n::: English ::: Nice place.\n::: Português ::: Lugar legal.'
    expect(pickLanguage(text, 'en')).toBe('📍 Kissimmee\nNice place.')
    expect(pickLanguage(text, 'pt')).toBe('📍 Kissimmee\nLugar legal.')
  })

  it('a stray marker-like word without enough colons is left alone', () => {
    expect(pickLanguage('Tour in English: 10am', 'pt')).toBe('Tour in English: 10am')
  })
})
