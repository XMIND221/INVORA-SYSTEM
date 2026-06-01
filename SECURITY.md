# INVORA V2 — Security

## Authentication

- Supabase Auth (email/password, extensible OAuth)
- JWT session côté client via `@supabase/supabase-js`
- `AuthProvider` synchronise session + profil

## Row Level Security (RLS)

Activé sur **toutes** les tables `public`. Principes :

1. **Ownership** : `organizer_id = auth.uid()` pour les événements
2. **Event roles** : fonction `has_event_role(event_id, roles[])`
3. **Self data** : wallet, notifications, drafts = `user_id = auth.uid()`
4. **Public read** : `events.visibility = 'public'`

## Storage policies

| Bucket | Politique |
|--------|-----------|
| `avatars` | Upload dossier = user id |
| `event-media` | Authentifié (affiner par event_id en prod) |
| `qr-assets` | Lecture authentifiée |

## Edge Functions

| Function | Rôle |
|----------|------|
| `validate-scan` | Valide JWT, enregistre scan, détecte doublons |
| `audit-log` | Écriture `audit_logs` centralisée |

Déployer avec Supabase CLI :

```bash
supabase functions deploy validate-scan
supabase functions deploy audit-log
```

## Frontend guards

- `ProtectedRoute` : authentification + rôles optionnels
- `usePermissions()` : capacités métier

## Audit

Table `audit_logs` : `action`, `entity_type`, `entity_id`, `metadata`, `actor_id`.

## Bonnes pratiques production

- Ne jamais exposer `service_role` côté client
- Rotation des clés Supabase
- Rate limiting sur Edge Functions
- Valider les payloads QR côté `scanner.engine` **et** serveur

## Environment

Variables validées par Zod dans `src/lib/env.ts` au démarrage.
