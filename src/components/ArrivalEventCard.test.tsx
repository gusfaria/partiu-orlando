import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { I18nProvider } from '@/lib/i18n/context'
import { ArrivalEventCard } from './ArrivalEventCard'
import type { ArrivalEventWithPeople } from '@/types/database'

function ev(over: Partial<ArrivalEventWithPeople> = {}): ArrivalEventWithPeople {
  return {
    id: 'e1', description: 'Voo LATAM 8190', transportation: 'Avião',
    arrival_date: '2026-10-09', arrival_time: '14:30:00', departure_date: null, departure_time: null,
    created_by: 'u1', created_at: '',
    arrival_event_people: [{ id: 'p1', event_id: 'e1', user_id: 'u1',
      profiles: { id: 'u1', name: 'Gus', avatar_color: '#E76F51', avatar_url: null } }],
    ...over,
  } as unknown as ArrivalEventWithPeople
}

const renderCard = (e: ArrivalEventWithPeople) =>
  render(<I18nProvider><ArrivalEventCard event={e} onEdit={() => {}} onDelete={() => {}} /></I18nProvider>)

describe('ArrivalEventCard', () => {
  it('shows arrival leg with short date and time, dash for missing departure', () => {
    renderCard(ev())
    expect(screen.getByText('09 out')).toBeInTheDocument()
    expect(screen.getByText('14:30')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Voo LATAM 8190')).toBeInTheDocument()
  })

  it('no transportation → no suitcase fallback emoji', () => {
    const { container } = renderCard(ev({ transportation: '' }))
    expect(container.textContent).not.toContain('🧳')
  })

  it('edit/delete are present', () => {
    renderCard(ev())
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument()
  })
})
