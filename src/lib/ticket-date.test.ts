import { describe, it, expect } from 'vitest'
import { ticketDateParts, shortDate, activityMeta } from './ticket-date'

describe('ticketDateParts', () => {
  it('pt-BR: uppercase weekday/month without dots', () => {
    expect(ticketDateParts('2026-10-10', 'pt-BR')).toEqual({ weekday: 'SÁB', day: '10', month: 'OUT' })
  })
  it('en-US', () => {
    expect(ticketDateParts('2026-10-10', 'en-US')).toEqual({ weekday: 'SAT', day: '10', month: 'OCT' })
  })
})

describe('shortDate', () => {
  it('pt-BR → "09 out"', () => expect(shortDate('2026-10-09', 'pt-BR')).toBe('09 out'))
  it('en-US → "09 Oct"', () => expect(shortDate('2026-10-09', 'en-US')).toBe('09 Oct'))
})

describe('activityMeta', () => {
  it('time and cost', () => expect(activityMeta('09:00:00', 159)).toBe('09:00 · $ 159.00'))
  it('only cost', () => expect(activityMeta(null, 0)).toBe('$ 0.00'))
  it('only time', () => expect(activityMeta('14:30:00', null)).toBe('14:30'))
  it('neither → empty string', () => expect(activityMeta(null, null)).toBe(''))
})
