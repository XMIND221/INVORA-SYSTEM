/** Communication Engine — types UI (envoi backend / Edge uniquement). */

export type NotificationChannel = 'email' | 'whatsapp' | 'in_app' | 'push' | 'sms';

export type NotificationDeliveryStatus =
  | 'pending'
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'failed';

export interface NotificationPreferences {
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  disabledKinds: string[];
}

export interface NotificationAnalytics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  byChannel: Record<string, number>;
}

export const NOTIFICATION_KIND_LABELS: Record<string, string> = {
  access_received: 'Accès reçu',
  access_claimed: 'Accès réclamé',
  access_used: 'Accès utilisé',
  access_expired: 'Accès expiré',
  event_reminder: 'Rappel événement',
  invitation_sent: 'Invitation envoyée',
  invitation_opened: 'Invitation ouverte',
  invitation_claimed: 'Invitation réclamée',
  ticket_distributed: 'Billet distribué',
  payment_confirmed: 'Paiement confirmé',
  purchase_confirmed: 'Achat confirmé',
  ticket_generated: 'Billet généré',
  ticket_used: 'Billet utilisé',
};
