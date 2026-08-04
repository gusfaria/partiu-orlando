'use client'
import { useI18n } from '@/lib/i18n/context'
import { AvatarCircle } from './AvatarCircle'
import type { ArrivalEventWithPeople } from '@/types/database'

type Props = {
  event: ArrivalEventWithPeople
  onEdit: () => void
  onDelete: () => void
}

export function ArrivalEventCard({ event, onEdit, onDelete }: Props) {
  const { t, lang } = useI18n()

  function fmt(dateStr: string | null, timeStr: string | null): string | null {
    if (!dateStr) return null
    const date = new Date(dateStr + 'T00:00:00').toLocaleDateString(
      lang === 'pt' ? 'pt-BR' : 'en-US',
      { day: '2-digit', month: '2-digit', year: 'numeric' }
    )
    return timeStr ? `${date} ${timeStr.slice(0, 5)}` : date
  }

  const people = event.arrival_event_people.filter(p => p.profiles != null)
  const arrival = fmt(event.arrival_date, event.arrival_time)
  const departure = fmt(event.departure_date, event.departure_time)

  return (
    <div className="bg-white rounded-2xl border border-navy/10 shadow-[0_4px_0_rgba(26,37,54,0.08)] p-4">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {people.map(p => (
          <AvatarCircle key={p.id} name={p.profiles!.name} color={p.profiles!.avatar_color}
            avatarUrl={p.profiles!.avatar_url} size="sm" />
        ))}
        <span className="text-sm font-semibold font-display text-navy">
          {people.map(p => p.profiles!.name).join(', ')}
        </span>
      </div>

      <p className="text-sm text-navy/80">{event.description}</p>
      <p className="text-xs text-navy/50 mt-0.5">🚗 {event.transportation}</p>

      <div className="mt-2 space-y-0.5">
        {arrival && (
          <p className="text-sm text-navy/70">↓ {t.arrivals.arrival}: {arrival}</p>
        )}
        {departure && (
          <p className="text-sm text-navy/70">↑ {t.arrivals.departure}: {departure}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-navy/10">
        <button onClick={onEdit}
          className="px-3 py-1.5 border border-navy/15 rounded-lg text-sm text-navy/70 hover:bg-navy/5">
          {t.arrivals.edit}
        </button>
        <button onClick={onDelete}
          className="px-3 py-1.5 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50">
          {t.arrivals.delete}
        </button>
      </div>
    </div>
  )
}
