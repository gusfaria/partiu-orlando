import { describe, it, expect } from 'vitest'
import { sortActivitiesByDate } from './activity-order'

type A = { id: string; activity_date: string | null; activity_time: string | null; display_order: number }
const a = (id: string, activity_date: string | null, activity_time: string | null = null, display_order = 0): A =>
  ({ id, activity_date, activity_time, display_order })

describe('sortActivitiesByDate', () => {
  it('orders by date, then time', () => {
    const out = sortActivitiesByDate([
      a('epcot', '2026-10-14'), a('mk-night', '2026-10-10', '19:00:00'), a('mk', '2026-10-10', '09:00:00'), a('outlet', '2026-10-11'),
    ])
    expect(out.map(x => x.id)).toEqual(['mk', 'mk-night', 'outlet', 'epcot'])
  })

  it('untimed activities come before timed ones on the same day', () => {
    const out = sortActivitiesByDate([a('dinner', '2026-10-10', '20:00:00'), a('beach', '2026-10-10')])
    expect(out.map(x => x.id)).toEqual(['beach', 'dinner'])
  })

  it('undated activities go last, ordered by display_order', () => {
    const out = sortActivitiesByDate([a('ross', null, null, 2), a('mk', '2026-10-10'), a('trivia', null, null, 1)])
    expect(out.map(x => x.id)).toEqual(['mk', 'trivia', 'ross'])
  })

  it('same date and time falls back to display_order', () => {
    const out = sortActivitiesByDate([a('b', '2026-10-10', null, 5), a('a', '2026-10-10', null, 1)])
    expect(out.map(x => x.id)).toEqual(['a', 'b'])
  })

  it('does not mutate the input', () => {
    const input = [a('x', '2026-10-12'), a('y', '2026-10-10')]
    sortActivitiesByDate(input)
    expect(input.map(x => x.id)).toEqual(['x', 'y'])
  })
})
