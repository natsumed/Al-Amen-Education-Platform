# Amenallah Edition agent contract

This repository is shared by human developers, Codex, Cursor, and OpenCode. This file is the first project instruction file to read.

## Before editing

1. Read `docs/PROJECT_STATE.md`, `docs/ARCHITECTURE.md`, `docs/agent-workflow.md`, and relevant records in `docs/decisions/`.
2. Read the GitHub issue assigned to the task. If there is no issue, create or request one before changing code.
3. Run `git status --short` and preserve unrelated modifications, temporary files, and user-owned work.
4. Never put passwords, API keys, private keys, OAuth secrets, service-account JSON, recovery codes, or signing material in the repository, prompts, logs, screenshots, issues, or PRs.
5. Use secret aliases from `docs/operations/secrets-catalog.md`; retrieve real values only through the approved human-controlled vault/runtime store.

## Collaboration rules

- Work on one issue and one branch. Use `codex/<issue>-...`, `cursor/<issue>-...`, `opencode/<issue>-...`, or `feature/<issue>-...`.
- Do not edit or deploy from `main`. Use a pull request linked to the issue.
- Do not overwrite another agent's changes. Coordinate shared files through the issue and PR.
- Production changes go through GitHub Actions and protected environment approval. Never use the VPS root account from an agent workflow.
- Update tests and the relevant decision/runbook when behavior, schema, security, deployment, or external providers change.
- If a task requires a credential, provider approval, destructive migration, or production approval, stop and report the exact gate without guessing.

## Security invariants

- Google Drive is a private source library, never learner delivery.
- New content is a draft until an approved secure asset is `READY` and an administrator explicitly publishes it.
- Public content endpoints return only published secure content and never source URLs or provider credentials.
- Student/parent MFA is opt-in. Teacher/admin privileged access requires MFA enrollment.
- ClicToPay remains disabled until the official SMT kit and certification are complete.
- Prices are server-authoritative integer millimes; never trust client prices.

## Required validation

Run the smallest relevant checks while iterating and the full checks before handoff:

```text
npm run lint
npx tsc --noEmit
npm test
cd mobile && npx tsc --noEmit
```

The handoff comment must list changed areas, tests run, migration/rollback impact, unresolved risks, and deployment requirements.
