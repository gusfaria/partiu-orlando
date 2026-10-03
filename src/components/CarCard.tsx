'use client'
import { useI18n } from '@/lib/i18n/context'
import { publicUrl } from '@/lib/photos'
import { shortDate } from '@/lib/ticket-date'
import { AvatarCircle } from './AvatarCircle'
import { BrandButton } from './brand/BrandButton'
import { TicketLegs } from './brand/TicketLegs'
import { CARD_CLASS, DIVIDER_CLASS, META_LABEL_CLASS } from './brand/styles'
import type { CarWithCreator } from '@/types/database'

type Props = {
  car: CarWithCreator
  onEdit: () => void
  onDelete: () => void
}

export function CarCard({ car, onEdit, onDelete }: Props) {
  const { t, lang } = useI18n()
  const locale = lang === 'pt' ? 'pt-BR' : 'en-US'

  return (
    <article className={CARD_CLASS}>
      {car.photo_path && (
        <img src={publicUrl('car-photos', car.photo_path)} alt={`${car.brand} ${car.color}`}
          className="w-full aspect-[4/3] object-cover" />
      )}
      <div className="px-4 py-3 min-w-0">
        <p className={`${META_LABEL_CLASS} truncate`}>{car.rental_company} · {car.location}</p>
        <p className="font-display text-lg font-bold text-navy">{car.brand} — {car.color}</p>
      </div>
      <TicketLegs legs={[
        { label: t.cars.pickup_date, value: shortDate(car.pickup_date, locale) },
        { label: t.cars.dropoff_date, value: shortDate(car.dropoff_date, locale) },
        { label: t.cars.seats, value: String(car.seats) },
      ]} />
      <div className={`flex items-center justify-between gap-3 px-4 py-2 ${DIVIDER_CLASS}`}>
        {car.profiles ? (
          <div className="flex min-w-0 items-center gap-2">
            <AvatarCircle name={car.profiles.name} color={car.profiles.avatar_color}
              avatarUrl={car.profiles.avatar_url} size="sm" />
            <span className={`${META_LABEL_CLASS} truncate`}>{t.cars.added_by} {car.profiles.name}</span>
          </div>
        ) : <span />}
        <div className="flex shrink-0 gap-4">
          <BrandButton variant="quiet" onClick={onEdit}>{t.cars.edit}</BrandButton>
          <BrandButton variant="danger-quiet" onClick={onDelete}>{t.cars.delete}</BrandButton>
        </div>
      </div>
    </article>
  )
}
