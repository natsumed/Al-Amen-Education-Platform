# Amenallah production operations

## Release and rollback

Deploy an immutable image that already passed staging:

```bash
sudo /opt/amenallah/deploy.sh production <commit-sha>
```

The script runs backward-compatible migrations, waits for `/api/health/ready`,
persists the successful image tag, and automatically restores the preceding
application image if the health check fails.

Manual rollback:

```bash
sudo /opt/amenallah/rollback.sh production <known-good-commit-sha>
```

## Backup and restore

`backup.sh` requires `/opt/amenallah/restic.env` pointing at an encrypted,
off-server Restic repository. A release is not backup-complete until all of the
following succeed:

```bash
sudo /opt/amenallah/backup.sh
sudo systemctl enable --now amenallah-backup.timer
sudo systemctl list-timers amenallah-backup.timer
```

Restore into staging first:

```bash
sudo /opt/amenallah/restore.sh staging /absolute/path/to/postgres.dump --confirm
```

Verify authentication, content records, subscriptions, and media mappings in
staging before authorizing the equivalent production restore.

## DNS and secret rollback

- DNS rollback: restore the prior `A`/`AAAA` values at Spaceship; keep MX, SPF,
  DKIM, and DMARC unchanged because mail is independent of the VPS.
- Rotate a compromised application secret by updating `runtime.env`, incrementing
  every user's `sessionVersion` when sessions must be revoked, and redeploying.
- Rotate the deployment key by installing the new public key first, verifying a
  second key-only session, and only then removing the old key.
- Never put root, Spacemail, Restic, signing, DRM, OpenAI, or payment credentials
  in Git, images, mobile bundles, logs, or support messages.

## Feature gates

Keep these settings disabled until their acceptance tests pass:

- `SECURE_CONTENT_ENABLED`: every published asset is imported and verified in
  VdoCipher or the protected document store.
- `MOBILE_ATTESTATION_ENFORCED`: Play Integrity and App Attest are configured on
  signed store builds.
- `CLICTOPAY_ENABLED`: SMT supplies its current official kit, sandbox credentials,
  and certification approval, and callback verification is implemented.
- Mobile publication: both signed Android and iOS rows exist and install/DRM tests
  pass. The website intentionally advertises no download before then.

Google Drive remains a private source library. Do not grant public or
“anyone-with-link” access and never switch secure delivery on while legacy URLs
are the only copy of published content.
