// Runs the preview page the way the sandboxed iframe would, for the page tests.
import { JSDOM } from "jsdom";

export const tick = (ms = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Run the preview HTML the way the sandboxed iframe would: scripts on.
 * Top-level, window.parent is the window itself, so the frame's messages to
 * its parent land on this window.
 */
export async function run(html: string) {
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

export const buttons = (document: Document) =>
  document.querySelectorAll('[data-slot="button"]').length;
export const storyButton = (document: Document) =>
  document.querySelector<HTMLButtonElement>('main [data-slot="button"]')!;
export const shownStory = (document: Document) =>
  document.querySelector("main")?.getAttribute("aria-label");
export const tokenEdits = (document: Document) =>
  document.getElementById("dsg-token-edits")?.textContent;
/** The stories file's args. */
export const ARGS = {
  size: "default",
  iconSize: "icon",
  disabled: false,
  children: "Button",
};

export const isDark = (document: Document) =>
  document.documentElement.classList.contains("dark");
export const modeButton = (document: Document) =>
  document.querySelector<HTMLButtonElement>('button[aria-label^="Switch to"]')!;
