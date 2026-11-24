import type {
  ApiError,
  ComponentSummary,
  GenerateRequest,
  GenerateResponse,
} from "@dsg/design-data/types";
import { useQuery } from "@tanstack/react-query";

const isApiError = (body: unknown): body is ApiError =>
  typeof body === "object" &&
  body !== null &&
  "error" in body &&
  typeof body.error === "string";

/** Throws with the server's error message, so components can show it. */
async function send(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null);
    throw new Error(
      isApiError(body)
        ? [body.error, body.detail].filter(Boolean).join(": ")
        : `HTTP ${res.status}`,
    );
  }
  return res;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return (await (await send(path, init)).json()) as T;
}

const postTokens = (tokens: GenerateRequest["tokens"]): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ tokens } satisfies GenerateRequest),
});

export function useComponents() {
  return useQuery({
    queryKey: ["components"],
    queryFn: () => request<ComponentSummary[]>("/api/components"),
  });
}

/**
 * Generation is a POST, but it has no side effects: same source + tokens, same output.
 * That makes it a read, so it's a query (cached, deduped) rather than a mutation.
 */
export function useGeneratedComponent(
  source: string,
  tokens?: GenerateRequest["tokens"],
) {
  return useQuery({
    queryKey: ["generate", source, tokens ?? "default"],
    queryFn: () =>
      request<GenerateResponse>(
        `/api/components/${encodeURIComponent(source)}/generate`,
        postTokens(tokens),
      ),
  });
}

/** The server-built preview: one self-contained HTML document for an iframe's srcdoc. */
export function usePreview(source: string, tokens?: GenerateRequest["tokens"]) {
  return useQuery({
    queryKey: ["preview", source, tokens ?? "default"],
    queryFn: async () =>
      (
        await send(
          `/api/components/${encodeURIComponent(source)}/preview`,
          postTokens(tokens),
        )
      ).text(),
  });
}
