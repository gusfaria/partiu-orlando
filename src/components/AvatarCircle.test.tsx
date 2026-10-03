import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AvatarCircle } from './AvatarCircle'

describe('AvatarCircle', () => {
  it('portrait size is a rounded rectangle, not a circle', () => {
    render(<AvatarCircle name="Gus" color="#E76F51" size="portrait" />)
    const el = screen.getByTitle('Gus')
    expect(el.className).toContain('rounded-xl')
    expect(el.className).not.toContain('rounded-full')
  })

  it('default size stays a circle', () => {
    render(<AvatarCircle name="Bia" color="#52A098" />)
    expect(screen.getByTitle('Bia').className).toContain('rounded-full')
  })
})
