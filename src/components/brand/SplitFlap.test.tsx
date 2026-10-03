import { render, act } from '@testing-library/react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { SplitFlap } from './SplitFlap'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] })
})
afterEach(() => {
  vi.useRealTimers()
  // jsdom has no matchMedia; remove any mock a test installed
  delete (window as { matchMedia?: unknown }).matchMedia
})

describe('SplitFlap', () => {
  it('starts on the first code', () => {
    const { container } = render(<SplitFlap codes={['GIG', 'JFK', 'LAX']} />)
    expect(container.textContent).toBe('GIG')
  })

  it('flips to the next code after the interval', () => {
    const { container } = render(<SplitFlap codes={['GIG', 'JFK', 'LAX']} />)
    act(() => { vi.advanceTimersByTime(3200 + 2000) })
    expect(container.textContent).toBe('JFK')
  })

  it('with reduced motion it never animates', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia
    const { container } = render(<SplitFlap codes={['GIG', 'JFK', 'LAX']} />)
    act(() => { vi.advanceTimersByTime(20000) })
    expect(container.textContent).toBe('GIG')
  })

  it('a single code is static', () => {
    const { container } = render(<SplitFlap codes={['MCO']} tone="gold" />)
    act(() => { vi.advanceTimersByTime(20000) })
    expect(container.textContent).toBe('MCO')
  })

  it('is hidden from assistive tech and stops its timers on unmount', () => {
    const { container, unmount } = render(<SplitFlap codes={['GIG', 'JFK']} />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
    act(() => { vi.advanceTimersByTime(3300) })
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
