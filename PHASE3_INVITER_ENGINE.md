# PHASE 3 — INVITER Engine

**Date :** 2026-06-01  
**Périmètre :** Moteur d’accès privés (INVITER) — pas billetterie, pas vente  
**Build :** `npm run typecheck` + `npm run build` — OK

---

## 1. Résumé

INVITER permet à l’organisateur de **créer des accès**, **ajouter des invités**, **distribuer**, **contrôler** et **analyser** — avec lien sécurisé, code unique et QR unique par invité.

| Livrable | Statut |
|----------|--------|
| Flows complets (UI) | Hub, invités, distribution, lien public, parcours |
| Distribution | WhatsApp · Email · mixte · multi-sélection |
| Claim system | `claimed`, `claimed_at`, `claimed_by`, `user_id` (engine + store + SQL) |
| Wallet | Onglets À venir / Utilisés / Expirés / Annulés |
| Réconciliation | Par téléphone & email (engine + RPC + démo wallet) |
| Analytics INVITER | Créées, envoyées, ouvertes, réclamées, utilisées, présence |
| Migration Supabase | `20250601000002_inviter_engine.sql` |
| Sécurité | Transitions de statut, QR unique, journal distribution |

**Mode données :** store Zustand + fixtures (`VITE_INVITER_MOCK=true` par défaut). Après `supabase db push`, régénérer les types et brancher `inviter.service` vers les RPC.

---

## 2. Workflow officiel

```
Créer événement → Créer accès → Ajouter invités → Distribuer → Utiliser accès → Scanner → Analyser
```

Affiché via `InviterWorkflowStrip` et `INVITER_FLOW` dans `product-copy.ts`.

---

## 3. Statuts d’accès

| Statut UI | Clé |
|-----------|-----|
| Créé | `created` |
| Distribué | `distributed` |
| Ouvert | `opened` |
| Réclamé | `claimed` |
| Scanné | `scanned` |
| Expiré | `expired` |
| Annulé | `cancelled` |

- Labels : `INVITER_STATUS_LABEL` (`inviter.engine.ts`)
- Badge : `InviterStatusBadge.tsx`
- Transitions contrôlées : `canTransitionStatus()`

---

## 4. Invité — champs

| Champ | Obligatoire |
|-------|-------------|
| Prénom | Oui |
| Nom | Oui |
| Téléphone | Oui |
| Email | Non |
| Type d’accès | Oui (`access_type_code`) |
| Statut | Auto (workflow) |

Types d’accès démo (Obsidian Gala) : VIP, Standard, Staff — table `access_types` en SQL.

---

## 5. Distribution

- **Individuelle / multiple** : sélection sur `InviterDistributePage`
- **Canaux** : WhatsApp, Email, ou les deux (`DistributionChannel[]`)
- **Message** : `buildWhatsAppShareText` / `buildEmailShareSubject`
- **Lien INVORA** : `/invite/:token` — `buildGuestSecureLink`
- **Code unique** : `INV-{event}-{suffix}`
- **QR** : `buildGuestQrPayload` (engine QR v1)

---

## 6. Mode sans compte

Route publique **`/invite/:token`** (`InvitePublicPage.tsx`) :

- Ouvrir le lien → `markGuestOpened` / RPC `mark_invitation_opened`
- Voir l’accès + QR
- Télécharger QR (UI)
- Entrer à l’événement (scan côté organisateur)
- **Aucun compte obligatoire**

---

## 7. Mode avec compte + Claim

Champs (DB + `InviterGuest`) :

- `claimed` (boolean)
- `claimed_at`
- `claimed_by`
- `user_id`

**Claim UI :** bouton « Ajouter au wallet » sur la page publique → `inviterService.claim(token, userId)`.

**SQL :** `claim_invitation(p_token, p_user_id)` — crée aussi une entrée `wallet_passes`.

---

## 8. Réconciliation automatique

**Engine :** `reconcileGuestsForUser()` — match `phone` / `email`.

**SQL :** `reconcile_user_invitations(p_user_id)` — rattache invitations, wallet, historique.

**Démo :** sur **Mes accès**, bouton « Réconcilier (démo +221771234567) » — retrouve les accès envoyés à ce numéro (ex. scénario 2026 → compte 2028).

Profil démo : `DEMO_RECONCILE_PROFILE` dans `inviter-mock.ts`.

---

## 9. Wallet INVORA

Onglets (`wallet.engine.ts`) :

| Onglet | Règle |
|--------|--------|
| À venir | created, distributed, opened, claimed |
| Utilisés | scanned |
| Expirés | expired |
| Annulés | cancelled |

Page : `AccesPage.tsx` — passes INVITER réclamés / réconciliés pour `walletUserId`.

---

## 10. Analytics INVITER

`computeInviterAnalytics(guests)` :

- Invitations créées
- Envoyées (`distributed`+)
- Ouvertes
- Réclamées
- Utilisées (scans)
- Taux de présence

UI : `/evenements/:eventId/inviter/analytics`

---

## 11. Sécurité

- Lien token opaque (`generateGuestToken`)
- QR payload signé structure v1 (pas de doublon côté scan — `validate-scan` edge function)
- Horodatage : `opened_at`, `distributed_at`, `scanned_at`
- Journal : table `invitation_distributions`
- Pas de double claim autre utilisateur (`already_claimed_other_user`)

---

## 12. Routes

| Route | Page |
|-------|------|
| `/evenements/:id/inviter` | Hub INVITER |
| `/evenements/:id/inviter/guests` | Gestion invités |
| `/evenements/:id/inviter/distribuer` | Distribution |
| `/evenements/:id/inviter/analytics` | Analytics |
| `/invite/:token` | Accès public invité |

---

## 13. Fichiers clés

| Couche | Fichiers |
|--------|----------|
| Engine | `src/features/engines/inviter.engine.ts`, `wallet.engine.ts` |
| Types | `src/types/inviter.ts` |
| Store | `src/store/inviter.store.ts` |
| Service | `src/services/inviter.service.ts` |
| Mock | `src/integration/lovable/inviter-mock.ts` |
| SQL | `supabase/migrations/20250601000002_inviter_engine.sql` |
| UI orga | `InviterHubPage`, `InviterGuestsPage`, `InviterDistributePage`, `InviterAnalyticsPage` |
| UI invité | `InvitePublicPage`, `AccesPage` |

---

## 14. Déploiement Supabase

```bash
supabase db push
npm run supabase:types
```

Puis brancher les appels RPC dans `inviter.service.ts` (commentaires en place).

Fonctions RPC exposées :

- `get_invitation_by_token`
- `mark_invitation_opened`
- `claim_invitation`
- `reconcile_user_invitations`

---

## 15. Tests manuels suggérés

1. Rôle **Organisateur** → Obsidian Gala → **INVITER** → ajouter invité → distribuer (WhatsApp+Email).
2. Ouvrir `/invite/tok-aminata-obsidian` — QR + claim.
3. Rôle **Invité** → **Mes accès** → Réconcilier avec +221771234567 — voir accès rattachés.
4. Analytics INVITER — vérifier compteurs après distribution / claim.
