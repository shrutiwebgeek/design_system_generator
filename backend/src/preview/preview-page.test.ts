// The page inside the iframe: its stories, modes and messages.
import { defaultTokens, mapping } from "@dsg/design-data";
import { describe, expect, it } from "vitest";
import { buildPreview } from "./build-preview.ts";
import { buttons, isDark, modeButton, run, tick } from "./test-page.ts";

describe("the preview page (Button)", async () => {
  const html = await buildPreview("button", defaultTokens, mapping, "Button");

  it("renders the first story, in dark mode, without errors", async () => {
    const { document, errors } = await run(html);
    expect(errors).toEqual([]);
    expect(document.querySelector("main")?.getAttribute("aria-label")).toBe(
      "Variants",
    );
    // 6 story buttons; the mode button isn't a [data-slot=button].
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

  it("tells its parent which stories and modes it has, and the one it opened in", async () => {
    const { posted } = await run(html);
    expect(posted).toContainEqual({
      type: "dsg-preview:ready",
      stories: ["Variants", "Sizes", "Icon only", "With icon", "States"],
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

  it("shows the story and mode its parent selects", async () => {
    const { document, sendFromParent } = await run(html);
    await sendFromParent({
      type: "dsg-preview:select",
      story: "Icon only",
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
      story: "Sizes",
      mode: "dark",
    });
    expect(isDark(document)).toBe(true);
  });

  it("ignores messages from other windows, unknown names and other shapes", async () => {
    const { document, sendFromParent } = await run(html);
    const select = {
      type: "dsg-preview:select",
      story: "Sizes",
      mode: "light",
    };
    await sendFromParent(select, null); // not from the parent
    await sendFromParent({ ...select, story: "Nope", mode: "sepia" });
    await sendFromParent({ type: "dsg-preview:select", story: 1, mode: [] });
    await sendFromParent("dsg-preview:select");
    expect(document.querySelector("main")?.getAttribute("aria-label")).toBe(
      "Variants",
    );
    expect(isDark(document)).toBe(true);
  });
});
