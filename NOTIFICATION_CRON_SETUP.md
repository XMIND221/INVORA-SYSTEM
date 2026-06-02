# Notification dispatch — Cron & providers

## 1. Déployer la Edge Function

```bash
npm run supabase:functions:deploy
```

Ou uniquement :

```bash
supabase functions deploy notification-dispatch
```

## 2. Secrets Edge (Dashboard → Project Settings → Edge Functions → Secrets)

| Secret | Usage |
|--------|--------|
| `RESEND_API_KEY` | Envoi email (Resend) |
| `RESEND_FROM_EMAIL` | Ex. `INVORA <hello@yourdomain.com>` |
| `WHATSAPP_ACCESS_TOKEN` | Meta WhatsApp Cloud API |
| `WHATSAPP_PHONE_NUMBER_ID` | ID du numéro WhatsApp Business |
| `NOTIFICATION_CRON_SECRET` | (optionnel) Header `x-invora-cron-secret` pour cron externe |

Sans clés API → mode **invora_sim** (traçabilité en base, pas d’email/WhatsApp réel).

## 3. Cron automatique (Supabase — chaque minute)

### A. Secrets Vault (SQL Editor)

```sql
-- Dashboard → SQL → une seule fois
SELECT vault.create_secret(
  'https://njucvyxucacgiztaczkn.supabase.co',
  'project_url',
  'URL projet Supabase'
);

SELECT vault.create_secret(
  'VOTRE_SERVICE_ROLE_KEY',
  'service_role_key',
  'Clé service role pour notification-dispatch'
);
```

Puis :

```bash
npm run supabase:db:push
```

La migration `20250601000017` planifie le job `invora-notification-dispatch` si les secrets existent.

### B. Vérifier le cron

```sql
SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname = 'invora-notification-dispatch';
```

### C. Historique des appels

```sql
SELECT * FROM net._http_response ORDER BY created DESC LIMIT 10;
```

## 4. Invocation manuelle (dev)

```bash
npm run notifications:dispatch
```

Variables locales (`.env` ou shell) :

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 5. Flux

```
notification_queue (email/whatsapp)
  → claim_notification_queue_batch (Edge)
  → Resend / WhatsApp / sim
  → finalize_notification_dispatch

notification_queue (in_app)
  → process_notification_in_app_batch (SQL, chaque run Edge)
```

## 6. Dépannage

- **403 Forbidden** : Bearer doit être la `service_role` key exacte.
- **missing_recipient_email / phone** : renseigner `guest_email` / `guest_phone` sur invitation ou billet.
- **Cron non planifié** : message NOTICE au `db push` → créer les secrets Vault puis re-pousser ou exécuter le bloc `cron.schedule` du fichier migration manuellement.
