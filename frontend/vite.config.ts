import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Matches "paths" in tsconfig.json (read by the shadcn CLI) and tsconfig.app.json (read by tsc).
  resolve: {
    alias: { "@": `${import.meta.dirname}/src` },
  },
  server: {
    // Same origin in dev: the browser calls /api, Vite forwards it to the backend. No CORS needed.
    proxy: { "/api": "http://localhost:3001" },
  },
});
