import {
  isModeMessage,
  isReadyMessage,
} from "@dsg/design-data/preview-messages";
import type {
  PreviewReadyMessage,
  PreviewSelectMessage,
} from "@dsg/design-data/types";
import { useEffect, useEffectEvent, useRef, useState } from "react";

interface PreviewFrameOptions {
  story: string;
  /** null until the user switches modes in the frame: the frame's own mode applies. */
  mode: string | null;
  /** The frame's own mode button switched modes. */
  onModeChange: (mode: string) => void;
}

/**
 * The tool's side of the preview protocol (types in @dsg/design-data/types): keeps
 * the frame on the tool's story and mode. Returns the ref for the iframe.
 */
export function usePreviewFrame({
  story,
  mode,
  onModeChange,
}: PreviewFrameOptions) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  // null until the frame reports in. Replaced on every frame reload (a new srcDoc),
  // which is the cue to send the current selection again.
  const [info, setInfo] = useState<PreviewReadyMessage | null>(null);

  // Reads the latest onModeChange without re-subscribing when it changes.
  const onMessage = useEffectEvent((event: MessageEvent<unknown>) => {
    // The frame's origin is opaque ("null"), so trust the sender window instead.
    if (event.source !== frameRef.current?.contentWindow) return;
    if (isReadyMessage(event.data)) setInfo(event.data);
    else if (isModeMessage(event.data)) onModeChange(event.data.mode);
  });

  useEffect(() => {
    const listener = (event: MessageEvent<unknown>) => onMessage(event);
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  useEffect(() => {
    if (!info) return;
    // Anything the frame doesn't know falls back to what it opened with.
    const message: PreviewSelectMessage = {
      type: "dsg-preview:select",
      story: info.stories.includes(story) ? story : (info.stories[0] ?? story),
      mode: mode !== null && info.modes.includes(mode) ? mode : info.mode,
    };
    frameRef.current?.contentWindow?.postMessage(message, "*");
  }, [info, story, mode]);

  return frameRef;
}
