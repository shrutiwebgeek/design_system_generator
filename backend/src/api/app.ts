import express, {
  type ErrorRequestHandler,
  type Request,
  type Response,
} from "express";
import {
  componentList,
  defaultTokens,
  mapping,
  type ApiError,
  type ComponentSummary,
  type GenerateRequest,
  type GenerateResponse,
  type Tier,
  type TokenFile,
} from "@dsg/design-data";
import {
  generateComponent,
  hasExamples,
  hasTemplate,
  TemplateNotFoundError,
} from "../generator/generate.ts";
import {
  buildPreview,
  NoExamplesError,
  PreviewBuildError,
} from "../preview/build-preview.ts";

/** Shallow shape check. Deep validation (aliases, mode parity, contrast) is the token validator's job. */
function isTokenFile(value: unknown): value is TokenFile {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const meta = v.meta as Record<string, unknown> | undefined;
  return (
    typeof meta === "object" &&
    meta !== null &&
    typeof meta.defaultMode === "string" &&
    typeof v.primitive === "object" &&
    v.primitive !== null &&
    typeof v.modes === "object" &&
    v.modes !== null &&
    meta.defaultMode in (v.modes as object)
  );
}

/** The request's tokens, the defaults when omitted, or null after answering 400. */
function tokensFrom(req: Request, res: Response): TokenFile | null {
  const body = (req.body ?? {}) as GenerateRequest;
  if (body.tokens === undefined) return defaultTokens;
  if (isTokenFile(body.tokens)) return body.tokens;
  res.status(400).json({
    error: "Invalid token file",
    detail:
      "Expected meta.defaultMode, primitive and modes, with defaultMode present in modes.",
  } satisfies ApiError);
  return null;
}

function sendGenerationError(res: Response, err: unknown): void {
  if (err instanceof TemplateNotFoundError || err instanceof NoExamplesError) {
    res.status(404).json({ error: err.message } satisfies ApiError);
  } else if (err instanceof PreviewBuildError) {
    // Generated code that doesn't bundle is our bug, not the caller's.
    res.status(500).json({
      error: "Preview build failed",
      detail: err.message,
    } satisfies ApiError);
  } else {
    // Token resolution errors (missing path, alias cycle, bad px value) are the caller's to fix.
    res.status(422).json({
      error: "Tokens could not be resolved",
      detail: (err as Error).message,
    } satisfies ApiError);
  }
}

/** Aliases share a source (Modal → dialog); the first entry is the canonical label. */
function labelFor(source: string): string {
  for (const entries of Object.values(componentList)) {
    const entry = entries.find((e) => e.source === source);
    if (entry) return entry.label;
  }
  return source;
}

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/components", async (_req, res) => {
    const tiers = Object.keys(componentList) as Tier[];
    const summaries: ComponentSummary[] = [];
    for (const tier of tiers) {
      for (const entry of componentList[tier]) {
        const available =
          entry.source !== null && (await hasTemplate(entry.source));
        summaries.push({
          ...entry,
          tier,
          available,
          previewable: available && (await hasExamples(entry.source!)),
        });
      }
    }
    res.json(summaries);
  });

  app.post("/api/components/:source/generate", async (req, res) => {
    const tokens = tokensFrom(req, res);
    if (!tokens) return;
    try {
      const result: GenerateResponse = await generateComponent(
        req.params.source,
        tokens,
        mapping,
      );
      res.json(result);
    } catch (err) {
      sendGenerationError(res, err);
    }
  });

  app.post("/api/components/:source/preview", async (req, res) => {
    const tokens = tokensFrom(req, res);
    if (!tokens) return;
    try {
      const html = await buildPreview(
        req.params.source,
        tokens,
        mapping,
        labelFor(req.params.source),
      );
      res.type("html").send(html);
    } catch (err) {
      sendGenerationError(res, err);
    }
  });

  // Malformed JSON bodies and anything unexpected end up here instead of an HTML stack trace.
  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    const status = typeof err?.status === "number" ? err.status : 500;
    res.status(status).json({
      error: status === 500 ? "Internal error" : String(err.message),
    } satisfies ApiError);
  };
  app.use(onError);

  return app;
}
