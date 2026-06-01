import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import type { Profile } from '@/types/database';
import type { UserRole } from '@/types/roles';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ session: null, user: null, profile: null, isLoading: false }),
}));

export function selectPrimaryRole(state: AuthState): UserRole | null {
  return state.profile?.primary_role ?? null;
}
