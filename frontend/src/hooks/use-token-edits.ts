import { isTokenValues } from "@dsg/design-data/preview-messages";
import { useEffect, useState } from "react";
import type { TokenEdits } from "@/lib/token-edits";

const storageKey = (source: string) => `dsg:token-edits:${source}`;

function read(source: string): TokenEdits {
  try {
    const raw = localStorage.getItem(storageKey(source));
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return isTokenValues(parsed) ? parsed : {};
  } catch {
    return {}; // blocked or corrupt storage: start clean
  }
}

/**
 * One component's token edits, kept in this browser until the download takes them
 * (saving them to the backend comes later).
 */
export function useTokenEdits(source: string) {
  const [edits, setEdits] = useState<TokenEdits>(() => read(source));

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(source), JSON.stringify(edits));
    } catch {
      // Private window or full storage: edits still work until reload.
    }
  }, [source, edits]);

  const edit = (key: string, scope: string, value: string) =>
    setEdits((prev) => ({ ...prev, [key]: { ...prev[key], [scope]: value } }));
  /** Back to the theme's values for these tokens, in one mode (or "*" for shared ones). */
  const reset = (keys: string[], scope: string) =>
    setEdits((prev) => {
      const next: TokenEdits = {};
      for (const [key, scopes] of Object.entries(prev)) {
        const left = keys.includes(key)
          ? Object.fromEntries(
              Object.entries(scopes).filter(([s]) => s !== scope),
            )
          : scopes;
        if (Object.keys(left).length > 0) next[key] = left;
      }
      return next;
    });

  return { edits, edit, reset };
}
