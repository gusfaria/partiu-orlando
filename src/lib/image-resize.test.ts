import { describe, it, expect } from 'vitest'
import { scaledDimensions } from './image-resize'

describe('scaledDimensions', () => {
  it('keeps small images unchanged', () => {
    expect(scaledDimensions(300, 200, 400)).toEqual({ width: 300, height: 200 })
  })
  it('scales down landscape by width', () => {
    expect(scaledDimensions(3200, 1600, 1600)).toEqual({ width: 1600, height: 800 })
  })
  it('scales down portrait by height', () => {
    expect(scaledDimensions(1000, 4000, 400)).toEqual({ width: 100, height: 400 })
  })
  it('rounds to integers', () => {
    expect(scaledDimensions(1001, 333, 400)).toEqual({ width: 400, height: 133 })
  })
})
