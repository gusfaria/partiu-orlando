import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TicketCard } from './TicketCard'
import { ScallopedBadge } from './ScallopedBadge'
import { BrandButton } from './BrandButton'
import { SunburstBg } from './SunburstBg'

describe('brand components', () => {
  it('TicketCard renders its label and children', () => {
    render(<TicketCard label="BOARDING PASS">hello</TicketCard>)
    expect(screen.getByText('BOARDING PASS')).toBeInTheDocument()
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('ScallopedBadge renders children', () => {
    render(<ScallopedBadge>PARTIU</ScallopedBadge>)
    expect(screen.getByText('PARTIU')).toBeInTheDocument()
  })

  it('BrandButton forwards clicks and type', () => {
    const onClick = vi.fn()
    render(<BrandButton type="submit" onClick={onClick}>Go</BrandButton>)
    const btn = screen.getByRole('button', { name: 'Go' })
    expect(btn).toHaveAttribute('type', 'submit')
    btn.click()
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('SunburstBg is decorative (aria-hidden)', () => {
    const { container } = render(<SunburstBg />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
