// Fixtures for the "generated" Vitest project, written when vitest.config.ts loads.
// Not a globalSetup: Vitest collects test files before globalSetup runs, so on a
// clean checkout the project found no files (verified 2026-11-18).
//
// Every predefined test ships next to the *generated* component, not the raw
// template. So before that project runs, generate each template that has a test
// (default tokens) into backend/.generated/, laid out the way a download is:
//   .generated/<source>/<source>.tsx + <source>.test.tsx
//   .generated/lib/utils.ts            (resolved via the "@/lib/utils" alias)
import { existsSync } from "node:fs";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { defaultTokens, mapping } from "@dsg/design-data";
import { generateComponent } from "./src/generator/generate.ts";

export const GENERATED_DIR = new URL("./.generated/", import.meta.url);
const TEMPLATES_DIR = new URL("./templates/", import.meta.url);

export async function generateFixtures(): Promise<void> {
  await rm(GENERATED_DIR, { recursive: true, force: true });
  await mkdir(new URL("lib/", GENERATED_DIR), { recursive: true });

  const entries = await readdir(TEMPLATES_DIR, { withFileTypes: true });
  const sources = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) =>
      existsSync(new URL(`${name}/${name}.test.tsx`, TEMPLATES_DIR)),
    );

  let utils: string | undefined;
  for (const source of sources) {
    const { files, shared } = await generateComponent(
      source,
      defaultTokens,
      mapping,
    );
    const dir = new URL(`${source}/`, GENERATED_DIR);
    await mkdir(dir, { recursive: true });
    for (const [name, code] of Object.entries(files)) {
      await writeFile(new URL(name, dir), code);
    }
    utils = shared["lib/utils.ts"];
  }
  if (utils !== undefined) {
    await writeFile(new URL("lib/utils.ts", GENERATED_DIR), utils);
  }
}
