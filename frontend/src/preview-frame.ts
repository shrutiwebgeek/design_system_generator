import type {
  PreviewModeMessage,
  PreviewReadyMessage,
  PreviewSelectMessage,
} from "@dsg/design-data/types";
import { useCallback, useEffect, useRef, useState } from "react";

const isStrings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");

function isReady(data: unknown): data is PreviewReadyMessage {
  const d = data as Partial<PreviewReadyMessage> | null;
  return (
    d?.type === "dsg-preview:ready" &&
    isStrings(d.examples) &&
    isStrings(d.modes) &&
    typeof d.defaultMode === "string" &&
    typeof d.mode === "string"
  );
}

function isMode(data: unknown): data is PreviewModeMessage {
  const d = data as Partial<PreviewModeMessage> | null;
  return d?.type === "dsg-preview:mode" && typeof d.mode === "string";
}

/**
 * The tool's side of the preview protocol (types in @dsg/design-data/types).
 * `info` is null until the frame reports in. It's replaced on every frame reload
 * (a new srcDoc), which is the cue to send the current selection again.
 * `onModeChange` fires when the frame's own mode button switches modes.
 */
export function usePreviewFrame(onModeChange: (mode: string) => void) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [info, setInfo] = useState<PreviewReadyMessage | null>(null);

  // The latest callback, without re-subscribing the listener on every render.
  const onModeChangeRef = useRef(onModeChange);
  useEffect(() => {
    onModeChangeRef.current = onModeChange;
  });

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // The frame's origin is opaque ("null"), so trust the sender window instead.
      if (event.source !== frameRef.current?.contentWindow) return;
      if (isReady(event.data)) setInfo(event.data);
      else if (isMode(event.data)) onModeChangeRef.current(event.data.mode);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const select = useCallback((example: string, mode: string) => {
    frameRef.current?.contentWindow?.postMessage(
      {
        type: "dsg-preview:select",
        example,
        mode,
      } satisfies PreviewSelectMessage,
      "*",
    );
  }, []);

  return { frameRef, info, select };
}
