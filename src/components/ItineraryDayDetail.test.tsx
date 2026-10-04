import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { I18nProvider } from '@/lib/i18n/context'
import { ItineraryDayDetail } from './ItineraryDayDetail'
import type { CalendarItem } from '@/lib/itinerary'

const item: CalendarItem = {
  id: 'activity-1', type: 'activity', date: '2026-10-12', time: null, emoji: '', label: 'Cocoa beach',
  detail: { description: '::: English ::: Beach town.\n\n::: Português ::: Cidade praiana.' },
}

describe('ItineraryDayDetail', () => {
  it('shows only the description half for the current language', () => {
    render(<I18nProvider><ItineraryDayDetail dateLabel="segunda" items={[item]} onClose={() => {}} /></I18nProvider>)
    expect(screen.getByText('Cidade praiana.')).toBeInTheDocument()
    expect(screen.queryByText(/Beach town/)).not.toBeInTheDocument()
  })
})
