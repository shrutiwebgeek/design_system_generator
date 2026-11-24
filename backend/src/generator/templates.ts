import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** A path, not a URL: under jsdom the global URL is jsdom's class, which node:fs rejects. */
export const TEMPLATES_DIR = join(import.meta.dirname, "../../templates");

/** Names of the templates that have a file, e.g. `(name) => `${name}.test.tsx``. */
export function templatesWith(fileOf: (name: string) => string): string[] {
  return readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(join(TEMPLATES_DIR, name, fileOf(name))));
}
