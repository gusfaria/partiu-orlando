import { describe, it, expect } from 'vitest'
import { parseHouseSegments } from './house-segments'

describe('parseHouseSegments', () => {
  it('splits markdown around [mapa] and [fotos] markers in order', () => {
    const segs = parseHouseSegments('# Endereço\nrua x\n[mapa]\n## Datas\ndatas\n[fotos]\n## Resort\nblurb')
    expect(segs.map(s => s.type)).toEqual(['md', 'map', 'md', 'photos', 'md'])
    expect(segs[0]).toEqual({ type: 'md', text: '# Endereço\nrua x' })
    expect(segs[2]).toEqual({ type: 'md', text: '## Datas\ndatas' })
    expect(segs[4]).toEqual({ type: 'md', text: '## Resort\nblurb' })
  })

  it('appends a photos segment when no [fotos] marker is present', () => {
    expect(parseHouseSegments('just text').map(s => s.type)).toEqual(['md', 'photos'])
  })

  it('recognizes english [map]/[photos] and is case-insensitive', () => {
    expect(parseHouseSegments('a\n[MAP]\nb\n[Photos]\nc').map(s => s.type)).toEqual(['md', 'map', 'md', 'photos', 'md'])
  })

  it('drops empty markdown chunks between adjacent markers', () => {
    expect(parseHouseSegments('[mapa]\n[fotos]').map(s => s.type)).toEqual(['map', 'photos'])
  })

  it('handles empty content (just the fallback photos segment)', () => {
    expect(parseHouseSegments('').map(s => s.type)).toEqual(['photos'])
  })
})
