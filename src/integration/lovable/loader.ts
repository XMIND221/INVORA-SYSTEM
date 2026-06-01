import type { LovableIntegrationManifest } from './types';
import { registerLovableManifest } from './registry';

/**
 * Dynamic import hook for Lovable bundle.
 * After ZIP extraction, point `modulePath` to the Lovable entry (e.g. ./bundle/routes).
 */
export async function loadLovableIntegration(
  modulePath: string,
): Promise<LovableIntegrationManifest> {
  const mod = (await import(/* @vite-ignore */ modulePath)) as {
    default?: LovableIntegrationManifest;
    manifest?: LovableIntegrationManifest;
  };

  const manifest = mod.default ?? mod.manifest;
  if (!manifest) {
    throw new Error(`Lovable module at ${modulePath} did not export a manifest.`);
  }

  registerLovableManifest(manifest);
  return manifest;
}
