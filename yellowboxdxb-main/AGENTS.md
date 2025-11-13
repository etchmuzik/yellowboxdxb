# Repository Guidelines

## Project Structure & Module Organization
Source lives in `src/`, organized by responsibility (`components/` for UI primitives, `pages/` for routed screens, `services/` for Firebase/Supabase adapters, `utils/` for shared helpers). Automation scripts live in `scripts/` and top-level `test-*.js` runners; Firebase Cloud Functions are under `functions/`; workflow assets are in `n8n-workflows/` and `supabase/`. Static assets and the PWA shell live in `public/`, while deployment configs (Firebase, Vercel, Docker) remain at the repo root for quick reference.

## Build, Test, and Development Commands
- `npm run dev`: starts the Vite dev server with HMR; default env is development Firebase project.
- `npm run build`: installs pinned deps (`--legacy-peer-deps`) then emits production bundles to `dist/`.
- `npm run preview`: serves the `dist/` output locally for smoke tests.
- `npm run deploy[:staging|:production]`: runs `scripts/deploy.js` with the matching target; ensure Firebase credentials are sourced.
- Targeted verifiers exist as node scripts, for example `node test-webhook-connection.js` (webhook health) or `node test-service-integration.cjs` (end-to-end service wiring). Prefer these to ad‑hoc manual checks.

## Coding Style & Naming Conventions
TypeScript + React 18 with SWC. Use functional components, PascalCase filenames (`FleetDashboard.tsx`), and colocate component-specific styles via Tailwind utility classes. Shared hooks follow `useThing` naming and live in `src/hooks/`. Keep modules IDE-friendly by exporting from `index.ts` barrels only when reuse is proven; default exports are discouraged. Lint with `npm run lint` (ESLint flat config) before pushing; Tailwind config (`tailwind.config.ts`) governs design tokens, so avoid hard-coded colors beyond `theme.extend`.

## Testing Guidelines
Unit-style checks run through the targeted node scripts; name new scripts `test-<focus>.js` at the repo root for discoverability. When adding integration flows, update the relevant test runner and document any required `.env` entries in `CREDENTIAL_SETUP_GUIDE.md`. Maintain parity between `firestore.rules`, `firestore.rules.dev`, and `firestore.rules.production` when tests touch security rules; use `npm run deploy-dev-rules` + `npm run restore-rules` to bracket data seeding. Capture any manual verification steps in `PRODUCTION_FEATURE_TESTING.md`.

## Commit & Pull Request Guidelines
Follow the conventional prefix found in history (`feat:`, `fix:`, `chore:`, `docs:`). Keep subject lines under 72 characters and describe the user-visible impact; add context in the body when touching automation or infrastructure. Pull requests should include: summary of changes, linked issue or checklist, screenshots/GIFs for UI work, and confirmation of relevant scripts (`npm run lint`, targeted tests, deploy dry-runs). Tag reviewers responsible for Firebase and workflow automation when their areas are affected to keep cross-system regressions low.
