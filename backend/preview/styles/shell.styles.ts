// Tool chrome, not tokens: colors are hex on purpose, so no token file can restyle
// them. The builder scans every file under preview/ for classes.

/** Plain join: nothing here conflicts, and cn() would add 13 KB to every preview. */
const cx = (...parts: string[]): string => parts.join(" ");

const focusOutline =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2";

const canvasBase = "flex min-h-screen flex-col text-foreground";

/** Outline only: no fill, a border and icon that contrast with the canvas. */
const modeButtonBase = cx(
  "inline-flex size-8 items-center justify-center rounded-md border bg-transparent",
  focusOutline,
);

/**
 * Light: a neutral grey, not the token background. A full-bleed light token
 * background was the brightest, largest surface on screen and cool against the
 * tool's warm cream; #E0E0E0 has luminance 0.745, below the cream's 0.868. I chose
 * comfort over accuracy here: light mode doesn't show components on their real
 * background. Button border #525252 is 5.92:1 on the grey, icon #171717 13.58.
 */
const light = {
  canvas: cx(canvasBase, "bg-[#e0e0e0]"),
  modeButton: cx(
    modeButtonBase,
    "border-[#525252] text-[#171717]",
    "hover:bg-[#0000000d] focus-visible:outline-[#171717]",
  ),
};

/**
 * Dark: the token background, full bleed. The button is translucent white, so it
 * holds on any dark background: border 9.13:1 on the default #0F172A, icon 17.85.
 */
const dark = {
  canvas: cx(canvasBase, "bg-background"),
  modeButton: cx(
    modeButtonBase,
    "border-[#ffffffb3] text-[#ffffff]",
    "hover:bg-[#ffffff1a] focus-visible:outline-[#ffffff]",
  ),
};

export const stylesFor = (mode: string) => (mode === "dark" ? dark : light);

export const toolbar = "flex h-12 shrink-0 items-center justify-end px-3";
export const stage =
  "flex flex-1 items-center justify-center overflow-auto px-8 pb-8";
