import { defaultTokens, mapping } from "@dsg/design-data";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { buildPreview } from "./build-preview.ts";

/** Run the preview HTML the way the sandboxed iframe would: scripts on. */
async function run(html: string) {
  const errors: string[] = [];
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
  });
  dom.window.addEventListener("error", (e) => errors.push(String(e.message)));
  await new Promise((resolve) => setTimeout(resolve, 100));
  return { document: dom.window.document, errors };
}

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
    expect(html).toMatch(/\.h-ds-control-md\s*\{/);
    expect(html).toContain("size-ds-icon-md"); // the [&_svg:not([class*='size-'])] icon rule
  });

  it("bundles the generated examples, with their layout classes rewritten", () => {
    expect(html).toContain("gap-ds-sm");
    expect(html).not.toMatch(/["\s]gap-2["\s]/);
  });

  it("renders every example section and button without errors", async () => {
    const { document, errors } = await run(html);
    expect(errors).toEqual([]);
    expect(
      [...document.querySelectorAll("section")].map((s) =>
        s.getAttribute("aria-label"),
      ),
    ).toEqual([
      "Variants",
      "Sizes",
      "Icon only",
      "With icon",
      "States",
      "As a link",
    ]);
    expect(document.querySelectorAll('[data-slot="button"]')).toHaveLength(19);
  });

  it("switches modes by class on <html>, like a real app using theme.css", async () => {
    const { document } = await run(html);
    const toggle = (mode: string) =>
      [
        ...document.querySelectorAll<HTMLButtonElement>(
          '[role="group"] button',
        ),
      ].find((b) => b.textContent === mode)!;

    toggle("dark").click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(toggle("dark").getAttribute("aria-pressed")).toBe("true");

    toggle("light").click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
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
  // NoExamplesError (template without examples) is untested: every template has
  // examples today. Cover it with the first synced template that has none yet.
});
