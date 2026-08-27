import { defineConfig } from "vitest/config";

/**
 * I test girano in Node, non nel Worker: sono controlli su funzioni pure e sul codice sorgente.
 * Senza questa configurazione userebbero vite.config.ts, dove il plugin Cloudflare li spingerebbe
 * dentro workerd e fallirebbero all'avvio.
 */
export default defineConfig({
  test: {
    include: ["admin/src/**/*.test.ts", "app/**/*.test.ts", "shared/**/*.test.ts"],
  },
});
