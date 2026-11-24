import { cn } from "@/lib/utils";
import { center, column, fill, heading, note } from "./atoms";

export const main = cn(column, "min-w-0 flex-1");
export const tabs = cn(fill, "gap-0");

// Header: flat tabs on a bar, like Storybook's addon panel
export const panelHeader =
  "flex h-10 shrink-0 items-stretch justify-between border-b bg-card ps-1 pe-2";
export const tabList =
  "h-full gap-0 rounded-none p-0 group-data-horizontal/tabs:h-full";
/**
 * shadcn's inactive text-foreground/60 fails AA; muted-foreground is 6.11 on the card.
 * The underline sits on the header's bottom edge (shadcn puts it 5px below the tab).
 */
export const tab = cn(
  "h-full flex-none rounded-none px-3 text-muted-foreground",
  "group-data-horizontal/tabs:after:bottom-0",
);
export const panelActions = "flex items-center gap-1";
/** Base UI sets aria-disabled instead of disabled here, so the dimming hangs on it. */
export const downloadButton = cn(
  "aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
  "aria-disabled:hover:bg-transparent",
);
/** shadcn's default tooltip text is 12px. */
export const tipContent = "px-3 py-2 text-sm";

// Panels
export const panel = "min-h-0";
export const previewFrame = "block size-full";
/** Status text inside takes the editor's colors: the app's muted brown is ~2.5:1 here. */
export const editorPanel = cn(
  column,
  "size-full bg-editor text-editor-foreground",
  "[&_[data-status]]:text-editor-foreground",
);
export const status = cn(center, note, "size-full p-4");

// Controls
export const controls = cn(
  column,
  "w-72 shrink-0 gap-2 overflow-y-auto border-l p-4",
);
export const controlsTitle = cn(heading, "text-sm");
