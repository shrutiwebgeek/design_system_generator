import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { generateFixtures } from "./vitest.generated-setup.ts";

// Regenerated on every run, before test files are collected.
await generateFixtures();

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "generator",
          include: ["src/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        // Predefined component tests against the raw templates.
        plugins: [react()],
        test: {
          name: "templates",
          include: ["templates/**/*.test.tsx"],
          environment: "jsdom",
          setupFiles: ["./templates/setup.ts"],
        },
      },
      {
        // The same predefined tests against the generated components, which is
        // what ships in a download: ds- classes and the token-aware cn.
        plugins: [react()],
        resolve: {
          alias: {
            "@/lib/utils": fileURLToPath(
              new URL("./.generated/lib/utils.ts", import.meta.url),
            ),
          },
        },
        test: {
          name: "generated",
          include: [".generated/**/*.test.tsx"],
          environment: "jsdom",
          setupFiles: ["./templates/setup.ts"],
        },
      },
    ],
  },
});
