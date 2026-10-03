'use client'
import { useI18n } from '@/lib/i18n/context'
import { activityMeta } from '@/lib/ticket-date'
import { AvatarCircle } from './AvatarCircle'
import { BrandButton } from './brand/BrandButton'
import { TicketBand } from './brand/TicketBand'
import { CARD_CLASS, DIVIDER_CLASS, META_LABEL_CLASS } from './brand/styles'
import type { ActivityWithSignups } from '@/types/database'

type Props = {
  activity: ActivityWithSignups
  isSignedUp: boolean
  myPlusGuests: number
  onToggle: () => void
  onPlusGuests: (count: number) => void
}

const STEP_BTN = 'grid place-items-center w-6 h-6 rounded-full bg-white border border-navy/15 font-bold text-navy/70 hover:bg-navy/5 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold'

export function ActivityCard({ activity, isSignedUp, myPlusGuests, onToggle, onPlusGuests }: Props) {
  const { t, lang } = useI18n()
  const locale = lang === 'pt' ? 'pt-BR' : 'en-US'
  const meta = activityMeta(activity.activity_time, activity.cost_per_person)
  const totalHeadcount = activity.activity_signups.reduce((sum, s) => sum + 1 + s.plus_guests, 0)

  return (
    <article className={CARD_CLASS}>
      <TicketBand date={activity.activity_date} locale={locale} meta={meta} />

      <div className="px-4 pt-3 pb-4">
        <h3 className="font-display text-lg font-bold leading-snug text-navy">{activity.title}</h3>
        {activity.description && (
          <p className="mt-1.5 text-sm leading-relaxed text-navy/70">{activity.description}</p>
        )}
        {activity.cost_notes && (
          <p className="mt-2 text-xs text-navy/70">
            <span className="font-medium">{t.activities.cost}:</span> {activity.cost_notes}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <BrandButton variant={isSignedUp ? 'secondary' : 'primary'} onClick={onToggle}>
            {isSignedUp ? t.activities.unsign : t.activities.signup}
          </BrandButton>
          {activity.ticket_url && (
            <a href={activity.ticket_url} target="_blank" rel="noopener noreferrer"
              className="font-ticket text-[11px] uppercase tracking-wider text-navy underline decoration-gold decoration-2 underline-offset-4">
              {t.activities.buy_tickets} →
            </a>
          )}
        </div>

        {isSignedUp && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-dashed border-gold bg-gold/10 px-3 py-1 text-sm text-navy">
            <span>+ {t.activities.plus_guests}</span>
            <button type="button" aria-label="−" className={STEP_BTN}
              onClick={() => onPlusGuests(Math.max(0, myPlusGuests - 1))} disabled={myPlusGuests === 0}>−</button>
            <span className="w-4 text-center font-semibold">{myPlusGuests}</span>
            <button type="button" aria-label="+" className={STEP_BTN}
              onClick={() => onPlusGuests(myPlusGuests + 1)}>+</button>
          </div>
        )}

        {activity.activity_signups.length > 0 && (
          <div className={`mt-3 pt-3 flex items-center gap-2 ${DIVIDER_CLASS}`}>
            <div className="flex -space-x-1.5">
              {activity.activity_signups.map(s => (
                <div key={s.id} className="relative rounded-full ring-2 ring-white">
                  <AvatarCircle name={s.profiles.name} color={s.profiles.avatar_color}
                    avatarUrl={s.profiles.avatar_url} size="sm" />
                  {s.plus_guests > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold leading-none text-navy">
                      +{s.plus_guests}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <span className={META_LABEL_CLASS}>{t.activities.attendees} · {totalHeadcount}</span>
          </div>
        )}
      </div>
    </article>
  )
}
