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
        <div ref={detailRef}>
          <ItineraryDayDetail dateLabel={dayLabel(selected)} items={selectedItems}
            onClose={() => setSelected(null)} />
        </div>
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
