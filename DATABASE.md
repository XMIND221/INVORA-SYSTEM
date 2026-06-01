# INVORA V2 — Database

## Migrations

| Fichier | Contenu |
|---------|---------|
| `20250601000000_initial_schema.sql` | Enums, profiles, events, invitations, tickets, wallet |
| `20250601000001_remaining_tables.sql` | scans, partners, analytics, RLS, storage, realtime |

## Tables

| Table | Rôle |
|-------|------|
| `profiles` | Profil utilisateur + `primary_role` |
| `events` | Expérience / événement (universe, visibility, status) |
| `event_roles` | Rôles par événement (owner, staff, scanner…) |
| `invitations` | Moteur INVITER |
| `ticket_types` / `tickets` | Moteur VENDRE |
| `wallet_passes` | Wallet participant |
| `scans` | Contrôle d'accès scanner |
| `partners` / `commissions` | Programme partenaire |
| `transactions` | Paiements |
| `analytics_events` | Tracking produit |
| `notifications` | Notifications utilisateur |
| `drafts` | Brouillons expérience |
| `media_assets` | Fichiers liés à un événement |
| `event_settings` | Branding, règles d'accès, ticketing |
| `event_metrics` | KPIs agrégés |
| `audit_logs` | Traçabilité sécurité |

## Enums clés

- `event_universe` : `inviter` | `vendre`
- `event_visibility` : `private` | `public` | `unlisted`
- `event_status` : `draft` → `published` → `live` → `ended`

## Triggers

- `on_auth_user_created` : crée un `profile` à l'inscription
- `set_updated_at` : met à jour `updated_at` sur profiles/events

## Realtime

Tables publiées : `scans`, `event_metrics`.

## Types TypeScript

Maintenus dans `src/types/database.ts`. Régénération :

```bash
npm run supabase:types
```
