# Secret catalog (aliases only)

This document deliberately contains no passwords or secret values. The human source of truth is the Bitwarden organization vault. GitHub protected environments and the VPS runtime file receive only the values needed by their service.

| Alias | Used by | Runtime location | Rotation owner |
|---|---|---|---|
| `AUTH_SECRET` | Auth.js/session signing | GitHub environment and VPS runtime | Platform owner |
| `DATABASE_URL` | Web/worker migrations | GitHub environment and VPS runtime | Platform owner |
| `SMTP_USER`, `SMTP_PASSWORD` | Spacemail outbox | GitHub environment and VPS runtime | Mailbox owner |
| `OPENAI_API_KEY` | Content AI worker | GitHub environment and VPS runtime | Platform owner |
| `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON` | Private Drive worker | VPS runtime and protected deployment secret | Drive owner |
| `GOOGLE_DRIVE_MASTERS_FOLDER_ID` | Drive source boundary | VPS runtime | Drive owner |
| `SUPABASE_SERVICE_ROLE_KEY` | Private derived-asset storage | VPS runtime | Storage owner |
| `DEPLOY_SSH_KEY` | CI deployment identity | GitHub protected environment | Infrastructure owner |
| `ANDROID_SIGNING_*` | Mobile release signing | EAS/GitHub protected secret | Mobile release owner |
| `CLICTOPAY_*` | Future SMT adapter | Protected staging/production only after certification | Finance owner |

Agents should verify presence with a boolean preflight only. They must not print, copy, decode, or place values in prompts, logs, issues, PRs, images, or generated artifacts.
