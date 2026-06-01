# PHASE 0 — Audit Lovable × Vision INVORA

**Date :** 2026-06-01  
**ZIP source :** `invora-experience-craft-main.zip`  
**Référence produit :** document Phase 0 (4 piliers, 2 univers, Rayonner, Business Engine)

---

## 1. Synthèse d'intégration

| Élément | Statut |
|---------|--------|
| ZIP extrait | `src/integration/lovable/bundle/` (archive, non compilée) |
| UI portée | `src/pages/lovable/`, `src/components/lovable/` |
| Router | **React Router 7** (remplace TanStack Start du ZIP) |
| Design system | `src/styles/lovable.css` (Tailwind v4, tokens Noir Luxe) |
| Auth | Bridge `useRole` ↔ `useAuth` (localStorage + profil Supabase) |
| Services | `integration/lovable/services-bridge.ts` (réexport fondation) |
| Build | `npm run build` OK |

**Décision d'architecture :** le ZIP n'a pas été exécuté tel quel (TanStack Start, Bun, SSR). Les écrans ont été **réalignés et portés** vers la fondation INVORA V2.

---

## 2. Cartographie routes

| Route Lovable | Page INVORA V2 | Pilier(s) |
|---------------|----------------|-----------|
| `/` | `WelcomePage` | Sélection pilier |
| `/accueil` | `AccueilPage` | Organisateur / Invité / Partenaire / Scanner |
| `/evenements` | `EvenementsPage` | Organisateur (catalogue) |
| `/creer` | `CreerPage` | Organisateur (studio) |
| `/acces` | `AccesPage` | Invité (wallet) |
| `/scanner` | `ScannerPage` | Scanner |
| `/parcours` | `ParcoursPage` | Organisateur (workflow, hors nav) |

**Navigation bottom :** Accueil · Événements · Créer (FAB) · Accès · Scanner — identique au ZIP.

---

## 3. Incohérences UX

| # | Problème | Gravité | Détail |
|---|----------|---------|--------|
| U1 | **Même nav pour tous les rôles** | Haute | Scanner et Partenaire voient « Créer » et « Événements » — hors périmètre produit |
| U2 | **`/parcours` invisible dans la nav** | Moyenne | Parcours organisateur critique mais uniquement via lien dashboard |
| U3 | **Scroll long sur Partenaire (ZIP)** | Moyenne | Version portée simplifiée ; ZIP original très long (liens, étapes, KPIs) |
| U4 | **Pas de fil d'Ariane / titre de contexte** | Moyenne | Utilisateur ne voit pas univers INVITER vs VENDRE en navigation |
| U5 | **« Changer » de rôle trop discret** | Faible | Lien texte 10px — risque de confusion compte vs rôle démo |
| U6 | **Scanner simulé** | Info | `setTimeout` aléatoire — pas de `html5-qrcode` branché (attendu Phase 0) |
| U7 | **Assets manquants dans ZIP** | Faible | `welcome-bg.jpg`, `event-hero.jpg` absents — remplacés par dégradés |

---

## 4. Incohérences produit (vision officielle)

