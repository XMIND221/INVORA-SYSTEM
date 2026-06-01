import { z } from 'zod';

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

function parseEnv(): AppEnv {
  const result = envSchema.safeParse(import.meta.env);
  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    throw new Error(
      `Invalid environment configuration: ${JSON.stringify(formatted, null, 2)}`,
    );
  }
  return result.data;
}

export const env = parseEnv();
