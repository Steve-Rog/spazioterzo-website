import { defineConfig } from "vite";

export default defineConfig({
  root: "admin",
  esbuild: { jsx: "automatic" },
  build: { outDir: "dist", emptyOutDir: true },
});
