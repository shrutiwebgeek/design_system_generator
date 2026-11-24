// Atomic classes: one small job each, reused across features. Compose them with
// cn() in a feature's *.styles.ts; whole elements don't belong here.

/** Keyboard focus for the tool's own controls: a solid outline, 4.17:1 on the cream. */
export const focusRing =
  "outline-none focus-visible:outline-2 focus-visible:outline-ring";
export const hoverTint = "hover:bg-muted";

// Layout
export const row = "flex items-center gap-1.5";
export const column = "flex flex-col";
export const center = "flex items-center justify-center";
/** Takes the space that's left and scrolls inside it instead of growing. */
export const fill = "min-h-0 flex-1";

// Text
export const mutedText = "text-muted-foreground";
export const note = "text-sm text-muted-foreground";
export const heading = "font-heading font-semibold";

// Icons
export const iconSm = "size-4 shrink-0";
