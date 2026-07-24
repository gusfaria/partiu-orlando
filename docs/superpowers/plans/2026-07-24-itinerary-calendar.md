# Itinerary Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Programação (`/schedule`) markdown page with a read-only October 2026 calendar that aggregates arrivals, departures, and activities into color-coded pills, with topic filters, a responsive desktop-grid / phone-stack layout, and a tap-to-open day-detail panel.

**Architecture:** A pure logic module (`src/lib/itinerary.ts`) maps `arrival_events` + `activities` rows into a normalized `CalendarItem[]` and builds the October month grid — all unit-tested with no DB. Presentational components (`ItineraryPill`, `ItineraryDayDetail`) render items. `ItineraryCalendar` fetches the two sources, holds filter + selected-day state, and renders the desktop grid and phone stack from the same per-day buckets. No new tables, no migration — pure read layer.

**Tech Stack:** Existing stack only — Next.js 16 static export, Supabase JS v2, Tailwind v4, Vitest. No new dependencies.

## Global Constraints

- All UI strings in `src/lib/i18n/pt.json` / `en.json` — never hardcoded; Portuguese default; pt/en must keep identical key structure (enforced via `typeof pt`)
- No server-side code; `'use client'` on components using hooks/browser APIs
- Read-only: this feature performs NO inserts/updates/deletes; editing stays on `/arrivals` and the admin panel
- October 2026 only; trip window is Oct 9–18 (`2026-10-09`..`2026-10-18`)
- Pill colors: arrival = green, departure = amber, activity = orange
- Transportation → emoji: `Avião → ✈️`, `Carro → 🚗`, `Trem → 🚆` (fallback 🧳); activity emoji fixed `🎢`
- One arrival event appears twice when it has both dates: an arrival item on `arrival_date` and a departure item on `departure_date`
- Node: `nvm use 22` before any npm command
- Working directory: `/Users/gusfaria/Documents/PROJECTS/Gustavo-Philipe__40-anos`

---

## File Map

```
src/lib/itinerary.ts             — new: CalendarItem type + buildCalendarItems, filterItems, itemsForDay, buildMonthGrid, tripDates, constants
src/lib/itinerary.test.ts        — new
src/lib/i18n/pt.json, en.json     — modify: new top-level `itinerary` section
src/components/ItineraryPill.tsx        — new: one color-coded pill
src/components/ItineraryDayDetail.tsx   — new: read-only day-detail panel
src/components/ItineraryCalendar.tsx    — new: fetch + filters + grid/stack + selected-day
src/app/schedule/page.tsx        — replace: render ItineraryCalendar
```

---

### Task 1: Itinerary logic module + i18n

**Files:**
- Create: `src/lib/itinerary.ts`, `src/lib/itinerary.test.ts`
- Modify: `src/lib/i18n/pt.json`, `src/lib/i18n/en.json`

**Interfaces:**
- Consumes: `ArrivalEventWithPeople`, `Activity` types
- Produces:
  - `type ItemType = 'arrival' | 'departure' | 'activity'`
  - `type FilterType = 'all' | ItemType`
  - `type CalendarItem = { id: string; type: ItemType; date: string; time: string | null; emoji: string; label: string; detail: { description?: string; transportation?: string; people?: string[]; cost_per_person?: number | null; cost_notes?: string | null; ticket_url?: string | null } }`
  - `buildCalendarItems(events: ArrivalEventWithPeople[], activities: Activity[]): CalendarItem[]`
  - `filterItems(items: CalendarItem[], filter: FilterType): CalendarItem[]`
  - `itemsForDay(items: CalendarItem[], date: string): CalendarItem[]`
  - `buildMonthGrid(year: number, month: number): (string | null)[][]` (month 0-indexed; weeks of `YYYY-MM-DD` or null padding, Sun–Sat)
  - `tripDates(): string[]`
  - consts `TRIP_YEAR = 2026`, `TRIP_MONTH = 9`, `TRIP_START = '2026-10-09'`, `TRIP_END = '2026-10-18'`
- Produces i18n keys: new top-level `itinerary` section

- [ ] **Step 1: Write the failing test**

