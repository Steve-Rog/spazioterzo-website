import { defineConfig } from "vite";

export default defineConfig({
  root: "admin",
  publicDir: "../public",
  esbuild: { jsx: "automatic" },
  build: { outDir: "dist", emptyOutDir: true },
});
