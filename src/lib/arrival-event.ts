import type { ArrivalEventWithPeople } from '@/types/database'

// Transportation options come from a fixed <select> (Carro/Trem/Avião).
// Shared so the arrivals card and the calendar always show the same emoji.
const TRANSPORT_EMOJI: Record<string, string> = {
  'Avião': '✈️',
  'Carro': '🚗',
  'Trem': '🚆',
}

export function transportEmoji(transportation: string): string {
  return TRANSPORT_EMOJI[transportation] ?? '🧳'
}

export type ArrivalEventFormValue = {
  description: string
  transportation: string
  arrival_date: string
  arrival_time: string
  departure_date: string
  departure_time: string
  personIds: string[]
}

export function isArrivalEventFormValid(v: ArrivalEventFormValue): boolean {
  return v.description.trim() !== '' &&
    v.transportation.trim() !== '' &&
    v.personIds.length > 0 &&
    (v.arrival_date !== '' || v.departure_date !== '')
}

export function hasLoggedArrival(userId: string, events: ArrivalEventWithPeople[]): boolean {
  return events.some(e =>
    (e.arrival_date != null || e.departure_date != null) &&
    e.arrival_event_people.some(p => p.user_id === userId)
  )
}
