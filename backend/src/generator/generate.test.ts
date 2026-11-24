import { defaultTokens, mapping } from "@dsg/design-data";
import { describe, expect, it } from "vitest";
import { generateComponent } from "./generate.ts";

describe("generateComponent: the shared files (preview and download)", () => {
  it("makes theme.css, lib/utils.ts and dependencies.json", async () => {
    const { shared } = await generateComponent(
      "button",
      defaultTokens,
      mapping,
    );
    expect(Object.keys(shared).sort()).toEqual([
      "dependencies.json",
      "lib/utils.ts",
      "theme.css",
    ]);
    expect(JSON.parse(shared["dependencies.json"])).toMatchObject({
      dependencies: {
        "@base-ui/react": expect.any(String),
        "class-variance-authority": expect.any(String),
        cn: expect.any(String),
      },
    });
  });

  it("builds theme.css from the uploaded tokens", async () => {
    const tokens = structuredClone(defaultTokens);
    (tokens.primitive.spacing as Record<string, { value: string }>).md = {
      value: "20px",
    };
    const { shared } = await generateComponent("button", tokens, mapping);
    expect(shared["theme.css"]).toContain("--spacing-ds-md: 20px;");
  });
});
