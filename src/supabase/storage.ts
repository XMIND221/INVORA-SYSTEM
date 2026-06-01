import { STORAGE_BUCKETS } from '@/lib/constants';
import { supabase } from './client';

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export async function uploadFile(
  bucket: StorageBucket,
  path: string,
  file: File,
  options?: { upsert?: boolean },
) {
  return supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: options?.upsert ?? false,
  });
}

export function getPublicUrl(bucket: StorageBucket, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path);
}

export async function removeFiles(bucket: StorageBucket, paths: string[]) {
  return supabase.storage.from(bucket).remove(paths);
}
