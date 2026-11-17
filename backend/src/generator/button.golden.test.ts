// Golden test: the real base-vega Button template through the whole generator.
import { readFileSync } from 'node:fs'
import { defaultTokens, mapping } from '@dsg/design-data'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { createRewriter, splitVariants } from './rewrite.ts'
import { compileTailwind, ruleFor } from './test-utils.ts'
import { generateThemeCss } from './theme.ts'

const template = readFileSync(new URL('../../templates/button/button.tsx', import.meta.url), 'utf8')
const { code, warnings } = createRewriter(defaultTokens, mapping).rewriteSource(template, 'button.tsx')

describe('Button template → generator', () => {
  it('still parses as TSX and keeps its exports', () => {
    const sf = ts.createSourceFile('button.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    expect(sf.statements.some((s) => ts.isExportDeclaration(s))).toBe(true)
  })

  it('imports the token-aware cn', () => {
    expect(code).toContain('from "@/lib/utils"')
    expect(code).not.toContain('from "cn"')
  })

  it('leaves no stock spacing or size steps behind', () => {
    expect(code).not.toMatch(/\b(?:h|px|gap|size|pr|pl)-\d/)
  })

  it('only warns about the two arbitrary radius caps', () => {
    expect(warnings).toEqual([
      { original: 'rounded-[min(var(--radius-md),8px)]', replacement: null, reason: 'arbitrary' },
      { original: 'rounded-[min(var(--radius-md),10px)]', replacement: null, reason: 'arbitrary' },
    ])
  })

  it('every ds- utility it uses compiles to a Tailwind rule', async () => {
    const compiler = await compileTailwind(generateThemeCss(defaultTokens, mapping))
    const utilities = new Set(
      code
        // Not on single quotes: [&_svg:not([class*='size-'])]:size-4 contains them.
        .split(/[\s"`]+/)
        .map((token) => splitVariants(token).utility)
        .filter((utility) => utility.includes('-ds-')),
    )
    expect(utilities.size).toBeGreaterThan(5)
    for (const utility of utilities) {
      expect(ruleFor(compiler.build([utility]), utility), utility).toBeDefined()
    }
  })
})
