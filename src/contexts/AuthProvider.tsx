import { useEffect, type ReactNode } from 'react';
import { getSession, onAuthStateChange } from '@/supabase/auth';
import { profilesService } from '@/services';
import { useAuthStore } from '@/store/auth.store';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setSession, setUser, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    void getSession()
      .then(async (session) => {
        if (session) {
          setSession(session);
          setUser(session.user);
          try {
            const profile = await profilesService.getProfile(session.user.id);
            setProfile(profile);
          } catch {
            setProfile(null);
          }
        }
      })
      .finally(() => setLoading(false));

    const { data: subscription } = onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          const profile = await profilesService.getProfile(session.user.id);
          setProfile(profile);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [setSession, setUser, setProfile, setLoading]);

  return children;
}