| # | Écart | Vision INVORA | État Lovable |
|---|-------|---------------|--------------|
| P1 | **Libellé « Participant »** | Pilier **Invité** | ZIP : « Participant » — porté : **Invité** sur welcome, `participant` en code DB |
| P2 | **Univers INVITER / VENDRE** | Nommage et flows distincts | ZIP : `invitation` / `billetterie` — porté : **INVITER** / **VENDRE** sur `/creer` uniquement |
| P3 | **Pilier Rayonner** | Transverse avant / pendant / après | **Absent** (affiches, stories, live, albums, bilan partenaire) |
| P4 | **Flow INVITER officiel** | Créer → Accès → Invités → Distribuer → Scanner → Analytics | ZIP/parcours : Créer → Config → Publier → Gérer → Analyser — **partiellement aligné** sur `ParcoursPage` portée |
| P5 | **Flow VENDRE officiel** | Créer → Billets → Publier → Acheter → Paiement → QR → Scanner → Analytics | **Non modélisé** — toggle sur création seulement |
| P6 | **Invité sans compte** | WhatsApp / Email / lien sécurisé | UI wallet seulement — pas de parcours « lien reçu » |
| P7 | **Partenaire : kit auto** | Affiches, stories, visuels, QR partenaire, textes | **Absent** — commissions mockées |
| P8 | **Business Engine** | Grille INVITER + commissions VENDRE via **RPC / Edge only** | **Aucune UI prix** (correct Phase 0) mais **aucune mention** que le calcul est serveur |
| P9 | **INVORA ≠ billetterie** | Système d'expériences | Copy ZIP : « gestion d'événements » / « billetterie » dans meta — à réécrire |
| P10 | **Authentification** | Comptes réels Supabase | Sélecteur rôle localStorage — bridge préparé, pas d'écran login |

---

## 5. Écrans incomplets

| Écran | Manques |
|-------|---------|
| `/creer` | Étapes 2–4, publication, choix visibilité, guest list, types de billets |
| `/evenements` | Détail événement, filtres INVITER/VENDRE, actions |
| `/acces` | Mode sans compte, import wallet réel, QR dynamique |
| `/scanner` | Caméra réelle, liaison `scansService` / Edge `validate-scan` |
| `/accueil` partenaire | Kit Rayonner, assets promo, QR partenaire |
| **Auth** | Login, signup, reset — absents |
| **Rayonner** | Avant / pendant / après — absents |
| **Paiement VENDRE** | Checkout, confirmation — absents |

---

## 6. Parcours cassés ou dead-ends

| Parcours | Problème |
|----------|----------|
| Invité → Créer (nav) | Accès à un écran organisateur sans garde rôle |
| Partenaire → Scanner | Nav expose scanner terrain sans contexte événement |
| Organisateur → Continuer (`/creer`) | Bouton sans navigation vers étape 2 |
| Organisateur → `/parcours` | OK depuis dashboard ; pas depuis nav |
| Retour global | Seul `/` « Changer rôle » — pas de logout |

---

## 7. Doublons

| Doublon | Fichiers / zones |
|---------|------------------|
| Dashboard vs Accueil organisateur | KPIs + EventCard répétés conceptuellement avec `/evenements` |
| Scanner home vs `/scanner` | Deux entrées scan (accueil scanner + page scanner) |
| Wallet | `/acces` vs section accès sur accueil invité |
| Parcours 5 étapes vs strip 5 colonnes accueil | Deux représentations du même workflow |

---

## 8. Écrans inutiles ou à fusionner (restructuration proposée)

| Écran | Recommandation |
|-------|----------------|
| `/evenements` + dashboard event card | Fusionner en **une** liste avec CTA contextuel |
| Scanner home | Supprimer — rediriger rôle scanner directement vers `/scanner` |
| Onglet « Historique » wallet | Garder mais sous **Invité** uniquement |

---

## 9. Écrans manquants (vs vision)

| Priorité | Écran / module |
|----------|----------------|
| P0 | Auth (email), onboarding pilier |
| P0 | Détail expérience (hub INVITER ou VENDRE) |
| P1 | Distribution invitations (WhatsApp, email) |
| P1 | Billetterie VENDRE (types, stock, page publique) |
| P1 | Rayonner — avant (affiches, stories) |
| P1 | Partenaire — kit média + liens |
| P2 | Rayonner — pendant (live, entrées) |
| P2 | Rayonner — après (bilan, albums, remerciements) |
| P2 | Paiement + confirmation |
| P2 | Analytics unifiés (organisateur + partenaire) |

---

## 10. Audit par pilier

### Organisateur
- **OK :** dashboard, création step 1, parcours, liste événements  
- **KO :** séparation INVITER/VENDRE, guest list, billetterie, analytics, publication, identité visuelle auto

