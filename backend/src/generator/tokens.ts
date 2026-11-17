import type {
  Token,
  TokenFile,
  TokenGroup,
  TokenValue,
} from "@dsg/design-data";

/** A fully resolved token value: no aliases left. */
export type Resolved = string | number | { [field: string]: string | number };

const ALIAS = /^\{(.+)\}$/;

export function isToken(node: Token | TokenGroup | undefined): node is Token {
  return typeof node === "object" && node !== null && "value" in node;
}

/** Paths under `primitive.` / `semantic.` are mode-free; anything else lives in `modes.<mode>`. */
export function isModeFree(path: string): boolean {
  return path.startsWith("primitive.") || path.startsWith("semantic.");
}

export function getToken(tokens: TokenFile, path: string, mode: string): Token {
  const root: TokenGroup | undefined = isModeFree(path)
    ? (tokens as unknown as TokenGroup)
    : tokens.modes[mode];
  if (!root)
    throw new Error(`Unknown mode "${mode}" while resolving "${path}"`);

  let node: Token | TokenGroup | undefined = root;
  for (const key of path.split(".")) {
    if (node === undefined || isToken(node)) break;
    node = node[key];
  }
  if (!isToken(node))
    throw new Error(
      `No token at "${path}"${isModeFree(path) ? "" : ` in mode "${mode}"`}`,
    );
  return node;
}

/** Follow aliases (including inside composite values) until only literals remain. */
export function resolveValue(
  tokens: TokenFile,
  value: TokenValue,
  mode: string,
  seen: string[] = [],
): Resolved {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const alias = ALIAS.exec(value)?.[1];
    if (!alias) return value;
    if (seen.includes(alias))
      throw new Error(`Alias cycle: ${[...seen, alias].join(" -> ")}`);
    const target = getToken(tokens, alias, mode).value;
    const resolved = resolveValue(tokens, target, mode, [...seen, alias]);
    if (typeof resolved === "object")
      throw new Error(
        `Alias "${alias}" points at a composite; only fields of a composite may alias`,
      );
    return resolved;
  }
  const out: { [field: string]: string | number } = {};
  for (const [field, fieldValue] of Object.entries(value)) {
    const resolved = resolveValue(tokens, fieldValue, mode, seen);
    if (typeof resolved === "object")
      throw new Error(
        `Composite field "${field}" resolved to another composite`,
      );
    out[field] = resolved;
  }
  return out;
}

export function resolvePath(
  tokens: TokenFile,
  path: string,
  mode: string,
): Resolved {
  return resolveValue(tokens, getToken(tokens, path, mode).value, mode, [path]);
}

/** "16px" → 16, "0px" → 0. Anything that isn't a px length is rejected. */
export function parsePx(value: Resolved): number {
  const match =
    typeof value === "string" ? /^(-?\d+(?:\.\d+)?)px$/.exec(value) : null;
  if (!match)
    throw new Error(`Expected a px length, got ${JSON.stringify(value)}`);
  return Number(match[1]);
}
