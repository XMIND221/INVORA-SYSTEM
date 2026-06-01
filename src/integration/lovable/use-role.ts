/**
 * Rôle UI Lovable — synchronisé avec Auth INVORA quand session active.
 * Phase 0 : localStorage + profil Supabase (pas de logique métier additionnelle).
 */
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/roles';

export type LovableRole = Exclude<UserRole, 'admin'>;

const KEY = 'invora.role';

export function getStoredRole(): LovableRole | null {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(KEY);
  if (v === 'organisateur' || v === 'participant' || v === 'partenaire' || v === 'scanner') {
    return v;
  }
  return null;
}

export function setStoredRole(role: LovableRole) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, role);
  window.dispatchEvent(new Event('invora:role'));
}

export function useRole(): LovableRole {
  const { role: authRole, isAuthenticated } = useAuth();
  const [role, setRole] = useState<LovableRole>('organisateur');

  useEffect(() => {
    const resolve = () => {
      if (isAuthenticated && authRole && authRole !== 'admin') {
        setRole(authRole);
        return;
      }
      const stored = getStoredRole();
      if (stored) setRole(stored);
    };
    resolve();
    window.addEventListener('storage', resolve);
    window.addEventListener('invora:role', resolve);
    return () => {
      window.removeEventListener('storage', resolve);
      window.removeEventListener('invora:role', resolve);
    };
  }, [authRole, isAuthenticated]);

  return role;
}

/** @deprecated Préférer ROLE_INTENT depuis product-copy.ts */
export const ROLE_LABEL: Record<LovableRole, string> = {
  organisateur: 'Organisateur',
  participant: 'Invité',
  partenaire: 'Partenaire',
  scanner: 'Scanner',
};

/** Libellé produit officiel : Invité (pas Participant) */
export const PILLAR_LABEL = {
  organisateur: 'Organisateur',
  invite: 'Invité',
  partenaire: 'Partenaire',
  scanner: 'Scanner',
  rayonner: 'Rayonner',
} as const;
