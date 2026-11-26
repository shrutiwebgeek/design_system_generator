import type {
  ComponentRules,
  ComponentTokenInfo,
  ComponentTokenKind,
  ComponentTokenRule,
  Mapping,
  TokenFile,
} from "@dsg/design-data";
import { mixOklch, withAlpha } from "./color.ts";
import { getToken, isModeFree, isToken, resolvePath } from "./tokens.ts";

const PATH = "[a-z][A-Za-z0-9]*(?:\\.[A-Za-z0-9-]+)+";
/** "color.action.primary" or "primitive.radius.md". */
const TOKEN_PATH = new RegExp(`^${PATH}$`);
/** "color.border.strong / 30%": that token at 30% opacity. */
const WITH_ALPHA = new RegExp(`^(${PATH}) / (\\d+(?:\\.\\d+)?)%$`);
/** "color.action.secondary + 5% color.text.default": mixed in oklch, like color-mix(). */
const MIX = new RegExp(`^(${PATH}) \\+ (\\d+(?:\\.\\d+)?)% (${PATH})$`);

const KINDS: readonly ComponentTokenKind[] = ["color", "radius", "borderWidth"];
const isKind = (kind: string): kind is ComponentTokenKind =>
  KINDS.some((k) => k === kind);

/** The primitive scale a shape token picks from. */
const SCALES: Partial<Record<ComponentTokenKind, string>> = {
  radius: "radius",
  borderWidth: "borderWidth",
};

function designerValue(
  tokens: TokenFile,
  rule: ComponentTokenRule,
  mode: string,
): string | undefined {
  try {
    getToken(tokens, rule.path, mode);
  } catch {
    return undefined; // not set: the default applies
  }
  return String(resolvePath(tokens, rule.path, mode));
}

/** A component token's CSS value in one mode: the designer's, else the default. */
export function componentValue(
  tokens: TokenFile,
  rule: ComponentTokenRule,
  mode: string,
): string {
  const set = designerValue(tokens, rule, mode);
  if (set !== undefined) return set;
  const fallback = rule.default[mode] ?? rule.default["*"];
  if (fallback === undefined)
    throw new Error(
      `Component token "${rule.path}" has no default for "${mode}"`,
    );
  return defaultValue(tokens, fallback, mode);
}

/** A default from the mapping, as CSS: a token, a token with alpha, a mix, or a literal. */
function defaultValue(tokens: TokenFile, value: string, mode: string): string {
  const token = (path: string) => String(resolvePath(tokens, path, mode));
  const alpha = WITH_ALPHA.exec(value);
  if (alpha?.[1] && alpha[2])
    return withAlpha(token(alpha[1]), Number(alpha[2]));
  const mix = MIX.exec(value);
  if (mix?.[1] && mix[2] && mix[3])
    return mixOklch(token(mix[1]), token(mix[3]), Number(mix[2]));
  return TOKEN_PATH.test(value) ? token(value) : value;
}

/** Shared tokens (radius, border thickness) have one value for every mode. */
export const isShared = (rule: ComponentTokenRule): boolean =>
  isModeFree(rule.path);

export const componentRules = (
  mapping: Mapping,
  source: string,
): ComponentRules | undefined => mapping.components?.[source];

function scaleOptions(tokens: TokenFile, kind: ComponentTokenKind) {
  const scale = SCALES[kind];
  const group = scale ? tokens.primitive[scale] : undefined;
  if (!scale || !group || isToken(group)) return undefined;
  return Object.keys(group).map((name) => ({
    name,
    value: String(
      resolvePath(
        tokens,
        `primitive.${scale}.${name}`,
        tokens.meta.defaultMode,
      ),
    ),
  }));
}

/** The component's tokens with their current values, for the Controls panel. */
export function componentTokenInfo(
  tokens: TokenFile,
  mapping: Mapping,
  source: string,
): ComponentTokenInfo[] {
  const rules = componentRules(mapping, source);
  if (!rules) return [];
  const modes = Object.keys(tokens.modes);
  return Object.entries(rules.tokens).map(([key, rule]) => {
    if (!isKind(rule.kind))
      throw new Error(
        `Component token "${key}" has unknown kind "${rule.kind}"`,
      );
    const values = isShared(rule)
      ? { "*": componentValue(tokens, rule, tokens.meta.defaultMode) }
      : Object.fromEntries(
          modes.map((mode) => [mode, componentValue(tokens, rule, mode)]),
        );
    const options = scaleOptions(tokens, rule.kind);
    return {
      key,
      cssVar: rule.cssVar,
      label: rule.label,
      kind: rule.kind,
      ...(rule.variant ? { variant: rule.variant } : {}),
      values,
      ...(options ? { options } : {}),
    };
  });
}

/** Lines for one mode's block in theme.css. Shared tokens go in the default mode's block only. */
export function componentVarLines(
  tokens: TokenFile,
  mapping: Mapping,
  mode: string,
): string[] {
  const isDefault = mode === tokens.meta.defaultMode;
  return Object.values(mapping.components ?? {}).flatMap((rules) =>
    Object.values(rules.tokens)
      .filter((rule) => isDefault || !isShared(rule))
      .map((rule) => `${rule.cssVar}: ${componentValue(tokens, rule, mode)};`),
  );
}

/** @theme inline entries, so bg-button-outline-bg and rounded-button exist. */
export function componentThemeAliases(mapping: Mapping): string[] {
  return Object.entries(mapping.components ?? {}).flatMap(([name, rules]) =>
    Object.values(rules.tokens).flatMap((rule) => {
      if (rule.kind === "color")
        return [`--color-${rule.cssVar.slice(2)}: var(${rule.cssVar});`];
      if (rule.kind === "radius")
        return [`--radius-${name}: var(${rule.cssVar});`];
      return []; // border thickness: the class reads the variable directly
    }),
  );
}
