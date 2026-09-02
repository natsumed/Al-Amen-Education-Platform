# VPS bootstrap checklist

Run these steps once as the provider’s root user. Do not put the root password, application secrets, or the Spacemail password in GitHub or this repository.

## 1. Secure access and install the runtime

```bash
adduser --disabled-password --gecos "" deploy
usermod -aG sudo,docker deploy
install -d -m 700 /home/deploy/.ssh
install -m 600 /home/deploy/.ssh/authorized_keys
# Add the operator’s public SSH key to authorized_keys before closing the root session.

apt-get update
apt-get install -y ca-certificates curl ufw fail2ban unattended-upgrades restic
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker fail2ban unattended-upgrades
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

After verifying a second terminal can log in as `deploy` with the SSH key, rotate the provider-issued root password and disable password/root SSH login in `/etc/ssh/sshd_config`:

```text
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
```

Then run `sshd -t && systemctl reload ssh` and keep the current root session open until key access is confirmed.

## 2. Install the stack files

```bash
mkdir -p /opt/amenallah
chown -R deploy:deploy /opt/amenallah
# Copy deploy/docker-compose.yml, deploy/Caddyfile, deploy/deploy.sh,
# deploy/rollback.sh, and deploy/backup.sh into /opt/amenallah.
chmod 750 /opt/amenallah/*.sh
```

Copy `runtime.env.example` to `/opt/amenallah/runtime.env`, replace every placeholder with a newly generated value, and set `IMAGE_NAME` to the repository’s lowercase GHCR image name. Keep the file mode at `600`. The deploy account should invoke release scripts through `sudo -n`; it does not need direct read access to this file.

Create `/opt/amenallah/restic.env` with the Restic repository password and S3-compatible backend variables, also mode `600`. Initialize the repository once, then test `backup.sh` and `restic snapshots`.

Install the backup timer:

```bash
cp /opt/amenallah/amenallah-backup.service /etc/systemd/system/
cp /opt/amenallah/amenallah-backup.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now amenallah-backup.timer
systemctl list-timers amenallah-backup.timer
```

## 3. DNS and GitHub configuration

At Spaceship, create:

- `A @` → the VPS address
- `A www` → the VPS address
- `A staging` → the VPS address
- Spacemail’s exact MX, SPF, DKIM, and DMARC records

In Supabase Storage, create the `content` bucket and set it to private. The application stores object paths in PostgreSQL and returns short-lived signed URLs only after the content-access check.

In GitHub, make the GHCR package pullable by the VPS and create protected `staging` and `production` environments. Add `DEPLOY_HOST`, `DEPLOY_USER`, and `DEPLOY_SSH_KEY` to each environment; require reviewers for `production`.

## 4. First deployment

Start with the first image tag produced by the deployment workflow:

```bash
/opt/amenallah/deploy.sh <commit-sha>
```

Verify both domains, authentication, database migration, uploads, and logs. Do not seed test accounts into production. Configure a systemd timer or provider scheduler to run `/opt/amenallah/backup.sh` daily and send only failures to the operator/support address.

## 5. Rollback

```bash
/opt/amenallah/rollback.sh <previous-known-good-commit-sha>
```

Database migrations must be backward-compatible with the preceding image before a production release is approved. Restore database backups only into staging first, then promote after verification.
