import { describe, it, expect } from 'vitest'
import { checklistItems } from './checklist'
import type { Profile } from '@/types/database'

const profile = (avatar_url: string | null): Profile =>
  ({ id: 'u1', name: 'Ana', is_admin: false, avatar_color: '#fff', avatar_url, created_at: '' })

describe('checklistItems', () => {
  it('lists both when nothing done', () => {
    expect(checklistItems(profile(null), false).map(i => i.key)).toEqual(['photo', 'arrival'])
  })
  it('omits photo when avatar set', () => {
    expect(checklistItems(profile('http://x/a.jpg'), false).map(i => i.key)).toEqual(['arrival'])
  })
  it('omits arrival when the user has logged an arrival', () => {
    expect(checklistItems(profile(null), true).map(i => i.key)).toEqual(['photo'])
  })
  it('empty when all done', () => {
    expect(checklistItems(profile('http://x/a.jpg'), true)).toEqual([])
  })
})
