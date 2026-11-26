import { defaultTokens, mapping } from "@dsg/design-data";
import { describe, expect, it } from "vitest";
import { generateComponent } from "./generate.ts";
import { cvaHeights } from "./size-heights.ts";

describe("cvaHeights", async () => {
  const { files } = await generateComponent("button", defaultTokens, mapping);
  const code = files["button.tsx"] ?? "";

  it("gives each button size the height its token sets", () => {
    expect(cvaHeights(code, defaultTokens, mapping, "size")).toEqual({
      default: "36px",
      xs: "24px",
      sm: "32px",
      lg: "40px",
      icon: "36px",
      "icon-xs": "24px",
      "icon-sm": "32px",
      "icon-lg": "40px",
    });
  });

  it("follows the tokens", () => {
    const tokens = structuredClone(defaultTokens);
    (
      tokens.primitive.size as { control: Record<string, { value: string }> }
    ).control.md = { value: "44px" };
    expect(cvaHeights(code, tokens, mapping, "size").default).toBe("44px");
  });

  it("is empty for a group without height classes", () => {
    expect(cvaHeights(code, defaultTokens, mapping, "variant")).toEqual({});
  });
});
