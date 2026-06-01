import type { RouteObject } from 'react-router-dom';
import type { LovableIntegrationManifest } from './types';

let manifest: LovableIntegrationManifest | null = null;

/**
 * Register routes exported from the Lovable ZIP without mutating core architecture.
 */
export function registerLovableManifest(next: LovableIntegrationManifest): void {
  manifest = next;
}

export function getLovableRoutes(): RouteObject[] {
  return manifest?.routes ?? [];
}

export function isLovableIntegrated(): boolean {
  return manifest !== null && manifest.routes.length > 0;
}

export function clearLovableManifest(): void {
  manifest = null;
}
