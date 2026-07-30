'use client'
import type { CalendarItem } from '@/lib/itinerary'

const COLORS: Record<CalendarItem['type'], string> = {
  arrival:   'bg-teal/15 text-teal border-teal/40',
  departure: 'bg-coral/15 text-coral border-coral/40',
  activity:  'bg-gold/15 text-navy border-gold/50',
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
