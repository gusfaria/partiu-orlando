import { describe, it, expect } from 'vitest'
import {
  buildCalendarItems, filterItems, itemsForDay, buildMonthGrid, tripDates,
  type CalendarItem,
} from './itinerary'
import type { ArrivalEventWithPeople, Activity, CalendarMarker } from '@/types/database'

function evt(o: Partial<ArrivalEventWithPeople>): ArrivalEventWithPeople {
  return {
    id: 'e1', description: 'desc', transportation: 'Avião',
    arrival_date: null, arrival_time: null, departure_date: null, departure_time: null,
    created_by: null, created_at: '', arrival_event_people: [], ...o,
  }
}
function person(name: string) {
  return { id: 'p' + name, event_id: 'e1', user_id: 'u' + name,
    profiles: { id: 'u' + name, name, email: null, is_admin: false, avatar_color: '#fff', avatar_url: null, created_at: '' } }
}
function act(o: Partial<Activity>): Activity {
  return {
    id: 'a1', title: 'Magic Kingdom', description: 'park', activity_date: null, activity_time: null,
    cost_per_person: null, cost_notes: null, ticket_url: null, display_order: 0, created_at: '', ...o,
  }
}
function mkr(o: Partial<CalendarMarker>): CalendarMarker {
  return { id: 'm1', label: 'Check-out da casa', emoji: '🧳', event_date: '2026-10-18',
    event_time: null, display_order: 0, created_at: '', ...o }
}

describe('buildCalendarItems', () => {
  it('makes one arrival item for an arrival-only event', () => {
    const items = buildCalendarItems([evt({ arrival_date: '2026-10-09', arrival_time: '11:00:00',
      transportation: 'Avião', arrival_event_people: [person('Gui'), person('Marina')] })], [])
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ type: 'arrival', date: '2026-10-09', time: '11:00', emoji: '✈️', label: 'Gui, Marina' })
  })
  it('makes both an arrival and a departure item when both dates set', () => {
    const items = buildCalendarItems([evt({ arrival_date: '2026-10-09', departure_date: '2026-10-18',
      transportation: 'Carro', arrival_event_people: [person('Ana')] })], [])
    expect(items.map(i => i.type)).toEqual(['arrival', 'departure'])
    expect(items[1]).toMatchObject({ type: 'departure', date: '2026-10-18', emoji: '🚗', label: 'Ana' })
  })
  it('skips events with no dates', () => {
    expect(buildCalendarItems([evt({ arrival_event_people: [person('Gui')] })], [])).toHaveLength(0)
  })
  it('makes an activity item with 🎢 and the title', () => {
    const items = buildCalendarItems([], [act({ activity_date: '2026-10-11', activity_time: '09:30:00', title: 'Magic Kingdom' })])
    expect(items[0]).toMatchObject({ type: 'activity', date: '2026-10-11', time: '09:30', emoji: '🎢', label: 'Magic Kingdom' })
  })
  it('skips activities with no date', () => {
    expect(buildCalendarItems([], [act({ activity_date: null })])).toHaveLength(0)
  })
  it('falls back to 🧳 for unknown transportation', () => {
    const items = buildCalendarItems([evt({ arrival_date: '2026-10-09', transportation: 'Barco',
      arrival_event_people: [person('Gui')] })], [])
    expect(items[0].emoji).toBe('🧳')
  })
  it('makes a full-day marker item with its own emoji and label', () => {
    const items = buildCalendarItems([], [], [mkr({ label: 'Dia livre', emoji: '🏖️', event_date: '2026-10-14' })])
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ type: 'marker', date: '2026-10-14', time: null, emoji: '🏖️', label: 'Dia livre' })
  })
  it('gives a timed marker its time', () => {
    const items = buildCalendarItems([], [], [mkr({ event_date: '2026-10-09', event_time: '16:00:00' })])
    expect(items[0].time).toBe('16:00')
  })
})

describe('filterItems', () => {
  const items: CalendarItem[] = [
    { id: 'arrival-1', type: 'arrival', date: '2026-10-09', time: null, emoji: '✈️', label: 'A', detail: {} },
    { id: 'departure-1', type: 'departure', date: '2026-10-18', time: null, emoji: '✈️', label: 'A', detail: {} },
    { id: 'activity-1', type: 'activity', date: '2026-10-11', time: null, emoji: '🎢', label: 'MK', detail: {} },
    { id: 'marker-1', type: 'marker', date: '2026-10-18', time: null, emoji: '🧳', label: 'Check-out', detail: {} },
  ]
  it('returns everything for all', () => {
    expect(filterItems(items, 'all')).toHaveLength(4)
  })
  it('returns only the matching type', () => {
    expect(filterItems(items, 'activity').map(i => i.id)).toEqual(['activity-1'])
  })
  it('filters to markers only', () => {
    expect(filterItems(items, 'marker').map(i => i.id)).toEqual(['marker-1'])
  })
})

describe('itemsForDay', () => {
  const items: CalendarItem[] = [
    { id: 'activity-1', type: 'activity', date: '2026-10-11', time: '14:00', emoji: '🎢', label: 'PM', detail: {} },
    { id: 'arrival-1', type: 'arrival', date: '2026-10-11', time: '09:00', emoji: '✈️', label: 'AM', detail: {} },
    { id: 'arrival-2', type: 'arrival', date: '2026-10-12', time: null, emoji: '✈️', label: 'Other', detail: {} },
  ]
  it('returns only that day, sorted by time', () => {
    expect(itemsForDay(items, '2026-10-11').map(i => i.label)).toEqual(['AM', 'PM'])
  })
  it('floats a full-day marker to the top of the day', () => {
    const dayItems: CalendarItem[] = [
      { id: 'activity-1', type: 'activity', date: '2026-10-09', time: '09:00', emoji: '🎢', label: 'Park', detail: {} },
      { id: 'marker-1', type: 'marker', date: '2026-10-09', time: null, emoji: '🔑', label: 'Check-in', detail: {} },
      { id: 'arrival-1', type: 'arrival', date: '2026-10-09', time: '11:00', emoji: '✈️', label: 'Gui', detail: {} },
    ]
    expect(itemsForDay(dayItems, '2026-10-09').map(i => i.label)).toEqual(['Check-in', 'Park', 'Gui'])
  })
  it('keeps a timed marker in time order', () => {
    const dayItems: CalendarItem[] = [
      { id: 'activity-1', type: 'activity', date: '2026-10-09', time: '09:00', emoji: '🎢', label: 'Park', detail: {} },
      { id: 'marker-1', type: 'marker', date: '2026-10-09', time: '16:00', emoji: '🔑', label: 'Check-in', detail: {} },
    ]
    expect(itemsForDay(dayItems, '2026-10-09').map(i => i.label)).toEqual(['Park', 'Check-in'])
  })
})

describe('buildMonthGrid', () => {
  const weeks = buildMonthGrid(2026, 9) // October 2026
  it('has 7 cells per week', () => {
    for (const w of weeks) expect(w).toHaveLength(7)
  })
  it('contains exactly 31 real days, first Oct 1 and last Oct 31', () => {
    const days = weeks.flat().filter((d): d is string => d !== null)
    expect(days).toHaveLength(31)
    expect(days[0]).toBe('2026-10-01')
    expect(days[30]).toBe('2026-10-31')
  })
})

describe('tripDates', () => {
  it('lists Oct 9 through Oct 18', () => {
    const d = tripDates()
    expect(d).toHaveLength(10)
    expect(d[0]).toBe('2026-10-09')
    expect(d[9]).toBe('2026-10-18')
  })
})
