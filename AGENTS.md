# AGENTS.md

## Cursor Cloud specific instructions

### What this repo is

Single-package **INVORA V2** app: React 19 + Vite 6 SPA (`npm run dev`, default **http://localhost:8080**) backed by **Supabase** (Auth, Postgres, Edge Functions). See `README.md` and `ARCHITECTURE.md` for product context.

### Dependency refresh (automatic on VM startup)

Handled by the update script: `npm install` at repo root. No other install steps belong in the update script.

### First-time / full backend on the VM

1. **Docker** must be running (`dockerd`). In this cloud image, Docker is not preinstalled; if `docker ps` fails with permission denied, use `sudo` or ensure your user is in the `docker` group after `dockerd` starts.
2. **Local Supabase** (recommended when cloud `VITE_SUPABASE_*` secrets are not set):
   ```bash
   sudo env PATH="$PATH" npx supabase start
   ```
   Migrations apply on start. Keys: `sudo env PATH="$PATH" npx supabase status -o json` → use `API_URL` and `ANON_KEY` in `.env` (copy from `.env.example`, then replace URL/key).
3. **`.env`**: Required for the app boot (`src/lib/env.ts`). Local stack example:
   - `VITE_SUPABASE_URL=http://127.0.0.1:54321`
   - `VITE_SUPABASE_ANON_KEY=<ANON_KEY from supabase status -o json>`
   - `VITE_APP_URL=http://localhost:8080`
4. **Do not** run `src/integration/lovable/bundle/` — reference-only Lovable export.

Supabase is **not** started by the update script. After a cold VM, run `supabase start` again before testing auth/DB flows.

### Run the frontend

```bash
npm run dev
```

Port is **8080** (`vite.config.ts`). Use a tmux session for long-running dev servers.

### Verify without the browser

| Command | Notes |
|---------|--------|
| `npm run test:phase10` … `test:phase11f` | Offline engine logic tests (no Supabase) |
| `npm run lint` | ESLint; repo currently reports many existing issues |
| `npm run typecheck` / `npm run build` | Currently fail on a known `scanner.service.ts` typing issue |
| `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/` | SPA up |

Auth smoke via API (local Supabase):

```bash
curl -s -X POST "$VITE_SUPABASE_URL/auth/v1/signup" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","data":{"primary_role":"organisateur"}}'
```

### Auth UI gap

`ROUTES.auth` is `/auth` and protected pages link to it, but **no `/auth` route is registered** in `src/integration/lovable/routes.tsx` (404 in browser). Sign-in UI is not wired in-tree; use Supabase Auth API, hosted Supabase dashboard, or add an auth page in a product PR. Cloud agents can still prove backend auth with the curl flow above.

### Cloud Supabase (optional)

To use project `njucvyxucacgiztaczkn` instead of local Docker: set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the Supabase dashboard (user secrets). Then `npm run supabase:link` / `supabase:db:push` only if you have `SUPABASE_ACCESS_TOKEN` — not required for local dev.

### Mock flags

`VITE_PAYMENTS_MOCK=true` (default in `.env.example`) skips Edge payment calls. `VITE_INVITER_MOCK` / `VITE_VENDRE_MOCK` are documented but mostly unused in `src/`; INVITER still uses client fixtures in places.
