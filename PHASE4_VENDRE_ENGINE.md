# PHASE 4 — VENDRE Engine

**Date :** 2026-06-01  
**Périmètre :** Billetterie publique — séparée d’INVITER (accès privés)  
**Build :** `npm run typecheck` + `npm run build` — OK

---

## 1. Principes

| Règle | Implémentation |
|-------|----------------|
| VENDRE ≠ INVITER | Routes, stores, engines distincts (`vendre.*` vs `inviter.*`) |
| Finance hors React | Grille commission dans `calculate_invora_commission` (SQL) + Edge `calculate-pricing` |
| Paiement avant accès | `payment_status = paid` requis (`canIssueTicketAccess`, RPC `claim_ticket`) |
| Transactions figées | `frozen_at` sur `transactions` après paiement |

---

## 2. Workflow

```
Créer événement → Créer billets → Publier → Acheter → Paiement → Recevoir accès → Scanner → Analyser
```

`VendreWorkflowStrip` + `VENDRE_FLOW` dans `product-copy.ts`.

---

## 3. Types de billets

Presets : Standard, VIP, Premium, Backstage, Corporate, Custom (`TICKET_PRESETS`).

Gestion : `/evenements/:id/vendre/billets` — plusieurs catégories par événement.

Prix **0 FCFA** autorisé (commission 0 via RPC).

---

## 4. Pricing & commissions (serveur)

Grille FCFA (RPC `calculate_invora_commission`) :

| Prix billet | Commission INVORA |
|-------------|-------------------|
| 5 000 – 9 999 | 500 |
| 10 000 – 19 999 | 750 |
| 20 000 – 49 999 | 1 000 |
| 50 000 – 99 999 | 1 500 |
| 100 000 – 499 999 | 2 500 |
| 500 000+ | 5 000 |

UI : `PricingBreakdownCard` affiche uniquement la réponse RPC / Edge — **aucune formule en React**.

Exemple 10 000 FCFA : net organisateur **9 250 FCFA**.

---

## 5. Statuts billetterie

| UI | Clé |
|----|-----|
| Brouillon | `draft` |
| Publié | `published` |
| En vente | `on_sale` |
| Épuisé | `sold_out` |
| Terminé | `ended` |
| Archivé | `archived` |

`TicketingStatusBadge` sur hub et types.

---

## 6. Parcours acheteur

| Étape | Route |
|-------|--------|
| Page publique | `/billetterie/:eventId` |
| Achat | `/billetterie/:eventId/acheter?type=` |
| Billet émis | `/ticket/:token` |

Sans compte : Email / WhatsApp / lien (UI) + QR + code unique.

Avec compte : claim → `wallet_passes` + **Mes accès**.

---

## 7. Claim & réconciliation

Champs billet : `claimed`, `claimed_at`, `claimed_by`, `user_id`.

- RPC `claim_ticket`
- RPC `reconcile_user_tickets` (téléphone / email)
- Démo wallet : bouton VENDRE +33601020304

---

## 8. Analytics VENDRE

`/evenements/:id/vendre/analytics` :

- Visites, ajouts panier, achats, conversion
- Billets vendus, CA, revenus organisateur, commission INVORA

Source store mock + agrégation `computeVendreAnalytics` (sommes depuis montants **déjà calculés serveur** sur les types).

---

## 9. RAYONNER (préparation)

`/evenements/:id/vendre/rayonner` — affiches, stories, publications, QR promo, lien partageable, media kit (partenaires).

---

## 10. Backend

| Fichier | Rôle |
|---------|------|
| `supabase/migrations/20250601000003_vendre_engine.sql` | Schéma, RPC checkout/paiement/claim |
| `supabase/functions/calculate-pricing` | Proxy RPC commission |
| `supabase/functions/process-ticket-purchase` | Checkout + `complete_ticket_payment` |

Déploiement :

```bash
supabase db push
supabase functions deploy calculate-pricing
supabase functions deploy process-ticket-purchase
npm run supabase:types
```

---

## 11. Fichiers frontend

| Couche | Chemins |
|--------|---------|
| Engine (non-financier) | `src/features/engines/vendre.engine.ts` |
| Service | `src/services/vendre.service.ts` |
| Store mock | `src/store/vendre.store.ts`, `vendre-mock.ts` |
| Organisateur | `VendreHubPage`, `VendreTicketsPage`, `VendrePublishPage`, … |
| Public | `PublicTicketingPage`, `TicketPurchasePage`, `TicketPublicPage` |

---

## 12. Tests manuels

1. **Showcase 06** (VENDRE) → hub VENDRE → créer billet 10 000 FCFA → vérifier breakdown RPC.
2. Publier → `/billetterie/showcase-06` → acheter → `/ticket/...` (paid).
3. Mes accès → réconciliation VENDRE démo.
4. Vérifier qu’**Obsidian Gala** (INVITER) n’expose pas la billetterie VENDRE.
