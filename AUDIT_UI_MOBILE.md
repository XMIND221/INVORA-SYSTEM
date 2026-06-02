# AUDIT UI MOBILE — INVORA

**Date :** 2026-06-01  
**Périmètre :** UI Lovable mobile (`src/pages/lovable/`, `src/components/lovable/`)  
**Hors scope :** `src/integration/lovable/bundle/` (référence TanStack, non servie par `npm run dev` racine)  
**Contrainte :** audit uniquement — aucun changement design / logique métier dans ce livrable.

**Légende statut**

| Statut | Signification |
|--------|----------------|
| **Fonctionnel** | Action ou navigation opérationnelle avec données cohérentes (mock ou backend) |
| **Partiellement fonctionnel** | UI réactive mais données locales, backend partiel, ou flux incomplet |
| **Statique** | Affichage sans action ou donnée figée |
| **À connecter** | Backend/RPC existe ou prévu ; UI non branchée |

---

## Synthèse transversale

| Critère | Constat global |
|---------|----------------|
| **1. Boutons non fonctionnels** | QR télécharger, partage Email/WhatsApp (invité/billet), photo couverture (Créer), validation recherche scanner sans feedback |
| **2. Liens non connectés** | « Analytics globales » → analytics **par événement** ; Parcours sans `?event=` ; publish Créer → hub inexistant si slug ≠ mock |
| **3. Cartes purement visuelles** | `Stat`, `FlowStrip`, `OrganizerJourneyStrip`, QR décoratif, hero gradient billetterie |
| **4. Données mockées** | `organizer-mock`, `inviter-mock`, `vendre-mock`, `partner-mock`, `scanner-mock`, `wallet-access-mock`, `payment-mock` |
| **5. Actions sans backend** | Publish studio, distribution INVITER, publish billetterie, claims `demo-user`, liste événements |
| **6. Écrans incomplets** | Paramètres (compte), post-paiement billet (pas de `/ticket/:token` auto), gate paiement → distribution |
| **7. Routes manquantes** | Analytics organisateur global ; `/acces` alias non autorisé par guard ; finance partenaire unifiée |
| **8. Loading absents** | Accueil, Créer (sauf design preview), Inviter/Vendre hubs, Partner quote, Wallet reconcile |
| **9. Erreurs absentes** | RoleRouteGuard redirect silencieux ; retrait partenaire ; RPC fallback silencieux |
| **10. Vides absents** | Partner wallet/retraits, Scanner historique, Wallet historique, liste campagnes vide |

**Infrastructure**

- **Routes :** `src/integration/lovable/routes.tsx` (manifest `10.0.0-phase10-payments`)
- **Guard :** `RoleRouteGuard` + `navigation.ts` — redirect `/accueil` sans message
- **Bottom nav :** highlight exact `pathname === to` — **sous-routes non actives** (`/partenaires/wallet`, `/scanner/historique`, `/mes-acces/recherche`)
- **Suspense :** `PageFallback` spinner au chargement chunk uniquement

---

## 1. Accueil

**Fichier :** `AccueilPage.tsx` — 4 variantes selon `useRole()`.

### Checklist critères

| # | Organisateur | Invité | Partenaire | Scanner |
|---|--------------|--------|------------|---------|
| 1 | — | — | — | — |
| 2 | Lien « analytics globales » trompeur | — | — | — |
| 3 | Stat ×3, JourneyStrip, UniverseCard steps fixes | Bloc info wallet | Stat ×2 | Stat ×3 |
| 4 | `ORGANIZER_MOCK_EVENTS` | Copy « Soirée Velours » | Montants 840€, 1240€ | Stats 218/3/221 |
| 5 | Aucun fetch events/auth | Pas de preview wallet | Pas `partnerService` | Pas `scannerService` |
| 6 | — | — | Pas CTA retraits | — |
| 7 | — | — | — | — |
| 8 | ❌ | ❌ | ❌ | ❌ |
| 9 | ❌ | ❌ | ❌ | ❌ |
| 10 | ❌ (si mock vide) | ❌ | ❌ | ❌ |

