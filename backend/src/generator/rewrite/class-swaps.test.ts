import { describe, expect, it } from "vitest";
import { applyClassSwaps } from "./class-swaps.ts";

const code = `const v = cva(
  "rounded-md border border-transparent",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        ghost: 'hover:bg-muted dark:hover:bg-muted/50',
      },
    },
  }
)
const other = "bg-primary"`;

describe("applyClassSwaps", () => {
  it("swaps, drops and appends classes in the cva strings it names, and nowhere else", () => {
    const out = applyClassSwaps(
      code,
      {
        base: {
          swap: { "rounded-md": "rounded-button", "border-transparent": "" },
        },
        "variant.default": {
          swap: { "bg-primary": "bg-button-default-bg" },
          add: "border-button-default-border",
        },
        "variant.ghost": { swap: { "dark:hover:bg-muted/50": "" } },
      },
      "x.tsx",
    );
    expect(out).toContain('"rounded-button border"');
    expect(out).toContain(
      '"bg-button-default-bg text-primary-foreground hover:bg-primary/80 border-button-default-border"',
    );
    expect(out).toContain("'hover:bg-muted'"); // keeps the quote style
    expect(out).toContain('const other = "bg-primary"');
  });

  it("swaps whole classes, not parts of them", () => {
    const out = applyClassSwaps(
      code,
      { "variant.default": { swap: { "text-primary-foreground": "text-fg" } } },
      "x.tsx",
    );
    expect(out).toContain("bg-primary text-fg hover:bg-primary/80");
  });

  it("fails when the template no longer has a class or a string the mapping names", () => {
    expect(() =>
      applyClassSwaps(code, { base: { swap: { "rounded-lg": "x" } } }, "x.tsx"),
    ).toThrow(/"rounded-lg" isn't in x.tsx base/);
    expect(() =>
      applyClassSwaps(code, { "variant.link": { add: "x" } }, "x.tsx"),
    ).toThrow(/no cva string "variant.link"/);
  });
});
