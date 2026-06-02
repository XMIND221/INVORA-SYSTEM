# PHASE 11A — SOURCE OF TRUTH & EVENT ENGINE

## Objectif

Supabase devient la **source de vérité** pour le parcours organisateur : création, publication, liste, hub, analytics de base.

**Hors scope 11A :** billetterie finale, distribution INVITER, wallet, notifications (→ 11B / 11C).

## Migration

`supabase/migrations/20250601000011_source_of_truth_events.sql`

| RPC | Rôle |
|-----|------|
| `create_experience` | Insert `events` + `event_metrics` + `event_roles` + audit |
| `update_experience` | Mise à jour champs |
| `publish_experience` | `status = published`, `published_at` |
| `archive_experience` | `status = archived` |
| `reactivate_experience` | Repasse en `published` |
| `delete_draft_experience` | Suppression brouillon |
| `duplicate_experience` | Copie en brouillon |
| `get_event_by_slug_or_id` | Lecture par UUID ou slug + métriques |
| `log_event_audit` | `audit_logs` |

Colonne ajoutée : `events.capacity`.

## Services

`src/services/events.service.ts`

- `createExperience` / `updateExperience` / `publishExperience`
- `archiveExperience` / `reactivateExperience` / `deleteDraft` / `duplicateExperience`
- `getEvent` / `getEventBySlug` / `getOrganizerEventView` / `getOrganizerEvents`

`src/features/event-engine/index.ts` — `createExperienceFromDraft`, `publishExperienceFromDraft`

## UI connectée (sans redesign)

| Page | Changement |
|------|------------|
| `CreerPage` | Publish → Supabase ; auth requise ; loading/erreur |
| `EvenementsPage` | `getOrganizerEvents()` ; sections brouillons / publiés / archivés |
| `EventHubPage` | Données dynamiques ; archive/réactiver ; NotFound/Permission/Network |
| `EventAnalyticsPage` | Métriques `event_metrics` ; empty analytics |
| `AccueilPage` (orga) | Profil réel ; liste événements |
| `ParcoursPage` | `?event=` depuis Supabase |

## États UX

`src/components/lovable/ui-states/`

- `LoadingPage`, `LoadingCard`, `LoadingButton`, `Skeleton`
- `NotFoundState`, `EmptyState`, `PermissionDeniedState`, `NetworkErrorState`

## Mocks

- **Production organisateur :** plus de `organizer-mock` dans les pages.
- **Fixtures tests :** `src/integration/lovable/__fixtures__/organizer-mock.fixture.ts`
- **Réexport déprécié :** `organizer-mock.ts` (tests uniquement)

## Auth

- Créer / liste / hub : `useAuth()` → `user.id` pour RPC (`auth.uid()` côté SQL).
- `demo-user` retiré du parcours organisateur ; wallet/invite restent en 11B/C.

## Déploiement

```bash
npm run supabase:db:push
npm run build
npm run test:phase11a
```

## Tests manuels

1. Connexion organisateur Supabase
2. Créer → Publier → Hub (UUID dans l’URL)
3. Mes événements : voir brouillon / publié
4. Archiver → Réactiver
5. Déconnexion → Créer → `PermissionDeniedState`
6. Hub ID invalide → `NotFoundState`

## Suite Phase 11B

- Paiement → émission billet
- `auth.uid()` sur claim wallet/ticket
- Titres événement dans wallet depuis Supabase
