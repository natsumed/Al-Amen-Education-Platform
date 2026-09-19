# Shared agent workflow

## Task lifecycle

1. Create or select one GitHub issue with acceptance criteria and risk.
2. Assign exactly one active owner: human, Codex, Cursor, or OpenCode.
3. Create a branch from current `main`; confirm working-tree changes before editing.
4. Read the project state, architecture, applicable ADR, and touched-area rules.
5. Implement the smallest coherent change with tests and documentation.
6. Rebase or merge current `main` before handoff when safe; never discard unrelated work.
7. Open one PR linked to the issue. Include test results, migration plan, rollback, and external gates.
8. A second developer reviews security-sensitive code. CI and protected-environment approval control release.

## Ownership labels

Use `area:content`, `area:auth`, `area:mobile`, `area:payments`, `area:infra`, or `area:docs`, plus `agent:codex`, `agent:cursor`, `agent:opencode`, or `owner:human`.

## Handoff format

Every handoff comment must include:

- Completed behavior and remaining behavior.
- Files/services changed.
- Commands and results.
- Database migration and rollback impact.
- Secret/provider requirements, using aliases only.
- Known risks and exact next action.

## Merge and deploy

`main` is protected. Production deploys only the exact tested image approved by GitHub Actions. A local agent must never run an ad-hoc production migration or copy a credential into the repository.
