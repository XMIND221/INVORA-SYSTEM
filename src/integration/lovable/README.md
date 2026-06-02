# Couche d'intégration Lovable — INVORA V2

## Statut Phase 0

- ZIP extrait dans `bundle/` (référence uniquement, exclu du build TypeScript)
- UI portée vers `src/pages/lovable/` + `src/components/lovable/`
- Routes enregistrées via `routes.tsx` (React Router)
- Audit : `PHASE0_LOVABLE_AUDIT.md` à la racine du projet

## Lancer

```bash
npm run dev
```

Ouvrir `http://localhost:8080` → sélection du pilier → navigation bottom.

> Le dossier `bundle/` est une **référence Lovable** (TanStack Start) : ne pas le lancer sur le port 8080. L'app INVORA tourne à la racine du projet (`npm run dev`).

## Bridge technique

| Module | Rôle |
|--------|------|
| `use-role.ts` | Rôle UI ; sync `useAuth().profile.primary_role` si session |
| `services-bridge.ts` | Réexport services / hooks fondation |
| `routes.tsx` | Définition routes + `registerLovableManifest` |

## Règles

- Ne pas compiler `bundle/` directement (TanStack Start ≠ stack INVORA)
- Toute évolution UI passe par `src/pages/lovable/` ou `src/components/lovable/`
- Calculs financiers : **jamais** dans React — RPC / Edge Functions uniquement
