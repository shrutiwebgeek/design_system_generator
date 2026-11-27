import type { ComponentTokenInfo, TokenValues } from "@dsg/design-data/types";

/** A designer's token edits: token key → mode (or "*" for shared tokens) → CSS value. */
export type TokenEdits = Record<string, Record<string, string>>;

/** Which value a token takes in this mode: shared tokens have one for every mode. */
export const scopeOf = (token: ComponentTokenInfo, mode: string): string =>
  "*" in token.values ? "*" : mode;

/** The token's value on screen: the designer's edit, else what the theme has. */
export const currentValue = (
  token: ComponentTokenInfo,
  edits: TokenEdits,
  mode: string,
): string => {
  const scope = scopeOf(token, mode);
  return edits[token.key]?.[scope] ?? token.values[scope] ?? "";
};

/** The edits as CSS variables per mode, for the preview frame. */
export function tokenValues(
  tokens: ComponentTokenInfo[],
  edits: TokenEdits,
): TokenValues {
  const out: TokenValues = {};
  for (const token of tokens)
    for (const [scope, value] of Object.entries(edits[token.key] ?? {}))
      out[scope] = { ...out[scope], [token.cssVar]: value };
  return out;
}

/** Whether any of these tokens has an edit in this mode (or "*"). */
export const isEdited = (
  edits: TokenEdits,
  keys: string[],
  scope: string,
): boolean => keys.some((key) => edits[key]?.[scope] !== undefined);
