/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional: when unset the app calls the API on its own origin. See services/http.ts. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
