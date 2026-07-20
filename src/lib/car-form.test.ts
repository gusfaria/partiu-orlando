import { describe, it, expect } from 'vitest'
import { isCarFormValid, type CarFormValue } from './car-form'

const valid: CarFormValue = {
  rental_company: 'Enterprise',
  location: 'MCO Airport',
  pickup_date: '2026-10-09',
  dropoff_date: '2026-10-18',
  brand: 'Toyota',
  color: 'Prata',
  seats: '5',
}

describe('isCarFormValid', () => {
  it('accepts a fully filled form', () => {
    expect(isCarFormValid(valid)).toBe(true)
  })
  it('rejects empty rental_company', () => {
    expect(isCarFormValid({ ...valid, rental_company: '  ' })).toBe(false)
  })
  it('rejects empty pickup_date', () => {
    expect(isCarFormValid({ ...valid, pickup_date: '' })).toBe(false)
  })
  it('rejects zero seats', () => {
    expect(isCarFormValid({ ...valid, seats: '0' })).toBe(false)
  })
  it('rejects non-numeric seats', () => {
    expect(isCarFormValid({ ...valid, seats: 'abc' })).toBe(false)
  })
})
