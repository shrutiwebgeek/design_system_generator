// Raw templates must stay byte-identical to the registry: template.json records
// the sha256 of each file at sync time. A formatter or a hand edit breaks this
// silently otherwise (it happened once, 2026-11-20: Prettier run from backend/
// skipped the root .prettierignore). Re-sync instead of editing a template.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const templatesDir = join(import.meta.dirname, "../../templates");
const templates = readdirSync(templatesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) =>
    readdirSync(join(templatesDir, name)).includes("template.json"),
  );

describe.each(templates)("%s template", (name) => {
  const meta = JSON.parse(
    readFileSync(join(templatesDir, name, "template.json"), "utf8"),
  ) as { files: { file: string; sha256: string }[] };

  it.each(meta.files)("$file matches the sha256 recorded at sync", (entry) => {
    const content = readFileSync(join(templatesDir, name, entry.file));
    expect(createHash("sha256").update(content).digest("hex")).toBe(
      entry.sha256,
    );
  });
});