Create `src/lib/itinerary.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  buildCalendarItems, filterItems, itemsForDay, buildMonthGrid, tripDates,
  type CalendarItem,
} from './itinerary'
import type { ArrivalEventWithPeople, Activity } from '@/types/database'

function evt(o: Partial<ArrivalEventWithPeople>): ArrivalEventWithPeople {
  return {
    id: 'e1', description: 'desc', transportation: 'Avião',
    arrival_date: null, arrival_time: null, departure_date: null, departure_time: null,
    created_by: null, created_at: '', arrival_event_people: [], ...o,
  }
}
function person(name: string) {
  return { id: 'p' + name, event_id: 'e1', user_id: 'u' + name,
    profiles: { id: 'u' + name, name, is_admin: false, avatar_color: '#fff', avatar_url: null, created_at: '' } }
}
function act(o: Partial<Activity>): Activity {
  return {
    id: 'a1', title: 'Magic Kingdom', description: 'park', activity_date: null, activity_time: null,
    cost_per_person: null, cost_notes: null, ticket_url: null, display_order: 0, created_at: '', ...o,
  }
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
})

describe('filterItems', () => {
  const items: CalendarItem[] = [
    { id: 'arrival-1', type: 'arrival', date: '2026-10-09', time: null, emoji: '✈️', label: 'A', detail: {} },
    { id: 'departure-1', type: 'departure', date: '2026-10-18', time: null, emoji: '✈️', label: 'A', detail: {} },
    { id: 'activity-1', type: 'activity', date: '2026-10-11', time: null, emoji: '🎢', label: 'MK', detail: {} },
  ]
  it('returns everything for all', () => {
    expect(filterItems(items, 'all')).toHaveLength(3)
  })
  it('returns only the matching type', () => {
    expect(filterItems(items, 'activity').map(i => i.id)).toEqual(['activity-1'])
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
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test
```

Expected: FAIL — `itinerary` module not found.

- [ ] **Step 3: Implement the module**

Create `src/lib/itinerary.ts`:

```ts
import type { ArrivalEventWithPeople, Activity } from '@/types/database'

export type ItemType = 'arrival' | 'departure' | 'activity'
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

const TRANSPORT_EMOJI: Record<string, string> = {
  'Avião': '✈️',
  'Carro': '🚗',
  'Trem': '🚆',
}

function peopleNames(event: ArrivalEventWithPeople): string[] {
  return event.arrival_event_people
    .filter(p => p.profiles != null)
    .map(p => p.profiles!.name)
}

export function buildCalendarItems(
  events: ArrivalEventWithPeople[],
  activities: Activity[],
): CalendarItem[] {
  const items: CalendarItem[] = []
  for (const e of events) {
    const names = peopleNames(e)
    const label = names.join(', ')
    const emoji = TRANSPORT_EMOJI[e.transportation] ?? '🧳'
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
  return items
}

export function filterItems(items: CalendarItem[], filter: FilterType): CalendarItem[] {
  if (filter === 'all') return items
  return items.filter(i => i.type === filter)
}

export function itemsForDay(items: CalendarItem[], date: string): CalendarItem[] {
  return items
    .filter(i => i.date === date)
    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
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
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test
```

Expected: PASS (all new itinerary tests + existing suite).

- [ ] **Step 5: Add i18n strings**

In `src/lib/i18n/pt.json`, add a new top-level `itinerary` section (sibling to `nav`, `arrivals`, etc.):

```json
"itinerary": {
  "title": "Programação",
  "filter_all": "Tudo",
  "filter_arrivals": "Chegadas",
  "filter_departures": "Saídas",
  "filter_activities": "Atividades",
  "arrival": "Chegada",
  "departure": "Saída",
  "activity": "Atividade",
  "transportation": "Transporte",
  "cost": "Custo por pessoa",
  "buy_tickets": "Comprar ingressos",
  "empty_day": "Nada neste dia",
  "empty": "Nada programado ainda."
}
```

In `src/lib/i18n/en.json`, mirror it:

```json
"itinerary": {
  "title": "Itinerary",
  "filter_all": "All",
  "filter_arrivals": "Arrivals",
  "filter_departures": "Departures",
  "filter_activities": "Activities",
  "arrival": "Arrival",
  "departure": "Departure",
  "activity": "Activity",
  "transportation": "Transportation",
  "cost": "Cost per person",
  "buy_tickets": "Buy tickets",
  "empty_day": "Nothing on this day",
  "empty": "Nothing scheduled yet."
}
```

- [ ] **Step 6: Verify tests + build**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test && npm run build
```

Expected: all tests pass; build compiles (this task adds a module + i18n only; nothing removed, so build stays green).

- [ ] **Step 7: Commit**

```bash
git add src/lib/itinerary.ts src/lib/itinerary.test.ts src/lib/i18n/
git commit -m "feat: add itinerary calendar logic module and i18n strings"
```

---

### Task 2: Pill + day-detail presentational components

**Files:**
- Create: `src/components/ItineraryPill.tsx`, `src/components/ItineraryDayDetail.tsx`

**Interfaces:**
- Consumes: `CalendarItem` type from Task 1; `useI18n()`; i18n `itinerary.*`
- Produces:
  - `<ItineraryPill item={CalendarItem} onClick?={() => void} />`
  - `<ItineraryDayDetail dateLabel={string} items={CalendarItem[]} onClose={() => void} />`

- [ ] **Step 1: Create ItineraryPill**

Create `src/components/ItineraryPill.tsx`:

```tsx
'use client'
import type { CalendarItem } from '@/lib/itinerary'

const COLORS: Record<CalendarItem['type'], string> = {
  arrival:   'bg-green-50 text-green-700 border-green-200',
  departure: 'bg-amber-50 text-amber-700 border-amber-200',
  activity:  'bg-orange-50 text-orange-700 border-orange-200',
}

type Props = { item: CalendarItem; onClick?: () => void }

