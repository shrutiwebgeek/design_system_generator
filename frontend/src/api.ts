import type {
  ApiError,
  ComponentSummary,
  GenerateRequest,
  GenerateResponse,
} from "@dsg/design-data/types";
import { useQuery } from "@tanstack/react-query";

/** Throws with the server's error message, so components can show it. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiError | null;
    throw new Error(body ? [body.error, body.detail].filter(Boolean).join(": ") : `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

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
export function useGeneratedComponent(source: string, tokens?: GenerateRequest["tokens"]) {
  return useQuery({
    queryKey: ["generate", source, tokens ?? "default"],
    queryFn: () =>
      request<GenerateResponse>(`/api/components/${encodeURIComponent(source)}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tokens } satisfies GenerateRequest),
      }),
  });
}
