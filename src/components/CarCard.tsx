'use client'
import { useI18n } from '@/lib/i18n/context'
import { AvatarCircle } from './AvatarCircle'
import { publicUrl } from '@/lib/photos'
import type { CarWithCreator } from '@/types/database'

type Props = {
  car: CarWithCreator
  onEdit: () => void
  onDelete: () => void
}

export function CarCard({ car, onEdit, onDelete }: Props) {
  const { t, lang } = useI18n()

  function fmt(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(
      lang === 'pt' ? 'pt-BR' : 'en-US',
      { day: '2-digit', month: '2-digit', year: 'numeric' }
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      {car.photo_path && (
        <img src={publicUrl('car-photos', car.photo_path)} alt={`${car.brand} ${car.color}`}
          className="w-full aspect-[4/3] object-cover rounded-xl mb-3" />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-gray-900">{car.brand} — {car.color}</p>
          <p className="text-sm text-gray-600 mt-0.5">{car.rental_company} • {car.location}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {fmt(car.pickup_date)} → {fmt(car.dropoff_date)}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">{t.cars.seats}: {car.seats}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <AvatarCircle name={car.profiles.name} color={car.profiles.avatar_color}
            avatarUrl={car.profiles.avatar_url} size="sm" />
          <span className="text-xs text-gray-400">{t.cars.added_by} {car.profiles.name}</span>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={onEdit}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            {t.cars.edit}
          </button>
          <button onClick={onDelete}
            className="px-3 py-1.5 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50">
            {t.cars.delete}
          </button>
        </div>
      </div>
    </div>
  )
}
