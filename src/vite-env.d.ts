/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production';
  readonly VITE_APP_URL: string;
  readonly VITE_ENABLE_REALTIME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'virtual:env-diagnostics' {
  export const envDiagnostics: {
    mode: string;
    files: Array<{
      file: string;
      exists: boolean;
      loadedInCurrentMode: boolean;
    }>;
    variables: Record<
      'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY' | 'VITE_APP_URL',
      {
        value: string | null;
        source: string;
        present: boolean;
      }
    >;
  };
}
