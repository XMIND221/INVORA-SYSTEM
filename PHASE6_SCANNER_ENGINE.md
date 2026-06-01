# PHASE 6 — Scanner Engine Pro

**Date :** 2026-06-01  
**Périmètre :** Validation officielle des accès terrain  
**Build :** `npm run typecheck` + `npm run build`

---

## 1. Vision

```
Organisateur crée → distribue → invité reçoit → Scanner valide → historique audit
```

| Règle | Implémentation |
|-------|----------------|
| Pas un simple lecteur QR | RPC `validate_access_scan` + audit immuable |
| Validation < 2 s | UI optimisée + stats `avgValidationMs` |
| Finance / règles métier | Backend uniquement (pas de calcul refus en React) |
| Anti-fraude | Index unique `(event_id, access_id)` si `valid` |

---

## 2. Modes de scan

- QR INVORA (payload base64)
- Code accès (`unique_code`)
- Recherche manuelle : nom, téléphone, email, code, billet

---

## 3. Résultats UI

| Statut | Feedback |
|--------|----------|
| VALIDÉ | Overlay vert, nom, type, événement |
| REFUSÉ | Overlay rouge + motif |

### Motifs de refus

| Code SQL | Libellé |
|----------|---------|
| `invalid_qr` | QR invalide |
| `expired` | Accès expiré |
| `already_used` | Déjà utilisé |
| `cancelled` | Accès annulé |
| `suspended` | Accès suspendu |
| `event_ended` | Événement terminé |

---

## 4. Multi-portes

`scanner_gate_code` : main, vip, backstage, press, staff, corporate.

Chaque scan enregistre : porte, date/heure, agent, device, IP (audit).

---

## 5. Équipes (préparé)

Table `scanner_team_members` : chef_scanner, scanner_agent, supervisor.

---

## 6. Mode hors ligne (architecture)

- `src/lib/scanner-offline-queue.ts` — cache localStorage
- Table `scanner_offline_queue` — sync via `sync_scanner_offline_queue`
- Bouton sync sur le scanner

---

## 7. Historique & analytics

| Route | Page |
|-------|------|
| `/scanner` | Scanner Pro plein écran |
| `/scanner/historique` | Tous les scans |
| `/scanner/analytics` | Terrain (validés, refusés, portes, pic) |
| `/scanner/recherche` | Recherche manuelle |

---

## 8. Audit

Table `scanner_audit_log` — **aucune suppression** (policy DELETE false).

Champs : event_id, access_id, scanner_id, timestamp, status, gate, device, ip.

---

## 9. Fichiers clés

| Couche | Chemins |
|--------|---------|
| SQL | `supabase/migrations/20250601000005_scanner_engine.sql` |
| Edge | `supabase/functions/scanner-validate-access/` |
| Types | `src/types/scanner.ts` |
| Engine UI | `scanner.engine.ts`, `scanner-pro.engine.ts` |
| Store | `scanner.store.ts`, `scanner-mock.ts` |
| Service | `scanner.service.ts` |
| Offline | `src/lib/scanner-offline-queue.ts` |

---

## 10. Test manuel

1. Rôle **Scanner** → **Ouvrir le scanner**
2. Observer validation / refus (démo cycle QR)
3. Changer de porte (VIP, Staff…)
4. **Recherche** → « Léa » → valider
5. **Historique** → motifs refus
6. **Analytics terrain** → répartition par porte

Déploiement :

```bash
supabase db push
supabase functions deploy scanner-validate-access
npm run supabase:types
```
