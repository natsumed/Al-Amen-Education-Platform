# Amenallah Edition — contribution guide

Read [AGENTS.md](AGENTS.md), [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md), and [docs/agent-workflow.md](docs/agent-workflow.md) before changing the project.

## Local setup

```bash
npm ci
npm run db:up
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Use local-only credentials from your private `.env.local` or seed setup. Never copy production passwords, mailbox credentials, VPS credentials, API keys, OAuth secrets, service-account JSON, or signing material into this document or the repository.

## Branch and review policy

- `main` is protected and must remain deployable.
- Work from one GitHub issue and one branch: `codex/<issue>-...`, `cursor/<issue>-...`, `opencode/<issue>-...`, or `feature/<issue>-...`.
- Open one PR linked to the issue. Do not force-push or deploy manually.
- Run the checks required by the touched area and include evidence in the PR.
- Database, authentication, payment, content-security, deployment, and mobile-release changes require a security-aware review.

## Validation

```bash
npm run lint
npx tsc --noEmit
npm test
cd mobile && npx tsc --noEmit
```

Production deployment uses the approved GitHub Actions workflow and protected environment. ClicToPay remains disabled until SMT certification. Drive is private source storage only; public content must use secure derived assets.
