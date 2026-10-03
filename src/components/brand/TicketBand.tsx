import { ticketDateParts } from '@/lib/ticket-date'

type Props = { date: string | null; locale: string; meta?: string }

// Navy header strip of a ticket card. Ends in a dashed tear line with cream
// notches; the parent card must be `relative overflow-hidden` on a cream page.
export function TicketBand({ date, locale, meta }: Props) {
  const parts = date ? ticketDateParts(date, locale) : null
  return (
    <div className="relative flex items-center justify-between gap-3 bg-navy px-4 py-2.5 text-cream border-b-2 border-dashed border-cream/40">
      {parts ? (
        <span className="flex items-baseline gap-2">
          <span className="font-ticket text-[10px] tracking-widest">{parts.weekday}</span>
          <span className="font-display text-2xl font-bold leading-none text-gold">{parts.day}</span>
          <span className="font-ticket text-[10px] tracking-widest">{parts.month}</span>
        </span>
      ) : (
        <span className="font-ticket text-sm">—</span>
      )}
      {meta && <span className="font-ticket text-[11px] tracking-wider text-right">{meta}</span>}
      <span aria-hidden="true" className="absolute -left-2 -bottom-2 w-4 h-4 rounded-full bg-cream" />
      <span aria-hidden="true" className="absolute -right-2 -bottom-2 w-4 h-4 rounded-full bg-cream" />
    </div>
  )
}
