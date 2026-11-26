// Every template's stories must render: they power the preview and ship as a
// usage reference. Runs against the raw templates.
import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { storyNamesIn } from "../src/generator/story-names.ts";
import { TEMPLATES_DIR, templatesWith } from "../src/generator/templates.ts";

interface StoriesModule {
  stories: { name: string; render: () => ReactNode }[];
}

const loadStories = async (name: string) => {
  const module: StoriesModule = await import(`./${name}/${name}.stories.tsx`);
  return module.stories;
};

describe.each(templatesWith((name) => `${name}.stories.tsx`))(
  "%s stories",
  (name) => {
    it("exports a non-empty list of uniquely named stories", async () => {
      const stories = await loadStories(name);
      expect(stories.length).toBeGreaterThan(0);
      expect(new Set(stories.map((e) => e.name)).size).toBe(stories.length);
    });

    it("names its stories with literals the tool can read without running them", async () => {
      // The sidebar lists these names before any preview is built.
      const stories = await loadStories(name);
      const code = readFileSync(
        join(TEMPLATES_DIR, name, `${name}.stories.tsx`),
        "utf8",
      );
      expect(storyNamesIn(code)).toEqual(stories.map((e) => e.name));
    });

    it("renders every story without throwing", async () => {
      for (const story of await loadStories(name)) {
        const { container, unmount } = render(<>{story.render()}</>);
        expect(container.childElementCount, story.name).toBeGreaterThan(0);
        unmount();
      }
    });
  },
);
