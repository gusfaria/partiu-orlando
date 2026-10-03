export type TicketDateParts = { weekday: string; day: string; month: string }

function partsOf(date: string, locale: string, opts: Intl.DateTimeFormatOptions) {
  const parts = new Intl.DateTimeFormat(locale, opts).formatToParts(new Date(date + 'T00:00:00'))
  return (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? ''
}

const stripDot = (s: string) => s.replace('.', '')

// "2026-10-10" → { weekday: 'SÁB', day: '10', month: 'OUT' } for a ticket stub.
export function ticketDateParts(date: string, locale: string): TicketDateParts {
  const get = partsOf(date, locale, { weekday: 'short', day: 'numeric', month: 'short' })
  return {
    weekday: stripDot(get('weekday')).toUpperCase(),
    day: get('day'),
    month: stripDot(get('month')).toUpperCase(),
  }
}

// "2026-10-09" → "09 out" / "09 Oct"
export function shortDate(date: string, locale: string): string {
  const get = partsOf(date, locale, { day: '2-digit', month: 'short' })
  return `${get('day')} ${stripDot(get('month'))}`
}

// Right side of an activity's ticket band: "09:00 · $ 159.00"
export function activityMeta(time: string | null, cost: number | null): string {
  return [
    time ? time.slice(0, 5) : null,
    cost != null ? `$ ${Number(cost).toFixed(2)}` : null,
  ].filter(Boolean).join(' · ')
}
