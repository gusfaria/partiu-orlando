'use client'
import { useI18n } from '@/lib/i18n/context'
import type { CalendarItem, ItemType } from '@/lib/itinerary'

type Props = { dateLabel: string; items: CalendarItem[]; onClose: () => void }

export function ItineraryDayDetail({ dateLabel, items, onClose }: Props) {
  const { t } = useI18n()

  const typeLabel = (type: ItemType) =>
    type === 'arrival' ? t.itinerary.arrival
    : type === 'departure' ? t.itinerary.departure
    : t.itinerary.activity

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold font-display text-navy capitalize">{dateLabel}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-sm" aria-label="close">✕</button>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-400 text-sm">{t.itinerary.empty_day}</p>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
              <p className="text-sm font-semibold text-gray-900">
                {item.emoji} {item.label}
                <span className="text-xs font-normal text-gray-400">
                  {' · '}{typeLabel(item.type)}{item.time ? ` · ${item.time}` : ''}
                </span>
              </p>
              {item.detail.description && (
                <p className="text-sm text-gray-600 mt-0.5">{item.detail.description}</p>
              )}
              {item.detail.transportation && (
                <p className="text-xs text-gray-500 mt-0.5">{t.itinerary.transportation}: {item.detail.transportation}</p>
              )}
              {item.detail.cost_per_person != null && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {t.itinerary.cost}: $ {Number(item.detail.cost_per_person).toFixed(2)}
                  {item.detail.cost_notes ? ` — ${item.detail.cost_notes}` : ''}
                </p>
              )}
              {item.detail.ticket_url && (
                <a href={item.detail.ticket_url} target="_blank" rel="noopener noreferrer"
                  className="inline-block text-xs text-navy underline decoration-gold decoration-2 underline-offset-2 mt-0.5">
                  {t.itinerary.buy_tickets} →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
