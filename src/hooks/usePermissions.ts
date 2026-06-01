import { useAuth } from './useAuth';
import type { RolePermissions } from '@/types/roles';

type PermissionKey = keyof RolePermissions;

export function usePermissions() {
  const { permissions, role } = useAuth();

  function can(action: PermissionKey): boolean {
    return permissions?.[action] ?? false;
  }

  return { can, role, permissions };
}
