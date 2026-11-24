import type { RefObject } from "react";
import { usePreview } from "@/api";
import { previewFrame } from "@/styles/workspace.styles";
import { PanelStatus } from "./panel-status";

interface PreviewPanelProps {
  source: string;
  label: string;
  frameRef: RefObject<HTMLIFrameElement | null>;
}

/** The server-built preview, in a sandboxed frame. */
export function PreviewPanel({ source, label, frameRef }: PreviewPanelProps) {
  const { data, error } = usePreview(source);
  // Data first: a failed background refetch shouldn't replace a working preview.
  if (data === undefined) {
    return error ? (
      <PanelStatus alert>{error.message}</PanelStatus>
    ) : (
      <PanelStatus>Building preview…</PanelStatus>
    );
  }

  return (
    // allow-scripts only: the frame gets an opaque origin, so preview code
    // can't reach this page's DOM, cookies or storage.
    <iframe
      ref={frameRef}
      title={`${label} preview`}
      sandbox="allow-scripts"
      srcDoc={data}
      className={previewFrame}
    />
  );
}
