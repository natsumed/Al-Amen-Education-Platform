# CI / CD — Amenallah Edition

## Continuous Integration (active)

Workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

Runs on every **pull request** to `main` and on **push** to `main`.

| Job | Purpose |
|-----|---------|
| `web-lint` | ESLint |
| `web-typecheck` | TypeScript (`tsc --noEmit`) |
| `web-test` | Vitest unit tests |
| `web-build` | Prisma generate + `db push` (SQLite CI file) + `next build` |
| `mobile-typecheck` | Typecheck Expo app under `/mobile` |

CI uses dummy env only (`AUTH_SECRET`, `DATABASE_URL=file:./ci.db`). No real secrets.

## Continuous Deployment (planned)

| Stage | Trigger | Action |
|-------|---------|--------|
| Local | — | `npm run dev` / Expo |
| Preview | PR green (optional) | Connect repo to Vercel → preview URL per PR |
| Production | Git tag `v*` or manual approve | Host with **PostgreSQL**, set secrets in dashboard, run `prisma migrate deploy` |

### Production secrets (host / GitHub Environment — never commit)

- `AUTH_SECRET`
- `DATABASE_URL` (Postgres)
- `GEMINI_API_KEY` (optional chatbot)
- `RESEND_API_KEY` / `EMAIL_FROM` (optional)
- Payment keys when Konnect/Flouci go live

### Recommended GitHub settings

1. **Branch protection** on `main`: require PR + required checks listed above.
2. **Environments**: `preview`, `production` (production with reviewers).
3. **Dependabot**: [`.github/dependabot.yml`](../.github/dependabot.yml) for npm security updates.
4. Collaborator: Write access; no force-push to `main`.

## Manual release checklist (production)

1. CI green on `main`
2. `DATABASE_URL` points to Postgres; run migrations
3. Env vars set; smoke test login + browse + parent link
4. Tag `vX.Y.Z` and deploy
