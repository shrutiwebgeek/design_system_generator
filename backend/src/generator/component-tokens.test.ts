// The button's own tokens: what the generated code reads, what theme.css defines,
// and what the Controls panel gets.
import { defaultTokens, mapping, type TokenFile } from "@dsg/design-data";
import { describe, expect, it } from "vitest";
import { componentTokenInfo } from "./component-tokens.ts";
import { generateComponent } from "./generate.ts";
import { splitVariants } from "./rewrite/rewrite.ts";
import { compileTailwind } from "./test-utils.ts";
import { generateThemeCss } from "./theme/theme.ts";

const VARIANTS = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
];

/** Default tokens plus a designer's edits: an outline background per mode and a shared radius. */
function edited(): TokenFile {
  const tokens = structuredClone(defaultTokens);
  for (const [mode, value] of [
    ["light", "#FF0000"],
    ["dark", "#00FF00"],
  ] as const)
    tokens.modes[mode] = {
      ...tokens.modes[mode],
      component: { button: { outline: { background: { value } } } },
    };
  tokens.semantic = {
    ...tokens.semantic,
    component: { button: { radius: { value: "{primitive.radius.full}" } } },
  };
  return tokens;
}

describe("the button's own tokens", async () => {
  const generated = await generateComponent("button", defaultTokens, mapping);
  const code = generated.files["button.tsx"] ?? "";
  const css = generated.shared["theme.css"];

  it("points every variant at its own colors, and the shape at shared ones", () => {
    for (const variant of VARIANTS)
      for (const part of ["bg", "fg", "border", "hover"])
        expect(code, `${variant} ${part}`).toContain(
          `button-${variant}-${part}`,
        );
    expect(code).toContain("rounded-button");
    expect(code).toContain("border-(length:--button-border-width)");
    expect(code).toContain("rounded-[min(var(--button-radius),8px)]");
    // The shared shadcn colors and the dark: duplicates are gone from the variants.
    expect(code).not.toMatch(
      /"[^"]*\b(?:bg-primary|border-border|bg-background|dark:bg-input\/30)\b/,
    );
  });

  it("every button- utility it uses compiles to a Tailwind rule", async () => {
    const compiler = await compileTailwind(css);
    const utilities = new Set(
      code
        .split(/[\s"`]+/)
        .map((token) => splitVariants(token).utility)
        .filter((utility) => utility.includes("button-")),
    );
    expect(utilities.size).toBeGreaterThan(20);
    for (const utility of utilities) {
      // The selector as Tailwind escapes it: border-\(length\:--button-border-width\)
      const selector = "." + utility.replace(/[()[\]:,]/g, (c) => "\\" + c);
      expect(compiler.build([utility]), utility).toContain(selector + " {");
    }
  });

  it("defaults to the values the shadcn classes had", () => {
    expect(css).toMatch(/:root \{[^}]*--button-default-bg: #2563EB;/);
    expect(css).toMatch(/\.dark \{[^}]*--button-default-bg: #60A5FA;/);
    expect(css).toMatch(
      /\.dark \{[^}]*--button-outline-bg: #64748B4D;/, // border.strong at 30%
    );
    expect(css).toMatch(
      /:root \{[^}]*--button-radius: 8px;[^}]*--button-border-width: 1px;/,
    );
    expect(css).not.toMatch(/\.dark \{[^}]*--button-radius/); // shared: once, on :root
    expect(css).toContain(
      "--color-button-outline-bg: var(--button-outline-bg);",
    );
    expect(css).toContain("--radius-button: var(--button-radius);");
    // Every default is a hex color, alpha included: no color-mix() or keywords left.
    expect(css).not.toMatch(
      /--button-[a-z-]+: (?:color-mix|transparent|currentColor)/,
    );
    expect(css).toMatch(/\.dark \{[^}]*--button-secondary-hover: #3B495D;/); // secondary + 5% text, in oklch
  });

  it("takes a designer's values from the token file, per mode and shared", () => {
    const theme = generateThemeCss(edited(), mapping);
    expect(theme).toMatch(/:root \{[^}]*--button-outline-bg: #FF0000;/);
    expect(theme).toMatch(/\.dark \{[^}]*--button-outline-bg: #00FF00;/);
    expect(theme).toMatch(/:root \{[^}]*--button-radius: 9999px;/);
    expect(theme).toMatch(/:root \{[^}]*--button-ghost-bg: #00000000;/); // untouched
  });

  it("gives the Controls panel each token's values and, for the shape, its scale", () => {
    const info = componentTokenInfo(edited(), mapping, "button");
    expect(info).toHaveLength(26);
    expect(info.find((t) => t.key === "outline.background")).toEqual({
      key: "outline.background",
      cssVar: "--button-outline-bg",
      label: "Background",
      kind: "color",
      variant: "outline",
      values: { light: "#FF0000", dark: "#00FF00" },
    });
    const radius = info.find((t) => t.key === "radius");
    expect(radius?.values).toEqual({ "*": "9999px" });
    expect(radius?.variant).toBeUndefined();
    expect(radius?.options?.map((o) => o.name)).toEqual([
      "none",
      "sm",
      "md",
      "lg",
      "full",
    ]);
    expect(componentTokenInfo(defaultTokens, mapping, "input")).toEqual([]);
  });
});
