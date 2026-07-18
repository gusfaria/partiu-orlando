'use client'
import { useI18n } from '@/lib/i18n/context'

const TRIP_START = new Date('2026-10-09T00:00:00')

export function daysUntilTrip(now: Date): number {
  const diff = TRIP_START.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function Countdown() {
  const { t } = useI18n()
  const days = daysUntilTrip(new Date())

  return (
    <div className="text-center py-10">
      <div className="text-9xl font-black text-orange-500 leading-none">{days}</div>
      <div className="text-xl text-gray-500 mt-3 font-medium">{t.home.countdown_label}</div>
    </div>
  )
}
