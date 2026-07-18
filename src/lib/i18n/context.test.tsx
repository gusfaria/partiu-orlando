import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { I18nProvider, useI18n } from './context'

function TestConsumer() {
  const { t, lang, setLang } = useI18n()
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="logout">{t.nav.logout}</span>
      <button onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}>toggle</button>
    </div>
  )
}

describe('I18nProvider', () => {
  it('defaults to Portuguese', () => {
    render(<I18nProvider><TestConsumer /></I18nProvider>)
    expect(screen.getByTestId('lang').textContent).toBe('pt')
    expect(screen.getByTestId('logout').textContent).toBe('Sair')
  })

  it('switches to English on toggle', () => {
    render(<I18nProvider><TestConsumer /></I18nProvider>)
    fireEvent.click(screen.getByText('toggle'))
    expect(screen.getByTestId('lang').textContent).toBe('en')
    expect(screen.getByTestId('logout').textContent).toBe('Logout')
  })
})
