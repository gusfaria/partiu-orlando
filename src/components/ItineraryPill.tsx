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
