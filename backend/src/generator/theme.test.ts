import { defaultTokens, mapping } from '@dsg/design-data'
import { describe, expect, it } from 'vitest'
import { compileTailwind, ruleFor } from './test-utils.ts'
import { generateThemeCss } from './theme.ts'

const css = generateThemeCss(defaultTokens, mapping)

describe('generateThemeCss', () => {
  it('writes shadcn variables for the default mode on :root and other modes on a class', () => {
    expect(css).toMatch(/:root \{[^}]*--background: #F8FAFC;/)
    expect(css).toMatch(/\.dark \{[^}]*--background: #0F172A;/)
    expect(css).toContain('@custom-variant dark (&:is(.dark *));')
  })

  it('bridges shadcn variables to Tailwind colors, except --radius', () => {
    expect(css).toContain('--color-primary: var(--primary);')
    expect(css).not.toContain('--color-radius')
  })

  it('writes the token scale into @theme, composing shadows', () => {
    expect(css).toContain('--spacing-ds-control-md: 36px;')
    expect(css).toContain('--shadow-sm: 0px 1px 2px 0px #0F172A14;')
    expect(css).toContain('--font-weight-normal: 400;')
  })

  it('writes one @utility per semantic text style', () => {
    expect(css).toMatch(/@utility text-heading-lg \{[^}]*font-size: 2\.074rem;[^}]*font-weight: 600;/)
    expect(css).not.toContain('@utility description')
  })
})

describe('theme CSS compiled by Tailwind', async () => {
  const compiler = await compileTailwind(css)
  const output = compiler.build(['h-ds-control-md', 'px-ds-sm', 'bg-primary', 'rounded-md', 'text-heading-lg'])

  it('turns token utilities into rules that read token variables', () => {
    expect(ruleFor(output, 'h-ds-control-md')).toContain('height: var(--spacing-ds-control-md)')
    expect(ruleFor(output, 'px-ds-sm')).toContain('padding-inline: var(--spacing-ds-sm)')
    // @theme inline: the utility reads shadcn's variable directly, so switching mode switches the color.
    expect(ruleFor(output, 'bg-primary')).toContain('background-color: var(--primary)')
    expect(ruleFor(output, 'rounded-md')).toContain('var(--radius-md)')
    expect(ruleFor(output, 'text-heading-lg')).toContain('font-size: 2.074rem')
  })

  it('emits the token values themselves', () => {
    expect(output).toContain('--spacing-ds-control-md: 36px')
    expect(output).toContain('--radius-md: 8px')
  })

  it('keeps Tailwind container sizes intact (the ds- prefix fix)', () => {
    expect(ruleFor(compiler.build(['max-w-md']), 'max-w-md')).toContain('var(--container-md)')
  })
})
