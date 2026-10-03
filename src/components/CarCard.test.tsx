import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { I18nProvider } from '@/lib/i18n/context'
import { CarCard } from './CarCard'
import type { CarWithCreator } from '@/types/database'

// @/lib/photos creates the Supabase client at import time, which needs env vars.
vi.mock('@/lib/photos', () => ({ publicUrl: (bucket: string, path: string) => `${bucket}/${path}` }))

const car = {
  id: 'c1', rental_company: 'Alamo', location: 'MCO Airport', pickup_date: '2026-10-09',
  dropoff_date: '2026-10-18', brand: 'Chevy Tahoe', color: 'Preto', seats: 7, photo_path: null,
  created_by: 'u1', created_at: '',
  profiles: { id: 'u1', name: 'Gus', avatar_color: '#E76F51', avatar_url: null },
} as unknown as CarWithCreator

describe('CarCard', () => {
  it('renders company/location label, title and the three legs', () => {
    render(<I18nProvider><CarCard car={car} onEdit={() => {}} onDelete={() => {}} /></I18nProvider>)
    expect(screen.getByText('Alamo · MCO Airport')).toBeInTheDocument()
    expect(screen.getByText('Chevy Tahoe — Preto')).toBeInTheDocument()
    expect(screen.getByText('09 out')).toBeInTheDocument()
    expect(screen.getByText('18 out')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('Adicionado por Gus')).toBeInTheDocument()
  })
})
