import type { ComponentType, LazyExoticComponent } from 'react';
import type { RouteObject } from 'react-router-dom';

export interface LovableRouteModule {
  routes?: RouteObject[];
  default?: ComponentType;
}

export interface LovableIntegrationManifest {
  version: string;
  routes: RouteObject[];
  /** Optional lazy page map from Lovable export */
  pages?: Record<string, LazyExoticComponent<ComponentType>>;
}
