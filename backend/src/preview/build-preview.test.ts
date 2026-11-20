import { defaultTokens, mapping } from "@dsg/design-data";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { buildPreview } from "./build-preview.ts";

const tick = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Run the preview HTML the way the sandboxed iframe would: scripts on.
 * Top-level, window.parent is the window itself, so the frame's messages to
 * its parent land on this window.
 */
async function run(html: string) {
  const errors: string[] = [];
  const posted: unknown[] = [];
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.addEventListener("error", (e) => errors.push(String(e.message)));
      window.addEventListener("message", (e) => posted.push(e.data));
    },
  });
  await tick(100);
  const { window } = dom;
  /** jsdom's postMessage leaves event.source unset, so dispatch the event directly. */
  const sendFromParent = async (data: unknown, source: unknown = window) => {
    window.dispatchEvent(
      new window.MessageEvent("message", {
        data,
        source: source as Window,
      }),
    );
    await tick(20); // message events render at default priority, not synchronously like clicks
  };
  return { document: window.document, errors, posted, sendFromParent };
}

const buttons = (document: Document) =>
  document.querySelectorAll('[data-slot="button"]').length;

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

  const isDark = (document: Document) =>
    document.documentElement.classList.contains("dark");
  const modeButton = (document: Document) =>
    document.querySelector<HTMLButtonElement>(
      'button[aria-label^="Switch to"]',
    )!;

  it("renders the first example, in dark mode, without errors", async () => {
    const { document, errors } = await run(html);
    expect(errors).toEqual([]);
    expect(document.querySelector("main")?.getAttribute("aria-label")).toBe(
      "Variants",
    );
    // 6 example buttons; the mode button isn't a [data-slot=button].
    expect(buttons(document)).toBe(6);
    expect(isDark(document)).toBe(true);
  });

  it("shows dark mode on the token background and light mode on a neutral grey", async () => {
    const { document } = await run(html);
    const canvas = () => document.querySelector("[data-canvas]")!;
    expect(canvas().className).toContain("bg-background");
    expect(canvas().querySelector("[data-stage-card]")).toBeNull();

    modeButton(document).click();
    await tick(20);
    expect(canvas().className).toContain("bg-[#e0e0e0]");
    expect(canvas().className).not.toContain("bg-background");
    // The grey is tool chrome in hex, and must actually compile.
    expect(html).toContain(".bg-\\[\\#e0e0e0\\]");
  });

  it("draws the mode button as an outline only, in colors that compile for both canvases", async () => {
    const { document } = await run(html);
    expect(modeButton(document).className).toContain("bg-transparent");
    // No resting fill; only the hover tint (hover:bg-[…]) may set a background.
    expect(modeButton(document).className).not.toMatch(/(^|\s)bg-\[#/);
    expect(html).toContain(".border-\\[\\#ffffffb3\\]"); // dark
    expect(html).toContain(".border-\\[\\#525252\\]"); // light
  });

  it("tells its parent which examples and modes it has, and the one it opened in", async () => {
    const { posted } = await run(html);
    expect(posted).toContainEqual({
      type: "dsg-preview:ready",
      examples: [
        "Variants",
        "Sizes",
        "Icon only",
        "With icon",
        "States",
        "As a link",
      ],
      modes: ["light", "dark"],
      defaultMode: "light",
      mode: "dark",
    });
  });

  it("switches mode with its own button and tells its parent", async () => {
    const { document, posted } = await run(html);
    expect(modeButton(document).getAttribute("aria-label")).toBe(
      "Switch to light mode",
    );

    modeButton(document).click();
    await tick(20);
    expect(isDark(document)).toBe(false);
    expect(posted).toContainEqual({ type: "dsg-preview:mode", mode: "light" });
    expect(modeButton(document).getAttribute("aria-label")).toBe(
      "Switch to dark mode",
    );

    modeButton(document).click();
    await tick(20);
    expect(isDark(document)).toBe(true);
    expect(posted).toContainEqual({ type: "dsg-preview:mode", mode: "dark" });
  });

  it("shows the example and mode its parent selects", async () => {
    const { document, sendFromParent } = await run(html);
    await sendFromParent({
      type: "dsg-preview:select",
      example: "Icon only",
      mode: "light",
    });
    expect(document.querySelector("main")?.getAttribute("aria-label")).toBe(
      "Icon only",
    );
    expect(buttons(document)).toBe(4);
    // Mode by class on <html>, like a real app using theme.css.
    expect(isDark(document)).toBe(false);

    await sendFromParent({
      type: "dsg-preview:select",
      example: "Sizes",
      mode: "dark",
    });
    expect(isDark(document)).toBe(true);
  });

  it("ignores messages from other windows, unknown names and other shapes", async () => {
    const { document, sendFromParent } = await run(html);
    const select = {
      type: "dsg-preview:select",
      example: "Sizes",
      mode: "light",
    };
    await sendFromParent(select, null); // not from the parent
    await sendFromParent({ ...select, example: "Nope", mode: "sepia" });
    await sendFromParent({ type: "dsg-preview:select", example: 1, mode: [] });
    await sendFromParent("dsg-preview:select");
    expect(document.querySelector("main")?.getAttribute("aria-label")).toBe(
      "Variants",
    );
    expect(isDark(document)).toBe(true);
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
