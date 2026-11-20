import type { ComponentSummary } from "@dsg/design-data/types";

/** Ready means it can be previewed, which implies it can be generated. */
export const isReady = (c: ComponentSummary) => c.previewable;
