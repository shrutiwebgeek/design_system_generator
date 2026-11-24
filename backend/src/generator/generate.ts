import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { GenerateResponse, Mapping, TokenFile } from "@dsg/design-data";
import backendPackage from "../../package.json" with { type: "json" };
import { exampleNamesIn } from "./example-names.ts";
import { generateUtilsFile } from "./merge/utils-file.ts";
import { createRewriter } from "./rewrite/rewrite.ts";
import { TEMPLATES_DIR } from "./templates.ts";
import { generateThemeCss } from "./theme/theme.ts";

/** Registry names only: lowercase, digits, dashes. Anything else could escape the templates dir. */
const SOURCE_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface TemplateMeta {
  name: string;
  style: string;
  files: { file: string; sha256: string; npmImports: string[] }[];
}

export class TemplateNotFoundError extends Error {}

const readTemplateFile = (source: string, file: string): Promise<string> =>
  readFile(join(TEMPLATES_DIR, source, file), "utf8");

async function readTemplateMeta(source: string): Promise<TemplateMeta> {
  if (!SOURCE_NAME.test(source))
    throw new TemplateNotFoundError(`Invalid component name "${source}"`);
  try {
    const raw = await readTemplateFile(source, "template.json");
    return JSON.parse(raw) as TemplateMeta;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      throw new TemplateNotFoundError(`No template for "${source}"`);
    throw error;
  }
}

export async function hasTemplate(source: string): Promise<boolean> {
  try {
    await readTemplateMeta(source);
    return true;
  } catch (error) {
    if (error instanceof TemplateNotFoundError) return false;
    throw error;
  }
}

async function readOptional(
  source: string,
  file: string,
): Promise<string | null> {
  try {
    return await readTemplateFile(source, file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

/**
 * The template's example names, read without running it. A template can be
 * previewed once it has some; [] without a template or an examples file.
 */
export async function readExampleNames(source: string): Promise<string[]> {
  if (!(await hasTemplate(source))) return [];
  const examples = await readOptional(source, `${source}.examples.tsx`);
  return examples === null ? [] : exampleNamesIn(examples);
}

/** npm packages the user installs, with the versions this backend was verified against. */
function dependenciesFor(meta: TemplateMeta): Record<string, string> {
  const installed: Record<string, string> = backendPackage.dependencies;
  // The rewritten component imports @/lib/utils instead of cn, but lib/utils.ts imports cn/config.
  const names = new Set([...meta.files.flatMap((f) => f.npmImports), "cn"]);
  return Object.fromEntries(
    [...names].sort().map((name) => [name, installed[name] ?? "*"]),
  );
}

/** Everything the generator makes. The preview and the download need `shared`; the API response doesn't carry it. */
export interface GeneratedComponent extends GenerateResponse {
  /** Files every component needs once: theme.css, lib/utils.ts, dependencies.json. */
  shared: Record<string, string>;
}

/**
 * Template → component files + shared files + warnings.
 * Throws TemplateNotFoundError for unknown components, and plain Errors for
 * tokens that don't resolve (missing paths, alias cycles).
 */
export async function generateComponent(
  source: string,
  tokens: TokenFile,
  mapping: Mapping,
): Promise<GeneratedComponent> {
  const meta = await readTemplateMeta(source);
  // Built first so broken tokens fail before any file work.
  const themeCss = generateThemeCss(tokens, mapping);
  const { rewriteSource } = createRewriter(tokens, mapping);

  const files: Record<string, string> = {};
  const warnings = new Map<string, GenerateResponse["warnings"][number]>();
  const addRewritten = (file: string, code: string): void => {
    const result = rewriteSource(code, file);
    files[file] = result.code;
    for (const w of result.warnings) warnings.set(w.original, w);
  };

  for (const { file } of meta.files)
    addRewritten(file, await readTemplateFile(meta.name, file));

  // The predefined test ships as-is: it tests behaviour, not classes.
  const testFile = `${source}.test.tsx`;
  const test = await readOptional(source, testFile);
  if (test !== null) files[testFile] = test;

  // Examples are a usage reference that ships, so their layout classes go
  // through the same rewrite as the component (gap-2 → gap-ds-sm).
  const examplesFile = `${source}.examples.tsx`;
  const examples = await readOptional(source, examplesFile);
  if (examples !== null) addRewritten(examplesFile, examples);

  return {
    source,
    files,
    shared: {
      "theme.css": themeCss,
      "lib/utils.ts": generateUtilsFile(mapping),
      "dependencies.json":
        JSON.stringify({ dependencies: dependenciesFor(meta) }, null, 2) + "\n",
    },
    warnings: [...warnings.values()],
  };
}
