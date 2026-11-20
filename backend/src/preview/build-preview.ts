import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { Mapping, TokenFile } from "@dsg/design-data";
import { build, type Plugin } from "esbuild";
import { generateComponent } from "../generator/generate.ts";
import { compileTailwind } from "../generator/theme/compile-tailwind.ts";

const BACKEND_DIR = fileURLToPath(new URL("../../", import.meta.url));
const SHELL = fileURLToPath(
  new URL("../../preview/shell.tsx", import.meta.url),
);

export class NoExamplesError extends Error {}
/** The generated code didn't bundle: a generator or template bug, not the caller's. */
export class PreviewBuildError extends Error {}

function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}

/**
 * Builds one self-contained HTML document: the *generated* component and its
 * *generated* examples (the same code a download contains), bundled with React
 * and Base UI, plus Tailwind CSS compiled against the generated theme.
 */
export async function buildPreview(
  source: string,
  tokens: TokenFile,
  mapping: Mapping,
  label: string,
): Promise<string> {
  const generated = await generateComponent(source, tokens, mapping);
  const examples = generated.files[`${source}.examples.tsx`];
  if (examples === undefined) {
    throw new NoExamplesError(`No preview examples for "${source}"`);
  }

  // Everything the bundle needs that isn't on disk. Relative imports between
  // generated files ("./button") resolve by file name without extension.
  const modules: Record<string, { contents: string; loader: "tsx" | "json" }> =
    {
      "preview:examples": { contents: examples, loader: "tsx" },
      "preview:config": {
        contents: JSON.stringify({
          label,
          modes: Object.keys(tokens.modes),
          defaultMode: tokens.meta.defaultMode,
        }),
        loader: "json",
      },
      "@/lib/utils": {
        contents: generated.shared["lib/utils.ts"],
        loader: "tsx",
      },
    };
  for (const [file, contents] of Object.entries(generated.files)) {
    if (file.endsWith(".tsx") && !file.endsWith(".test.tsx")) {
      modules[`./${file.replace(/\.tsx$/, "")}`] = { contents, loader: "tsx" };
    }
  }

  const virtualModules: Plugin = {
    name: "preview-virtual-modules",
    setup(b) {
      b.onResolve(
        { filter: /^(preview:config|preview:examples|@\/lib\/utils)$/ },
        (args) => ({ path: args.path, namespace: "virtual" }),
      );
      b.onResolve({ filter: /^\.\//, namespace: "virtual" }, (args) => ({
        path: args.path,
        namespace: "virtual",
      }));
      b.onLoad({ filter: /.*/, namespace: "virtual" }, (args) => {
        const mod = modules[args.path];
        if (!mod) return { errors: [{ text: `Unknown module ${args.path}` }] };
        // Bare imports (react, @base-ui/react, cn) resolve from the backend.
        return { ...mod, resolveDir: BACKEND_DIR };
      });
    },
  };

  let bundle;
  try {
    bundle = await build({
      entryPoints: [SHELL],
      bundle: true,
      write: false,
      format: "iife",
      platform: "browser",
      target: "es2022",
      jsx: "automatic",
      minify: true,
      legalComments: "none",
      logLevel: "silent",
      define: { "process.env.NODE_ENV": '"production"' },
      plugins: [virtualModules],
    });
  } catch (error) {
    throw new PreviewBuildError((error as Error).message);
  }
  const js = bundle.outputFiles[0].text;

  // Tailwind only emits CSS for classes it sees. Feed it every class string in
  // the generated sources and the shell. Not splitting on single quotes:
  // [&_svg:not([class*='size-'])]:size-4 contains them.
  const shell = await readFile(SHELL, "utf8");
  const candidates = [
    shell,
    ...Object.values(modules).map((m) => m.contents),
  ].flatMap((code) => code.split(/[\s"`]+/));
  const compiler = await compileTailwind(generated.shared["theme.css"]);
  const css = compiler.build(candidates);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(label)} preview</title>
<style>${css.replace(/<\/style/gi, "<\\/style")}</style>
</head>
<body>
<div id="root"></div>
<script>${js.replace(/<\/script/gi, "<\\/script")}</script>
</body>
</html>
`;
}
