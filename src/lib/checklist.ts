import type { Profile, Arrival } from '@/types/database'

export type ChecklistItem = { key: 'photo' | 'arrival'; href: string }

export function checklistItems(profile: Profile, arrival: Arrival | null): ChecklistItem[] {
  const items: ChecklistItem[] = []
  if (!profile.avatar_url) items.push({ key: 'photo', href: '/profile' })
  if (!arrival?.arrival_date) items.push({ key: 'arrival', href: '/arrivals' })
  return items
}
