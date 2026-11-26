import { describe, expect, it } from "vitest";
import { storyNamesIn } from "./story-names.ts";

describe("storyNamesIn", () => {
  it("reads each story's name from the exported array, in order", () => {
    const code = `
      export const stories: { name: string; args: Args }[] = [
        { name: "Default", args: base },
        { name: 'Outline', args: { ...base, variant: "outline" } },
        { name: \`With icon\`, args: base, render: (args) => <Button {...args} /> },
      ];`;
    expect(storyNamesIn(code)).toEqual(["Default", "Outline", "With icon"]);
  });

  it("sees through satisfies and as", () => {
    expect(
      storyNamesIn(`export const stories = [{ name: "A" }] satisfies X[];`),
    ).toEqual(["A"]);
    expect(
      storyNamesIn(`export const stories = ([{ name: "B" }]) as X[];`),
    ).toEqual(["B"]);
  });

  it("skips names it can't read without running code", () => {
    expect(
      storyNamesIn(
        `const n = "x"; export const stories = [{ name: n }, { name: "Kept" }, spread];`,
      ),
    ).toEqual(["Kept"]);
  });

  it("returns nothing without an exported stories array", () => {
    expect(storyNamesIn(`const stories = [{ name: "Hidden" }];`)).toEqual([]);
    expect(storyNamesIn(`export const stories = makeStories();`)).toEqual([]);
    expect(storyNamesIn(`export const other = [{ name: "No" }];`)).toEqual([]);
  });
});
