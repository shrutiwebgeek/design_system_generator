import ts from "typescript";
import type { ClassSwap } from "@dsg/design-data";

const keyOf = (p: ts.ObjectLiteralElementLike): string =>
  p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))
    ? p.name.text
    : "";

const isText = (
  node: ts.Node | undefined,
): node is ts.StringLiteral | ts.NoSubstitutionTemplateLiteral =>
  !!node &&
  (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node));

/** The class strings of a cva() call: "base", and "<group>.<value>" for each variant. */
export function cvaStrings(
  file: ts.SourceFile,
): Map<string, ts.StringLiteral | ts.NoSubstitutionTemplateLiteral> {
  const found = new Map<
    string,
    ts.StringLiteral | ts.NoSubstitutionTemplateLiteral
  >();
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && node.expression.getText(file) === "cva") {
      const [base, config] = node.arguments;
      if (isText(base)) found.set("base", base);
      const variants =
        config && ts.isObjectLiteralExpression(config)
          ? config.properties.find((p) => keyOf(p) === "variants")
          : undefined;
      if (
        variants &&
        ts.isPropertyAssignment(variants) &&
        ts.isObjectLiteralExpression(variants.initializer)
      )
        for (const group of variants.initializer.properties)
          if (
            ts.isPropertyAssignment(group) &&
            ts.isObjectLiteralExpression(group.initializer)
          )
            for (const value of group.initializer.properties)
              if (ts.isPropertyAssignment(value) && isText(value.initializer))
                found.set(`${keyOf(group)}.${keyOf(value)}`, value.initializer);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}

function swapClasses(classes: string, rule: ClassSwap, where: string): string {
  const list = classes.split(/\s+/).filter(Boolean);
  for (const from of Object.keys(rule.swap ?? {}))
    if (!list.includes(from))
      throw new Error(
        `Class swap: "${from}" isn't in ${where}; update the mapping to the template`,
      );
  const swapped = list.map((c) => rule.swap?.[c] ?? c).filter(Boolean);
  return [...swapped, ...(rule.add ? [rule.add] : [])].join(" ");
}

/**
 * Points a component's cva() strings at its own tokens: swaps and appends classes
 * where the mapping says. Runs after the class rewrite, on the generated source.
 */
export function applyClassSwaps(
  code: string,
  swaps: Record<string, ClassSwap>,
  file: string,
): string {
  const source = ts.createSourceFile(
    file,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const strings = cvaStrings(source);
  const edits = Object.entries(swaps).map(([where, rule]) => {
    const node = strings.get(where);
    if (!node)
      throw new Error(`Class swap: ${file} has no cva string "${where}"`);
    // Inside the quotes, so the file keeps its quote style.
    return {
      start: node.getStart(source) + 1,
      end: node.getEnd() - 1,
      text: swapClasses(node.text, rule, `${file} ${where}`),
    };
  });
  return edits
    .sort((a, b) => b.start - a.start)
    .reduce(
      (out, e) => out.slice(0, e.start) + e.text + out.slice(e.end),
      code,
    );
}
