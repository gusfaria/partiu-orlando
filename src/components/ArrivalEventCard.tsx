'use client'
import { useI18n } from '@/lib/i18n/context'
import { transportEmoji } from '@/lib/arrival-event'
import { shortDate } from '@/lib/ticket-date'
import { AvatarCircle } from './AvatarCircle'
import { BrandButton } from './brand/BrandButton'
import { TicketLegs } from './brand/TicketLegs'
import { CARD_CLASS, DIVIDER_CLASS, META_LABEL_CLASS } from './brand/styles'
import type { ArrivalEventWithPeople } from '@/types/database'

type Props = {
  event: ArrivalEventWithPeople
  onEdit: () => void
  onDelete: () => void
}

export function ArrivalEventCard({ event, onEdit, onDelete }: Props) {
  const { t, lang } = useI18n()
  const locale = lang === 'pt' ? 'pt-BR' : 'en-US'
  const people = event.arrival_event_people.filter(p => p.profiles != null)

  return (
    <article className={CARD_CLASS}>
      <div className="px-4 py-3">
        {event.transportation && (
          <p className={META_LABEL_CLASS}>{transportEmoji(event.transportation)} {event.transportation}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <div className="flex -space-x-1.5">
            {people.map(p => (
              <span key={p.id} className="rounded-full ring-2 ring-white">
                <AvatarCircle name={p.profiles!.name} color={p.profiles!.avatar_color}
                  avatarUrl={p.profiles!.avatar_url} size="sm" />
              </span>
            ))}
          </div>
          <span className="min-w-0 font-display font-semibold text-navy">
            {people.map(p => p.profiles!.name).join(', ')}
          </span>
        </div>
        {event.description && <p className="mt-1.5 text-sm text-navy/80 break-words">{event.description}</p>}
      </div>

      <TicketLegs legs={[
        { label: `↓ ${t.arrivals.arrival}`,
          value: event.arrival_date ? shortDate(event.arrival_date, locale) : null,
          sub: event.arrival_time?.slice(0, 5) ?? null },
        { label: `↑ ${t.arrivals.departure}`,
          value: event.departure_date ? shortDate(event.departure_date, locale) : null,
          sub: event.departure_time?.slice(0, 5) ?? null },
      ]} />

      <div className={`flex justify-end gap-4 px-4 py-2 ${DIVIDER_CLASS}`}>
        <BrandButton variant="quiet" onClick={onEdit}>{t.arrivals.edit}</BrandButton>
        <BrandButton variant="danger-quiet" onClick={onDelete}>{t.arrivals.delete}</BrandButton>
      </div>
    </article>
  )
}
