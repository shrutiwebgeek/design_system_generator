// Every template's examples must render: they power the preview and ship as a
// usage reference. Runs against the raw templates.
import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { exampleNamesIn } from "../src/generator/example-names.ts";
import { TEMPLATES_DIR, templatesWith } from "../src/generator/templates.ts";

interface ExamplesModule {
  examples: { name: string; render: () => ReactNode }[];
}

const loadExamples = async (name: string) => {
  const module: ExamplesModule = await import(`./${name}/${name}.examples.tsx`);
  return module.examples;
};

describe.each(templatesWith((name) => `${name}.examples.tsx`))(
  "%s examples",
  (name) => {
    it("exports a non-empty list of uniquely named examples", async () => {
      const examples = await loadExamples(name);
      expect(examples.length).toBeGreaterThan(0);
      expect(new Set(examples.map((e) => e.name)).size).toBe(examples.length);
    });

    it("names its examples with literals the tool can read without running them", async () => {
      // The sidebar lists these names before any preview is built.
      const examples = await loadExamples(name);
      const code = readFileSync(
        join(TEMPLATES_DIR, name, `${name}.examples.tsx`),
        "utf8",
      );
      expect(exampleNamesIn(code)).toEqual(examples.map((e) => e.name));
    });

    it("renders every example without throwing", async () => {
      for (const example of await loadExamples(name)) {
        const { container, unmount } = render(<>{example.render()}</>);
        expect(container.childElementCount, example.name).toBeGreaterThan(0);
        unmount();
      }
    });
  },
);
