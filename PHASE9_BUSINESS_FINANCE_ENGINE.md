# PHASE 9 — Business & Finance Engine

**Date :** 2026-06-01  
**Règle absolue :** aucun calcul financier dans React  
**Build :** `npm run typecheck` + `npm run build`

---

## 1. Source de vérité

| Couche | Rôle |
|--------|------|
| RPC Supabase | Tarifs, devis, soldes, rapports, retraits |
| Edge `calculate-finance-quote` | Fallback devis |
| `finance.engine.ts` | Formatage & CSV uniquement |
| `finance-mock.ts` | Fixtures offline |

---

## 2. INVITER — grille officielle

| Accès (rang) | Prix unitaire FCFA |
|--------------|-------------------|
| 1–15 | 950 |
| 16–30 | 900 |
| 31–99 | 850 |
| 100–150 | 750 |
| 151–300 | 650 |
| 301–500 | 550 |
| 501+ | 300 |

RPC : `calculate_inviter_pricing_quote(quantity, existing_count)`

Retourne : total, unitaire, palier, hint prochain palier (*Encore X accès pour débloquer Y FCFA*).

---

## 3. VENDRE — commission INVORA

| Prix billet FCFA | Commission |
|------------------|------------|
| 5 000–9 999 | 500 |
| 10 000–19 999 | 750 |
| 20 000–49 999 | 1 000 |
| 50 000–99 999 | 1 500 |
| 100 000–499 999 | 2 500 |
| 500 000+ | 5 000 |

RPC : `calculate_invora_commission`, `calculate_vendre_pricing_quote`

UI : prix billet, commission, net organisateur, montant client.

---

## 4. Partenaires

Grilles Phase 5 inchangées — RPC `calculate_partner_commission_*`

Prélevées **uniquement sur la marge INVORA**.

---

## 5. Tables & répartitions

| Table | Usage |
|-------|--------|
| `payments` | Paiements provider |
| `finance_settlements` | Brut, commission INVORA, partenaire, net — **figé** |
| `organizer_balances` | Agrégat organisateur |
| `organizer_payout_requests` | Retraits orga |
| `partner_commission_ledger` | Partenaires (Phase 5) |
| `partner_withdrawal_requests` | Retraits partenaires |
| `finance_audit_log` | Audit immuable (no delete) |
| `transactions` | Référence + champs répartition |

RPC : `freeze_finance_settlement` — uniquement si `payment_status = paid`.

---

## 6. Wallets & balances

| Acteur | UI | RPC |
|--------|-----|-----|
| Organisateur | `/finance` | `get_organizer_balance_summary` |
| Partenaire | `/partenaires/wallet` | ledger Phase 5 + finance reports |
| Retrait orga | historique + demande | `create_organizer_payout_request` |

---

## 7. Rapports

`/finance/rapports` — scopes `organizer` | `partner` | `invora`

RPC : `get_finance_report` — export CSV côté client (`financeReportToCsv`).

---

## 8. Routes

| Route | Page |
|-------|------|
| `/finance` | Solde organisateur |
| `/finance/rapports` | Rapports & CSV |
| `/evenements/:id/inviter/tarifs` | Devis INVITER |
| VENDRE billets | `VendrePricingQuoteCard` |

---

## 9. Immutabilité

- Commissions figées à `frozen_at` sur settlement  
- Changement de grille → n’affecte pas l’historique  

---

## 10. Déploiement

```bash
supabase db push
supabase functions deploy calculate-finance-quote
npm run supabase:types
```
