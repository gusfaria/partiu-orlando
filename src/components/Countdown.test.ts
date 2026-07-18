import { describe, it, expect } from 'vitest'
import { daysUntilTrip } from './Countdown'

describe('daysUntilTrip', () => {
  it('returns correct days when trip is in the future', () => {
    expect(daysUntilTrip(new Date('2026-07-12T00:00:00'))).toBe(89)
  })

  it('returns 0 on trip start day', () => {
    expect(daysUntilTrip(new Date('2026-10-09T12:00:00'))).toBe(0)
  })

  it('returns 0 after trip has started', () => {
    expect(daysUntilTrip(new Date('2026-10-15T00:00:00'))).toBe(0)
  })

  it('returns 1 the day before the trip', () => {
    expect(daysUntilTrip(new Date('2026-10-08T23:59:59'))).toBe(1)
  })
})
