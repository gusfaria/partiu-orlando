'use client'
import type { CalendarItem } from '@/lib/itinerary'

const COLORS: Record<CalendarItem['type'], string> = {
  arrival:   'bg-teal/15 text-navy border-teal/40',
  departure: 'bg-coral/15 text-navy border-coral/40',
  activity:  'bg-gold/15 text-navy border-gold/50',
  marker:    'bg-pink/20 text-navy border-pink/50',
}

type Props = { item: CalendarItem; onClick?: () => void }

export function ItineraryPill({ item, onClick }: Props) {
  // line-clamp (not truncate) so wider calendar cells show two lines of the label
  const className = `w-full line-clamp-2 break-words leading-snug rounded-md border px-1.5 py-0.5 text-left text-xs font-medium ${COLORS[item.type]}`

  if (!onClick) {
    return (
      <span className={className} title={item.label}>
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
