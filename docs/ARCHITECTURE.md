# Architecture and security boundaries

## Request flow

The public browser reaches the Next.js web/API service through the VPS reverse proxy. PostgreSQL, Valkey, the content worker, and private storage are internal services. The database has no public port.

## Content flow

`private Drive masters → controlled admin selection → encrypted intake reference → worker download → signature/malware/checksum validation → text/page extraction → structured AI proposal → human review → secure asset processing → explicit publication`.

Drive is never a learner delivery layer. A public content response contains metadata and opaque asset state only. Protected documents use secure page/tile endpoints; protected video uses the native DRM path.

## Authentication

Web uses Auth.js sessions. Mobile uses the bearer/device-session flow. Email verification is required for new password accounts. MFA is optional for students/parents and required for privileged teacher/admin operations. Any enabled MFA factor is required at login and cannot be bypassed by choosing another client.

## Agent boundaries

Agents may inspect source, run tests, and prepare branches/PRs. They must not read or print secret values, use root SSH, change production directly, or invent external-provider protocols. Provider changes require the official provider documentation and an explicit issue/decision record.
