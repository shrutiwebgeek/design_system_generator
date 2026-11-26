import type { Mapping, TokenFile } from "@dsg/design-data";
import ts from "typescript";
import { cvaStrings } from "./rewrite/class-swaps.ts";
import { resolvePath } from "./tokens.ts";

/** A class that sets the height: h-ds-control-md, or size-ds-lg on icon buttons. */
const HEIGHT = /^(?:h|size)-(ds-[a-z0-9-]+)$/;

/**
 * Each value of a cva group with the height it gives, e.g. { default: "36px",
 * xs: "24px", … } for "size". Read from the generated component and the tokens,
 * so the Size dropdown shows what the button will actually measure.
 */
export function cvaHeights(
  code: string,
  tokens: TokenFile,
  mapping: Mapping,
  group: string,
): Record<string, string> {
  const file = ts.createSourceFile(
    "component.tsx",
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const heights: Record<string, string> = {};
  for (const [where, node] of cvaStrings(file)) {
    if (!where.startsWith(`${group}.`)) continue;
    const step = node.text
      .split(/\s+/)
      .map((c) => HEIGHT.exec(c)?.[1])
      .find((s) => s !== undefined);
    const path = step ? mapping.theme[`--spacing-${step}`] : undefined;
    if (path)
      heights[where.slice(group.length + 1)] = String(
        resolvePath(tokens, path, tokens.meta.defaultMode),
      );
  }
  return heights;
}
