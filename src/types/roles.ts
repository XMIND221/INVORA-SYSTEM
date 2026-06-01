import type { USER_ROLES } from '@/lib/constants';

export type UserRole = (typeof USER_ROLES)[number];

export type EventRoleType = 'owner' | 'organizer' | 'staff' | 'scanner' | 'partner';

export interface RolePermissions {
  canCreateExperience: boolean;
  canManageParticipants: boolean;
  canManageTickets: boolean;
  canScan: boolean;
  canDistribute: boolean;
  canViewAnalytics: boolean;
  canManagePartners: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  organisateur: {
    canCreateExperience: true,
    canManageParticipants: true,
    canManageTickets: true,
    canScan: false,
    canDistribute: false,
    canViewAnalytics: true,
    canManagePartners: true,
  },
  participant: {
    canCreateExperience: false,
    canManageParticipants: false,
    canManageTickets: false,
    canScan: false,
    canDistribute: false,
    canViewAnalytics: false,
    canManagePartners: false,
  },
  partenaire: {
    canCreateExperience: false,
    canManageParticipants: false,
    canManageTickets: false,
    canScan: false,
    canDistribute: true,
    canViewAnalytics: true,
    canManagePartners: false,
  },
  scanner: {
    canCreateExperience: false,
    canManageParticipants: false,
    canManageTickets: false,
    canScan: true,
    canDistribute: false,
    canViewAnalytics: false,
    canManagePartners: false,
  },
  admin: {
    canCreateExperience: true,
    canManageParticipants: true,
    canManageTickets: true,
    canScan: true,
    canDistribute: true,
    canViewAnalytics: true,
    canManagePartners: true,
  },
};
