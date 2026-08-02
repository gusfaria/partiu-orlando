import { describe, it, expect } from 'vitest'
import { splitOnFirstHr } from './markdown-split'

describe('splitOnFirstHr', () => {
  it('splits on the first --- line', () => {
    expect(splitOnFirstHr('# A\ntop\n---\nbottom')).toEqual({ before: '# A\ntop', after: 'bottom' })
  })
  it('returns the whole string as before when no --- exists', () => {
    expect(splitOnFirstHr('# A\njust content')).toEqual({ before: '# A\njust content', after: '' })
  })
  it('splits on the FIRST --- only (keeps later --- in after)', () => {
    expect(splitOnFirstHr('a\n---\nb\n---\nc')).toEqual({ before: 'a', after: 'b\n---\nc' })
  })
  it('trims surrounding whitespace on both parts', () => {
    expect(splitOnFirstHr('  top  \n---\n  bottom  ')).toEqual({ before: 'top', after: 'bottom' })
  })
  it('handles empty input', () => {
    expect(splitOnFirstHr('')).toEqual({ before: '', after: '' })
  })
})
