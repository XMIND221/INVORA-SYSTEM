# INVORA V2 — Supabase Setup

## Prérequis

- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Projet Supabase (cloud ou local)

## 1. Variables d'environnement

Copier `.env.example` vers `.env` :

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_APP_ENV=development
VITE_APP_URL=http://localhost:5173
VITE_ENABLE_REALTIME=true
```

## 2. Lier le projet

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

## 3. Appliquer les migrations

```bash
supabase db push
```

Ou en local :

```bash
supabase start
supabase migration up
```

## 4. Edge Functions

```bash
supabase functions deploy validate-scan
supabase functions deploy audit-log
```

## 5. Types TypeScript

```bash
npm run supabase:types
```

## 6. Auth — métadonnées inscription

Lors du signup, passer dans `options.data` :

```json
{
  "full_name": "Nom",
  "primary_role": "organisateur"
}
```

Le trigger `handle_new_user` crée le profil automatiquement.

## 7. Storage

Buckets créés par migration :

- `event-media` (public)
- `avatars` (public)
- `qr-assets` (private)

## 8. Realtime

Activé pour `scans` et `event_metrics`. Client : `src/supabase/realtime.ts`.

## 9. Vérification

1. Créer un utilisateur test
2. Vérifier `profiles` en base
3. Créer un `event` en statut `draft`
4. Tester RLS avec un second utilisateur

## Rôles par pilier

| Pilier | Table / mécanisme |
|--------|-------------------|
| Organisateur | `events.organizer_id`, `event_roles` |
| Participant | `wallet_passes`, `tickets.owner_id` |
| Partenaire | `partners`, `commissions` |
| Scanner | `event_roles.role = scanner`, `scans` |
