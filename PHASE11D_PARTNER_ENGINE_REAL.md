# PHASE 11D — Partner Engine Real

## Objectif

Partenaires sur **données réelles** : tracking, attribution, commissions INVITER/VENDRE, wallet, retraits, media kit, dashboard.

## Modèle (noms SQL)

| Spec | Implémentation |
|------|----------------|
| `partners` | Table `partners` |
| `partner_profiles` | Vue `partner_profiles` |
| `partner_wallets` | Vue `partner_wallets` (earned / pending / withdrawn) |
| `partner_links` | `partner_campaigns.share_path` + UTM `?ref=` |
| `partner_attributions` | Table `partner_attributions` |
| `partner_clicks` | Vue sur `partner_tracking_events` |
| `partner_conversions` | Vue sur `partner_commission_ledger` |
| `payout_requests` | `partner_withdrawal_requests` |
| `withdrawal_history` | Vue alias |

## Migration

`supabase/migrations/20250601000013_partner_engine_real.sql`

### RPC principales

| RPC | Rôle |
|-----|------|
| `get_or_create_partner_for_user` | Identité partenaire |
| `refresh_partner_campaigns` | Campagnes sur événements publiés |
| `ensure_partner_campaign` | Lien + code campagne |
| `record_partner_click` | Clic + attribution (anon OK) |
| `record_partner_open` | Ouverture lien |
| `record_partner_conversion` | Commission + audit |
| `attribute_partner_vendre_sale` | Post-paiement billet |
| `get_partner_dashboard` | Dashboard complet |
| `get_partner_wallet_summary` | Disponible / attente / retiré |
| `create_partner_withdrawal_request` | Retrait (solde vérifié) |
| `list_partner_media_kit` | Media kit événement |
| `sync_partner_media_kit_for_event` | Génération assets |

### Commissions (serveur uniquement)

**INVITER** (par accès converti) : 1–100 → 50 F · 101–300 → 75 F · 301–500 → 100 F · 501+ → 125 F  

**VENDRE** (prix billet FCFA) : 5k–9,999 → 100 F · … · 100k+ → 500 F  

Prélevées sur **marge INVORA** via `partner_commission_ledger` + `partner_commission_audit`.

## Services & UI

- `src/services/partner.service.ts` — Supabase (plus de store mock en prod)
- `src/hooks/usePartnerDashboard.ts`
- `src/lib/partner-attribution.ts` — `sessionStorage` campagne + `?ref=`

### Parcours

1. `/p/:partnerCode/:eventId` → `record_partner_click` → billetterie `?ref=`
2. Paiement validé → `attribute_partner_vendre_sale` (si campagne en session)
3. Dashboard `/partenaires` — campagnes, wallet, analytics
4. Retraits → `create_partner_withdrawal_request`

## Déploiement

```bash
npm run supabase:db:push
npm run build
npm run test:phase11d
```

## Tests manuels

1. Compte `partenaire` → dashboard campagnes réelles
2. Ouvrir `/p/{code}/{eventId}` → clic en base
3. Acheter billet avec ref → commission ledger
4. Demande retrait → `partner_withdrawal_requests` pending
5. Media kit campagne → lignes `partner_media_kits`

## Suite

- Approbation retraits admin (Phase 11.E)
- Attribution INVITER sur claim invitation
- Notifications payout
