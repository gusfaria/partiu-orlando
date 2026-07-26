'use client'
import type { CalendarItem } from '@/lib/itinerary'

const COLORS: Record<CalendarItem['type'], string> = {
  arrival:   'bg-green-50 text-green-700 border-green-200',
  departure: 'bg-amber-50 text-amber-700 border-amber-200',
  activity:  'bg-orange-50 text-orange-700 border-orange-200',
}

type Props = { item: CalendarItem; onClick?: () => void }

export function ItineraryPill({ item, onClick }: Props) {
  const className = `w-full truncate rounded-md border px-1.5 py-0.5 text-left text-xs font-medium ${COLORS[item.type]}`

  if (!onClick) {
    return (
      <span className={`block ${className}`} title={item.label}>
        {item.emoji} {item.label}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      title={item.label}
    >
      {item.emoji} {item.label}
    </button>
  )
}