### Tableau composants

| Écran | Composant | Statut |
|-------|-----------|--------|
| Accueil · Organisateur | `PageHeader` (salutation « Marc. ») | Statique |
| Accueil · Organisateur | `Stat` (scans, revenus, conversions) | Statique · mock |
| Accueil · Organisateur | `OrganizerJourneyStrip` | Statique |
| Accueil · Organisateur | `NextActionCard` → hub flagship | Partiellement fonctionnel · mock |
| Accueil · Organisateur | `UniverseCard` inviter/vendre | Partiellement fonctionnel · steps hardcodés |
| Accueil · Organisateur | Lien analytics « globales » | À connecter · route event-only |
| Accueil · Organisateur | Lien Finance | Fonctionnel · route |
| Accueil · Organisateur | Lien Créer | Fonctionnel · route |
| Accueil · Invité | `NextActionCard` → `/mes-acces` | Fonctionnel · route |
| Accueil · Invité | Description « Soirée Velours » | Statique · ≠ wallet réel |
| Accueil · Invité | Bloc `WALLET_COPY.notARole` | Statique |
| Accueil · Partenaire | `Stat` balance / commissions | Statique · literals |
| Accueil · Partenaire | `NextActionCard` → campagne mock | Partiellement fonctionnel |
| Accueil · Scanner | `Stat` validés/refusés/total | Statique · literals |
| Accueil · Scanner | Liens scanner / historique / analytics | Fonctionnel · routes |
| Accueil · Tous | `RoleContextBar` → Paramètres | Fonctionnel |

---

## 2. Créer

**Fichier :** `CreerPage.tsx` — studio 5 étapes · store `event.store.ts`.

### Checklist critères

| # | Constat |
|---|---------|
| 1 | Bouton « Photo de couverture » sans handler |
| 2 | Publish → `lovableEventHub(slug)` si slug ∉ mock → redirect liste |
| 3 | `EventCard`, `StudioStepper`, `OrganizerJourneyStrip` preview |
| 4 | `DEFAULT_DRAFT` = Obsidian Gala ; design `studio-draft` |
| 5 | **`createExperienceFromDraft` / `eventsService` non appelés** |
| 6 | Pas de feedback succès/échec publish |
| 7 | — |
| 8 | Loading uniquement `DesignEnginePreview` |
| 9 | Erreurs design persist non affichées |
| 10 | — |

### Tableau composants

| Écran | Composant | Statut |
|-------|-----------|--------|
| Créer · Étape 1 | Champs titre/date/lieu/description | Partiellement fonctionnel · Zustand |
| Créer · Étape 1 | Bouton photo couverture | Statique |
| Créer · Étape 1 | `EventCard` preview | Statique |
| Créer · Étape 2 | Choix univers INVITER/VENDRE | Partiellement fonctionnel · local |
| Créer · Étape 3 | Visibilité / capacité | Partiellement fonctionnel · local |
| Créer · Étape 3 | Copy paiements « hors scope Phase 2 » | Statique · obsolète (Phase 10) |
| Créer · Étape 4 | `DesignEnginePreview` | Partiellement fonctionnel · RPC optionnel |
| Créer · Étape 4 | `DesignToneControls` | Partiellement fonctionnel · store |
| Créer · Étape 5 | Liste blockers publication | Partiellement fonctionnel · engine local |
| Créer · Étape 5 | Bouton « Publier l'expérience » | À connecter · navigate only |
| Créer · Footer | Retour / Continuer / Annuler | Fonctionnel · navigation |
| Créer · Chrome | `StudioStepper` | Statique |

**Écrans liés (organisateur, nav Créer)** : `EvenementsPage` — liste `ORGANIZER_MOCK_EVENTS` · **Statique/mock** · liens hub **Fonctionnel**.

---

## 3. Inviter

