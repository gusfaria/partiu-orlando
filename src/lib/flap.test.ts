import { describe, it, expect } from 'vitest'
import { nextLetter, advanceTowards, FLAP_STAGGER_MS } from './flap'

describe('nextLetter', () => {
  it('advances A→B and wraps Z→A', () => {
    expect(nextLetter('A')).toBe('B')
    expect(nextLetter('Z')).toBe('A')
  })
  it('non-letters restart at A', () => expect(nextLetter('3')).toBe('A'))
})

describe('advanceTowards', () => {
  it('only the first letter moves before the stagger delay', () => {
    expect(advanceTowards('GIG', 'JFK', 0)).toBe('HIG')
  })
  it('all letters move once their stagger has passed', () => {
    expect(advanceTowards('GIG', 'JFK', 2 * FLAP_STAGGER_MS)).toBe('HJH')
  })
  it('letters already at target stay put', () => {
    expect(advanceTowards('JFG', 'JFK', 1000)).toBe('JFH')
  })
  it('non-letter target characters are set immediately', () => {
    expect(advanceTowards('ABC', 'A-C', 1000)).toBe('A-C')
  })
  it('length mismatch jumps straight to target', () => {
    expect(advanceTowards('GIG', 'MCOX', 0)).toBe('MCOX')
  })
  it('converges to the target', () => {
    let cur = 'GIG'
    for (let i = 0; i < 40; i++) cur = advanceTowards(cur, 'LAX', 1000)
    expect(cur).toBe('LAX')
  })
})
