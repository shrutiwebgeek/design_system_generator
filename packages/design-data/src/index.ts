import componentListJson from '../data/component_list.json' with { type: 'json' }
import tokensJson from '../data/design-tokens.json' with { type: 'json' }
import mappingJson from '../data/shadcn-mapping.json' with { type: 'json' }

// ---- Token file ------------------------------------------------------------
// A token is any object with a `value`; anything else is a group.
// Alias values look like "{primitive.color.blue.600}".

export type CompositeValue = { [field: string]: string | number }
export type TokenValue = string | number | CompositeValue

export interface Token {
  value: TokenValue
  description?: string
}

export interface TokenGroup {
  [key: string]: Token | TokenGroup
}

export interface TokenFile {
  meta: { name: string; version: string; description?: string; defaultMode: string }
  primitive: TokenGroup
  /** Mode-free semantic tokens (e.g. typography). */
  semantic?: TokenGroup
  /** Mode-specific semantic tokens, one block per mode. */
  modes: Record<string, TokenGroup>
}

// ---- shadcn mapping ---------------------------------------------------------

export interface RewriteGroup {
  description?: string
  /** Utility prefixes this group rewrites (spacing/size). */
  prefixes?: string[]
  /** Single utility prefix (fontSize, leading, radius, shadow). */
  prefix?: string
  /** Tailwind step → token utility name. */
  steps: Record<string, string>
  /** Group whose steps are used when a step isn't listed here. */
  fallback?: string
}

export interface Mapping {
  meta: { name: string; version: string; target: string; description?: string; pathConvention: string }
  /** shadcn CSS variable → token path. */
  cssVars: Record<string, string>
  /** Tailwind v4 @theme variable → token path. */
  theme: Record<string, string>
  /** @utility name → semantic typography path. The "description" key is documentation. */
  textStyles: Record<string, string>
  /** Module specifier → replacement in generated components. The "description" key is documentation. */
  imports: Record<string, string>
  rewrite: {
    unmapped: string
    tieBreak: string
    neverSnapNonZeroToNone: boolean
    utilityPrefix: { namespace: string; prefix: string; why: string }
    spacing: RewriteGroup
    size: RewriteGroup
    fontSize: RewriteGroup
    leading: RewriteGroup
    radius: RewriteGroup
    shadow: RewriteGroup
  }
}

// ---- Component list ---------------------------------------------------------

export type Tier = 'atoms' | 'molecules' | 'organisms'

export interface ComponentEntry {
  label: string
  description: string
  /** shadcn registry name, or null for custom compositions. */
  source: string | null
}

export type ComponentList = Record<Tier, ComponentEntry[]>

// `satisfies` makes the type checker validate the JSON files against the schema.
export const defaultTokens: TokenFile = tokensJson satisfies TokenFile
export const mapping: Mapping = mappingJson satisfies Mapping
export const componentList: ComponentList = componentListJson satisfies ComponentList
