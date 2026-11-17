import type { Mapping, TokenFile } from '@dsg/design-data'
import { resolvePath, type Resolved } from './tokens.ts'

const SHADOW_FIELDS = ['offsetX', 'offsetY', 'blur', 'spread', 'color'] as const
const TYPE_FIELDS: Record<string, string> = {
  fontFamily: 'font-family',
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  lineHeight: 'line-height',
}

function toCss(value: Resolved, path: string): string {
  if (typeof value !== 'object') return String(value)
  if (SHADOW_FIELDS.every((f) => f in value)) return SHADOW_FIELDS.map((f) => String(value[f])).join(' ')
  throw new Error(`"${path}" is a composite that has no single CSS value`)
}

function block(selector: string, lines: string[]): string {
  return `${selector} {\n${lines.map((l) => `  ${l}`).join('\n')}\n}`
}

/**
 * Generates the CSS a project imports after `@import "tailwindcss"`:
 * shadcn's variables per mode, the bridge to Tailwind color utilities,
 * the Tailwind @theme scale, and one @utility per semantic text style.
 */
export function generateThemeCss(tokens: TokenFile, mapping: Mapping): string {
  const defaultMode = tokens.meta.defaultMode
  const modes = [defaultMode, ...Object.keys(tokens.modes).filter((m) => m !== defaultMode)]
  const out: string[] = [
    `/* Generated from ${tokens.meta.name} v${tokens.meta.version} with ${mapping.meta.name} v${mapping.meta.version}. Do not edit by hand. */`,
  ]

  for (const mode of modes.slice(1)) out.push(`@custom-variant ${mode} (&:is(.${mode} *));`)

  for (const mode of modes) {
    const selector = mode === defaultMode ? ':root' : `.${mode}`
    const lines = Object.entries(mapping.cssVars).map(([name, path]) => `${name}: ${toCss(resolvePath(tokens, path, mode), path)};`)
    out.push(block(selector, lines))
  }

  // shadcn's bridge: bg-primary, text-muted-foreground, ... read these.
  const colorVars = Object.keys(mapping.cssVars).filter((name) => name !== '--radius')
  out.push(block('@theme inline', colorVars.map((name) => `--color-${name.slice(2)}: var(${name});`)))

  out.push(
    block(
      '@theme',
      Object.entries(mapping.theme).map(([name, path]) => `${name}: ${toCss(resolvePath(tokens, path, defaultMode), path)};`),
    ),
  )

  for (const [utility, path] of Object.entries(mapping.textStyles)) {
    if (utility === 'description') continue
    const style = resolvePath(tokens, path, defaultMode)
    if (typeof style !== 'object') throw new Error(`Text style "${path}" must be a composite token`)
    const lines = Object.entries(style).map(([field, v]) => {
      const prop = TYPE_FIELDS[field]
      if (!prop) throw new Error(`Unknown typography field "${field}" in "${path}"`)
      return `${prop}: ${v};`
    })
    out.push(block(`@utility ${utility}`, lines))
  }

  return out.join('\n\n') + '\n'
}
