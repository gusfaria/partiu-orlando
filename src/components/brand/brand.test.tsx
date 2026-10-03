import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TicketCard } from './TicketCard'
import { ScallopedBadge } from './ScallopedBadge'
import { BrandButton } from './BrandButton'
import { SunburstBg } from './SunburstBg'
import { fireEvent } from '@testing-library/react'
import { PageHeader } from './PageHeader'
import { FilterChip } from './FilterChip'
import { TicketBand } from './TicketBand'
import { TicketLegs } from './TicketLegs'

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

describe('visual polish kit', () => {
  it('PageHeader renders title as h1 and the optional eyebrow', () => {
    render(<PageHeader eyebrow="Parques & passeios" title="Atividades" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Atividades' })).toBeInTheDocument()
    expect(screen.getByText('Parques & passeios')).toBeInTheDocument()
  })

  it('PageHeader without eyebrow renders only the title', () => {
    const { container } = render(<PageHeader title="Admin" />)
    expect(container.querySelectorAll('p')).toHaveLength(0)
  })

  it('FilterChip exposes pressed state and fires onClick', () => {
    const onClick = vi.fn()
    render(<FilterChip label="Chegadas" active dotClass="bg-teal" onClick={onClick} />)
    const btn = screen.getByRole('button', { name: 'Chegadas' })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    expect(btn.className).toContain('bg-navy')
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('FilterChip idle has no navy fill', () => {
    render(<FilterChip label="Tudo" active={false} onClick={() => {}} />)
    const btn = screen.getByRole('button', { name: 'Tudo' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    expect(btn.className).not.toContain('bg-navy ')
  })

  it('BrandButton primary is navy with gold text', () => {
    render(<BrandButton>Vou!</BrandButton>)
    expect(screen.getByRole('button', { name: 'Vou!' }).className).toContain('bg-navy text-gold')
  })

  it('BrandButton quiet and danger-quiet render as text links', () => {
    render(<><BrandButton variant="quiet">Editar</BrandButton><BrandButton variant="danger-quiet">Excluir</BrandButton></>)
    expect(screen.getByRole('button', { name: 'Editar' }).className).toContain('font-ticket')
    expect(screen.getByRole('button', { name: 'Excluir' }).className).toContain('text-[#B4361A]')
  })
})

describe('ticket parts', () => {
  it('TicketBand shows date parts and meta', () => {
    render(<TicketBand date="2026-10-10" locale="pt-BR" meta="09:00 · $ 159.00" />)
    expect(screen.getByText('SÁB')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('OUT')).toBeInTheDocument()
    expect(screen.getByText('09:00 · $ 159.00')).toBeInTheDocument()
  })

  it('TicketBand without a date shows a dash and no meta element when meta is empty', () => {
    const { container } = render(<TicketBand date={null} locale="pt-BR" meta="" />)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(container.textContent).not.toContain('·')
  })

  it('TicketLegs renders one column per leg and a dash for empty values', () => {
    const { container } = render(<TicketLegs legs={[
      { label: '↓ Chegada', value: '09 out', sub: '14:30' },
      { label: '↑ Saída', value: null, sub: '22:10' },
    ]} />)
    expect((container.firstChild as HTMLElement).className).toContain('grid-cols-2')
    expect(screen.getByText('09 out')).toBeInTheDocument()
    expect(screen.getByText('14:30')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByText('22:10')).not.toBeInTheDocument()
  })

  it('TicketLegs supports three legs', () => {
    const { container } = render(<TicketLegs legs={[
      { label: 'Retirada', value: '09 out' }, { label: 'Devolução', value: '18 out' }, { label: 'Assentos', value: '7' },
    ]} />)
    expect((container.firstChild as HTMLElement).className).toContain('grid-cols-3')
  })
})
