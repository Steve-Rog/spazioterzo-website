/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base dell'API admin: in sviluppo ripiega su http://127.0.0.1:8787 (vedi api.ts). */
  readonly VITE_ADMIN_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
