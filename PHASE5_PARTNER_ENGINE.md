# PHASE 5 — Partner Engine

**Date :** 2026-06-01  
**Périmètre :** Distributeur d’audience — distinct organisateur & invité  
**Build :** `npm run typecheck` + `npm run build` — OK

---

## 1. Vision produit

```
Organisateur publie → INVORA génère outils → Partenaire partage → Conversions → Commissions
```

| Règle | Implémentation |
|-------|----------------|
| Pas organisateur | Rôle `partenaire` + routes dédiées |
| Pas invité | Pas d’accès wallet invité comme rôle |
| Un compte / wallet / retrait | `PartnerWalletPage` + retraits unifiés INVITER+VENDRE |
| Finance hors React | RPC `calculate_partner_commission_*` + Edge `calculate-partner-commission` |

---

## 2. Dashboard partenaire (`/partenaires`)

- Campagnes actives (INVITER + VENDRE)
- Conversions, clics, commissions
- Prochaine action → campagne
- Liens : Wallet · Retraits · Analytics

---

## 3. Liens & tracking

Chaque partenaire :

- **Partner ID** : `PART-221` (affichage)
- **Code** : `XMIND221`
- **Lien traçable** : `/p/{code}/{eventId}` → enregistre un clic → redirige billetterie / invite
- **QR** : même URL (Media Kit)

Tables SQL : `partner_campaigns`, `partner_tracking_events`.

---

## 4. Media Kit Engine

`getPartnerMediaKitAssets()` — génère :

- Story Instagram / WhatsApp
- Affiche carrée / verticale
- Bannière
- Texte promo
- QR + lien partenaire

UI : `MediaKitGrid` — copier, télécharger, WhatsApp, Email.

---

## 5. Commissions (serveur uniquement)

### INVITER (par accès converti)

| Accès | Commission FCFA |
|-------|-----------------|
| 1–100 | 50 |
| 101–300 | 75 |
| 301–500 | 100 |
| 501+ | 125 |

### VENDRE (par prix billet)

| Prix FCFA | Commission |
|-----------|------------|
| 5 000–9 999 | 100 |
| 10 000–19 999 | 150 |
| 20 000–49 999 | 200 |
| 50 000–99 999 | 300 |
| 100 000+ | 500 |

RPC : `calculate_partner_commission_inviter`, `calculate_partner_commission_vendre`, `calculate_partner_commission`.

Commissions **figées** dans `partner_commission_ledger` à la conversion (`record_partner_conversion`).

---

## 6. Wallet & retraits

| Écran | Route |
|-------|--------|
| Wallet | `/partenaires/wallet` |
| Demande retrait | `/partenaires/retraits` |

Statuts : En attente · Validé · Retiré · Refusé.

Architecture `partner_withdrawal_requests` — pas d’intégration bancaire complète (Phase ultérieure).

---

## 7. Analytics

`/partenaires/analytics` — clics, ouvertures, conversions, invitations, ventes, commissions, détail par campagne.

---

## 8. RAYONNER (partenaire)

`/partenaires/rayonner/:eventId` — Avant / Pendant / Après :

- Résultats, remerciements, photos, albums, bilan événement

---

## 9. Routes

| Route | Page |
|-------|------|
| `/partenaires` | Dashboard (partenaire) ou vue orga |
| `/partenaires/campagnes/:id` | Campagne + Media Kit |
| `/partenaires/wallet` | Wallet |
| `/partenaires/retraits` | Retraits |
| `/partenaires/analytics` | Analytics |
| `/partenaires/rayonner/:eventId` | RAYONNER |
| `/p/:partnerCode/:eventId` | Redirect traçable |

---

## 10. Fichiers clés

| Couche | Chemins |
|--------|---------|
| SQL | `supabase/migrations/20250601000004_partner_engine.sql` |
| Edge | `supabase/functions/calculate-partner-commission/` |
| Engine | `partner.engine.ts`, `media-kit.engine.ts` |
| Store | `partner.store.ts`, `partner-mock.ts` |
| Service | `partner.service.ts` |

---

## 11. Test manuel

1. Rôle **Partenaire** → **Promouvoir** (dashboard)
2. Campagne **Showcase 06** → Media Kit → copier lien
3. Ouvrir `/p/XMIND221/showcase-06` → tracking + redirect
4. **Wallet** → **Retraits** → demande 84 050 FCFA
5. **Analytics** — vérifier agrégats

Déploiement :

```bash
supabase db push
supabase functions deploy calculate-partner-commission
npm run supabase:types
```
