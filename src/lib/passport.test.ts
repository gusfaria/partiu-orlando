import { describe, it, expect } from 'vitest'
import { mrzLine } from './passport'

describe('mrzLine', () => {
  it('uppercases and pads to 44 chars', () => {
    const line = mrzLine('Gustavo')
    expect(line.startsWith('P<BRAGUSTAVO<<ORLANDO<2026<')).toBe(true)
    expect(line).toHaveLength(44)
  })
  it('strips accents and turns spaces into <', () => {
    expect(mrzLine('José  Maria').startsWith('P<BRAJOSE<MARIA<<ORLANDO<2026')).toBe(true)
  })
  it('empty or emoji-only name still produces a valid line', () => {
    expect(mrzLine('').startsWith('P<BRA<<ORLANDO<2026')).toBe(true)
    expect(mrzLine('🎉')).toHaveLength(44)
  })
  it('very long names are truncated to 44', () => {
    expect(mrzLine('Pedro de Alcântara Francisco Antônio João Carlos')).toHaveLength(44)
  })
})
