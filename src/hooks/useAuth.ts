import { useAuthStore, selectPrimaryRole } from '@/store/auth.store';
import { ROLE_PERMISSIONS } from '@/types/roles';

export function useAuth() {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const isLoading = useAuthStore((s) => s.isLoading);
  const role = useAuthStore(selectPrimaryRole);
  const permissions = role ? ROLE_PERMISSIONS[role] : null;

  return {
    session,
    user,
    profile,
    role,
    permissions,
    isAuthenticated: !!session,
    isLoading,
  };
}
