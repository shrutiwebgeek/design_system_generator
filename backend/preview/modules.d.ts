// Virtual modules supplied by src/preview/build-preview.ts at bundle time.

declare module "preview:config" {
  const config: {
    /** Component label from component_list.json, e.g. "Button". */
    label: string;
    /** Every mode in the token file; the default mode is the unclassed :root. */
    modes: string[];
    defaultMode: string;
  };
  export default config;
}

declare module "preview:examples" {
  import type { ReactNode } from "react";
  export const examples: { name: string; render: () => ReactNode }[];
}
