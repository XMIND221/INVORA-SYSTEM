# PHASE 1 — Alignement UX global INVORA

**Date :** 2026-06-01  
**Périmètre :** UX · UI · Navigation · Architecture produit uniquement  
**Hors scope :** Business Engine, Supabase, engines, RLS, Edge Functions

**Build :** `npm run typecheck` + `npm run build` — OK

---

## 1. Résumé des changements

| Zone | Avant (Phase 0) | Après (Phase 1) |
|------|-----------------|-----------------|
| Navigation | 5 onglets identiques pour tous | **Nav adaptative par rôle** (3 à 5 onglets) |
| Mes accès | Onglet « Accès » ambigu | Route `/mes-acces`, libellé **Mes accès** (portefeuille) |
| Invité | Label « Participant » | **Invité** partout (copy produit) |
| INVITER / VENDRE | Toggle sans contexte | **Flows visibles** + parcours `?univers=` |
| Organisateur accueil | Scroll long, KPI + doublons | **2 cartes univers** + 1 prochaine action |
| Scanner accueil | Écran intermédiaire redondant | **1 CTA** → scanner |
| Partenaire | Bloc retrait seul | **4 questions** (gagner / partager / suivre / retirer) |
| Garde routes | Aucune | **RoleRouteGuard** → redirection accueil |
| Paramètres | Absent | **`/parametres`** (rôle, changer d’espace) |
| Partenaires | Absent | **`/partenaires`** (promouvoir / gestion orga) |

---

## 2. Navigation simplifiée par rôle

### Avant

```
Tous les rôles : Accueil | Événements | [Créer] | Accès | Scanner
```

### Après

| Rôle | Onglets |
|------|---------|
| **Organisateur** | Accueil · Mes événements · **Créer** (FAB) · Partenaires · Paramètres |
| **Invité** | Accueil · **Mes accès** · Paramètres |
| **Partenaire** | Accueil · **Promouvoir** · Paramètres |
| **Scanner** | Accueil · **Scanner** (FAB) · Paramètres |

Fichier : `src/integration/lovable/navigation.ts`  
Composant : `src/components/lovable/BottomNav.tsx`

**Capture textuelle — Invité (après)**

```
┌─────────────────────────────────────┐
│  Accueil    Mes accès    Paramètres │  ← pas de Créer / Scanner
└─────────────────────────────────────┘
```

---

## 3. Rôles clarifiés

Source unique : `src/integration/lovable/product-copy.ts` → `ROLE_INTENT`

| Rôle | Vous êtes… | Vous obtenez… | Prochaine action typique |
|------|------------|---------------|------------------------|
| Organisateur | Vous créez et pilotez l’expérience | Invitations, billets, QR générés | Choisir INVITER ou VENDRE |
| Invité | Invité ou acheteur — pas organisateur | Billets & QR dans le portefeuille | Ouvrir Mes accès |
| Partenaire | Vous distribuez — vous ne créez pas | Liens, visuels, commissions | Partager vos liens |
| Scanner | Vous validez les entrées | Scan, refus, historique | Lancer le scan |

Barre de contexte sur chaque écran : `RoleContextBar` (rôle + emplacement + lien Profil).

---

## 4. INVITER — parcours clarifié

### Flow officiel affiché

```
Créer accès → Ajouter invités → Distribuer → Scanner → Analyser
```

### Où c’est visible

- **Accueil organisateur** : carte univers INVITER + `FlowStrip` (étape 3/5 en cours)
- **Créer** : sélection INVITER + bandeau de flow + badge **Privé**
- **Parcours** : `/parcours?univers=inviter` — étapes listées, « À faire maintenant »

### Message clé (copy)

> « Accès privés — vous connaissez vos invités »  
> Mariages, VIP, corporate, famille, presse, staff

---

## 5. VENDRE — parcours clarifié

### Flow officiel affiché

```
Créer billets → Publier → Acheter → Payer → Recevoir QR → Scanner → Analyser
```

### Où c’est visible

- **Accueil organisateur** : carte univers VENDRE
- **Créer** : sélection VENDRE + badge **Public**
- **Parcours** : `/parcours?univers=vendre`

### Message clé

> « Billetterie publique — vous ne connaissez pas encore les acheteurs »

---

## 6. Mes accès (portefeuille)

### Avant

- Onglet « Accès » dans la nav globale
- Confusion possible avec un « rôle »

### Après

- Route : **`/mes-acces`** (alias `/acces` conservé)
- Nav invité : **Mes accès** uniquement
- Copy explicite :

  - *« Ce n’est pas un rôle — c’est l’endroit où vivent vos billets et invitations »*
  - *« QR, cartes et historique — compte optionnel »*

- Welcome : note en bas de page rappelant que Mes accès n’est pas à choisir sur l’écran d’entrée

---

## 7. Partenaire

