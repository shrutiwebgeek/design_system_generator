// The page inside the iframe: its stories, args, modes, token edits and messages.
import { defaultTokens, mapping } from "@dsg/design-data";
import { isReadyMessage } from "@dsg/design-data/preview-messages";
import { describe, expect, it } from "vitest";
import { buildPreview } from "./build-preview.ts";
import {
  ARGS,
  buttons,
  isDark,
  modeButton,
  run,
  shownStory,
  storyButton,
  tick,
  tokenEdits,
} from "./test-page.ts";

describe("the preview page (Button)", async () => {
  const html = await buildPreview("button", defaultTokens, mapping, "Button");

  it("renders the first story, in dark mode, without errors", async () => {
    const { document, errors } = await run(html);
    expect(errors).toEqual([]);
    expect(shownStory(document)).toBe("Default");
    // One button per story; the mode button isn't a [data-slot=button].
    expect(buttons(document)).toBe(1);
    expect(storyButton(document).textContent).toBe("Button");
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

  it("tells its parent its stories, their args, the controls, and its modes", async () => {
    const { posted } = await run(html);
    const ready = posted.find(isReadyMessage);
    expect(ready?.stories.map((s) => s.name)).toEqual([
      "Default",
      "Secondary",
      "Outline",
      "Ghost",
      "Destructive",
      "Link",
      "Icon",
      "With icon",
    ]);
    expect(ready?.stories[2]).toEqual({
      name: "Outline",
      controls: ["size", "disabled", "children"],
      variant: "outline",
    });
    expect(ready?.stories[6]?.controls).toEqual(["iconSize", "disabled"]);
    expect(ready?.args).toEqual(ARGS);
    expect(Object.keys(ready?.controls ?? {})).toEqual([
      "size",
      "iconSize",
      "disabled",
      "children",
    ]);
    // Each size with the height its token gives, for the Size dropdowns.
    expect(ready?.controls.size).toMatchObject({
      details: { default: "36px", xs: "24px", sm: "32px", lg: "40px" },
    });
    expect(ready?.controls.iconSize).toMatchObject({
      details: {
        icon: "36px",
        "icon-xs": "24px",
        "icon-sm": "32px",
        "icon-lg": "40px",
      },
    });
    expect(ready?.tokens).toHaveLength(26);
    expect(
      ready?.tokens.find((t) => t.key === "default.background")?.values,
    ).toEqual({
      light: "#2563EB",
      dark: "#60A5FA",
    });
    expect(ready).toMatchObject({
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

  it("shows the story, args and mode its parent selects", async () => {
    const { document, sendFromParent } = await run(html);
    await sendFromParent({
      type: "dsg-preview:select",
      story: "Icon",
      mode: "light",
      args: { ...ARGS, iconSize: "icon-lg" },
      tokenValues: {},
    });
    expect(shownStory(document)).toBe("Icon");
    expect(storyButton(document).getAttribute("aria-label")).toBe("Add");
    // Mode by class on <html>, like a real app using theme.css.
    expect(isDark(document)).toBe(false);

    // The Controls panel's args, on the story's own variant.
    await sendFromParent({
      type: "dsg-preview:select",
      story: "Outline",
      mode: "dark",
      args: { ...ARGS, disabled: true, children: "Save" },
      tokenValues: {},
    });
    expect(storyButton(document).textContent).toBe("Save");
    expect(storyButton(document).hasAttribute("disabled")).toBe(true);
    expect(storyButton(document).className).toContain("bg-button-outline-bg");
    expect(isDark(document)).toBe(true);
  });

  it("applies the designer's token edits over the theme, per mode", async () => {
    const { document, sendFromParent } = await run(html);
    await sendFromParent({
      type: "dsg-preview:select",
      story: "Outline",
      mode: "dark",
      args: ARGS,
      tokenValues: {
        light: { "--button-outline-bg": "#ff0000" },
        dark: { "--button-outline-bg": "#00ff00" },
        "*": { "--button-radius": "12px", "not-a-var": "x" },
      },
    });
    const css = tokenEdits(document) ?? "";
    expect(css).toContain(":root { --button-outline-bg: #ff0000; }");
    expect(css).toContain(".dark { --button-outline-bg: #00ff00; }");
    expect(css).toContain(":root { --button-radius: 12px; }");
    expect(css).not.toContain("not-a-var");
    // After the generated theme, so the same selectors win.
    expect(document.head.lastElementChild?.id).toBe("dsg-token-edits");
  });

  it("ignores messages from other windows, unknown names and other shapes", async () => {
    const { document, sendFromParent } = await run(html);
    const select = {
      type: "dsg-preview:select",
      story: "Ghost",
      mode: "light",
      args: { ...ARGS, children: "Changed" },
      tokenValues: {},
    };
    await sendFromParent(select, null); // not from the parent
    await sendFromParent({ ...select, story: "Nope", mode: "sepia" });
    await sendFromParent({ ...select, args: { size: 5 } });
    await sendFromParent({ ...select, tokenValues: undefined });
    await sendFromParent({ type: "dsg-preview:select", story: 1, mode: [] });
    await sendFromParent("dsg-preview:select");
    expect(shownStory(document)).toBe("Default");
    expect(storyButton(document).textContent).toBe("Button");
    expect(isDark(document)).toBe(true);
  });
});
