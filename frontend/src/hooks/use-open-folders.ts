import type { ComponentSummary } from "@dsg/design-data/types";
import { useState } from "react";
import type { Selection } from "@/lib/component-catalog";

/** Open state for one folder, ready to spread onto a TreeFolder. */
export type FolderState = (id: string) => {
  open: boolean;
  onOpenChange: (next: boolean) => void;
};

/**
 * Which folders are open. Starts with the path to the selection open.
 * `forceOpen` (a search is on) opens every folder without forgetting the choices.
 */
export function useOpenFolders(
  components: ComponentSummary[],
  selected: Selection | undefined,
  forceOpen: boolean,
): FolderState {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => {
    const start = components.find((c) => c.source === selected?.source);
    return new Set([
      "design-system",
      ...(start ? [`tier:${start.tier}`, `component:${start.source}`] : []),
    ]);
  });

  return (id) => ({
    open: forceOpen || open.has(id),
    onOpenChange: (next) =>
      setOpen((prev) => {
        const copy = new Set(prev);
        if (next) copy.add(id);
        else copy.delete(id);
        return copy;
      }),
  });
}