**Préfixe :** `/evenements/:eventId/inviter*` · service **`inviter.service.ts`** → **Zustand uniquement** (SQL Phase 3 non branché).

### Checklist critères

| # | Constat |
|---|---------|
| 1 | « Télécharger QR » (`InvitePublicPage`) |
| 2 | — |
| 3 | QR grid CSS, workflow strips |
| 4 | `inviter-mock.ts` (5 guests `obsidian-gala`) |
| 5 | Distribution WhatsApp/Email = statut local, pas d'envoi |
| 6 | Paiement tarifs non bloque `distribute()` |
| 7 | — |
| 8 | ❌ tous écrans |
| 9 | Redirect hub si mauvais univers ; pas d'erreur API |
| 10 | Liste guests vide possible sans copy dédiée |

### Tableau composants

| Écran | Composant | Statut |
|-------|-----------|--------|
| Inviter · Hub | `InviterWorkflowStrip` | Statique |
| Inviter · Hub | `Stat` ×4 | Partiellement fonctionnel · mock |
| Inviter · Hub | Liens guests / distribuer / tarifs / analytics | Fonctionnel · routes |
| Inviter · Guests | Formulaire + « Créer l'accès » | Partiellement fonctionnel · store |
| Inviter · Guests | Lien `/invite/:token` | Fonctionnel · mock tokens |
| Inviter · Distribute | `ChannelToggle` WhatsApp/Email | Partiellement fonctionnel · UI only |
| Inviter · Distribute | « Distribuer (N) » | Partiellement fonctionnel · pas d'envoi réel |
| Inviter · Analytics | `Stat` ×6 | Partiellement fonctionnel · dérivé mock |
| Inviter · Tarifs | `InviterPricingCard` | Partiellement fonctionnel · RPC quote |
| Inviter · Tarifs | « Payer avant distribution » | Partiellement fonctionnel · checkout Phase 10 |
| Inviter · Tarifs | Provider fixe `wave` | À connecter · sélecteur provider |
| Inviter · Public `/invite/:token` | « Ajouter au wallet » | Partiellement fonctionnel · `demo-user` |
| Inviter · Public | « Télécharger QR » | Statique |
| Inviter · Public | QR visuel | Statique |
| Inviter · Public | `openByToken` au load | Partiellement fonctionnel · store |

**Routes publiques :** `/invite/:token` — **Fonctionnel** (hors bottom nav).

---

## 4. Vendre

**Préfixe :** `/evenements/:eventId/vendre*` + billetterie publique · **`vendre.service.ts`** — pricing RPC · tickets **store**.

### Checklist critères

| # | Constat |
|---|---------|
| 1 | Email / WhatsApp / QR (`TicketPublicPage`) |
| 2 | — |
| 3 | Hero gradient, QR décoratif, stats hub |
| 4 | `vendre-mock.ts` (`showcase-06`) |
| 5 | `publishTicketing` / `startSale` local ; **`checkout()` store non utilisé après paiement** |
| 6 | Flux achat → paiement → **pas d'émission billet / redirect ticket** |
| 7 | Checkout Phase 10 OK ; issuance billet **manquante** |
| 8 | ❌ hubs ; Checkout a loading bouton |
| 9 | Fallback RPC silencieux |
| 10 | Types épuisés gérés par `canPurchase` |

### Tableau composants