### Page `/partenaires`

**Invité partenaire (Promouvoir)** — 4 blocs FAQ :

1. Comment gagner ?
2. Comment partager ?
3. Comment suivre ?
4. Comment retirer ?

**Organisateur** — texte explicatif (invitation partenaires, calcul serveur).

### Accueil partenaire (allégé)

- 1 **NextActionCard** → Promouvoir
- 2 KPIs (plus de scroll long type Phase 0)

---

## 8. Scanner

### Avant

- Accueil scanner : grand mock + stats + page scanner = **double étape**

### Après

- Accueil : **1 carte** « Lancer le scan »
- Page scanner : contexte + libellés `SCANNER_COPY` (scan / historique)
- Nav scanner : FAB **Scanner** (3 onglets max)

---

## 9. Écrans modifiés

| Fichier | Modifications |
|---------|----------------|
| `WelcomePage.tsx` | Copy rôle via `ROLE_INTENT`, note portefeuille |
| `AccueilPage.tsx` | 4 homes restructurés, moins de scroll |
| `CreerPage.tsx` | Univers INVITER/VENDRE + flow + lien parcours |
| `ParcoursPage.tsx` | Query `univers`, steps dynamiques |
| `EvenementsPage.tsx` | « Mes expériences », badges INVITER/VENDRE |
| `AccesPage.tsx` | Framing portefeuille, `RoleContextBar` |
| `ScannerPage.tsx` | Contexte scanner |
| `PartenairesPage.tsx` | **Nouveau** |
| `ParametresPage.tsx` | **Nouveau** |
| `BottomNav.tsx` | Nav par rôle |
| `LovableAppLayout.tsx` | `RoleRouteGuard` |

### Nouveaux composants UX

| Composant | Rôle |
|-----------|------|
| `RoleContextBar` | Où je suis + quel pilier |
| `FlowStrip` | Parcours INVITER / VENDRE |
| `NextActionCard` | Prochaine action unique |
| `UniverseCard` | Carte univers sur accueil orga |
| `RoleRouteGuard` | Empêche accès hors-rôle |

---

## 10. Langage utilisateur (exemples appliqués)

| ❌ Évité | ✔ Utilisé |
|---------|----------|
| Participant (UI) | **Invité** |
| Dashboard générique | **Tableau de bord** / contexte rôle |
| invitation / billetterie (seuls) | **INVITER** / **VENDRE** + sous-titre explicatif |
| Accès (nav ambiguë) | **Mes accès** |
| Événements | **Mes événements** / **Mes expériences** |
| Studio · Étape 1/4 (jargon) | **Étape 1 · L’essentiel** |

---

## 11. Incohérences corrigées (audit Phase 0 → Phase 1)

| # | Correction |
|---|------------|
| 1 | Nav identique → nav par rôle |
| 2 | Invité voyait Créer / Scanner → masqué + guard |
| 3 | Parcours hors nav → accessible via cartes univers + NextAction |
| 4 | INVITER/VENDRE toggle seul → flows + parcours dédiés |
| 5 | Mes accès = onglet global → portefeuille invité seulement |
| 6 | Scanner double écran → accueil minimal + FAB |
| 7 | Partenaire scroll → FAQ structurée |
| 8 | Pas de paramètres → `/parametres` |
| 9 | « Participant » UI → « Invité » |
| 10 | Pas de contexte écran → `RoleContextBar` |

---

## 12. Non modifié (volontaire)

- Aucune logique métier / paiement / RPC
- Données toujours **mock** (services non branchés)
- 46 composants shadcn du ZIP non importés (pas utilisés)
- Pilier **Rayonner** : pas d’écran dédié (Phase 2 produit)
- Auth Supabase : mention « phase métier à venir » dans Paramètres

---

## 13. Critère « 5 secondes » — réévaluation

| Écran | Compréhension immédiate |
|-------|-------------------------|
| Welcome | ✅ Quel espace choisir |
| Accueil (tous rôles) | ✅ Rôle + prochaine action |
| Créer | ✅ Privé vs Public + suite |
| Parcours | ✅ Étapes + étape courante |
| Mes accès | ✅ Portefeuille, pas un rôle |
| Scanner | ✅ Scanner maintenant |
| Partenaires | ✅ 4 questions partenaire |

---

## 14. Prochaines étapes recommandées (Phase 2+)

1. Écran **Rayonner** (avant / pendant / après) sur fiche expérience  
2. Brancher données réelles (sans changer l’IA navigation)  
3. Auth réelle remplaçant « Changer d’espace »  
4. Détail expérience (hub post-création)

---

## 15. Vérification

```bash
npm run dev
# Tester chaque rôle depuis /
# Organisateur : créer → parcours inviter/vendre
# Invité : tenter /creer → redirect accueil
# Scanner : FAB scanner
```
