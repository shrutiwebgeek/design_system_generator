// Types only: no JSON imports, so the frontend can import this without loading data.

// ---- Token file ------------------------------------------------------------
// A token is any object with a `value`; anything else is a group.
// Alias values look like "{primitive.color.blue.600}".

export type CompositeValue = { [field: string]: string | number };
export type TokenValue = string | number | CompositeValue;

export interface Token {
  value: TokenValue;
  description?: string;
}

export interface TokenGroup {
  [key: string]: Token | TokenGroup;
}

export interface TokenFile {
  meta: {
    name: string;
    version: string;
    description?: string;
    defaultMode: string;
  };
  primitive: TokenGroup;
  /** Mode-free semantic tokens (e.g. typography). */
  semantic?: TokenGroup;
  /** Mode-specific semantic tokens, one block per mode. */
  modes: Record<string, TokenGroup>;
}

// ---- shadcn mapping ---------------------------------------------------------

export interface RewriteGroup {
  description?: string;
  /** Utility prefixes this group rewrites (spacing/size). */
  prefixes?: string[];
  /** Single utility prefix (fontSize, leading, radius, shadow). */
  prefix?: string;
  /** Tailwind step → token utility name. */
  steps: Record<string, string>;
  /** Group whose steps are used when a step isn't listed here. */
  fallback?: string;
}

export interface Mapping {
  meta: {
    name: string;
    version: string;
    target: string;
    description?: string;
    pathConvention: string;
  };
  /** shadcn CSS variable → token path. */
  cssVars: Record<string, string>;
  /** Tailwind v4 @theme variable → token path. */
  theme: Record<string, string>;
  /** @utility name → semantic typography path. The "description" key is documentation. */
  textStyles: Record<string, string>;
  /** Module specifier → replacement in generated components. The "description" key is documentation. */
  imports: Record<string, string>;
  rewrite: {
    unmapped: string;
    tieBreak: string;
    neverSnapNonZeroToNone: boolean;
    utilityPrefix: { namespace: string; prefix: string; why: string };
    spacing: RewriteGroup;
    size: RewriteGroup;
    fontSize: RewriteGroup;
    leading: RewriteGroup;
    radius: RewriteGroup;
    shadow: RewriteGroup;
  };
}

// ---- Component list ---------------------------------------------------------

export type Tier = "atoms" | "molecules" | "organisms";

export interface ComponentEntry {
  label: string;
  description: string;
  /** shadcn registry name, or null for custom compositions. */
  source: string | null;
}

export type ComponentList = Record<Tier, ComponentEntry[]>;

// ---- API contract (backend ↔ frontend) ------------------------------------

export type WarningReason =
  | "snapped" //   off-scale step, replaced by the nearest token (tie-break per mapping)
  | "unmapped" //  named step with no rule and no theme variable; left as-is
  | "arbitrary"; // arbitrary value like rounded-[min(var(--radius-md),8px)]; can't be tokenized

export interface RewriteWarning {
  original: string;
  replacement: string | null;
  reason: WarningReason;
}

/** GET /api/components */
export interface ComponentSummary extends ComponentEntry {
  tier: Tier;
  /** A template exists for `source`, so it can be generated. */
  available: boolean;
  /** The template also has examples, so it can be previewed. */
  previewable: boolean;
}

/** POST /api/components/:source/generate */
export interface GenerateRequest {
  /** Omit to use the default tokens. */
  tokens?: TokenFile;
}

export interface GenerateResponse {
  source: string;
  /** The component and its predefined test, keyed by file name. */
  files: Record<string, string>;
  /** Files every component needs once: theme.css, lib/utils.ts, dependencies.json. */
  shared: Record<string, string>;
  warnings: RewriteWarning[];
}

export interface ApiError {
  error: string;
  detail?: string;
}
