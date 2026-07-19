'use client'
import { useI18n } from '@/lib/i18n/context'
import { AvatarCircle } from './AvatarCircle'
import type { ActivityWithSignups } from '@/types/database'

type Props = {
  activity: ActivityWithSignups
  isSignedUp: boolean
  myPlusGuests: number
  onToggle: () => void
  onPlusGuests: (count: number) => void
}

export function ActivityCard({ activity, isSignedUp, myPlusGuests, onToggle, onPlusGuests }: Props) {
  const { t, lang } = useI18n()

  function fmtDate(dateStr: string | null, timeStr: string | null) {
    if (!dateStr) return null
    const date = new Date(dateStr + 'T00:00:00').toLocaleDateString(
      lang === 'pt' ? 'pt-BR' : 'en-US',
      { weekday: 'long', day: 'numeric', month: 'long' }
    )
    const time = timeStr ? ` • ${timeStr.slice(0, 5)}` : ''
    return date + time
  }

  const dateLabel = fmtDate(activity.activity_date, activity.activity_time)
  const totalHeadcount = activity.activity_signups.reduce((sum, s) => sum + 1 + s.plus_guests, 0)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 text-lg leading-snug">{activity.title}</h3>
          {dateLabel && (
            <p className="text-sm text-gray-400 mt-0.5 capitalize">{dateLabel}</p>
          )}
        </div>
        <button
          onClick={onToggle}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            isSignedUp
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          {isSignedUp ? t.activities.unsign : t.activities.signup}
        </button>
      </div>

      {activity.description && (
        <p className="text-gray-600 text-sm mt-3 leading-relaxed">{activity.description}</p>
      )}

      {activity.cost_per_person != null && (
        <p className="text-sm mt-3">
          <span className="font-medium text-gray-700">{t.activities.cost}: </span>
          <span className="text-gray-600">
            $ {Number(activity.cost_per_person).toFixed(2)}
          </span>
          {activity.cost_notes && (
            <span className="text-gray-400"> — {activity.cost_notes}</span>
          )}
        </p>
      )}

      {activity.ticket_url && (
        <a
          href={activity.ticket_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-sm text-orange-500 hover:underline font-medium"
        >
          {t.activities.buy_tickets} →
        </a>
      )}

      {isSignedUp && (
        <div className="mt-4 flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-xl px-4 py-2.5 w-fit">
          <span className="text-sm text-gray-700">+ {t.activities.plus_guests}:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPlusGuests(Math.max(0, myPlusGuests - 1))}
              disabled={myPlusGuests === 0}
              className="w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-600 font-bold disabled:opacity-40 hover:bg-gray-50"
            >
              −
            </button>
            <span className="w-5 text-center text-sm font-semibold text-gray-900">{myPlusGuests}</span>
            <button
              onClick={() => onPlusGuests(myPlusGuests + 1)}
              className="w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-50"
            >
              +
            </button>
          </div>
        </div>
      )}

      {activity.activity_signups.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2">
            {t.activities.attendees} ({totalHeadcount} {t.activities.total})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {activity.activity_signups.map(s => (
              <div key={s.id} className="relative">
                <AvatarCircle
                  name={s.profiles.name}
                  color={s.profiles.avatar_color}
                  avatarUrl={s.profiles.avatar_url}
                  size="sm"
                />
                {s.plus_guests > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] font-bold rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center leading-none">
                    +{s.plus_guests}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
