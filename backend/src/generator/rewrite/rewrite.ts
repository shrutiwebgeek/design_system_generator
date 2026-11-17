import ts from 'typescript'
import type { Mapping, RewriteGroup, RewriteWarning, TokenFile } from '@dsg/design-data'
import { parsePx, resolvePath } from '../tokens.ts'

export type { RewriteWarning, WarningReason } from '@dsg/design-data'

export interface RewriteResult {
  code: string
  warnings: RewriteWarning[]
}

type GroupName = 'spacing' | 'size' | 'fontSize' | 'leading' | 'radius' | 'shadow'

const NUMERIC_GROUPS: ReadonlySet<GroupName> = new Set(['spacing', 'size'])
const THEME_NAMESPACE: Record<Exclude<GroupName, 'spacing' | 'size'>, string> = {
  fontSize: '--text-',
  leading: '--leading-',
  radius: '--radius-',
  shadow: '--shadow-',
}
/** rounded-t-xl, rounded-tl-md, rounded-s-lg ... */
const RADIUS_SIDES = new Set(['t', 'r', 'b', 'l', 'tl', 'tr', 'br', 'bl', 's', 'e', 'ss', 'se', 'es', 'ee'])
const NUMERIC_STEP = /^\d+(?:\.\d+)?$/

/** Split "hover:[&_svg:not([class*='x'])]:px-2" into variants + utility, ignoring colons inside brackets. */
export function splitVariants(token: string): { variants: string; utility: string } {
  let depth = 0
  let last = -1
  for (let i = 0; i < token.length; i++) {
    const ch = token[i]
    if (ch === '[' || ch === '(') depth++
    else if (ch === ']' || ch === ')') depth--
    else if (ch === ':' && depth === 0) last = i
  }
  return { variants: token.slice(0, last + 1), utility: token.slice(last + 1) }
}

interface SpacingStop {
  utility: string // e.g. "ds-md"
  px: number
}

