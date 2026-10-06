'use client'
import { useI18n } from '@/lib/i18n/context'
import { daysUntilTrip } from '@/components/Countdown'
import { TRIP_ORIGINS, TRIP_DESTINATION, ORIGIN_CITIES } from '@/lib/trip-origins'
import { SplitFlap } from './SplitFlap'

const DESTINATION = [TRIP_DESTINATION]
const LABEL = 'font-ticket text-[9px] uppercase tracking-widest text-navy/70'

export function BoardingPass() {
  const { t } = useI18n()
  const days = daysUntilTrip(new Date())

  return (
    <section className="relative flex overflow-hidden rounded-2xl bg-cream text-navy shadow-[0_6px_0_rgba(0,0,0,0.25)]">
      <div className="min-w-0 flex-1 p-4">
        <p className={LABEL}>{t.home.boarding_pass}</p>
        <p className="sr-only">{`${TRIP_ORIGINS.join(', ')} → ${TRIP_DESTINATION}`}</p>
        <div className="mt-1.5 flex items-start gap-2">
          <SplitFlap codes={TRIP_ORIGINS} captions={ORIGIN_CITIES} />
          <span aria-hidden="true" className="text-sm leading-[30px] text-navy/60">✈</span>
          <div>
            <SplitFlap codes={DESTINATION} tone="gold" />
            <p className="mt-0.5 font-ticket text-[9px] uppercase tracking-wider text-navy/70">{t.home.destination_city}</p>
          </div>
        </div>
        <div className="mt-2 flex gap-5">
          <div>
            <p className={LABEL}>{t.home.outbound}</p>
            <p className="text-sm font-semibold">{t.home.outbound_date}</p>
          </div>
          <div>
            <p className={LABEL}>{t.home.inbound}</p>
            <p className="text-sm font-semibold">{t.home.inbound_date}</p>
          </div>
        </div>
      </div>

      <div data-stub className="relative grid w-24 shrink-0 place-items-center border-l-2 border-dashed border-navy/40 bg-gold px-1 text-center">
        <div>
          {t.home.countdown_prefix && (
            <p className="font-ticket text-[9px] uppercase tracking-wider">{t.home.countdown_prefix}</p>
          )}
          <p className="font-display text-5xl font-bold leading-none">{days}</p>
          <p className="font-ticket text-[9px] uppercase leading-tight tracking-wider">{t.home.countdown_label}</p>
        </div>
        <span aria-hidden="true" className="absolute -left-2.5 -top-2.5 w-5 h-5 rounded-full bg-navy" />
        <span aria-hidden="true" className="absolute -left-2.5 -bottom-2.5 w-5 h-5 rounded-full bg-navy" />
      </div>
    </section>
  )
}
