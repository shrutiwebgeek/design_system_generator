import { useEffect, useState } from "react";

/**
 * Full screen, with Esc to leave. Keys pressed inside the preview frame don't reach
 * this page (it's a separate document), so the button stays the sure way out.
 */
export function useFullScreen() {
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    if (!fullScreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullScreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullScreen]);

  return [fullScreen, setFullScreen] as const;
}
