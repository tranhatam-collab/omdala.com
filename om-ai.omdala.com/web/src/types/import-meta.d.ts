/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_RELEASE_TAG?: string;
  readonly VITE_DEPLOY_STATUS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
