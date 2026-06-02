# PHASE 10 — PAYMENTS & CHECKOUT ENGINE

## Principe

```
Provider → Webhook → Backend (RPC) → Validation → Fulfillment
```

Le frontend **ne valide jamais** un paiement. Il initie un checkout et affiche le statut retourné par le serveur.

## Tables

| Table | Rôle |
|-------|------|
| `payment_providers` | Stripe, Wave, Orange Money, Free Money, carte, PayPal/Apple/Google (phase 2) |
| `payment_attempts` | Tentative liée à `transactions`, idempotency |
| `payments` | Paiement confirmé provider |
| `webhook_events` | Journal webhooks, anti-doublon `(provider_id, provider_event_id)` |
| `refunds` | Remboursements total/partiel |
| `payment_audit_log` | Audit immuable (pas de DELETE) |
| `finance_settlements` | Répartition figée (Phase 9, appelée après `paid`) |

## États `payment_status`

`pending` · `processing` · `paid` · `failed` · `expired` · `cancelled` · `refunded` · `disputed`

## RPC principales

| RPC | Description |
|-----|-------------|
| `create_inviter_checkout` | Checkout INVITER + `payment_attempt` |
| `initiate_vendre_checkout` | Transaction billet + attempt (sans fulfillment) |
| `process_payment_webhook` | Webhook idempotent → confirm ou fail |
| `confirm_payment_attempt` | Validation montant, `payments`, fulfillment, settlement |
| `reconcile_payment_attempt` | Écart attendu / reçu |
| `create_payment_refund` | Remboursement |
| `list_payment_providers` | Providers actifs phase 1/2 |
| `log_payment_audit` | Trace audit |

## Edge Functions

| Function | Rôle |
|----------|------|
| `payment-initiate` | Proxy `initiate_vendre_checkout` |
| `payment-webhook-processor` | Entrée webhooks providers |
| `payment-simulate-confirm` | Dev : simule webhook `payment.succeeded` |
| `process-ticket-purchase` | **Phase 10** : initiate only (plus de `paid` direct) |

## Flows

### INVITER

1. `create_inviter_checkout`
2. Paiement provider
3. Webhook → `confirm_payment_attempt`
4. Distribution autorisée (`canDistributeAfterPayment`)

### VENDRE

1. `initiate_vendre_checkout`
2. `/checkout/:attemptId` UI
3. Webhook → tickets via `_complete_ticket_payment_internal`
4. `freeze_finance_settlement`

## Frontend

| Route | Page |
|-------|------|
| `/checkout/:attemptId` | `CheckoutPage` |
| `/paiement/statut/:attemptId` | `PaymentStatusPage` |
| `/billetterie/:eventId/acheter` | Redirige vers checkout Phase 10 |

Services : `payment.service.ts`, `checkout.service.ts`  
Engines : `payments.engine`, `webhook.engine`, `refund.engine`, `payment-reconciliation.engine`

## Env

```env
VITE_PAYMENTS_MOCK=true   # fallback local si RPC indisponible
```

## Tests

```bash
npm run test:phase10
npm run build
```

### Checklist manuelle

- [ ] Paiement réussi (simulate confirm)
- [ ] Paiement échoué (`payment.failed` webhook)
- [ ] Double webhook (idempotent, pas de double ticket)
- [ ] Montant incohérent → `amount_mismatch`
- [ ] Réconciliation `reconcile_payment_attempt`
- [ ] Retrait organisateur (Phase 9, inchangé)

## Déploiement

```bash
npm run supabase:db:push
npm run supabase:functions:deploy
```

Migration : `20250601000010_payments_checkout_engine.sql`

## Anti-fraude

- Idempotency `webhook_events` + `payment_attempts.idempotency_key`
- `complete_ticket_payment` exige attempt `paid`
- Audit `payment_audit_log` sur mismatch, refund, confirm

## Notifications (préparé)

Types : `payment_received`, `payment_failed`, `payment_refunded`, `payout_approved`, `payout_rejected` — à brancher sur triggers / queue Phase 11.
