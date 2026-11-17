import { defaultTokens, mapping, type Mapping } from '@dsg/design-data'
import { describe, expect, it } from 'vitest'
import { createRewriter, splitVariants } from './rewrite.ts'

const { rewriteClass, rewriteSource } = createRewriter(defaultTokens, mapping)
const rw = (token: string) => rewriteClass(token).value

describe('splitVariants', () => {
  it('ignores colons inside brackets', () => {
    expect(splitVariants("[&_svg:not([class*='size-'])]:size-4")).toEqual({
      variants: "[&_svg:not([class*='size-'])]:",
      utility: 'size-4',
    })
  })

  it('splits stacked variants at the last top-level colon', () => {
    expect(splitVariants('dark:hover:has-data-[icon=inline-end]:pr-2')).toEqual({
      variants: 'dark:hover:has-data-[icon=inline-end]:',
      utility: 'pr-2',
    })
  })
})

describe('rewriteClass: spacing and size', () => {
  it('maps listed spacing steps to ds- tokens', () => {
    expect(rw('px-4')).toBe('px-ds-md')
    expect(rw('gap-1.5')).toBe('gap-ds-xs') // 6px tie rounds down
    expect(rw('px-2.5')).toBe('px-ds-sm')
    expect(rw('p-0')).toBe('p-ds-none')
  })

  it('maps control heights and icons to size tokens', () => {
    expect(rw('h-9')).toBe('h-ds-control-md')
    expect(rw('size-8')).toBe('size-ds-control-sm')
    expect(rw('h-5')).toBe('h-ds-control-xs')
    expect(rw('size-4')).toBe('size-ds-icon-md')
    expect(rw('size-3.5')).toBe('size-ds-icon-sm')
  })

  it('falls back to spacing steps for unlisted size steps, without a warning', () => {
    expect(rewriteClass('h-6')).toEqual({ value: 'h-ds-lg' })
  })

  it('keeps variants, negatives and important markers', () => {
    expect(rw("[&_svg:not([class*='size-'])]:size-3")).toBe("[&_svg:not([class*='size-'])]:size-ds-icon-sm")
    expect(rw('has-data-[icon=inline-end]:pr-2')).toBe('has-data-[icon=inline-end]:pr-ds-sm')
    expect(rw('-mt-2')).toBe('-mt-ds-sm')
    expect(rw('px-4!')).toBe('px-ds-md!')
    expect(rw('!px-4')).toBe('!px-ds-md')
  })

  it('snaps unlisted steps to the nearest token and warns', () => {
    expect(rewriteClass('pr-18')).toEqual({
      value: 'pr-ds-2xl',
      warning: { original: 'pr-18', replacement: 'pr-ds-2xl', reason: 'snapped' },
    })
  })

  it('never snaps a non-zero value to none', () => {
    expect(rw('p-px')).toBe('p-ds-xs')
  })

  it('breaks ties according to mapping.rewrite.tieBreak', () => {
    // Remove the listed steps so 12px (between 8 and 16) has to be snapped.
    const unlisted = (tieBreak: string): Mapping => ({
      ...mapping,
      rewrite: { ...mapping.rewrite, tieBreak, spacing: { ...mapping.rewrite.spacing, steps: {} } },
    })
    expect(createRewriter(defaultTokens, unlisted('down')).rewriteClass('p-3').value).toBe('p-ds-sm')
    expect(createRewriter(defaultTokens, unlisted('up')).rewriteClass('p-3').value).toBe('p-ds-md')
  })
})

describe('rewriteClass: named groups', () => {
  it('rewrites steps that have a rule', () => {
    expect(rw('text-base')).toBe('text-md')
    expect(rw('rounded')).toBe('rounded-sm')
    expect(rw('rounded-4xl')).toBe('rounded-full')
    expect(rw('rounded-t-xl')).toBe('rounded-t-lg')
    expect(rw('shadow-xs')).toBe('shadow-sm')
    expect(rw('leading-none')).toBe('leading-tight')
  })

  it('leaves token-named steps and color utilities alone, silently', () => {
    for (const cls of ['text-sm', 'rounded-md', 'rounded-full', 'text-primary', 'text-primary-foreground', 'shadow-primary/20']) {
      expect(rewriteClass(cls)).toEqual({ value: cls })
    }
  })

  it('warns on named steps it cannot place', () => {
    expect(rewriteClass('text-7xl').warning?.reason).toBe('unmapped')
  })

  it('warns on arbitrary values instead of guessing', () => {
    const cls = 'rounded-[min(var(--radius-md),8px)]'
    expect(rewriteClass(cls)).toEqual({ value: cls, warning: { original: cls, replacement: null, reason: 'arbitrary' } })
  })
})

describe('rewriteClass: everything else', () => {
  it('ignores utilities outside the rewrite groups', () => {
    for (const cls of ['pointer-events-none', 'w-full', 'top-1/2', 'ring-3', 'translate-y-px', 'mx-auto', 'hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]']) {
      expect(rewriteClass(cls)).toEqual({ value: cls })
    }
  })
})

describe('rewriteSource', () => {
  it('rewrites class strings but not imports, object keys or data attributes', () => {
    const source = `import { x } from "px-4"
import { cn } from "cn"
const v = { "px-4": "px-4 h-9" }
export const A = () => <div data-slot="px-4" className="px-4">{cn("gap-2")}</div>
`
    const { code } = rewriteSource(source)
    expect(code).toBe(`import { x } from "px-4"
import { cn } from "@/lib/utils"
const v = { "px-4": "px-ds-md h-ds-control-md" }
export const A = () => <div data-slot="px-4" className="px-ds-md">{cn("gap-ds-sm")}</div>
`)
  })

})
