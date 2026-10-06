import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { I18nProvider, useI18n } from '@/lib/i18n/context'
import { BoardingPass } from './BoardingPass'

function WithToggle() {
  const { setLang } = useI18n()
  return <><button onClick={() => setLang('en')}>en</button><BoardingPass /></>
}

describe('BoardingPass', () => {
  it('shows labels, destination and countdown (pt)', () => {
    render(<I18nProvider><BoardingPass /></I18nProvider>)
    expect(screen.getByText('Cartão de embarque')).toBeInTheDocument()
    expect(screen.getByText('Orlando')).toBeInTheDocument()
    expect(screen.getByText('faltam')).toBeInTheDocument()
    expect(screen.getByText('dias para a viagem')).toBeInTheDocument()
    expect(screen.getByText('GIG, JFK, LAX → MCO')).toHaveClass('sr-only')
    expect(screen.getByText('Rio')).toBeInTheDocument()
  })

  it('renders no empty prefix line in English (countdown_prefix is "")', () => {
    const { container } = render(<I18nProvider><WithToggle /></I18nProvider>)
    fireEvent.click(screen.getByText('en'))
    expect(screen.getByText('Boarding pass')).toBeInTheDocument()
    const stub = container.querySelector('[data-stub]') as HTMLElement
    expect(stub.querySelectorAll('p')).toHaveLength(2) // days + label only
  })
})
