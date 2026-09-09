# Email release checklist

The application sends transactional mail through Spacemail SMTP only. The
replacement mailbox password must be entered in `/opt/amenallah/runtime.env`
on the VPS (and in the protected staging secret store), never in Git or chat.

Required runtime values:

```text
SMTP_HOST=mail.spacemail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=support@amanallahedition.com
SMTP_PASSWORD=<rotated secret>
SMTP_FROM=Amenallah Edition <support@amanallahedition.com>
SMTP_REPLY_TO=support@amanallahedition.com
EMAIL_WORKER_ENABLED=true
```

DNS must keep the existing Spacemail MX, SPF, and DKIM records. Add one DMARC
record at `_dmarc.amanallahedition.com`:

```text
v=DMARC1; p=none; rua=mailto:support@amanallahedition.com; adkim=s; aspf=s; pct=100
```

After at least 14 days of clean reports, change `p=none` to `p=quarantine`,
then later to `p=reject` after another clean monitoring period. Do not create a
second SPF record.

The web process records delivery attempts in `EmailOutbox`; the private
`*-email-worker` Compose services retry encrypted pending payloads. Successful
delivery deletes the encrypted payload. Mail templates never log raw tokens or
passwords.
