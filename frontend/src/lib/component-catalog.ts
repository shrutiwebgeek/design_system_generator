import type { ComponentSummary, Tier } from "@dsg/design-data/types";

export const TIERS: readonly { tier: Tier; label: string }[] = [
  { tier: "atoms", label: "Atoms" },
  { tier: "molecules", label: "Molecules" },
  { tier: "organisms", label: "Organisms" },
];

/** A component the tool can show: it has a template, so `source` is never null. */
export interface ReadyComponent extends ComponentSummary {
  source: string;
}

/** The open story: a component and one of its stories. */
export interface Selection {
  source: string;
  story: string;
}

export const isReady = (c: ComponentSummary): c is ReadyComponent =>
  c.previewable && c.source !== null;

/** `query` is already trimmed and lowercase. */
export const matches = (c: ComponentSummary, query: string): boolean =>
  c.label.toLowerCase().includes(query) ||
  (c.source ?? "").toLowerCase().includes(query);
