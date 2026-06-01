# INVORA V2 — Rôles & permissions

## Les 4 piliers (+ admin)

| Rôle | Pillar | Capacités principales |
|------|--------|------------------------|
| `organisateur` | Organisateur | Créer expériences, participants, tickets, analytics, partenaires |
| `participant` | Participant | Découvrir, acheter, wallet, QR entrée |
| `partenaire` | Partenaire | Distribution, commissions, analytics partenaire |
| `scanner` | Scanner | Scan QR, validation, historique |
| `admin` | Plateforme | Tous droits |

## Rôle primaire vs rôle événement

- **`profiles.primary_role`** : rôle global de navigation (routes protégées).
- **`event_roles`** : permissions fines par événement (`owner`, `organizer`, `staff`, `scanner`, `partner`).

## Matrice permissions (frontend)

Définie dans `src/types/roles.ts` → `ROLE_PERMISSIONS`.

Consommation :

```ts
const { can } = usePermissions();
if (can('canScan')) { /* … */ }
```

## Routes protégées

| Route | Rôles autorisés |
|-------|-----------------|
| `/dashboard` | Authentifié |
| `/scanner` | `scanner`, `admin` |
| `/partner` | `partenaire`, `admin` |

Les pages visuelles seront fournies par Lovable ; les guards restent dans `src/pages/ProtectedRoute.tsx`.

## RLS (base)

- Organisateur : accès complet à ses `events` et dérivés.
- Participant : `wallet_passes`, `tickets` (owner), événements `public`.
- Scanner : insert/select `scans` via `has_event_role`.
- Partenaire : `partners` + `commissions` propres.

Détails : `SECURITY.md` et migrations SQL.
