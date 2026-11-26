import { defaultTokens, mapping } from "@dsg/design-data";
import { describe, expect, it } from "vitest";
import { buildPreview } from "./build-preview.ts";

describe("buildPreview (Button)", async () => {
  const html = await buildPreview("button", defaultTokens, mapping, "Button");

  it("is one self-contained document: inline CSS and JS, no external requests", () => {
    expect(html).toMatch(/^<!doctype html>/);
    expect(html).toContain("<style>");
    expect(html).toContain("<script>");
    expect(html).not.toMatch(/<script[^>]+src=|<link[^>]+href=/);
  });

  it("can't close its own script or style tag early", () => {
    const script = html.slice(
      html.indexOf("<script>") + 8,
      html.lastIndexOf("</script>"),
    );
    expect(script).not.toMatch(/<\/script/i);
  });

  it("compiles CSS from the generated theme, including token utilities", () => {
    expect(html).toContain("--background: #F8FAFC");
    expect(html).toContain("--button-outline-bg: #F8FAFC");
    expect(html).toMatch(/\.bg-button-outline-bg\s*\{/);
    expect(html).toMatch(/\.h-ds-control-md\s*\{/);
    expect(html).toContain("size-ds-icon-md"); // the [&_svg:not([class*='size-'])] icon rule
  });

  it("bundles the generated stories", () => {
    expect(html).toContain("Icon size"); // a control label from the stories file
  });

  it("reflects uploaded tokens", async () => {
    const tokens = structuredClone(defaultTokens);
    (
      tokens.primitive.size as { control: Record<string, { value: string }> }
    ).control.md = {
      value: "44px",
    };
    const custom = await buildPreview("button", tokens, mapping, "Button");
    expect(custom).toContain("--spacing-ds-control-md: 44px");
  });

  it("escapes the label in the document title", async () => {
    const custom = await buildPreview(
      "button",
      defaultTokens,
      mapping,
      "<b>Button</b>",
    );
    expect(custom).toContain(
      "<title>&lt;b&gt;Button&lt;/b&gt; preview</title>",
    );
  });
});

describe("buildPreview errors", () => {
  it("rejects unknown templates before building anything", async () => {
    await expect(
      buildPreview("input", defaultTokens, mapping, "Input"),
    ).rejects.toThrow(/No template for "input"/);
  });
  // NoStoriesError (template without stories) is untested: every template has
  // stories today. Cover it with the first synced template that has none yet.
});
