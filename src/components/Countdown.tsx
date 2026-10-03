const TRIP_START = new Date('2026-10-09T00:00:00')

export function daysUntilTrip(now: Date): number {
  const diff = TRIP_START.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
