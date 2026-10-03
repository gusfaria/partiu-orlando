'use client'
import { useEffect, useState } from 'react'
import { advanceTowards, FLAP_TICK_MS } from '@/lib/flap'

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const TILE = {
  dark: 'bg-navy text-cream',
  gold: 'bg-gold text-navy',
} as const

type Props = { codes: string[]; intervalMs?: number; tone?: keyof typeof TILE }

// Airport departures-board letters. Decorative: callers supply sr-only text.
export function SplitFlap({ codes, intervalMs = 3200, tone = 'dark' }: Props) {
  const [letters, setLetters] = useState(codes[0] ?? '')

  useEffect(() => {
    if (codes.length < 2 || prefersReducedMotion()) return
    let idx = 0
    let flip: ReturnType<typeof setInterval> | undefined
    const cycle = setInterval(() => {
      idx = (idx + 1) % codes.length
      const target = codes[idx]
      const start = Date.now()
      let current = codes[(idx - 1 + codes.length) % codes.length]
      clearInterval(flip)
      flip = setInterval(() => {
        current = advanceTowards(current, target, Date.now() - start)
        setLetters(current)
        if (current === target) clearInterval(flip)
      }, FLAP_TICK_MS)
    }, intervalMs)
    return () => { clearInterval(cycle); clearInterval(flip) }
  }, [codes, intervalMs])

  return (
    <span aria-hidden="true" className="inline-flex gap-0.5">
      {[...letters].map((c, i) => (
        <span key={i}
          className={`relative grid place-items-center w-5 h-[30px] rounded font-ticket text-[19px] font-bold ${TILE[tone]}`}>
          {c}
          <span className="absolute inset-x-0 top-1/2 h-px bg-black/40" />
        </span>
      ))}
    </span>
  )
}
