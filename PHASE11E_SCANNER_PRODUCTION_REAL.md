# PHASE 11E — Scanner Production Real

## Objectif

Scanner INVORA **production-ready** : validation temps réel via Supabase (RPC), source officielle de présence, multi-portes, anti-fraude, offline + sync, historique immuable, analytics terrain, audit.

**Aucun mock en parcours prod** — `scanner.service.ts` → RPC uniquement.

## Modèle (noms SQL / spec)

| Spec | Implémentation |
|------|----------------|
| `scan_sessions` | Table `scan_sessions` |
| `scan_devices` | Table `scan_devices` |
| `scan_logs` | Vue sur `scans` |
| `scan_events` | Vue sur `scanner_audit_log` |
| `scan_results` | Colonne `result` + enum `scanner_display_status` |
| `scanner_gates` | Table existante + `ensure_event_scanner_gates` |
| `scanner_offline_queue` | Table existante + enqueue/sync RPC |
| `scanner_audit_log` | Audit immuable |
| `scanner_security_events` | Alertes (double scan, fraude, etc.) |

## Migration

`supabase/migrations/20250601000014_scanner_production_real.sql`

### RPC principales

| RPC | Rôle |
|-----|------|
| `get_scanner_session_context` | Session agent + événement + porte + rôle |
| `ensure_event_scanner_gates` | Portes : Main, VIP, Backstage, Corporate, Staff, Presse |
| `validate_access_scan` | Moteur unique billets + invitations (VIP, corporate, staff, presse, partenaire) |
| `resolve_scan_pass` | Résolution pass (ticket `access_token` / invitation `qr_payload`) |
| `search_access_for_scan` | Recherche manuelle (nom, tel, email, code, IDs) |
| `get_scanner_live_stats` | Entrées, refus, taux présence, incidents, derniers scans |
| `get_scanner_history` | Historique complet (non supprimable) |
| `get_scanner_field_analytics` | Validés/refusés, temps moyen, par porte, pic |
| `enqueue_scanner_offline_scan` | File serveur offline |
| `sync_scanner_offline_batch` | Synchronisation batch |
| `log_scanner_security_event` | Journal alertes |

### Statuts explicites (`displayStatus`)

`VALID` · `USED` · `EXPIRED` · `CANCELLED` · `REFUNDED` · `BLOCKED` · `UNKNOWN`

### Double scan

- Détection sur `scans` / statut billet `used` / invitation déjà scannée
- Réponse instantanée `USED` + entrée `scanner_security_events` si répétition suspecte

### Permissions (rôles événement)

`scanner_agent` · `chef_scanner` · `supervisor` · admin org — vérifiés dans les RPC (`assert_event_scanner_access`).

## Frontend

| Fichier | Rôle |
|---------|------|
| `src/services/scanner.service.ts` | RPC + file locale offline |
| `src/hooks/useScannerData.ts` | Session, live (5s), history (8s), analytics |
| `src/pages/lovable/ScannerPage.tsx` | Scan manuel QR + stats temps réel |
| `ScannerHistoryPage.tsx` | Historique RPC |
| `ScannerAnalyticsPage.tsx` | Analytics terrain RPC |
| `ScannerSearchPage.tsx` | Recherche + validation |
| `src/lib/scanner-offline-queue.ts` | Cache local + sync |
| `src/store/scanner.store.ts` | Session / porte / pause |

### Déprécié (tests uniquement)

- `src/integration/lovable/scanner-mock.ts`
- `src/features/engines/scanner-pro.engine.ts` (`recordFixtureValidation`)

## Parcours

```
Invité → QR (VENDRE / INVITER)
       → Scanner (?event={uuid})
       → validate_access_scan
       → VALID → entrée | USED/EXPIRED/… → refus explicite
```

Offline : scan → `scanner-offline-queue` local → `enqueue_scanner_offline_scan` → `sync_scanner_offline_batch` / rejeu `validate_access_scan`.

## Déploiement

```bash
npm run supabase:db:push
npm run build
npm run test:phase11e
```

## Tests manuels

1. Utilisateur avec rôle scanner sur événement → `/scanner?event={id}`
2. Coller `access_token` billet valide → overlay `VALID`, `entered` +1
3. Re-scanner même QR → `USED` + motif « Déjà utilisé »
4. Billet remboursé / annulé → `REFUNDED` / `CANCELLED`
5. Invitation INVITER → même moteur
6. Changer porte (VIP / Backstage) → `gate` enregistré dans `scans`
7. `/scanner/search` → nom ou email → valider
8. Mode avion → scan → file offline → sync au retour réseau
9. Historique / Analytics → données alignées RPC (pas de fixture)

## Performance

- Cible validation **&lt; 500 ms** (index `scans`, `tickets.access_token`, `invitations.qr_payload`)
- Live stats via RPC agrégée (pas de mock client)

## Suite

- Abonnement Realtime Supabase sur `scans` (remplacer polling 5–8s si besoin)
- Scan caméra native (Capacitor / ZXing) branché sur `decodeScannedText` + `runScan`
- Edge Function rate-limit anti-bruteforce