### Invité
- **OK :** wallet UI, QR mock, onglets billets/invitations  
- **KO :** mode sans compte, lien sécurisé reçu, regroupement historique cross-événements réel

### Partenaire
- **OK :** commissions mock, retrait CTA  
- **KO :** kit promo auto, un wallet INVITER+VENDRE expliqué, suivi performance par lien

### Scanner
- **OK :** UI validation/refus, historique mock  
- **KO :** scan caméra réel, doublons serveur, sélection événement/porte

### Rayonner
- **KO :** entièrement absent

---

## 11. Incohérences Wallet

| Point | Attendu | Actuel |
|-------|---------|--------|
| Source de vérité | `wallet_passes` Supabase | Données mock |
| Types | invitation / ticket / access | UI billets + invitations séparés — OK conceptuellement |
| Sans compte | Lien → QR sans app | Non |
| Apple / Google Pay | Intégration future | Boutons présents, non fonctionnels |
| Un wallet invité | Tous accès regroupés | UI présente, pas de fetch |

---

## 12. Liste des corrections proposées (Phase 1+)

### Navigation & IA (sans nouvelle feature métier)
1. **Nav adaptative par rôle** — masquer Créer/Événements pour invité, scanner, partenaire  
2. **Renommer routes** — `/experiences` au lieu de `/evenements` (vocabulaire produit)  
3. **Hub `/parcours` → `/experience/:id`** avec onglets selon univers  
4. **INVITER / VENDRE** — badge persistant + routes dédiées post-création  
5. **Écran Rayonner** — section ou onglet sur fiche expérience (avant/pendant/après)  
6. **Auth réelle** — remplacer sélecteur `/` par login + `primary_role` Supabase  
7. **Brancher services** — listes vides + états loading (pas de mock silencieux)  
8. **Scanner** — `html5-qrcode` + `scansService`  
9. **Wallet** — `walletService.listUserWalletPasses`  
10. **Copy** — supprimer « billetterie app », renforcer « expérience »

### Technique
11. Générer types Supabase + typer client  
12. Déployer migrations + Edge Functions  
13. Importer shadcn du bundle **à la demande** (46 composants non utilisés — ne pas tout charger)

---

## 13. Critère « 5 secondes » — évaluation

| Écran | Compréhension < 5s ? | Commentaire |
|-------|----------------------|-------------|
| Welcome | Oui | Choix pilier clair |
| Accueil orga | Partiel | Prochaine action OK ; univers flou |
| Créer | Partiel | INVITER/VENDRE visible ; suite floue |
| Accès | Oui | QR + wallet évidents |
| Scanner | Oui | Validé/Refusé clair |
| Partenaire | Partiel | Retrait clair ; distribution floue |
| Parcours | Oui | Timeline lisible |

---

## 14. Fichiers clés post-intégration

```
src/integration/lovable/
  bundle/          # Archive ZIP (référence)
  routes.tsx       # Manifest routes + enregistrement
  use-role.ts      # Bridge rôle UI / Auth
  services-bridge.ts
src/pages/lovable/ # 7 pages portées
src/components/lovable/
src/layouts/LovableAppLayout.tsx
src/styles/lovable.css
```

---

## 15. Conclusion Phase 0

Le ZIP Lovable fournit une **base visuelle premium** (Noir Luxe, mobile-first) et une **ossature de navigation**, mais :

- Il **ne reflète pas** encore la vision complète (Rayonner, INVITER/VENDRE flows, Invité sans compte, kit partenaire).  
- Il **ne doit pas** être copié aveuglément : nav unique, vocabulaire « participant », parcours générique, données mock.  

**Objectif Phase 0 atteint :** comprendre, intégrer, auditer, proposer réalignement — **sans** nouvelle feature ni logique métier financière côté React.

**Prochaine phase recommandée :** restructuration navigation (§12.1–5) puis branchement données Supabase (§12.7–9).
