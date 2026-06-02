# INVORA-SYSTEM

Fondation **INVORA V2** + UI Lovable intégrée (Phase 0). Dépôt : [XMIND221/INVORA-SYSTEM](https://github.com/XMIND221/INVORA-SYSTEM). Archive : `invora-experience-craft-main.zip`.

## Démarrage rapide

```bash
npm install
cp .env.example .env
# Renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run dev
```

Ouvrir **http://localhost:8080** (port par défaut, compatible Lovable). Si le port est occupé, Vite affiche un autre port dans le terminal.

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur Vite |
| `npm run build` | Build production |
| `npm run typecheck` | Vérification TypeScript |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATABASE.md](./DATABASE.md)
- [ROLES.md](./ROLES.md)
- [SECURITY.md](./SECURITY.md)
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- [PHASE0_LOVABLE_AUDIT.md](./PHASE0_LOVABLE_AUDIT.md)
- [PHASE1_UX_ALIGNMENT.md](./PHASE1_UX_ALIGNMENT.md)
- [src/integration/lovable/README.md](./src/integration/lovable/README.md)