export function createRewriter(tokens: TokenFile, mapping: Mapping) {
  const mode = tokens.meta.defaultMode
  const rules = mapping.rewrite
  const groups: Record<GroupName, RewriteGroup> = {
    spacing: rules.spacing,
    size: rules.size,
    fontSize: rules.fontSize,
    leading: rules.leading,
    radius: rules.radius,
    shadow: rules.shadow,
  }

  // Longest prefix first, so "gap-x" wins over "gap" and "min-h" over "h".
  const prefixes: [string, GroupName][] = (Object.keys(groups) as GroupName[])
    .flatMap((name): [string, GroupName][] => {
      const g = groups[name]
      return (g.prefixes ?? (g.prefix ? [g.prefix] : [])).map((p): [string, GroupName] => [p, name])
    })
    .sort((a, b) => b[0].length - a[0].length)

  // The spacing scale to snap onto: theme vars that point at primitive.spacing.*
  const stops: SpacingStop[] = Object.entries(mapping.theme)
    .filter(([name, path]) => name.startsWith('--spacing-') && path.startsWith('primitive.spacing.'))
    .map(([name, path]) => ({ utility: name.slice('--spacing-'.length), px: parsePx(resolvePath(tokens, path, mode)) }))
    .sort((a, b) => a.px - b.px)

  function snap(px: number): string {
    const candidates = rules.neverSnapNonZeroToNone && px > 0 ? stops.filter((s) => s.px > 0) : stops
    let best = candidates[0]
    for (const stop of candidates) {
      const d = Math.abs(stop.px - px)
      const bestD = Math.abs(best.px - px)
      // Ties: "down" keeps the smaller stop (candidates are sorted ascending), "up" takes the larger.
      if (d < bestD || (d === bestD && rules.tieBreak === 'up')) best = stop
    }
    return best.utility
  }

  /** Rewrite one class token. Returns the new token and an optional warning. */
  function rewriteClass(token: string): { value: string; warning?: RewriteWarning } {
    const { variants, utility: rawUtility } = splitVariants(token)
    let utility = rawUtility
    // Tailwind v4 marks important with a trailing "!"; v3 used a leading one. Keep whichever was used.
    const importantPrefix = utility.startsWith('!') ? '!' : ''
    if (importantPrefix) utility = utility.slice(1)
    const importantSuffix = utility.endsWith('!') ? '!' : ''
    if (importantSuffix) utility = utility.slice(0, -1)
    const negative = utility.startsWith('-') ? '-' : ''
    if (negative) utility = utility.slice(1)

    for (const [prefix, group] of prefixes) {
      let base = prefix
      let step: string
      if (utility === prefix) {
        if (group !== 'radius' && group !== 'shadow') continue
        step = '' // bare `rounded` / `shadow`
      } else if (utility.startsWith(prefix + '-')) {
        step = utility.slice(prefix.length + 1)
      } else continue

      if (group === 'radius') {
        const [side, ...rest] = step.split('-')
        if (RADIUS_SIDES.has(side)) {
          base = `${prefix}-${side}`
          step = rest.join('-')
        }
      }

      const rebuild = (newStep: string) =>
        `${variants}${importantPrefix}${negative}${base}${newStep === '' ? '' : '-' + newStep}${importantSuffix}`

      if (step.startsWith('[') || step.startsWith('(')) {
        return { value: token, warning: { original: token, replacement: null, reason: 'arbitrary' } }
      }

      if (NUMERIC_GROUPS.has(group)) {
        if (!NUMERIC_STEP.test(step) && step !== 'px') return { value: token } // w-full, size-auto, top-1/2 ...
        const own = groups[group].steps[step]
        const fallbackGroup = groups[group].fallback as GroupName | undefined
        const mapped = own ?? (fallbackGroup ? groups[fallbackGroup].steps[step] : undefined)
        if (mapped) return { value: rebuild(mapped) }
        const snapped = snap(step === 'px' ? 1 : Number(step) * 4)
        const value = rebuild(snapped)
        return { value, warning: { original: token, replacement: value, reason: 'snapped' } }
      }

      // Named groups: text-*, leading-*, rounded-*, shadow-*
      const mapped = groups[group].steps[step]
      if (mapped !== undefined) return { value: rebuild(mapped) }
      const namespace = THEME_NAMESPACE[group as keyof typeof THEME_NAMESPACE]
      if (step !== '' && `${namespace}${step}` in mapping.theme) return { value: token } // already a token name
      if (group === 'fontSize' || group === 'shadow') {
        // text-primary / shadow-primary/20 are colors, not sizes: leave them alone.
        if (!/^(?:xs|sm|base|md|lg|\d?xl)$/.test(step)) return { value: token }
      }
      return { value: token, warning: { original: token, replacement: null, reason: 'unmapped' } }
    }
    return { value: token }
  }

  function rewriteClassList(text: string, warnings: Map<string, RewriteWarning>): string {
    return text.replace(/\S+/g, (token) => {
      const { value, warning } = rewriteClass(token)
      if (warning) warnings.set(warning.original, warning)
      return value
    })
  }

  /** Rewrite classes inside string literals of a .tsx source, and remap imports. */
  function rewriteSource(source: string, fileName = 'component.tsx'): RewriteResult {
    const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const edits: { start: number; end: number; text: string }[] = []
    const warnings = new Map<string, RewriteWarning>()

    const visit = (node: ts.Node): void => {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        const parent = node.parent
        const start = node.getStart(sf) + 1
        const end = node.getEnd() - 1
        const raw = source.slice(start, end)

        if ((ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) && parent.moduleSpecifier === node) {
          const target = mapping.imports[node.text]
          if (target) edits.push({ start, end, text: target })
          return
        }
        const isPropertyKey = ts.isPropertyAssignment(parent) && parent.name === node
        const isNonClassJsxAttr =
          ts.isJsxAttribute(parent) && !['className', 'class'].includes(parent.name.getText(sf))
        if (!isPropertyKey && !isNonClassJsxAttr) {
          const rewritten = rewriteClassList(raw, warnings)
          if (rewritten !== raw) edits.push({ start, end, text: rewritten })
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(sf)

    let code = source
    for (const edit of edits.sort((a, b) => b.start - a.start)) {
      code = code.slice(0, edit.start) + edit.text + code.slice(edit.end)
    }
    return { code, warnings: [...warnings.values()] }
  }

  return { rewriteClass, rewriteSource }
}
