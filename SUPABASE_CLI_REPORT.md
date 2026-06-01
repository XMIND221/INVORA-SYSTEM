# Rapport Supabase — INVORA (`njucvyxucacgiztaczkn`)

**Dernière mise à jour :** 2026-06-01  
**Statut :** Opérationnel

## Résumé

| Étape | Statut |
|-------|--------|
| CLI `2.102.0` | OK |
| `supabase login` (token) | OK |
| `supabase link` | OK (PostgreSQL 17) |
| `supabase db push` | OK — 2 migrations appliquées |
| `validate-scan` deploy | OK |
| `audit-log` deploy | OK |
| `npm run supabase:types` | OK |
| API `profiles` | OK (HTTP 200) |
| Client `createClient<Database>` | OK |

## Application (`.env`)

- `VITE_SUPABASE_URL` → projet INVORA
- `VITE_SUPABASE_ANON_KEY` → clé anon
- `SUPABASE_ACCESS_TOKEN` / `SUPABASE_DB_PASSWORD` → **local uniquement**, jamais commiter

## Migrations appliquées

1. `20250601000000_initial_schema.sql`
2. `20250601000001_remaining_tables.sql`

## Relancer le setup

```powershell
.\scripts\supabase-setup.ps1
```

## Sécurité

- Régénérez le token CLI si exposé dans un chat.
- Ne commitez jamais `.env`.
