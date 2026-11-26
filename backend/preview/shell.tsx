// The page inside the preview iframe: one story at a time, with the story and its
// args chosen by the tool over postMessage, plus a mode button. Everything in this folder is tool chrome: it is
// not rewritten and never ships in a download.
import { isSelectMessage } from "@dsg/design-data/preview-messages";
import type {
  PreviewModeMessage,
  PreviewReadyMessage,
  StoryArgs,
  TokenValues,
} from "@dsg/design-data/types";
import config from "preview:config";
import { args as storyArgs, controls, render, stories } from "preview:stories";
import { StrictMode, useEffect, useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ModeIcon } from "./icons/mode-icon";
import { stage, stylesFor, toolbar } from "./styles/shell.styles";

/** The preview opens in dark when the tokens have it: a big light canvas is hard on the eyes. */
const INITIAL_MODE = config.modes.includes("dark")
  ? "dark"
  : config.defaultMode;

/** Same convention as the generated theme.css: default mode = no class. */
function applyMode(mode: string): void {
  const root = document.documentElement;
  root.classList.remove(...config.modes);
  if (mode !== config.defaultMode) root.classList.add(mode);
  root.style.colorScheme = mode === "dark" ? "dark" : "light";
}

/** Cycles through every mode in the token file; with light + dark it's a toggle. */
function nextMode(mode: string): string {
  const { modes } = config;
  return modes[(modes.indexOf(mode) + 1) % modes.length] ?? mode;
}

/**
 * The designer's token edits over the generated theme: the same selectors, later in
 * the page, so they win. Shared values ("*") go on :root with the default mode's.
 */
function applyTokenValues(values: TokenValues): void {
  let style = document.getElementById("dsg-token-edits");
  if (!style) {
    style = document.createElement("style");
    style.id = "dsg-token-edits";
    document.head.append(style);
  }
  style.textContent = Object.entries(values)
    .map(([mode, vars]) => {
      const selector =
        mode === "*" || mode === config.defaultMode ? ":root" : `.${mode}`;
      const lines = Object.entries(vars)
        .filter(([name]) => name.startsWith("--"))
        .map(([name, value]) => `${name}: ${value};`);
      return `${selector} { ${lines.join(" ")} }`;
    })
    .join("\n");
}

/** The stories file's controls, each select with what the generator knows about its options. */
const shownControls = Object.fromEntries(
  Object.entries(controls).map(([name, control]) => {
    const details =
      control.type === "select"
        ? config.details[control.prop ?? name]
        : undefined;
    return [name, details ? { ...control, details } : control];
  }),
);

function post(message: PreviewReadyMessage | PreviewModeMessage): void {
  window.parent.postMessage(message, "*");
}

function Preview() {
  const [storyName, setStoryName] = useState(stories[0]?.name);
  // The stories file's args until the tool sends its own.
  const [args, setArgs] = useState<StoryArgs>(storyArgs);
  const [mode, setMode] = useState(INITIAL_MODE);

  useEffect(() => {
    const onMessage = ({ source, data }: MessageEvent<unknown>) => {
      // The frame's origin is opaque, so trust the sender window, not an origin string.
      if (source !== window.parent || !isSelectMessage(data)) return;
      if (stories.some((s) => s.name === data.story)) {
        setStoryName(data.story);
        setArgs(data.args);
      }
      applyTokenValues(data.tokenValues);
      if (config.modes.includes(data.mode)) setMode(data.mode);
    };
    window.addEventListener("message", onMessage);
    post({
      type: "dsg-preview:ready",
      stories: stories.map(({ name, controls, props }) => ({
        name,
        controls,
        ...(typeof props?.variant === "string"
          ? { variant: props.variant }
          : {}),
      })),
      args: storyArgs,
      controls: shownControls,
      tokens: config.tokens,
      modes: config.modes,
      defaultMode: config.defaultMode,
      mode: INITIAL_MODE,
    });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Before paint, so a switch never flashes the other theme.
  useLayoutEffect(() => applyMode(mode), [mode]);

  const next = nextMode(mode);
  const switchMode = () => {
    setMode(next);
    post({ type: "dsg-preview:mode", mode: next });
  };

  const story = stories.find((s) => s.name === storyName) ?? stories[0];
  const draw = story?.render ?? render;
  const styles = stylesFor(mode);
  return (
    <div data-canvas="" className={styles.canvas}>
      {config.modes.length > 1 && (
        <div className={toolbar}>
          <button
            type="button"
            onClick={switchMode}
            aria-label={`Switch to ${next} mode`}
            title={`Switch to ${next} mode`}
            className={styles.modeButton}
          >
            <ModeIcon mode={next} />
          </button>
        </div>
      )}
      <main aria-label={story?.name} className={stage}>
        {story && draw(args, story.props ?? {})}
      </main>
    </div>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("The preview page has no #root element");

applyMode(INITIAL_MODE);
createRoot(root).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
);
