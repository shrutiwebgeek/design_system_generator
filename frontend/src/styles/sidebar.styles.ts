import { cn } from "@/lib/utils";
import {
  center,
  column,
  focusRing,
  hoverTint,
  iconSm,
  mutedText,
  note,
  row,
} from "./atoms";

// Panel
export const sidebar = "w-64 shrink-0 border-r";
export const content = cn(column, "gap-3 p-3");
export const loading = cn(note, "p-4");
export const error = "p-4 text-sm text-destructive";
export const noMatch = cn(note, "px-2 py-3");

// Search
export const searchIcon = cn(
  mutedText,
  "size-4",
  "pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2",
);
export const searchInput = cn(
  "pr-8 pl-8",
  "[&::-webkit-search-cancel-button]:hidden",
);
export const clearButton = cn(
  center,
  mutedText,
  focusRing,
  hoverTint,
  "size-6 rounded hover:text-foreground",
  "absolute top-1/2 right-1.5 -translate-y-1/2",
);

// Tree
/** One level deeper, with an indent guide. */
export const branch = cn(column, "ms-3.5 border-s border-border/70 ps-1");

/** Every clickable row: folders and files. */
const treeRow = cn(
  row,
  focusRing,
  hoverTint,
  "w-full rounded-md py-1 text-left text-sm",
);

const folderRow = cn(
  treeRow,
  "group px-1.5",
  "[&_svg]:size-4 [&_svg]:shrink-0",
);
export const folderRows = {
  folder: folderRow,
  category: cn(folderRow, "text-xs font-semibold tracking-wide uppercase"),
  group: cn(folderRow, mutedText),
};
export type FolderKind = keyof typeof folderRows;

// Base UI marks an expanded trigger with data-panel-open; the row is the `group`.
export const chevron = cn(
  mutedText,
  "transition-transform group-data-panel-open:rotate-90",
);
export const folderIcon = "text-ring group-data-panel-open:hidden";
export const folderOpenIcon = "hidden text-ring group-data-panel-open:block";
export const kindIcon = "flex text-ring";

export const exampleFile = cn(
  treeRow,
  "ps-6 pe-2",
  "aria-[current=page]:bg-secondary",
  "aria-[current=page]:text-secondary-foreground",
);
export const exampleFileIcon = cn(iconSm, mutedText);
export const inProgressItem = cn(row, note, "py-1 ps-6 pe-2");
