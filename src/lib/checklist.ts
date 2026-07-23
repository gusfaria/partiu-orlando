import type { Profile } from '@/types/database'

export type ChecklistItem = { key: 'photo' | 'arrival'; href: string }

export function checklistItems(profile: Profile, hasArrival: boolean): ChecklistItem[] {
  const items: ChecklistItem[] = []
  if (!profile.avatar_url) items.push({ key: 'photo', href: '/profile' })
  if (!hasArrival) items.push({ key: 'arrival', href: '/arrivals' })
  return items
}