| Écran | Composant | Statut |
|-------|-----------|--------|
| Vendre · Hub | `VendreWorkflowStrip` | Statique |
| Vendre · Hub | `TicketingStatusBadge` | Partiellement fonctionnel · mock |
| Vendre · Hub | `Stat` ventes/revenus | Partiellement fonctionnel · mock |
| Vendre · Hub | Liens billets / publier / billetterie / analytics | Fonctionnel |
| Vendre · Billets | Presets + « Ajouter le billet » | Partiellement fonctionnel · commission RPC + store |
| Vendre · Billets | `VendrePricingQuoteCard` | Partiellement fonctionnel · RPC |
| Vendre · Publier | « Publier et ouvrir la vente » | Partiellement fonctionnel · store only |
| Vendre · Publier | Lien preview billetterie | Fonctionnel |
| Vendre · Analytics | `Stat` ×8 funnel | Partiellement fonctionnel · mock |
| Billetterie publique | Liste types + « Acheter » | Partiellement fonctionnel · mock event |
| Billetterie publique | Cover image | Statique |
| Achat | Formulaire acheteur | Partiellement fonctionnel |
| Achat | « Continuer vers paiement sécurisé » | Partiellement fonctionnel · `initiateVendreCheckout` |
| Achat | Provider fixe `wave` | À connecter |
| Checkout `/checkout/:id` | `PaymentProviderSelect` | Partiellement fonctionnel |
| Checkout | « Confirmer le paiement » | Partiellement fonctionnel · simulate/webhook |
| Statut `/paiement/statut/:id` | Réconciliation | Partiellement fonctionnel · pas de suite billet |
| Ticket public | Claim wallet | Partiellement fonctionnel · si ticket en store |
| Ticket public | Boutons partage | Statique |

**Événement démo VENDRE :** `showcase-06` · **INVITER :** `obsidian-gala`.

---

## 5. Partenaire

**Préfixe :** `/partenaires*` · **`partner.service.ts`** — store + commission RPC.

### Checklist critères

| # | Constat |
|---|---------|
| 1 | — |
| 2 | Organisateur bloqué sur sous-routes (by design) |
| 3 | Stats, media kit preview |
| 4 | `partner-mock.ts` |
| 5 | Retraits : erreur `insufficient_balance` non affichée |
| 6 | Vue organisateur = hint seulement |
| 7 | Organisateur : pas wallet/retraits/analytics |
| 8 | Quote campagne async sans spinner |
| 9 | Campagne inconnue → redirect silencieux |
| 10 | Wallet/retraits vides sans empty state |

### Tableau composants

| Écran | Composant | Statut |
|-------|-----------|--------|
| Partenaire · Hub | `PartnerDashboard` (rôle partenaire) | Partiellement fonctionnel · mock |
| Partenaire · Hub | `OrganizerPartnersView` | Statique · hint |
| Partenaire · Hub | Liens campagnes / wallet / retraits / analytics | Fonctionnel (partenaire) |
| Partenaire · Campagne | Stats + commission quote | Partiellement fonctionnel · RPC fallback |
| Partenaire · Campagne | Copier lien tracking | Partiellement fonctionnel · clipboard |
| Partenaire · Campagne | Aperçu destination | Statique |
| Partenaire · Wallet | Soldes + historique retraits | Partiellement fonctionnel · mock |
| Partenaire · Retraits | Demande retrait | Partiellement fonctionnel · store ; erreur absente |
| Partenaire · Analytics | Stats + breakdown | Partiellement fonctionnel · mock |

**Accueil partenaire :** montants hardcodés — voir §1.

---

## 6. Scanner

**Préfixe :** `/scanner*` · **`scanner.service.ts`** — validate RPC/Edge + fixtures.

### Checklist critères

| # | Constat |
|---|---------|
| 1 | Validation manuelle recherche sans feedback |
| 2 | — |
| 3 | Overlay résultat, stats terrain |
| 4 | `scanner-mock.ts` (Obsidian Gala) |
| 5 | Auto-scan démo 2,8 s ; offline queue sync partiel |
| 6 | — |
| 7 | — |
| 8 | `ScannerSearchPage` oui ; reste non |
| 9 | Échec réseau → fixture silencieux |
| 10 | Historique vide sans message |

### Tableau composants

