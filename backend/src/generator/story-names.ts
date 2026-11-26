import ts from "typescript";

/**
 * Story names read statically from a stories file, without running it:
 * the `name` string of each object literal in `export const stories = [...]`.
 * A non-literal name is skipped; the templates' stories test checks that the
 * static names match the runtime ones, so a skip can't go unnoticed.
 */
export function storyNamesIn(code: string): string[] {
  const file = ts.createSourceFile(
    "stories.tsx",
    code,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX,
  );
  for (const statement of file.statements) {
    if (
      !ts.isVariableStatement(statement) ||
      !statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    )
      continue;
    for (const decl of statement.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || decl.name.text !== "stories") continue;
      let init = decl.initializer;
      while (
        init &&
        (ts.isSatisfiesExpression(init) ||
          ts.isAsExpression(init) ||
          ts.isParenthesizedExpression(init))
      )
        init = init.expression;
      if (!init || !ts.isArrayLiteralExpression(init)) return [];
      return init.elements.flatMap((element) => {
        if (!ts.isObjectLiteralExpression(element)) return [];
        const name = element.properties.find(
          (p): p is ts.PropertyAssignment =>
            ts.isPropertyAssignment(p) &&
            ts.isIdentifier(p.name) &&
            p.name.text === "name",
        );
        return name && ts.isStringLiteralLike(name.initializer)
          ? [name.initializer.text]
          : [];
      });
    }
  }
  return [];
}
