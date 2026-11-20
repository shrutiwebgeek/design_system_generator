import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import {
  defaultTokens,
  type ApiError,
  type ComponentSummary,
  type GenerateResponse,
} from "@dsg/design-data";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.ts";

let server: Server;
let base: string;

beforeAll(async () => {
  server = createApp().listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  base = `http://localhost:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

const post = (path: string, body: unknown) =>
  fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("GET /api/components", () => {
  it("lists every component with its tier, marking which ones have a template", async () => {
    const res = await fetch(`${base}/api/components`);
    expect(res.status).toBe(200);
    const list = (await res.json()) as ComponentSummary[];
    expect(list).toHaveLength(64);
    expect(list.find((c) => c.label === "Button")).toMatchObject({
      source: "button",
      tier: "atoms",
      available: true,
    });
    expect(list.find((c) => c.label === "Input")).toMatchObject({
      available: false,
    });
    expect(list.find((c) => c.label === "Footer")).toMatchObject({
      source: null,
      available: false,
    });
  });
});

describe("POST /api/components/:source/generate", () => {
  it("generates Button with the default tokens when none are sent", async () => {
    const res = await post("/api/components/button/generate", {});
    expect(res.status).toBe(200);
    const body = (await res.json()) as GenerateResponse;
    expect(Object.keys(body.files).sort()).toEqual([
      "button.examples.tsx",
      "button.test.tsx",
      "button.tsx",
    ]);
    // Examples ship tokenized, like the component.
    expect(body.files["button.examples.tsx"]).toContain("gap-ds-sm");
    expect(body.files["button.tsx"]).toContain('from "@/lib/utils"');
    expect(Object.keys(body.shared).sort()).toEqual([
      "dependencies.json",
      "lib/utils.ts",
      "theme.css",
    ]);
    expect(
      JSON.parse(body.shared["dependencies.json"]).dependencies,
    ).toMatchObject({
      "@base-ui/react": expect.any(String),
      "class-variance-authority": expect.any(String),
      cn: expect.any(String),
    });
    expect(body.warnings.map((w) => w.reason)).toEqual([
      "arbitrary",
      "arbitrary",
    ]);
  });

  it("uses uploaded tokens", async () => {
    const tokens = structuredClone(defaultTokens);
    (tokens.primitive.spacing as Record<string, { value: string }>).md = {
      value: "20px",
    };
    const body = (await (
      await post("/api/components/button/generate", { tokens })
    ).json()) as GenerateResponse;
    expect(body.shared["theme.css"]).toContain("--spacing-ds-md: 20px;");
  });

  it("404s for components without a template", async () => {
    expect((await post("/api/components/input/generate", {})).status).toBe(404);
  });

  it("404s instead of reading outside the templates dir", async () => {
    const res = await post(
      `/api/components/${encodeURIComponent("../../package")}/generate`,
      {},
    );
    expect(res.status).toBe(404);
    expect(((await res.json()) as ApiError).error).toMatch(
      /Invalid component name/,
    );
  });

  it("400s for a body that is not a token file", async () => {
    expect(
      (
        await post("/api/components/button/generate", {
          tokens: { hello: "world" },
        })
      ).status,
    ).toBe(400);
  });

  it("422s with the reason when tokens do not resolve", async () => {
    const tokens = structuredClone(defaultTokens);
    delete (tokens.modes.light.color as Record<string, unknown>).surface;
    const res = await post("/api/components/button/generate", { tokens });
    expect(res.status).toBe(422);
    expect(((await res.json()) as ApiError).detail).toMatch(
      /color\.surface\.default/,
    );
  });

  it("answers malformed JSON with a JSON 400, not an HTML page", async () => {
    const res = await fetch(`${base}/api/components/button/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{ not json",
    });
    expect(res.status).toBe(400);
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
  });
});
