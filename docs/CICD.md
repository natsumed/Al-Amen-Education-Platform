# CI / CD — Amenallah Edition

## Continuous Integration (active)

Workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

Runs on every **pull request** to `main` and on **push** to `main`.

| Job | Purpose |
|-----|---------|
| `web-lint` | ESLint |
| `web-typecheck` | TypeScript (`tsc --noEmit`) |
| `web-test` | Vitest unit tests |
| `web-build` | Prisma generate + PostgreSQL migration + `next build` |
| `mobile-typecheck` | Typecheck Expo app under `/mobile` |

CI uses an ephemeral PostgreSQL service and dummy env only. No real secrets.

## Continuous Deployment

| Stage | Trigger | Action |
|-------|---------|--------|
| Local | — | `npm run dev` / Expo |
| Staging | Manual deploy workflow | Pull the immutable GHCR image and run migrations on the protected staging stack |
| Production | Release or manual approval | Deploy the same verified image after the staging job and environment approval |

### Production secrets (host / GitHub Environment — never commit)

- `AUTH_SECRET`
- `DATABASE_URL` (Postgres)
- `GEMINI_API_KEY` (optional chatbot)
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` (optional)
- Payment keys when Konnect/Flouci go live

### Recommended GitHub settings

1. **Branch protection** on `main`: require PR + required checks listed above.
2. **Environments**: `preview`, `production` (production with reviewers).
3. **Dependabot**: [`.github/dependabot.yml`](../.github/dependabot.yml) for npm security updates.
4. Collaborator: Write access; no force-push to `main`.

## Manual release checklist (production)

1. CI green on `main`
2. Publish or manually select the release workflow
3. Staging health checks and smoke tests pass
4. Approve the protected production environment
