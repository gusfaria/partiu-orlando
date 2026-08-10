'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
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

// Color-code each filter to match the calendar items it shows.
// Literal class names so Tailwind can see them (no dynamic construction).
const FILTER_STYLE: Record<FilterType, { active: string; idle: string }> = {
  all:       { active: 'bg-navy text-cream',  idle: 'bg-navy/5 text-navy/70 hover:bg-navy/10' },
  arrival:   { active: 'bg-teal text-white',  idle: 'bg-teal/15 text-navy hover:bg-teal/25' },
  departure: { active: 'bg-coral text-white', idle: 'bg-coral/15 text-navy hover:bg-coral/25' },
  activity:  { active: 'bg-gold text-navy',   idle: 'bg-gold/15 text-navy hover:bg-gold/25' },
}

function ItineraryContent() {
  const { t, lang } = useI18n()
  const locale = lang === 'pt' ? 'pt-BR' : 'en-US'
  const [events, setEvents] = useState<ArrivalEventWithPeople[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [selected, setSelected] = useState<string | null>(null)
  const detailRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (selected) {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selected])

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-navy mb-4">{t.itinerary.title}</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map(f => (
          <button key={f} onClick={() => { setFilter(f); setSelected(null) }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? FILTER_STYLE[f].active : FILTER_STYLE[f].idle
            }`}>
            {filterLabel[f]}
          </button>
        ))}
      </div>

      {/* Desktop grid */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-navy/30 mb-1">
          {weekdayLabels.map((w, i) => <div key={i} className="capitalize py-1">{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((date, i) => {
            if (!date) return <div key={i} className="min-h-20 rounded-lg bg-cream" />
            const dayItems = itemsForDay(visible, date)
            const trip = isTrip(date)
            return (
              <button key={i} type="button" disabled={dayItems.length === 0}
                onClick={() => setSelected(date)}
                className={`min-h-20 rounded-lg border p-1 flex flex-col gap-0.5 text-left ${
                  trip ? 'border-navy/15 bg-white' : 'border-transparent bg-cream'
                } ${dayItems.length ? 'hover:border-gold cursor-pointer' : 'cursor-default'} ${
                  selected === date ? 'ring-2 ring-gold' : ''
                }`}>
                <span className={`text-xs ${trip ? 'text-navy/80 font-semibold' : 'text-navy/30'}`}>{dayNum(date)}</span>
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
            <div key={date} className="bg-white rounded-2xl border border-navy/10 shadow-[0_4px_0_rgba(26,37,54,0.08)] p-4">
              <p className="text-sm font-semibold text-navy capitalize mb-2">{dayLabel(date)}</p>
              {dayItems.length === 0 ? (
                <p className="text-xs text-navy/30">{t.itinerary.empty_day}</p>
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
        <div ref={detailRef}>
          <ItineraryDayDetail dateLabel={dayLabel(selected)} items={selectedItems}
            onClose={() => setSelected(null)} />
        </div>
      )}

      {items.length === 0 && (
        <p className="text-navy/50 text-sm mt-4">{t.itinerary.empty}</p>
      )}
    </div>
  )
}

export function ItineraryCalendar() {
  return <ProtectedRoute><ItineraryContent /></ProtectedRoute>
}
