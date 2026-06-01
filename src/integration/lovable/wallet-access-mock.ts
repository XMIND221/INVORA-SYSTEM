import type { WalletNotificationPrep } from '@/types/access';

export const MOCK_WALLET_USER_ID = 'demo-user';

export const WALLET_RECONCILE_DEMO = {
  userId: 'demo-reconcile-user',
  phone: '+221771234567',
  email: 'aminata@example.com',
  label: 'Mariage Fatou · 2026 → compte 2028',
} as const;

export const MOCK_WALLET_NOTIFICATIONS: WalletNotificationPrep[] = [
  { kind: 'access_received', label: 'Accès reçu', enabled: true },
  { kind: 'access_claimed', label: 'Accès réclamé', enabled: true },
  { kind: 'access_used', label: 'Accès utilisé', enabled: true },
  { kind: 'access_expired', label: 'Accès expiré', enabled: false },
  { kind: 'event_reminder', label: 'Rappel événement', enabled: true },
];
