export const FLAP_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const FLAP_TICK_MS = 45
export const FLAP_STAGGER_MS = 120

export function nextLetter(c: string): string {
  const i = FLAP_ALPHABET.indexOf(c)
  return i === -1 ? FLAP_ALPHABET[0] : FLAP_ALPHABET[(i + 1) % FLAP_ALPHABET.length]
}

// One tick of a split-flap board: each letter i starts flipping after
// i * FLAP_STAGGER_MS and steps one letter per tick until it matches.
export function advanceTowards(current: string, target: string, elapsedMs: number): string {
  if (current.length !== target.length) return target
  return [...current].map((c, i) => {
    const t = target[i]
    if (c === t) return c
    if (!FLAP_ALPHABET.includes(t)) return t
    return elapsedMs >= i * FLAP_STAGGER_MS ? nextLetter(c) : c
  }).join('')
}
