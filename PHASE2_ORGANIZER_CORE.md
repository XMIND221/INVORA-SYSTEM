# PHASE 2 — Organizer Core Experience

**Date :** 2026-06-01  
**Périmètre :** Espace organisateur — création, gestion, pilotage, analytics (UI + orchestration légère)  
**Hors scope :** Stripe, paiements, retraits, logique financière côté React

**Build :** `npm run typecheck` + `npm run build` — OK

---

## 1. Résumé

| Zone | Livrable |
|------|----------|
| **Studio** | 5 étapes : Essentiel → Univers → Configuration → Prévisualisation (Design Engine) → Publication |
| **Design Engine** | `design.engine.ts` — livrables auto par univers, sans galerie |
| **Centre de contrôle** | `/evenements/:eventId` — statut, KPIs, actions rapides |
| **Statuts** | Brouillon · Publié · Actif · Terminé · Archivé (mapping DB → UI) |
| **Parcours orga** | `OrganizerJourneyStrip` sur accueil, liste, studio, hub, parcours |
| **Analytics** | `/evenements/:eventId/analytics` — métriques démo |
| **RAYONNER** | `/evenements/:eventId/rayonner` — Avant / Pendant / Après (preview) |
| **Médias** | `/evenements/:eventId/medias` — aperçu Design Engine |

Données : **fixtures Phase 2** (`organizer-mock.ts`) + **Zustand** pour le brouillon studio. Services Supabase inchangés (branchement métier phase suivante).

---

## 2. Parcours organisateur (visible partout)

```
Créer → Configurer → Publier → Gérer → Analyser
```

- Copy : `ORGANIZER_JOURNEY` dans `product-copy.ts`
- Composant : `OrganizerJourneyStrip.tsx`
- Index courant piloté par mock (`journeyStep`) ou par étape studio (1–5)

---

## 3. Studio réorganisé (`/creer`)

| Étape | Contenu |
|-------|---------|
| 1 | Photo couverture, nom, date, lieu, description |
| 2 | INVITER ou VENDRE |
| 3 | Visibilité, capacité (note : pas de paiements) |
| 4 | INVORA Design Engine — grille de supports auto |
| 5 | Récap + publication (`validatePublication` engine) |

État : `useEventStore` — `draft`, `studioStep`, `patchDraft`, `resetStudio`.

Après publication → navigation vers `/evenements/{slug}` (hub).

---

## 4. INVORA Design Engine

- Fichier : `src/features/engines/design.engine.ts`
- **Pas de galerie** : l’organisateur construit l’événement ; INVORA liste les livrables prêts.
- **INVITER :** invitation, badge, story, affiche, wallet pass
- **VENDRE :** billet, story, affiche, badge, wallet pass
- UI : `DesignEnginePreview.tsx`

---

## 5. Statuts universels

| UI (fr) | Statuts DB mappés |
|---------|-------------------|
| Brouillon | `draft` |
| Publié | `scheduled`, `published` |
| Actif | `live` |
| Terminé | `ended` |
| Archivé | `archived` |

- Module : `src/integration/lovable/event-status.ts`
- Composant : `EventStatusBadge.tsx`

---

## 6. Centre de contrôle événement

**Route :** `/evenements/:eventId`

Affiche :

- Statut (badge)
- Parcours organisateur + flow INVITER/VENDRE
- KPIs : accès/billets, scans, conversions, revenus (— si INVITER), partenaires
- **Actions rapides :** INVITER/VENDRE (parcours), Partenaires, Scanner, Analytics, Médias, RAYONNER

Mock : `ORGANIZER_MOCK_EVENTS` — 3 expériences (Obsidian Gala, Showcase 06, Brunch Privé).

---

## 7. Analytics

**Route :** `/evenements/:eventId/analytics`

- Vues, invitations envoyées/acceptées, billets vendus, scans, taux de présence, partenaires actifs
- Données démo ; tables cibles : `event_metrics`, `analytics_events`

---

## 8. RAYONNER (préparation)

**Route :** `/evenements/:eventId/rayonner`

- Phases : **Avant**, **Pendant**, **Après** — badge « Bientôt »
- Copy : `RAYONNER_PHASES` dans `product-copy.ts`

---

## 9. Navigation

- Garde : `isPathAllowed` autorise `/evenements/*` pour l’organisateur
- Bottom nav inchangée (Accueil · Mes événements · Créer · Partenaires · Paramètres)
- Sous-pages hub accessibles depuis actions rapides (pas d’onglet dédié)

---

## 10. Fichiers clés

| Rôle | Chemins |
|------|---------|
| Studio | `src/pages/lovable/CreerPage.tsx` |
| Liste | `src/pages/lovable/EvenementsPage.tsx` |
| Hub | `src/pages/lovable/EventHubPage.tsx` |
| Analytics / Rayonner / Médias | `EventAnalyticsPage`, `EventRayonnerPage`, `EventMediasPage` |
| Mock | `src/integration/lovable/organizer-mock.ts` |
| Routes | `src/integration/lovable/routes.tsx`, `src/lib/constants.ts` |
| Store | `src/store/event.store.ts` |

---

## 11. Prochaine phase (suggestion)

1. Auth organisateur + `listOrganizerEvents` / `createExperience` branchés au studio
2. `updateEvent` / RPC publication (statut `published`, `published_at`)
3. Upload couverture → Storage `event-media`
4. RAYONNER fonctionnel (campagnes, live, post-event)
5. Pas de Stripe avant validation produit paiements
