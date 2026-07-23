import { describe, it, expect } from 'vitest'
import { isArrivalEventFormValid, hasLoggedArrival, type ArrivalEventFormValue } from './arrival-event'
import type { ArrivalEventWithPeople } from '@/types/database'

const validForm: ArrivalEventFormValue = {
  description: 'Chegando do aeroporto',
  transportation: 'Avião',
  arrival_date: '2026-10-09',
  arrival_time: '',
  departure_date: '',
  departure_time: '',
  personIds: ['u1'],
}

describe('isArrivalEventFormValid', () => {
  it('accepts a form with an arrival date only', () => {
    expect(isArrivalEventFormValid(validForm)).toBe(true)
  })
  it('accepts a form with a departure date only', () => {
    expect(isArrivalEventFormValid({ ...validForm, arrival_date: '', departure_date: '2026-10-18' })).toBe(true)
  })
  it('rejects when neither date is set', () => {
    expect(isArrivalEventFormValid({ ...validForm, arrival_date: '', departure_date: '' })).toBe(false)
  })
  it('rejects empty description', () => {
    expect(isArrivalEventFormValid({ ...validForm, description: '  ' })).toBe(false)
  })
  it('rejects empty transportation', () => {
    expect(isArrivalEventFormValid({ ...validForm, transportation: '' })).toBe(false)
  })
  it('rejects when no people are selected', () => {
    expect(isArrivalEventFormValid({ ...validForm, personIds: [] })).toBe(false)
  })
})

function event(overrides: Partial<ArrivalEventWithPeople>): ArrivalEventWithPeople {
  return {
    id: 'e1', description: '', transportation: 'Carro',
    arrival_date: null, arrival_time: null, departure_date: null, departure_time: null,
    created_by: null, created_at: '', arrival_event_people: [], ...overrides,
  }
}

describe('hasLoggedArrival', () => {
  it('true when user is in an event with an arrival date', () => {
    const events = [event({ arrival_date: '2026-10-09', arrival_event_people: [
      { id: 'p1', event_id: 'e1', user_id: 'u1', profiles: null },
    ] })]
    expect(hasLoggedArrival('u1', events)).toBe(true)
  })
  it('true when user is in an event with only a departure date', () => {
    const events = [event({ departure_date: '2026-10-18', arrival_event_people: [
      { id: 'p1', event_id: 'e1', user_id: 'u1', profiles: null },
    ] })]
    expect(hasLoggedArrival('u1', events)).toBe(true)
  })
  it('false when user is in an event with no dates', () => {
    const events = [event({ arrival_event_people: [
      { id: 'p1', event_id: 'e1', user_id: 'u1', profiles: null },
    ] })]
    expect(hasLoggedArrival('u1', events)).toBe(false)
  })
  it('false when user is not in any event', () => {
    const events = [event({ arrival_date: '2026-10-09', arrival_event_people: [
      { id: 'p1', event_id: 'e1', user_id: 'u2', profiles: null },
    ] })]
    expect(hasLoggedArrival('u1', events)).toBe(false)
  })
  it('false for empty event list', () => {
    expect(hasLoggedArrival('u1', [])).toBe(false)
  })
})