| Écran | Composant | Statut |
|-------|-----------|--------|
| Scanner · Live | Zone scan + caméra placeholder | Partiellement fonctionnel · simulate/fixture |
| Scanner · Live | Torche / pause | Partiellement fonctionnel · UI |
| Scanner · Live | Sync offline | Partiellement fonctionnel · `syncOfflineQueue` |
| Scanner · Live | `ScannerResultOverlay` | Partiellement fonctionnel |
| Scanner · Live | Historique récent (5) | Partiellement fonctionnel · mock |
| Scanner · Live | Liens historique / analytics / recherche | Fonctionnel |
| Scanner · Historique | Liste scans | Partiellement fonctionnel · empty absent |
| Scanner · Analytics | Stats + portes | Partiellement fonctionnel · mock |
| Scanner · Recherche | Recherche + empty copy | Partiellement fonctionnel |
| Scanner · Recherche | Valider hit | À connecter · feedback UI |

**Accueil scanner :** stats statiques — voir §1.

---

## 7. Wallet invité

**Préfixe :** `/mes-acces*` · **`access.service.ts`** — agrège inviter + vendre stores.

### Checklist critères

| # | Constat |
|---|---------|
| 1 | — |
| 2 | Route alias `/acces` → **guard redirect** (≠ `/mes-acces`) |
| 3 | QR décoratif fiche accès |
| 4 | Passes depuis stores inviter/vendre (pas Supabase wallet) |
| 5 | Reconcile / claim : RPC + fallback ; `demo-user` |
| 6 | — |
| 7 | `/acces` alias incohérent |
| 8 | ❌ sauf lazy route |
| 9 | Claim sans erreur UI |
| 10 | AccesPage onglets OK ; historique vide non |

### Tableau composants

| Écran | Composant | Statut |
|-------|-----------|--------|
| Wallet · Liste | Tabs today/upcoming/used/expired | Partiellement fonctionnel · store |
| Wallet · Liste | `AccessPassCard` | Partiellement fonctionnel |
| Wallet · Liste | Empty section copy | Fonctionnel |
| Wallet · Liste | Reconcile démo | Partiellement fonctionnel · sans feedback |
| Wallet · Liste | Liens historique / recherche / analytics | Fonctionnel |
| Wallet · Détail | QR + métadonnées | Partiellement fonctionnel |
| Wallet · Détail | Claim | Partiellement fonctionnel · `demo-user` |
| Wallet · Détail | « Accès introuvable » | Fonctionnel · empty/error léger |
| Wallet · Historique | Timeline | Partiellement fonctionnel · empty absent |
| Wallet · Analytics | 4 stats | Partiellement fonctionnel · dérivé local |
| Wallet · Recherche | Filtre + résultats | Partiellement fonctionnel · empty OK |

---

## Écrans satellites (hors liste, impact mobile)

| Écran | Fichier | Statut global | Note |
|-------|---------|---------------|------|
| Welcome / choix rôle | `WelcomePage.tsx` | Fonctionnel | localStorage rôle |
| Mes événements | `EvenementsPage.tsx` | Partiellement fonctionnel | mock liste |
| Centre contrôle | `EventHubPage.tsx` | Partiellement fonctionnel | mock ; redirect si id inconnu |
| Finance | `OrganizerFinancePage.tsx` | Partiellement fonctionnel | RPC + mock |
| Paramètres | `ParametresPage.tsx` | Statique | pas de auth UI |
| Parcours | `ParcoursPage.tsx` | Partiellement fonctionnel | mock ; event query optionnel |
| Design / Rayonner | pages dédiées | Partiellement fonctionnel | selon phase 8 |

---

## Inventaire mocks & services

| Fichier mock | Alimente |
|--------------|----------|
| `organizer-mock.ts` | Accueil orga, Evenements, EventHub, Analytics event, billetterie meta |
| `inviter-mock.ts` | Inviter store guests/types |
| `vendre-mock.ts` | Vendre tickets, pricing fallback |
| `partner-mock.ts` | Partner store |
| `scanner-mock.ts` | Scanner session/history |
| `wallet-access-mock.ts` | Reconcile demo profile |
| `payment-mock.ts` | Checkout si `VITE_PAYMENTS_MOCK` |
| `finance-mock.ts` | Quotes fallback |

