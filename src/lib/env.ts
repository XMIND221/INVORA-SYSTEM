import { z } from 'zod';

const requiredPublicEnvKeys = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_APP_URL',
] as const;

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_APP_URL: z.string().url(),
  VITE_ENABLE_REALTIME: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
});

export type AppEnv = z.infer<typeof envSchema>;

function getEnvDiagnostics() {
  if (typeof __APP_ENV_DIAGNOSTICS__ !== 'undefined') {
    return __APP_ENV_DIAGNOSTICS__;
  }

  return {
    mode: import.meta.env.MODE,
    files: [],
    variables: Object.fromEntries(
      requiredPublicEnvKeys.map((key) => [
        key,
        {
          value: import.meta.env[key] ?? null,
          source: import.meta.env[key] ? 'import.meta.env' : '<missing>',
          present: Boolean(import.meta.env[key]),
        },
      ]),
    ),
  };
}

function logEnvDiagnostics() {
  const diagnostics = getEnvDiagnostics();

  console.group('[INVORA] Environment diagnostics');
  console.info('Vite mode:', diagnostics.mode);
  console.table(diagnostics.files);
  console.table(
    requiredPublicEnvKeys.map((key) => ({
      variable: key,
      value: diagnostics.variables[key]?.value ?? '<missing>',
      source: diagnostics.variables[key]?.source ?? '<missing>',
      present: diagnostics.variables[key]?.present ?? false,
    })),
  );
  console.groupEnd();
}

function parseEnv(): AppEnv {
  logEnvDiagnostics();

  const result = envSchema.safeParse(import.meta.env);
  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    const diagnostics = getEnvDiagnostics();
    const missing = requiredPublicEnvKeys.filter((key) => !diagnostics.variables[key]?.present);
    const expectedFiles = diagnostics.files
      .filter((file) => file.loadedInCurrentMode)
      .map((file) => file.file)
      .join(', ');

    throw new Error(
      [
        `Invalid environment configuration.`,
        `Missing required variables: ${missing.length > 0 ? missing.join(', ') : 'none'}.`,
        `Define them in project environment variables or one of the Vite env files for this mode: ${expectedFiles}.`,
        `Validation errors: ${JSON.stringify(formatted, null, 2)}`,
      ].join(' '),
    );
  }
  return result.data;
}

export const env = parseEnv();
