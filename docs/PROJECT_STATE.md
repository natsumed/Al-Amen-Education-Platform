# Project state

Last reviewed: 2026-09-19

## Product

Amenallah Edition is a French/Arabic Tunisian primary-education platform for students, parents, teachers, and administrators. The canonical production URL is `https://amanallahedition.com`. The public web catalog is separate from native protected-content delivery.

## Runtime

- Web/API: Next.js App Router, TypeScript, Prisma, PostgreSQL.
- Worker: private content-processing worker for Drive ingestion and secure document tiles.
- Cache/rate limiting: Valkey-compatible service.
- Storage: private Supabase storage for protected derived assets.
- Mobile: Expo/React Native under `mobile/` with a signed Android APK distribution path.
- Email: Spacemail SMTP through the transactional outbox.
- Source content: private Google Drive masters folder.
- AI: structured OpenAI content proposal flow; it requires protected runtime configuration.
- Payments: cash is available; ClicToPay is deliberately disabled pending SMT kit/certification.

## Current feature gates

- New content must be saved as `DRAFT`.
- Public catalog content must be `PUBLISHED` and have a primary `READY` secure asset.
- Learners never receive Drive URLs, raw PDFs, or source identifiers.
- Student/parent MFA is optional. Teacher/admin privileged routes require MFA enrollment.
- AI intake requires Drive service-account configuration, OpenAI configuration, malware scanning, document tools, private storage, and an enabled worker.

## Deployment facts

Production and staging are deployed by protected GitHub Actions environments using immutable images. Runtime secrets are stored outside Git. See `docs/operations/secrets-catalog.md` for aliases and locations; this repository intentionally contains no secret values.

## Known gates

- Google OAuth production configuration must be present before advertising Google sign-in.
- ClicToPay cannot be enabled without official SMT integration material and certification.
- Content migration requires an administrator review of metadata, rights, duplicates, and secure asset processing.
