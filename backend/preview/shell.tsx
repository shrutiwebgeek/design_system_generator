// The page inside the preview iframe: one example at a time, chosen by the tool
// over postMessage, plus a mode button. Tool chrome only. It is not rewritten and
// never ships in a download.
import type {
  PreviewModeMessage,
  PreviewReadyMessage,
  PreviewSelectMessage,
} from "@dsg/design-data/types";
import config from "preview:config";
import { examples } from "preview:examples";
import { StrictMode, useEffect, useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";

/** The preview opens in dark when the tokens have it: a big light canvas is hard on the eyes. */
const INITIAL_MODE = config.modes.includes("dark")
  ? "dark"
  : config.defaultMode;

/**
 * The canvas behind the example.
 * Light: a neutral grey in tool hex (so no token file can restyle it), not the
 * token background. A full-bleed light token background was the brightest, largest
 * surface on screen and cool against the tool's warm cream; #E0E0E0 has luminance
 * 0.745, below the cream's 0.868. Cost (her call, 2026-11-20): light mode no longer
 * shows components on their real background.
 * Dark: the token background, full bleed.
 * The mode button is outline only (her call): no fill, a border and icon that
 * contrast with the canvas. Light: border #525252 (5.92 on the grey), icon #171717
 * (13.58). Dark: translucent white, so it holds on any dark token background:
 * border white/70 (9.13 on the default #0F172A), icon white (17.85).
 */
const CANVAS = {
  light: {
    background: "bg-[#e0e0e0]",
    button:
      "border-[#525252] text-[#171717] hover:bg-[#0000000d] focus-visible:outline-[#171717]",
  },
  dark: {
    background: "bg-background",
    button:
      "border-[#ffffffb3] text-[#ffffff] hover:bg-[#ffffff1a] focus-visible:outline-[#ffffff]",
  },
};

/** Same convention as the generated theme.css: default mode = no class. */
function applyMode(mode: string) {
  const root = document.documentElement;
  for (const m of config.modes) root.classList.remove(m);
  if (mode !== config.defaultMode) root.classList.add(mode);
  root.style.colorScheme = mode === "dark" ? "dark" : "light";
}

function isSelect(data: unknown): data is PreviewSelectMessage {
  const d = data as Partial<PreviewSelectMessage> | null;
  return (
    d?.type === "dsg-preview:select" &&
    typeof d.example === "string" &&
    typeof d.mode === "string"
  );
}

const post = (message: PreviewReadyMessage | PreviewModeMessage) =>
  window.parent.postMessage(message, "*");

// Icon paths from Lucide (ISC license): sun, moon, and a half circle for other modes.
function ModeIcon({ mode }: { mode: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4"
    >
      {mode === "light" ? (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </>
      ) : mode === "dark" ? (
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      ) : (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 0 0 0 20Z" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

function Preview() {
  const [exampleName, setExampleName] = useState(examples[0]?.name);
  const [mode, setMode] = useState(INITIAL_MODE);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // The frame's origin is opaque, so trust the sender window, not an origin string.
      if (event.source !== window.parent || !isSelect(event.data)) return;
      const { example, mode } = event.data;
      if (examples.some((e) => e.name === example)) setExampleName(example);
      if (config.modes.includes(mode)) setMode(mode);
    };
    window.addEventListener("message", onMessage);
    post({
      type: "dsg-preview:ready",
      examples: examples.map((e) => e.name),
      modes: config.modes,
      defaultMode: config.defaultMode,
      mode: INITIAL_MODE,
    });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Before paint, so a switch never flashes the other theme.
  useLayoutEffect(() => applyMode(mode), [mode]);

  // Cycles through every mode in the token file; with light + dark it's a toggle.
  const next =
    config.modes[(config.modes.indexOf(mode) + 1) % config.modes.length];
  const switchMode = () => {
    setMode(next);
    post({ type: "dsg-preview:mode", mode: next });
  };

  const example = examples.find((e) => e.name === exampleName) ?? examples[0];
  const canvas = mode === "dark" ? CANVAS.dark : CANVAS.light;
  return (
    <div
      data-canvas=""
      className={`flex min-h-screen flex-col text-foreground ${canvas.background}`}
    >
      {config.modes.length > 1 && (
        <div className="flex h-12 shrink-0 items-center justify-end px-3">
          <button
            type="button"
            onClick={switchMode}
            aria-label={`Switch to ${next} mode`}
            title={`Switch to ${next} mode`}
            className={`inline-flex size-8 items-center justify-center rounded-md border bg-transparent outline-none focus-visible:outline-2 focus-visible:outline-offset-2 ${canvas.button}`}
          >
            <ModeIcon mode={next} />
          </button>
        </div>
      )}
      <main
        aria-label={example.name}
        className="flex flex-1 items-center justify-center overflow-auto px-8 pb-8"
      >
        {example.render()}
      </main>
    </div>
  );
}

applyMode(INITIAL_MODE);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
);
