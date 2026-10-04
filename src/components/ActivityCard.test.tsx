import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { I18nProvider } from '@/lib/i18n/context'
import { ActivityCard } from './ActivityCard'
import type { ActivityWithSignups } from '@/types/database'

function activity(over: Partial<ActivityWithSignups> = {}): ActivityWithSignups {
  return {
    id: 'a1', title: 'Magic Kingdom', description: 'Dia inteiro no parque.',
    activity_date: '2026-10-10', activity_time: '09:00:00', cost_per_person: 159, cost_notes: null,
    ticket_url: null, display_order: 1, created_at: '', activity_signups: [],
    ...over,
  } as ActivityWithSignups
}

function renderCard(a: ActivityWithSignups, signed = false) {
  const onToggle = vi.fn()
  render(<I18nProvider><ActivityCard activity={a} isSignedUp={signed} myPlusGuests={0}
    onToggle={onToggle} onPlusGuests={() => {}} /></I18nProvider>)
  return { onToggle }
}

describe('ActivityCard', () => {
  it('shows the ticket band with date and meta', () => {
    renderCard(activity())
    expect(screen.getByText('SÁB')).toBeInTheDocument()
    expect(screen.getByText('09:00 · $ 159.00')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Magic Kingdom' })).toBeInTheDocument()
  })

  it('no date and no cost: dash and no meta separator', () => {
    renderCard(activity({ activity_date: null, activity_time: null, cost_per_person: null }))
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByText(/·/)).not.toBeInTheDocument()
  })

  it('signup button toggles and swaps label', () => {
    const { onToggle } = renderCard(activity(), false)
    fireEvent.click(screen.getByRole('button', { name: 'Vou!' }))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('signed-up state shows "Não vou mais" and the companions stepper', () => {
    renderCard(activity(), true)
    expect(screen.getByRole('button', { name: 'Não vou mais' })).toBeInTheDocument()
    expect(screen.getByText(/acompanhantes/)).toBeInTheDocument()
  })

  it('cost notes render on their own, not under the per-person cost label', () => {
    renderCard(activity({ cost_notes: 'inclui estacionamento' }))
    expect(screen.getByText('inclui estacionamento').textContent).toBe('inclui estacionamento')
    expect(screen.queryByText(/Custo por pessoa/)).not.toBeInTheDocument()
  })

  it('shows only the half of a bilingual description that matches the language', () => {
    renderCard(activity({ description: '::: English ::: Beach day.\n\n::: Português ::: Dia de praia.' }))
    expect(screen.getByText('Dia de praia.')).toBeInTheDocument()
    expect(screen.queryByText(/Beach day/)).not.toBeInTheDocument()
    expect(screen.queryByText(/:::/)).not.toBeInTheDocument()
  })
})
