import type { ComponentSummary } from "@dsg/design-data/types";
import { useState } from "react";
import { isReady, type Selection } from "@/lib/component-catalog";

/**
 * The open story. Until something is picked, and whenever the pick no longer
 * exists, it's the first story of the first ready component.
 */
export function useSelection(components: ComponentSummary[] = []) {
  const [picked, select] = useState<Selection | null>(null);

  const ready = components.filter(isReady);
  const component = ready.find((c) => c.source === picked?.source) ?? ready[0];
  if (!component) return { component: undefined, selected: undefined, select };

  const story =
    picked?.source === component.source &&
    component.stories.includes(picked.story)
      ? picked.story
      : component.stories[0];
  const selected: Selection | undefined = story
    ? { source: component.source, story }
    : undefined;
  return { component, selected, select };
}