| Service | Backend réel | UI branchée |
|---------|--------------|-------------|
| `inviter.service.ts` | SQL Phase 3 | ❌ store only |
| `vendre.service.ts` | RPC commission, checkout RPC | ⚠️ partiel |
| `payment.service.ts` | Phase 10 RPC + Edge | ⚠️ partiel |
| `partner.service.ts` | Commission RPC | ⚠️ partiel |
| `scanner.service.ts` | `validate_access_scan` RPC | ⚠️ partiel |
| `access.service.ts` | claim/reconcile RPC | ⚠️ partiel |
| `finance.service.ts` | balance, report, payout RPC | ⚠️ partiel |
| `events.service.ts` | create/publish experience | ❌ pas Créer |

---

## Plan de correction priorisé (avant PHASE 11)

### P0 — Bloquants produit / confiance

1. **Créer → publish** : brancher `createExperienceFromDraft` / `eventsService` ; naviguer vers `event.id` réel ; remplacer dépendance `organizer-mock` pour liste/hub.
2. **Vendre : paiement → billet** : après `payment.succeeded`, lier `complete_ticket_payment` + redirect `/ticket/:token` + claim réel (`auth.uid()`).
3. **INVITER : paiement → distribution** : bloquer `distribute()` tant que transaction inviter ≠ `paid`.
4. **Auth réelle** : remplacer `demo-user` sur claim invite/ticket/wallet.

### P1 — Données source de vérité

5. **Inviter service** : CRUD guests, distribution log, statuts — Supabase RPC (migration Phase 3).
6. **Vendre service** : ticket types, publish, stock — Supabase (Phase 4).
7. **Accueil + Evenements** : agrégats depuis API (plus de literals Marc / Soirée Velours / stats scanner).
8. **Partner wallet/retraits** : `create_partner_withdrawal_request` + soldes RPC.

### P2 — UX mobile robuste

9. **BottomNav** : `pathname.startsWith(tab.to)` pour sous-routes.
10. **RoleRouteGuard** : page « accès refusé » ou toast au lieu de redirect silencieux.
11. **Route `/acces`** : supprimer alias ou ajouter à `ALLOWED_PATHS`.
12. **Loading / error / empty** : pattern commun (Accueil, hubs, Partner quote, withdrawals, Scanner history, Wallet history).
13. **Provider select** : réutiliser `PaymentProviderSelect` sur achat + tarifs inviter.

### P3 — Finitions

14. Boutons QR / partage (génération réelle `qrcode` / share API).
15. Photo couverture Créer → storage Supabase.
16. Parcours : passer `event` depuis `UniverseCard`.
17. Analytics organisateur global (route + agrégation).
18. Paramètres : session Supabase, profil, déconnexion.
19. Mettre à jour copy « Paiement simulé Phase 4 » → renvoi Phase 10 réel.
20. Tests E2E mobile : parcours invité achat, organisateur publish, scanner validate.

### Jalons suggérés PHASE 11

| Lot | Thème | Dépend de |
|-----|-------|-----------|
| 11.A | Events API + Créer publish + liste organisateur | P0.1, P1.7 |
| 11.B | Checkout complet VENDRE + wallet ticket | P0.2, P0.4 |
| 11.C | INVITER Supabase + gate paiement | P0.3, P1.5 |
| 11.D | UX états + nav mobile | P2 |
| 11.E | Partner payouts + notifications | P1.8, Phase 10 notifications |

---

## Métriques audit (estimation)

| Statut | ~Nombre de composants audités |
|--------|-------------------------------|
| Fonctionnel | 18 |
| Partiellement fonctionnel | 52 |
| Statique | 24 |
| À connecter | 16 |

**Ratio connecté backend réel (hors pricing/checkout partiels) :** ~15 % des actions utilisateur critiques.

---

*Document généré par audit code-only — à valider en session mobile réelle (iPhone via ngrok) pour écarts CSS/touch non couverts ici.*
