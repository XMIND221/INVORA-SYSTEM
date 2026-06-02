# PHASE 11B — Ticketing Engine & Wallet Real

## Objectif

Parcours acheteur **sans mock** : paiement → billet en base → QR unique → wallet → scanner.

## Migration

`supabase/migrations/20250601000012_ticketing_wallet_engine.sql`

| Élément | Rôle |
|--------|------|
| `wallet_access_unified` (vue) | Tickets + invitations avec titre/date/lieu événement |
| `get_public_ticket_by_token` | Page `/ticket/:token` |
| `list_public_ticket_types` | Billetterie publique |
| `get_tickets_for_payment_attempt` | Redirection post-paiement |
| `reconcile_payment_attempt` (MAJ) | Retourne `primaryTicketToken` + `ticketTokens` |
| `log_ticket_distribution` | Email / WhatsApp / lien / download |
| `record_ticketing_funnel` | `page_views`, `cart_adds` |
| `get_vendre_ticketing_analytics` | Billets émis, scannés, remboursés, présence |
| `ticket_distribution_log` | Audit distribution |

## Modèle (existant, pas de table `orders`)

- **Checkout** : `transactions` + `payment_attempts` + `payments`
- **Billets** : `tickets` (`access_token`, `qr_payload`, `unique_code`, `payment_status`)
- **Claim** : `claim_ticket` / `claim_access` → `auth.uid()`
- **Wallet** : `wallet_access_unified` + `wallet_passes`

## Services

| Fichier | Rôle |
|---------|------|
| `tickets.service.ts` | Lecture publique, claim, distribution log |
| `vendre.service.ts` | Types, funnel, analytics Supabase |
| `wallet.service.ts` | Liste / recherche / analytics wallet |
| `access.service.ts` | Wallet unifié + réconciliation RPC |

## UI connectée

| Route | Changement |
|-------|------------|
| `/billetterie/:eventId` | Types depuis Supabase |
| `/billetterie/.../acheter` | Checkout Phase 10 inchangé |
| `/checkout/:attemptId` | Paiement → webhook |
| `/paiement/statut/:id` | CTA « Voir mon billet » → `/ticket/:token` |
| `/ticket/:token` | QR réel, claim `user.id`, distribution |
| `/mes-acces` | `list_user_wallet_accesses`, auth requise |
| Hub VENDRE organisateur | Analytics + types async |

## Flux cible

```
Acheteur → initiate_vendre_checkout
         → confirm_payment_attempt (paid)
         → complete_ticket_payment (gated)
         → tickets en base
         → /ticket/:access_token
         → claim_ticket(auth.uid())
         → wallet
         → validate_access_scan(qr_payload | access_token)
```

## Tests

```bash
npm run supabase:db:push
npm run build
npm run test:phase11b
```

## Hors scope

- INVITER mock (guests store) — invitations restent partiellement en store jusqu’à phase dédiée
- Scanner offline fixture si RPC indisponible
- Notifications email/WhatsApp réelles (audit + liens préparés)

## Suite

Phase 11C : notifications finales, wallet Apple/Google, remboursements UI.
