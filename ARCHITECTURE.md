# INVORA V2 — Architecture

## Vision

INVORA est le système d'exploitation des expériences premium : création, diffusion, accès, billetterie et orchestration. L'utilisateur crée une **expérience** ; INVORA génère invitations, billets, QR, wallet et contrôles.

## Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | React 19, TypeScript, Vite |
| Routing | React Router 7 |
| State | Zustand (session/UI), TanStack Query (server) |
| Backend | Supabase (Auth, Postgres, Storage, Realtime, Edge Functions) |
| Forms | React Hook Form + Zod |
| QR | qrcode, html5-qrcode (UI Lovable) |

## Structure `src/`

```
src/
├── assets/           # Assets statiques (Lovable peut enrichir)
├── components/       # Composants techniques uniquement (ErrorBoundary)
├── contexts/         # Providers (Auth, Query)
├── features/
│   ├── engines/      # QR, scanner, wallet, invitation, ticket, publication…
│   └── event-engine/ # Orchestration INVITER / VENDRE
├── hooks/            # useAuth, usePermissions, useEvent
├── integration/
│   └── lovable/      # Injection ZIP Lovable
├── lib/              # env, constants, schemas, utils
├── pages/            # Guards & shells (slots data-invora)
├── router/           # Routes fondation + merge Lovable
├── services/         # Accès Supabase métier
├── store/            # Zustand
├── supabase/         # Client, auth, storage, realtime
└── types/            # Types domaine + database
```

## Univers produit

- **INVITER** : événements privés, invitations, accès restreints
- **VENDRE** : billetterie publique, tickets, paiements

## Principes

1. **Pas d'UI Cursor** — le ZIP Lovable est la source unique d'interface.
2. **Experience-first** — `events` représente l'expérience ; engines dérivent invitations/tickets/QR.
3. **Séparation** — `services/` (IO), `features/engines/` (logique pure), `hooks/` (consommation React).

## Flux d'intégration Lovable

Voir `src/integration/lovable/README.md`.

## Code splitting

Vite `manualChunks` : `vendor`, `supabase`, `query`. Routes lazy via `React.lazy`.
