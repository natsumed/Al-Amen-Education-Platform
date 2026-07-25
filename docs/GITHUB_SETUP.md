# One-time GitHub setup (after first sync PR)

Branch `feature/sync-platform-july-2026` is on origin. If `gh` is not logged in yet:

1. Open the PR UI:  
   https://github.com/natsumed/Al-Amen-Education-Platform/compare/main...feature/sync-platform-july-2026?expand=1
2. Or authenticate CLI then create/merge:
   ```bash
   gh auth login
   gh pr create --base main --head feature/sync-platform-july-2026 \
     --title "feat: sync platform — chatbot, settings, mobile, CI" \
     --body "See docs/CICD.md and DEVELOPERS.md"
   ```

## Protect `main` (required for duo workflow)

Repo → **Settings** → **Branches** → **Add rule** for `main`:

- Require a pull request before merging
- Require status checks to pass:
  - `web-lint`
  - `web-typecheck`
  - `web-test`
  - `web-build`
  - `mobile-typecheck`
- Do not allow force pushes
- Do not allow deletions

Add your teammate under **Settings → Collaborators** (Write).

Details: [CICD.md](./CICD.md)
