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
  /** Tokens a component owns, keyed by template name. */
  components?: Record<string, ComponentRules>;
}

/** A token one component owns, such as the outline button's background. */
export interface ComponentTokenRule {
  /** The CSS variable the generated component reads, e.g. "--button-outline-bg". */
  cssVar: string;
  /**
   * Where a designer's value lives in the token file. Mode-relative for colors
   * ("component.button.outline.background"), mode-free under "semantic." for shape.
   */
  path: string;
  label: string;
  /** "color", "radius" or "borderWidth" (a string: JSON imports don't keep literal types). */
  kind: string;
  /** The variant it belongs to; absent when every variant shares it. */
  variant?: string;
  /** Its value until a designer sets one, per mode ("*" for any): a token path, or CSS. */
  default: Record<string, string>;
}

/** Class swaps in one string of the component's cva() call: "base", or "<group>.<value>". */
export interface ClassSwap {
  /** Class → replacement; "" drops it. Every class must be present, or generation fails. */
  swap?: Record<string, string>;
  /** Classes appended to the string. */
  add?: string;
}

export interface ComponentRules {
  description?: string;
  /** Keyed by a stable name, e.g. "outline.background" or "radius". */
  tokens: Record<string, ComponentTokenRule>;
  classes: Record<string, ClassSwap>;
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
  /** The template also has stories, so it can be previewed. */
  previewable: boolean;
  /** Story names, in file order; [] unless previewable. The tool lists them as files. */
  stories: string[];
}

/** POST /api/components/:source/generate */
export interface GenerateRequest {
  /** Omit to use the default tokens. */
  tokens?: TokenFile;
}

/** What the tool shows. The files every component shares come with the download instead. */
export interface GenerateResponse {
  source: string;
  /** The component, its stories and its predefined test, keyed by file name. */
  files: Record<string, string>;
  warnings: RewriteWarning[];
}

export interface ApiError {
  error: string;
  detail?: string;
}

/*
 * postMessage protocol between the tool and the sandboxed preview iframe.
 * The frame has an opaque origin, so both sides post with targetOrigin "*" and
 * trust a message by its `event.source` instead. Only names cross, nothing secret.
 */

/** A story's settings: the props the Controls panel can change. */
export type StoryArgs = Record<string, string | boolean>;

/** How the Controls panel edits one arg. */
export type StoryControl =
  | {
      type: "select";
      label: string;
      options: readonly string[];
      /** The component prop it sets, when that isn't the arg's name. */
      prop?: string;
      /** Shown beside an option, e.g. a size's height ("36px"). Added by the preview. */
      details?: Record<string, string>;
    }
  | { type: "boolean"; label: string }
  | { type: "text"; label: string };

export type ComponentTokenKind = "color" | "radius" | "borderWidth";

/** A component token as Controls shows it. */
export interface ComponentTokenInfo {
  /** e.g. "outline.background" or "radius". */
  key: string;
  cssVar: string;
  label: string;
  kind: ComponentTokenKind;
  /** Absent when every variant shares it. */
  variant?: string;
  /** The current CSS value per mode; shared tokens use "*". */
  values: Record<string, string>;
  /** For radius and border thickness: the token scale to pick from. */
  options?: { name: string; value: string }[];
}

/** CSS variable values per mode ("*" for every mode). */
export type TokenValues = Record<string, Record<string, string>>;

/** Frame → tool, on every load: what the preview can show. */
export interface PreviewReadyMessage {
  type: "dsg-preview:ready";
  stories: string[];
  modes: string[];
  /** The token file's default mode: the unclassed :root in theme.css. */
  defaultMode: string;
  /** The mode the frame opened in: dark when the tokens have it, else defaultMode. */
  mode: string;
}

/** Tool → frame: what to show. Unknown names are ignored. */
export interface PreviewSelectMessage {
  type: "dsg-preview:select";
  story: string;
  mode: string;
}

/** Frame → tool, when its own mode button switches modes, so the tool can keep the choice. */
export interface PreviewModeMessage {
  type: "dsg-preview:mode";
  mode: string;
}