export function ItineraryPill({ item, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full truncate rounded-md border px-1.5 py-0.5 text-left text-xs font-medium ${COLORS[item.type]}`}
      title={item.label}
    >
      {item.emoji} {item.label}
    </button>
  )
}
```

- [ ] **Step 2: Create ItineraryDayDetail**

Create `src/components/ItineraryDayDetail.tsx`:

```tsx
'use client'
import { useI18n } from '@/lib/i18n/context'
import type { CalendarItem, ItemType } from '@/lib/itinerary'

type Props = { dateLabel: string; items: CalendarItem[]; onClose: () => void }

export function ItineraryDayDetail({ dateLabel, items, onClose }: Props) {
  const { t } = useI18n()

  const typeLabel = (type: ItemType) =>
    type === 'arrival' ? t.itinerary.arrival
    : type === 'departure' ? t.itinerary.departure
    : t.itinerary.activity

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 capitalize">{dateLabel}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-sm" aria-label="close">✕</button>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-400 text-sm">{t.itinerary.empty_day}</p>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
              <p className="text-sm font-semibold text-gray-900">
                {item.emoji} {item.label}
                <span className="text-xs font-normal text-gray-400">
                  {' · '}{typeLabel(item.type)}{item.time ? ` · ${item.time}` : ''}
                </span>
              </p>
              {item.detail.description && (
                <p className="text-sm text-gray-600 mt-0.5">{item.detail.description}</p>
              )}
              {item.detail.transportation && (
                <p className="text-xs text-gray-500 mt-0.5">{t.itinerary.transportation}: {item.detail.transportation}</p>
              )}
              {item.detail.cost_per_person != null && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {t.itinerary.cost}: $ {Number(item.detail.cost_per_person).toFixed(2)}
                  {item.detail.cost_notes ? ` — ${item.detail.cost_notes}` : ''}
                </p>
              )}
              {item.detail.ticket_url && (
                <a href={item.detail.ticket_url} target="_blank" rel="noopener noreferrer"
                  className="inline-block text-xs text-orange-500 hover:underline mt-0.5">
                  {t.itinerary.buy_tickets} →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm run build
```

Expected: build passes (components compile even though not yet wired into a page).

- [ ] **Step 4: Commit**

```bash
git add src/components/ItineraryPill.tsx src/components/ItineraryDayDetail.tsx
git commit -m "feat: add itinerary pill and day-detail components"
```

---

### Task 3: ItineraryCalendar + replace /schedule page

**Files:**
- Create: `src/components/ItineraryCalendar.tsx`
- Replace: `src/app/schedule/page.tsx`

**Interfaces:**
- Consumes: `buildCalendarItems`, `filterItems`, `itemsForDay`, `buildMonthGrid`, `tripDates`, `TRIP_YEAR`, `TRIP_MONTH`, `TRIP_START`, `TRIP_END`, `FilterType` from `src/lib/itinerary.ts`; `ItineraryPill`, `ItineraryDayDetail` from Task 2; `ArrivalEventWithPeople`, `Activity` types; `supabase`, `useI18n`, `ProtectedRoute`

- [ ] **Step 1: Create ItineraryCalendar**

Create `src/components/ItineraryCalendar.tsx`:

```tsx
'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n/context'
import { ProtectedRoute } from './ProtectedRoute'
import { ItineraryPill } from './ItineraryPill'
import { ItineraryDayDetail } from './ItineraryDayDetail'
import {
  buildCalendarItems, filterItems, itemsForDay, buildMonthGrid, tripDates,
  TRIP_YEAR, TRIP_MONTH, TRIP_START, TRIP_END, type FilterType,
} from '@/lib/itinerary'
import type { ArrivalEventWithPeople, Activity } from '@/types/database'

const FILTERS: FilterType[] = ['all', 'arrival', 'departure', 'activity']

function ItineraryContent() {
  const { t, lang } = useI18n()
  const locale = lang === 'pt' ? 'pt-BR' : 'en-US'
  const [events, setEvents] = useState<ArrivalEventWithPeople[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('arrival_events').select('*, arrival_event_people(*, profiles(*))')
      .then(({ data }) => setEvents((data as ArrivalEventWithPeople[]) ?? []))
    supabase.from('activities').select('*')
      .then(({ data }) => setActivities((data as Activity[]) ?? []))
  }, [])

  const items = useMemo(() => buildCalendarItems(events, activities), [events, activities])
  const visible = useMemo(() => filterItems(items, filter), [items, filter])
  const weeks = useMemo(() => buildMonthGrid(TRIP_YEAR, TRIP_MONTH), [])

  const weekdayLabels = useMemo(() => {
    const base = Date.UTC(2023, 0, 1) // a Sunday
    return Array.from({ length: 7 }, (_, i) =>
      new Date(base + i * 86400000).toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' }))
  }, [locale])

  const filterLabel: Record<FilterType, string> = {
    all: t.itinerary.filter_all,
    arrival: t.itinerary.filter_arrivals,
    departure: t.itinerary.filter_departures,
    activity: t.itinerary.filter_activities,
  }

  function isTrip(date: string) { return date >= TRIP_START && date <= TRIP_END }
  function dayNum(date: string) { return Number(date.slice(8, 10)) }
  function dayLabel(date: string) {
    return new Date(date + 'T00:00:00').toLocaleDateString(locale,
      { weekday: 'long', day: '2-digit', month: '2-digit' })
  }

  const selectedItems = selected ? itemsForDay(visible, selected) : []

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{t.itinerary.title}</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map(f => (
          <button key={f} onClick={() => { setFilter(f); setSelected(null) }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              filter === f ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {filterLabel[f]}
          </button>
        ))}
      </div>

      {/* Desktop grid */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
          {weekdayLabels.map((w, i) => <div key={i} className="capitalize py-1">{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((date, i) => {
            if (!date) return <div key={i} className="min-h-20 rounded-lg bg-gray-50/40" />
            const dayItems = itemsForDay(visible, date)
            const trip = isTrip(date)
            return (
              <button key={i} type="button" disabled={dayItems.length === 0}
                onClick={() => setSelected(date)}
                className={`min-h-20 rounded-lg border p-1 flex flex-col gap-0.5 text-left ${
                  trip ? 'border-gray-200 bg-white' : 'border-transparent bg-gray-50/40'
                } ${dayItems.length ? 'hover:border-orange-300 cursor-pointer' : 'cursor-default'} ${
                  selected === date ? 'ring-2 ring-orange-400' : ''
                }`}>
                <span className={`text-xs ${trip ? 'text-gray-700 font-semibold' : 'text-gray-300'}`}>{dayNum(date)}</span>
                {dayItems.map(item => <ItineraryPill key={item.id} item={item} />)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Phone stack */}
      <div className="md:hidden space-y-3">
        {tripDates().map(date => {
          const dayItems = itemsForDay(visible, date)
          return (
            <div key={date} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-900 capitalize mb-2">{dayLabel(date)}</p>
              {dayItems.length === 0 ? (
                <p className="text-xs text-gray-300">{t.itinerary.empty_day}</p>
              ) : (
                <div className="space-y-1.5">
                  {dayItems.map(item => (
                    <ItineraryPill key={item.id} item={item} onClick={() => setSelected(date)} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selected && (
        <ItineraryDayDetail dateLabel={dayLabel(selected)} items={selectedItems}
          onClose={() => setSelected(null)} />
      )}

      {items.length === 0 && (
        <p className="text-gray-400 text-sm mt-4">{t.itinerary.empty}</p>
      )}
    </div>
  )
}

export function ItineraryCalendar() {
  return <ProtectedRoute><ItineraryContent /></ProtectedRoute>
}
```

- [ ] **Step 2: Replace the schedule page**

Replace `src/app/schedule/page.tsx` with:

```tsx
import { ItineraryCalendar } from '@/components/ItineraryCalendar'

export default function SchedulePage() {
  return <ItineraryCalendar />
}
```

- [ ] **Step 3: Verify tests + build**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test && npm run build
```

Expected: all tests pass; build succeeds with `/schedule` compiling to the new calendar.

- [ ] **Step 4: Manual end-to-end** (skip if no browser; note as concern)

1. Visit `/schedule` — filter chips (Tudo/Chegadas/Saídas/Atividades) + October grid on desktop, stacked day cards on a narrow viewport
2. With an arrival event that has both dates, confirm it shows as a green pill on its arrival day AND an amber pill on its departure day
3. An activity with a date shows as an orange 🎢 pill on that day
4. Tap a day → detail panel lists that day's items with times/people/transport/cost/ticket link
5. Filter to "Atividades" → only activity pills remain; days with no activities become non-clickable

- [ ] **Step 5: Commit and deploy**

```bash
git add src/components/ItineraryCalendar.tsx src/app/schedule/page.tsx
git commit -m "feat: itinerary calendar replaces schedule markdown page"
git push origin main   # auto-deploys via GitHub Actions
```

---

## Self-Review

**Spec coverage:** data sources (arrival_events + activities, read-only) → Task 1's `buildCalendarItems`; item model with emoji/label/time/detail → Task 1; October grid + trip dates → Task 1's `buildMonthGrid`/`tripDates`; pills with color-by-type → Task 2 `ItineraryPill`; day-detail panel → Task 2 `ItineraryDayDetail`; responsive desktop-grid/phone-stack + filters + selected-day + wiring into `/schedule` → Task 3; i18n → Task 1. One arrival event appearing twice (arrival + departure day) → covered by `buildCalendarItems` and its test. Out-of-scope items (add/edit, multi-month, generic types) correctly omitted.

**Type consistency:** `CalendarItem` shape is defined once in Task 1 and consumed unchanged by `ItineraryPill`, `ItineraryDayDetail`, and `ItineraryCalendar`. `FilterType` (`'all' | 'arrival' | 'departure' | 'activity'`) is used identically in `filterItems` and the `FILTERS`/`filterLabel` map. `buildMonthGrid(year, month)` (month 0-indexed) is called with `TRIP_MONTH = 9`. Dates are `YYYY-MM-DD` strings throughout; string comparison for `isTrip`/`itemsForDay` is valid because ISO dates sort lexically. `time` values are sliced to `HH:MM` in `buildCalendarItems` and rendered as-is. No new DB writes, so no RLS/migration concerns.
