# AstroLaabh — Admin Panel

Standalone operations panel extracted from the AstroLaabh storefront:
order pipeline, energisation scheduling, live-link handling, returns and
tracking. State is a localStorage mock (`components/Store.tsx`) — the panel
runs fully client-side against the same catalogue data as the store.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 — the panel is the root route.

## Notes

- `lib/catalog.ts` is a snapshot of the storefront's catalogue (deterministic,
  seeded — no network).
- Orders placed on the storefront live in *its* localStorage; this standalone
  panel seeds/drives its own demo orders via the same store, so it works
  without the storefront running.
- Stone/design imagery is not bundled — the panel is text-first and does not
  render product photos.

## Release workflow

- All changes land on the `staging` branch first.
- Review build: https://astrolaabh-admin-staging.vercel.app (updated on every staging deploy).
- Code review happens on the `staging → main` pull request.
- After approval: merge the PR, then deploy production (`vercel --prod`) → https://astrolaabh-admin-three.vercel.app
