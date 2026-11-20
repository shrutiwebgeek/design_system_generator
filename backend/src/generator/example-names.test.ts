import { describe, expect, it } from "vitest";
import { exampleNamesIn } from "./example-names.ts";

describe("exampleNamesIn", () => {
  it("reads each example's name from the exported array, in order", () => {
    const code = `
      export const examples: { name: string; render: () => ReactNode }[] = [
        { name: "Variants", render: () => <Row /> },
        { name: 'Sizes', render: () => <Row /> },
        { name: \`Icon only\`, render: () => <Row /> },
      ];`;
    expect(exampleNamesIn(code)).toEqual(["Variants", "Sizes", "Icon only"]);
  });

  it("sees through satisfies and as", () => {
    expect(
      exampleNamesIn(`export const examples = [{ name: "A" }] satisfies X[];`),
    ).toEqual(["A"]);
    expect(
      exampleNamesIn(`export const examples = ([{ name: "B" }]) as X[];`),
    ).toEqual(["B"]);
  });

  it("skips names it can't read without running code", () => {
    expect(
      exampleNamesIn(
        `const n = "x"; export const examples = [{ name: n }, { name: "Kept" }, spread];`,
      ),
    ).toEqual(["Kept"]);
  });

  it("returns nothing without an exported examples array", () => {
    expect(exampleNamesIn(`const examples = [{ name: "Hidden" }];`)).toEqual(
      [],
    );
    expect(exampleNamesIn(`export const examples = makeExamples();`)).toEqual(
      [],
    );
    expect(exampleNamesIn(`export const other = [{ name: "No" }];`)).toEqual(
      [],
    );
  });
});
