import { defaultTokens, type TokenFile } from '@dsg/design-data'
import { describe, expect, it } from 'vitest'
import { parsePx, resolvePath } from './tokens.ts'

describe('resolvePath', () => {
  it('resolves mode-relative paths inside the requested mode', () => {
    expect(resolvePath(defaultTokens, 'color.surface.default', 'light')).toBe('#F8FAFC')
    expect(resolvePath(defaultTokens, 'color.surface.default', 'dark')).toBe('#0F172A')
  })

  it('resolves mode-free primitive paths regardless of mode', () => {
    expect(resolvePath(defaultTokens, 'primitive.spacing.md', 'dark')).toBe('16px')
  })

  it('resolves aliases inside composite values', () => {
    expect(resolvePath(defaultTokens, 'semantic.typography.heading.lg', 'light')).toEqual({
      fontFamily: expect.stringContaining('-apple-system'),
      fontSize: '2.074rem',
      fontWeight: 600,
      lineHeight: 1.2,
    })
  })

  it('throws on a missing token, naming the path and mode', () => {
    expect(() => resolvePath(defaultTokens, 'color.surface.nope', 'light')).toThrow(/color\.surface\.nope.*light/)
  })

  it('throws on alias cycles instead of recursing forever', () => {
    const cyclic: TokenFile = {
      meta: { name: 't', version: '0', defaultMode: 'light' },
      primitive: { a: { value: '{primitive.b}' }, b: { value: '{primitive.a}' } },
      modes: { light: {} },
    }
    expect(() => resolvePath(cyclic, 'primitive.a', 'light')).toThrow(/cycle/)
  })
})

describe('parsePx', () => {
  it('parses px lengths and rejects everything else', () => {
    expect(parsePx('16px')).toBe(16)
    expect(parsePx('0px')).toBe(0)
    expect(() => parsePx('1rem')).toThrow(/px length/)
  })
})
