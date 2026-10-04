import { describe, it, expect } from 'vitest'
import pt from './pt.json'
import en from './en.json'

function keys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`])
}

describe('i18n', () => {
  it('pt and en have exactly the same keys', () => {
    expect(keys(en).sort()).toEqual(keys(pt).sort())
  })

  it('has the visual-polish keys', () => {
    for (const k of ['home.boarding_pass', 'itinerary.eyebrow', 'house.eyebrow', 'profile.traveler', 'admin.eyebrow', 'admin.description_hint']) {
      expect(keys(pt)).toContain(k)
    }
  })
})
