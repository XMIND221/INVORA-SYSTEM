import type { RouteObject } from 'react-router-dom';
import { getLovableRoutes } from './registry';

/**
 * Merges foundation routes with Lovable routes.
 * Lovable routes take precedence on path conflicts when `lovableFirst` is true.
 */
export function mergeRoutes(
  foundation: RouteObject[],
  options?: { lovableFirst?: boolean },
): RouteObject[] {
  const lovable = getLovableRoutes();
  if (lovable.length === 0) return foundation;
  return options?.lovableFirst ? [...lovable, ...foundation] : [...foundation, ...lovable];
}
