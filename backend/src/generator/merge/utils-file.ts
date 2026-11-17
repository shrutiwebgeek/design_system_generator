import type { Mapping } from "@dsg/design-data";

/**
 * Generates lib/utils.ts: a `cn` that knows the token utilities.
 * Plain `cn` treats `px-ds-md px-ds-sm` as non-conflicting and keeps both,
 * so a className override would lose to stylesheet order (verified 2026-11-17).
 */
export function generateUtilsFile(mapping: Mapping): string {
  const spacingPrefix = "--spacing-";
  const spacing = Object.keys(mapping.theme)
    .filter((name) => name.startsWith(spacingPrefix))
    .map((name) => name.slice(spacingPrefix.length));
  const textStyles = Object.keys(mapping.textStyles)
    .filter((name) => name !== "description")
    .map((name) => name.replace(/^text-/, ""));

  const list = (items: string[]) =>
    items.map((i) => JSON.stringify(i)).join(", ");

  return `// Generated from ${mapping.meta.name} v${mapping.meta.version}. Do not edit by hand.
import { createCn } from "cn/config"

export const cn = createCn({
  extend: {
    theme: {
      spacing: [${list(spacing)}],
    },
    classGroups: {
      "font-size": [{ text: [${list(textStyles)}] }],
    },
  },
})
`;
}
