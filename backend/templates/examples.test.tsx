// Every template's examples must render: they power the preview and ship as a
// usage reference. Runs against the raw templates.
import { render } from "@testing-library/react";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

// A path string, not new URL(...): under jsdom the global URL is jsdom's class,
// which node:fs rejects ("The URL must be of scheme file").
const templatesDir = import.meta.dirname;
const withExamples = readdirSync(templatesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) =>
    readdirSync(join(templatesDir, name)).includes(`${name}.examples.tsx`),
  );

describe.each(withExamples)("%s examples", (name) => {
  it("exports a non-empty list of uniquely named examples", async () => {
    const { examples } = (await import(`./${name}/${name}.examples.tsx`)) as {
      examples: { name: string; render: () => ReactNode }[];
    };
    expect(examples.length).toBeGreaterThan(0);
    expect(new Set(examples.map((e) => e.name)).size).toBe(examples.length);
  });

  it("renders every example without throwing", async () => {
    const { examples } = (await import(`./${name}/${name}.examples.tsx`)) as {
      examples: { name: string; render: () => ReactNode }[];
    };
    for (const example of examples) {
      const { container, unmount } = render(<>{example.render()}</>);
      expect(container.childElementCount, example.name).toBeGreaterThan(0);
      unmount();
    }
  });
});
