import { describe, it, expect } from 'vitest'
import { checklistItems } from './checklist'
import type { Profile, Arrival } from '@/types/database'

const profile = (avatar_url: string | null): Profile =>
  ({ id: 'u1', name: 'Ana', is_admin: false, avatar_color: '#fff', avatar_url, created_at: '' })
const arrival = (arrival_date: string | null): Arrival =>
  ({ id: 'a1', user_id: 'u1', arrival_date, departure_date: null, notes: null, updated_at: '' })

describe('checklistItems', () => {
  it('lists both when nothing done', () => {
    expect(checklistItems(profile(null), null).map(i => i.key)).toEqual(['photo', 'arrival'])
  })
  it('omits photo when avatar set', () => {
    expect(checklistItems(profile('http://x/a.jpg'), null).map(i => i.key)).toEqual(['arrival'])
  })
  it('omits arrival when date set', () => {
    expect(checklistItems(profile(null), arrival('2026-10-09')).map(i => i.key)).toEqual(['photo'])
  })
  it('empty when all done', () => {
    expect(checklistItems(profile('http://x/a.jpg'), arrival('2026-10-09'))).toEqual([])
  })
  it('arrival row without date still counts as missing', () => {
    expect(checklistItems(profile('http://x/a.jpg'), arrival(null)).map(i => i.key)).toEqual(['arrival'])
  })
})
