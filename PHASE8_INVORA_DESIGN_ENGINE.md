# PHASE 8 — INVORA Luxury Design Engine

**Date :** 2026-06-01  
**Règle absolue :** aucune galerie · aucun template choisi par l’utilisateur  
**Build :** `npm run typecheck` + `npm run build`

---

## 1. Vision

```
Créer → Analyser → Composer identité → Générer supports → Distribuer
```

L’organisateur crée une **expérience**. INVORA crée l’**identité visuelle**.

---

## 2. Collections internes (non visibles)

| ID | Usage moteur |
|----|----------------|
| editorial | Galas culturels |
| luxe | Mariages, VIP |
| avant_garde | Club, art |
| nocturne | Soirées noires |
| heritage | Tradition |
| corporate | Conférences |
| festival | Live, VENDRE |
| signature_invora | Fallback ADN |

Fichier : `design-collections.internal.ts` — **ne pas importer dans l’UI utilisateur**.

---

## 3. Moteurs

| Moteur | Fichier | Rôle |
|--------|---------|------|
| Analyse | `design-analysis.engine.ts` | Catégorie, seed, profil visuel |
| Composition | `design-composition.engine.ts` | Grille, cadres, QR zones |
| Photo | `design-photo.engine.ts` | Overlay, gradient, zone texte |
| Supports | `design-supports.engine.ts` | 12+ formats auto |
| Media Kit | `design-media-kit.engine.ts` | Partenaires + RAYONNER |
| Animations | `design-animations.ts` | Motion premium |
| Orchestrateur | `design.engine.ts` | `composeEventIdentity`, `generateDesignPackage` |

---

## 4. Unicité

Fingerprint = collection + palette + grille + photo + profil + seed événement.

**Tests diversité :** 50 événements (10×5 catégories) → `/design/diversity`

Critère : `uniqueFingerprints === total` (50/50).

---

## 5. Personnalisation (sans templates)

Boutons : Plus élégant · moderne · premium · festif · corporate · exclusif

→ `applyTonePreset` recalcule identité + assets.

---

## 6. Assets générés

Invitation, billet, pass VIP, QR card, stories (vertical, WA, IG), affiches carrée/portrait, wallet pass, media kit, bannière, visuel partenaire.

---

## 7. Routes UI

| Route | Page |
|-------|------|
| Studio étape 4 | `CreerPage` + tone controls |
| `/evenements/:id/medias` | Médias générés |
| `/evenements/:id/design` | Studio design complet |
| `/design/diversity` | Rapport QA 50 événements |

---

## 8. Persistance

Migration `20250601000007_design_engine.sql` :

- `events.design_fingerprint`, `design_identity` (JSONB)
- RPC `upsert_event_design_identity`

---

## 9. Test manuel

1. **Créer** → étape 4 Design → affiner le ton  
2. **Obsidian Gala** → Médias / Design  
3. **/design/diversity** → 50/50 uniques  

```bash
supabase db push
```
