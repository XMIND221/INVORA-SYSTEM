# PHASE 7 — Wallet & Access Engine

**Date :** 2026-06-01  
**Périmètre :** Centre personnel de tous les accès INVORA  
**Build :** `npm run typecheck` + `npm run build`

---

## 1. Philosophie

| Mode | Comportement |
|------|----------------|
| Sans compte | Lien `/invite/:token`, `/ticket/:token` — voir, QR, entrer |
| Avec compte | Wallet `/acces` — historique, recherche, réconciliation |

Le compte n’est **jamais obligatoire**.

---

## 2. Modèle Access unifié

`InvoraAccess` — `src/types/access.ts`

Converge **INVITER** (invitations) et **VENDRE** (billets) :

- access_id, event_id, holder, phone, email  
- access_type, qr_code, access_code, status  
- claimed, claimed_at, claimed_by, user_id  
- universe · pass_kind  

Vue SQL : `wallet_access_unified`.

---

## 3. Claim Engine

- RPC `claim_access` → délègue `claim_invitation` / `claim_ticket`
- UI : `claim.engine.ts` — `canClaimAccess`, libellés
- Fiche accès : bouton « Réclamer dans mon wallet »

---

## 4. Réconciliation automatique

RPC `reconcile_user_wallet` :

1. `reconcile_user_invitations` (téléphone / email)  
2. `reconcile_user_tickets`  
3. Journal `wallet_reconciliation_runs`

**Démo :** bouton « Mariage Fatou · +221771234567 » sur le wallet.

---

## 5. Mes accès — sections

| Onglet | Contenu |
|--------|---------|
| Aujourd’hui | Événements du jour (démo : Obsidian Gala) |
| À venir | Accès actifs futurs |
| Utilisés | Scannés / utilisés |
| Expirés | Expirés |
| Annulés | Annulés |

---

## 6. Fiche accès

Route : `/acces/:accessId`

- Nom événement, date, lieu  
- QR, code accès, type, statut  
- Instructions, export pass, lien sans compte  

---

## 7. Routes wallet

| Route | Page |
|-------|------|
| `/acces` | Hub wallet |
| `/acces/:accessId` | Fiche accès |
| `/acces/historique` | Historique |
| `/acces/analytics` | Analytics |
| `/acces/recherche` | Recherche |

---

## 8. Préparé (Phase ultérieure)

- **Wallet Pass** : Apple / Google / téléchargement (`wallet_pass_artifacts`)
- **Notifications** : file `wallet_notification_queue` + UI préparée

---

## 9. Intégrations

| Moteur | Lien |
|--------|------|
| INVITER | Invitations → Access inviter |
| VENDRE | Billets → Access vendre |
| SCANNER | Statut `used` / validation historique |
| PARTENAIRE | Distribution → accès reçus |

---

## 10. Fichiers clés

| Couche | Chemins |
|--------|---------|
| SQL | `supabase/migrations/20250601000006_wallet_access_engine.sql` |
| Engine | `access.engine.ts`, `claim.engine.ts`, `wallet.engine.ts` |
| Store | `access.store.ts` |
| Service | `access.service.ts` |
| UI | `AccesPage`, `AccessDetailPage`, `AccessPassCard` |

---

## 11. Test manuel

1. Rôle **Participant** → **Mes accès**  
2. Voir pass principal + onglets  
3. **Réconciliation** Fatou / +221771234567  
4. **Recherche** « Léa » ou « INV-OBSIDI »  
5. **Fiche accès** → QR + réclamer  
6. **Historique** / **Analytics**

```bash
supabase db push
npm run supabase:types
```
