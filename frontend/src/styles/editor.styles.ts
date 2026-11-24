import { cn } from "@/lib/utils";
import { fill, row } from "./atoms";

// Atoms for the VS Code surfaces only; their colors are the --editor tokens in index.css.
/** VS Code's focus blue, drawn inside the edge so panels don't clip it. */
const focusInside =
  "focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-editor-focus";
const hoverLight = "hover:bg-white/10 hover:text-editor-tab-foreground";
const panelColumn = "flex min-h-0 flex-col";

/**
 * A code block that fills its panel. Default size, not "sm": sm's padding sits
 * behind a group-data variant that className can't override. text-xs gives
 * VS Code's 12px instead.
 */
const codeSurface = cn(fill, "rounded-none border-0 bg-editor text-xs");

/** Square buttons on the dark surfaces; looks held down while aria-pressed. */
export const iconButton = cn(
  hoverLight,
  focusInside,
  "inline-flex size-7 items-center justify-center rounded outline-none",
  "text-editor-foreground",
  "aria-pressed:bg-white/10 aria-pressed:text-editor-tab-foreground",
  "[&_svg]:size-4",
);

// File editor
export const editor = cn(panelColumn, "size-full");
export const editorSurface = cn(codeSurface, "text-editor-foreground");
export const editorHeader =
  "gap-0 bg-editor-tabs p-0 pe-2 text-editor-foreground";
export const fileTabs = "flex min-w-0 overflow-x-auto";
export const fileTab = cn(
  row,
  focusInside,
  "h-9 shrink-0 border-e border-editor-border px-3 outline-none",
  "text-[13px] text-editor-tab-inactive-foreground",
  "hover:text-editor-foreground",
  "data-active:bg-editor data-active:text-editor-tab-foreground",
  "[&_svg]:size-4",
);
export const editorActions = "gap-0.5";
export const copyButton = cn(hoverLight, "text-editor-foreground");
export const filePanel = cn(panelColumn, "flex-1 outline-none");
export const fileCode = cn(focusInside, "flex-1");
export const codeLine = "before:text-editor-line-number";

/** The blue of VS Code's default (Seti) icon theme. */
export const fileIcon = "text-[#519aba]";

// Workbench
export const workbenchPanel = panelColumn;
export const divider =
  "bg-editor-border hover:bg-editor-focus focus-visible:ring-editor-focus";

// Terminal
export const terminal = cn(panelColumn, "flex-1 bg-editor");
export const terminalHeader =
  "flex h-8 shrink-0 items-center justify-between ps-4 pe-2";
export const terminalTitle = cn(
  "border-b border-editor-tab-foreground pb-0.5",
  "text-[11px] tracking-wide text-editor-tab-foreground uppercase",
);
export const terminalSurface = cn(codeSurface, "text-terminal-foreground");
export const terminalCode = cn(focusInside, "flex-1 pt-1");
