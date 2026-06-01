import {
  Calendar,
  Home,
  Plus,
  ScanLine,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { LOVABLE_ROUTES } from '@/lib/constants';
import type { LovableRole } from './use-role';

export interface NavTab {
  to: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
}

export const NAV_BY_ROLE: Record<LovableRole, NavTab[]> = {
  organisateur: [
    { to: LOVABLE_ROUTES.accueil, label: 'Accueil', icon: Home },
    { to: LOVABLE_ROUTES.evenements, label: 'Mes événements', icon: Calendar },
    { to: LOVABLE_ROUTES.creer, label: 'Créer', icon: Plus, primary: true },
    { to: LOVABLE_ROUTES.partenaires, label: 'Partenaires', icon: Users },
    { to: LOVABLE_ROUTES.parametres, label: 'Paramètres', icon: Settings },
  ],
  participant: [
    { to: LOVABLE_ROUTES.accueil, label: 'Accueil', icon: Home },
    { to: LOVABLE_ROUTES.acces, label: 'Mes accès', icon: Wallet },
    { to: LOVABLE_ROUTES.parametres, label: 'Paramètres', icon: Settings },
  ],
  partenaire: [
    { to: LOVABLE_ROUTES.accueil, label: 'Accueil', icon: Home },
    { to: LOVABLE_ROUTES.partenaires, label: 'Promouvoir', icon: Users },
    { to: LOVABLE_ROUTES.parametres, label: 'Paramètres', icon: Settings },
  ],
  scanner: [
    { to: LOVABLE_ROUTES.accueil, label: 'Accueil', icon: Home },
    { to: LOVABLE_ROUTES.scanner, label: 'Scanner', icon: ScanLine, primary: true },
    { to: LOVABLE_ROUTES.parametres, label: 'Paramètres', icon: Settings },
  ],
};

/** Routes accessibles par rôle (garde UX — pas de logique métier) */
export const ALLOWED_PATHS: Record<LovableRole, string[]> = {
  organisateur: [
    LOVABLE_ROUTES.accueil,
    LOVABLE_ROUTES.evenements,
    LOVABLE_ROUTES.creer,
    LOVABLE_ROUTES.parcours,
    LOVABLE_ROUTES.partenaires,
    LOVABLE_ROUTES.parametres,
  ],
  participant: [LOVABLE_ROUTES.accueil, LOVABLE_ROUTES.acces, LOVABLE_ROUTES.parametres],
  partenaire: [
    LOVABLE_ROUTES.accueil,
    LOVABLE_ROUTES.partenaires,
    LOVABLE_ROUTES.parametres,
  ],
  scanner: [LOVABLE_ROUTES.accueil, LOVABLE_ROUTES.scanner, LOVABLE_ROUTES.parametres],
};

export function isPathAllowed(role: LovableRole, pathname: string): boolean {
  return ALLOWED_PATHS[role].some((p) => pathname === p || pathname.startsWith(`${p}?`));
}
