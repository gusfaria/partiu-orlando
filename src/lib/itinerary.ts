import type { ArrivalEventWithPeople, Activity, CalendarMarker } from '@/types/database'
import { transportEmoji } from './arrival-event'

export type ItemType = 'arrival' | 'departure' | 'activity' | 'marker'
export type FilterType = 'all' | ItemType

export type CalendarItem = {
  id: string
  type: ItemType
  date: string
  time: string | null
  emoji: string
  label: string
  detail: {
    description?: string
    transportation?: string
    people?: string[]
    cost_per_person?: number | null
    cost_notes?: string | null
    ticket_url?: string | null
  }
}

export const TRIP_YEAR = 2026
export const TRIP_MONTH = 9 // October, 0-indexed
export const TRIP_START = '2026-10-09'
export const TRIP_END = '2026-10-18'

function peopleNames(event: ArrivalEventWithPeople): string[] {
  return event.arrival_event_people
    .filter(p => p.profiles != null)
    .map(p => p.profiles!.name)
}

export function buildCalendarItems(
  events: ArrivalEventWithPeople[],
  activities: Activity[],
  markers: CalendarMarker[] = [],
): CalendarItem[] {
  const items: CalendarItem[] = []
  for (const e of events) {
    const names = peopleNames(e)
    const label = names.join(', ')
    const emoji = transportEmoji(e.transportation)
    const detail = { description: e.description, transportation: e.transportation, people: names }
    if (e.arrival_date) {
      items.push({ id: `arrival-${e.id}`, type: 'arrival', date: e.arrival_date,
        time: e.arrival_time?.slice(0, 5) ?? null, emoji, label, detail })
    }
    if (e.departure_date) {
      items.push({ id: `departure-${e.id}`, type: 'departure', date: e.departure_date,
        time: e.departure_time?.slice(0, 5) ?? null, emoji, label, detail })
    }
  }
  for (const a of activities) {
    if (a.activity_date) {
      items.push({ id: `activity-${a.id}`, type: 'activity', date: a.activity_date,
        time: a.activity_time?.slice(0, 5) ?? null, emoji: '🎢', label: a.title,
        detail: { description: a.description, cost_per_person: a.cost_per_person,
          cost_notes: a.cost_notes, ticket_url: a.ticket_url } })
    }
  }
  for (const m of markers) {
    items.push({ id: `marker-${m.id}`, type: 'marker', date: m.event_date,
      time: m.event_time?.slice(0, 5) ?? null, emoji: m.emoji, label: m.label, detail: {} })
  }
  return items
}

export function filterItems(items: CalendarItem[], filter: FilterType): CalendarItem[] {
  if (filter === 'all') return items
  return items.filter(i => i.type === filter)
}

export function itemsForDay(items: CalendarItem[], date: string): CalendarItem[] {
  // Full-day markers (no time) lead the day; everything else follows by time.
  const isFullDayMarker = (i: CalendarItem) => i.type === 'marker' && !i.time
  return items
    .filter(i => i.date === date)
    .sort((a, b) => {
      const af = isFullDayMarker(a), bf = isFullDayMarker(b)
      if (af !== bf) return af ? -1 : 1
      return (a.time ?? '').localeCompare(b.time ?? '')
    })
}

export function buildMonthGrid(year: number, month: number): (string | null)[][] {
  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay() // 0=Sun
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const cells: (string | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  const mm = String(month + 1).padStart(2, '0')
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${mm}-${String(d).padStart(2, '0')}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export function tripDates(): string[] {
  const out: string[] = []
  for (let d = 9; d <= 18; d++) out.push(`2026-10-${String(d).padStart(2, '0')}`)
  return out
}
