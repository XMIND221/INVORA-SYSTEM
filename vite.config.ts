import path from 'node:path';
import fs from 'node:fs';
import { parse } from 'dotenv';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const REQUIRED_PUBLIC_ENV_KEYS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

const OPTIONAL_PUBLIC_ENV_KEYS = ['VITE_APP_URL'] as const;
const PUBLIC_ENV_KEYS = [...REQUIRED_PUBLIC_ENV_KEYS, ...OPTIONAL_PUBLIC_ENV_KEYS] as const;

const STANDARD_ENV_FILES = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.development.local',
  '.env.production',
  '.env.production.local',
];

function getViteEnvFilesForMode(mode: string): string[] {
  return ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`];
}

function createEnvDiagnostics(root: string, mode: string) {
  const loadedFiles = new Set(getViteEnvFilesForMode(mode));
  const checkedFiles = new Set([...STANDARD_ENV_FILES, ...loadedFiles]);

  const variables = Object.fromEntries(
    PUBLIC_ENV_KEYS.map((key) => [
      key,
      {
        value: process.env[key] ?? null,
        source: process.env[key] !== undefined ? 'process.env' : null,
      },
    ]),
  );

  for (const fileName of loadedFiles) {
    const filePath = path.resolve(root, fileName);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const parsed = parse(fs.readFileSync(filePath));
    for (const key of PUBLIC_ENV_KEYS) {
      if (process.env[key] === undefined && Object.prototype.hasOwnProperty.call(parsed, key)) {
        variables[key] = {
          value: parsed[key] ?? null,
          source: fileName,
        };
      }
    }
  }

  return {
    mode,
    files: [...checkedFiles].map((fileName) => ({
      file: fileName,
      exists: fs.existsSync(path.resolve(root, fileName)),
      loadedInCurrentMode: loadedFiles.has(fileName),
    })),
    variables: Object.fromEntries(
      Object.entries(variables).map(([key, variable]) => [
        key,
        {
          value: variable.value,
          source: variable.source ?? '<missing>',
          present: Boolean(variable.value),
        },
      ]),
    ),
  };
}

function envDiagnosticsPlugin(root: string, mode: string): Plugin {
  const virtualModuleId = 'virtual:env-diagnostics';
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;

  return {
    name: 'invora-env-diagnostics',
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
      return undefined;
    },
    load(id) {
      if (id !== resolvedVirtualModuleId) {
        return undefined;
      }

      return `export const envDiagnostics = ${JSON.stringify(
        createEnvDiagnostics(root, mode),
      )};`;
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [envDiagnosticsPlugin(__dirname, mode), react(), tailwindcss()],
  server: {
    port: 8080,
    strictPort: false,
    open: true,
    host: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'retention-imprudent-whisking.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok.io',
    ],
  },
  preview: {
    port: 8080,
    strictPort: false,
    host: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'retention-imprudent-whisking.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok.io',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
}));
