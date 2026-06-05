import { z } from 'zod';
import { envDiagnostics } from 'virtual:env-diagnostics';

const requiredPublicEnvKeys = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

const optionalPublicEnvKeys = ['VITE_APP_URL'] as const;
const publicEnvKeys = [...requiredPublicEnvKeys, ...optionalPublicEnvKeys] as const;

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_APP_URL: z.string().url().optional(),
  VITE_ENABLE_REALTIME: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
});

type ParsedAppEnv = z.infer<typeof envSchema>;
export type AppEnv = Omit<ParsedAppEnv, 'VITE_APP_URL'> & {
  VITE_APP_URL: string;
};

function getEnvDiagnostics() {
  return envDiagnostics;
}

function getDefaultAppUrl() {
  return window.location.origin;
}

function getDisplayedVariable(key: (typeof publicEnvKeys)[number]) {
  const variable = getEnvDiagnostics().variables[key];

  if (key === 'VITE_APP_URL' && !variable.present) {
    return {
      value: getDefaultAppUrl(),
      source: 'window.location.origin (default)',
      present: true,
    };
  }

  return variable;
}

function logEnvDiagnostics() {
  const diagnostics = getEnvDiagnostics();

  console.group('[INVORA] Environment diagnostics');
  console.info('Vite mode:', diagnostics.mode);
  console.table(diagnostics.files);
  console.table(
    publicEnvKeys.map((key) => {
      const variable = getDisplayedVariable(key);

      return {
        variable: key,
        value: variable.value ?? '<missing>',
        source: variable.source,
        present: variable.present,
      };
    }),
  );
  console.groupEnd();
}

function parseEnv(): AppEnv {
  logEnvDiagnostics();

  const result = envSchema.safeParse(import.meta.env);
  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    const diagnostics = getEnvDiagnostics();
    const missing = requiredPublicEnvKeys.filter((key) => !diagnostics.variables[key].present);
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
  const parsed = result.data;

  return {
    ...parsed,
    VITE_APP_URL: parsed.VITE_APP_URL ?? getDefaultAppUrl(),
  };
}

export const env = parseEnv();
