import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import type { Database } from '@/types/database.generated';

const clientOptions: Parameters<typeof createClient<Database>>[2] = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
};

if (env.VITE_ENABLE_REALTIME) {
  clientOptions.realtime = { params: { eventsPerSecond: 10 } };
}

export const supabase = createClient<Database>(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY,
  clientOptions,
);
