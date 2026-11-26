// Virtual modules supplied by src/preview/build-preview.ts at bundle time.

declare module "preview:config" {
  import type { ComponentTokenInfo } from "@dsg/design-data/types";
  const config: {
    /** Component label from component_list.json, e.g. "Button". */
    label: string;
    /** Every mode in the token file; the default mode is the unclassed :root. */
    modes: string[];
    defaultMode: string;
    /** The component's own tokens, with their values from the token file. */
    tokens: ComponentTokenInfo[];
    /** Per component prop, a note for each option, e.g. { size: { xs: "24px" } }. */
    details: Record<string, Record<string, string>>;
  };
  export default config;
}

/** The generated <source>.stories.tsx. */
declare module "preview:stories" {
  import type { StoryArgs, StoryControl } from "@dsg/design-data/types";
  import type { ReactNode } from "react";
  type StoryProps = Record<string, unknown>;
  export const stories: {
    name: string;
    props?: StoryProps;
    controls: string[];
    render?: (args: StoryArgs, props: StoryProps) => ReactNode;
  }[];
  export const args: StoryArgs;
  export const controls: Record<string, StoryControl>;
  export const render: (args: StoryArgs, props: StoryProps) => ReactNode;
}
