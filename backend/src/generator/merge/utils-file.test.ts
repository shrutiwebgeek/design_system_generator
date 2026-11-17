import { rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { mapping } from "@dsg/design-data";
import { afterAll, describe, expect, it } from "vitest";
import { generateUtilsFile } from "./utils-file.ts";

const source = generateUtilsFile(mapping);

describe("generateUtilsFile", () => {
  it("lists every ds- spacing utility and text style", () => {
    expect(source).toContain('"ds-control-md"');
    expect(source).toContain('"ds-icon-sm"');
    expect(source).toContain('"heading-lg"');
    expect(source).not.toContain('"description"');
  });

  describe("the generated cn", async () => {
    // The generated file is valid JS as well as TS: write it next to node_modules and import it.
    const file = fileURLToPath(
      new URL("./.generated-utils.test-tmp.mjs", import.meta.url),
    );
    writeFileSync(file, source);
    afterAll(() => rmSync(file, { force: true }));
    const { cn } = (await import(file)) as {
      cn: (...classes: string[]) => string;
    };

    it("lets a later ds- class override an earlier one", () => {
      expect(cn("px-ds-md", "px-ds-sm")).toBe("px-ds-sm");
      expect(cn("h-ds-control-md", "h-ds-control-sm")).toBe("h-ds-control-sm");
      expect(
        cn(
          "has-data-[icon=inline-end]:pr-ds-sm",
          "has-data-[icon=inline-end]:pr-ds-xs",
        ),
      ).toBe("has-data-[icon=inline-end]:pr-ds-xs");
    });

    it("treats a text style as a font size but not as a color", () => {
      expect(cn("text-sm", "text-heading-lg")).toBe("text-heading-lg");
      expect(cn("text-primary", "text-heading-lg")).toBe(
        "text-primary text-heading-lg",
      );
    });
  });
});
