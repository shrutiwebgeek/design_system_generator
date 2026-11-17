import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { compile } from "tailwindcss";

/** Compile CSS the way Tailwind's Vite plugin would, resolving `@import "tailwindcss"` from node_modules. */
export async function compileTailwind(css: string) {
  const require = createRequire(import.meta.url);
  const twDir = dirname(require.resolve("tailwindcss/package.json"));
  return compile(`@import "tailwindcss";\n${css}`, {
    base: process.cwd(),
    loadStylesheet: async (id: string) => {
      const file =
        id === "tailwindcss"
          ? join(twDir, "index.css")
          : join(twDir, id.replace(/^tailwindcss\//, ""));
      return {
        path: file,
        base: dirname(file),
        content: readFileSync(file, "utf8"),
      };
    },
  });
}

/** The first CSS rule for a plain class selector, or undefined. */
export function ruleFor(css: string, className: string): string | undefined {
  const escaped = className.replace(/[-.[\]()=:&*'/!]/g, (c) => "\\" + c);
  return new RegExp(`\\.${escaped} \\{[^}]*\\}`).exec(css)?.[0];
}
