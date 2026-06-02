# PHASE 11F — Notifications & Communication Engine

## Objectif

Moteur **unique** de communication INVORA : tous les messages, distributions, rappels et confirmations passent par Supabase + Edge Functions. **Aucun envoi depuis React / navigateur.**

## Modèle

| Spec | Table / vue |
|------|-------------|
| `notification_templates` | Templates Email / WhatsApp / In-App (+ Push préparé) |
| `notification_events` | Événements métier déclenchés (immuable) |
| `notification_queue` | File d'envoi + retry |
| `notification_deliveries` | Statuts fins par canal |
| `notification_preferences` | Préférences utilisateur |
| `notification_logs` | Audit immuable (who / what / channel / status / provider) |

### Canaux (Phase 1)

`email` · `whatsapp` · `in_app` · `push` (préparation) — Phase 2 : `sms`

### Statuts livraison

`pending` → `queued` → `sending` → `sent` → `delivered` → `opened` / `clicked` / `failed`

## Migration

`supabase/migrations/20250601000015_notifications_communication_engine.sql`

### RPC principales

| RPC | Rôle |
|-----|------|
| `emit_notification_event` | Moteur central (DEFINER, interne) |
| `enqueue_inviter_distributions` | Distribution INVITER + notifications |
| `enqueue_ticket_distribution` | Billet + journal + notifications |
| `process_notification_queue_batch` | Traitement file (service_role) |
| `get_notification_preferences` | Préférences utilisateur |
| `upsert_notification_preferences` | Mise à jour préférences |
| `get_notification_analytics` | Envoyés / livrés / ouverts / clics / échecs par canal |
| `record_notification_delivery_event` | Webhooks ouverture / clic |

### Edge Function

`supabase/functions/notification-dispatch` — appelle `process_notification_queue_batch` avec **service_role** uniquement.

Provider Phase 1 : `invora_sim` (simulation traçable). Brancher SendGrid / WhatsApp Business via variables d'environnement en Phase 2.

### Hooks automatiques

- `mark_invitation_opened` → `invitation_opened`
- `claim_invitation` → `invitation_claimed` + organisateur
- `log_ticket_distribution` → `ticket_distributed`
- Scan validé (`scans` INSERT) → `access_used` / `ticket_used`
- `scanner_security_events` → `security_incident`
- `transactions.payment_status = paid` → `payment_confirmed` + `payment_received`
- `record_partner_conversion` → `conversion_new` + `commission_earned`

## Frontend

| Fichier | Rôle |
|---------|------|
| `src/services/notification.service.ts` | Enqueue + préférences + analytics (RPC) |
| `src/hooks/useNotificationPreferences.ts` | React Query |
| `WalletNotificationPrep.tsx` | Préférences réelles (plus de mock) |
| `InviterDistributePage.tsx` | `enqueue_inviter_distributions` si UUID Supabase |

**Sécurité** : le client ne fait que demander la mise en file ; l'envoi est traité par Edge / cron.

## Parcours

```
Action métier (claim, scan, paiement, distribution)
  → emit_notification_event
  → notification_queue + notification_deliveries
  → notification-dispatch (Edge)
  → delivered + notification_logs
```

## Déploiement

```bash
npm run supabase:db:push
npm run build
npm run test:phase11f
# Déployer la fonction :
npm run supabase:functions:deploy
```

## Tests manuels

1. Wallet `/acces` → toggles Email / WhatsApp / In-App persistés
2. Distribution INVITER (invitations UUID en base) → lignes `notification_queue`
3. Distribution billet → `enqueue_ticket_distribution`
4. Claim invitation → notification in-app organisateur + invité
5. Scan valide → `ticket_used` / `access_used`
6. Paiement confirmé → `payment_confirmed`
7. `curl` Edge `notification-dispatch` (Bearer service_role) → statuts `delivered`
8. `get_notification_analytics` → compteurs par canal

## Cron & providers (Phase 11F+)

Voir **`NOTIFICATION_CRON_SETUP.md`**.

- Migration `20250601000017_notification_dispatch_cron.sql` — `claim` / `finalize` + pg_cron
- Edge : Resend (email) + WhatsApp Cloud API si secrets configurés
- `npm run notifications:dispatch` — traitement manuel de la file

## Suite

- Rappels événement planifiés (`scheduled_at`)
- Rayonner : publication / album / bilan via RPC dédiées
