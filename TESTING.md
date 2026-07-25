# How to Test the Latest Changes

## 1. Start PostgreSQL

PostgreSQL is already running on this machine (PID 22652). If it ever stops:

```powershell
& "E:\pgsql\pgsql\bin\pg_ctl.exe" start -D "E:\pgsql\data"
```

Check status:
```powershell
& "E:\pgsql\pgsql\bin\pg_ctl.exe" status -D "E:\pgsql\data"
```

## 2. Start the Platform

Open a terminal in the project folder and run:

```bash
E:
cd \Al-Amen-Education-Platform
npm run dev
```

Open http://localhost:3000

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@edutunisia.tn | admin123 |
| Teacher | teacher@edutunisia.tn | teacher123 |
| Student | student@edutunisia.tn | student123 |

---

## 3. Test Pages (without logging in)

| Page | URL | What to check |
|------|-----|--------------|
| Home | http://localhost:3000 | "Al-Aman" logo, FR / عربي button, hero animations |
| Catalog | http://localhost:3000/content/browse | Content cards, filters, pagination |
| Pricing | http://localhost:3000/pricing | 4 plans (Student/Teacher x Monthly/Yearly) |
| Login | http://localhost:3000/login | Form, Google button, FR/عربي toggle |
| Register | http://localhost:3000/register | Full form, role selector |

---

## 4. Test Language Switching

On every page, click the **FR / عربي** button:
- Page must switch to Arabic with **RTL** layout (right to left)
- Page must switch to French with **LTR** layout (left to right)
- Logo must change (أ → A)

---

## 5. Test Authentication

### 5.1 Admin Login
1. Go to http://localhost:3000/login
2. Email: `admin@edutunisia.tn`
3. Password: `admin123`
4. Must show green toast "Connexion reussie!" + redirect to **/admin**
5. Check the admin sidebar with all links

### 5.2 Teacher Login
- Email: `teacher@edutunisia.tn` / `teacher123`
- Must redirect to **/teacher**

### 5.3 Student Login
- Email: `student@edutunisia.tn` / `student123`
- Must redirect to **/student**

### 5.4 Wrong Password
1. Email: `admin@edutunisia.tn`
2. Password: `wrong`
3. Must show "Email ou mot de passe incorrect. X tentative(s) restante(s)."

### 5.5 Rate Limiting Test
1. Enter email `admin@edutunisia.tn`
2. Enter wrong password and click login **6 times in a row**
3. 1st-5th attempt: shows error with remaining attempts count
4. 6th attempt: shows "Connexion temporairement bloquee. Reessayez dans 5 minutes."
5. Verify the counter persists — close the page and reopen, try again, should still be blocked
6. Wait 5 minutes (or delete `.opencode/rate-limits.json`) to reset

### 5.6 Forgot Password
1. Click "Mot de passe oublie?"
2. Enter an email (e.g. `admin@edutunisia.tn`)
3. Page shows "Email envoye!"
4. **Check the terminal** — the reset link is printed to the console:
   ```
   [DEV] Password reset link: http://localhost:3000/reset-password?token=...
   ```
5. Click the link (or copy-paste into browser)
6. Enter a new password (min 8 characters)
7. Try logging in with the new password — must work

**Note:** Email sending via Resend is not configured. The token is logged to the terminal for local testing. In production, configure `RESEND_API_KEY` in `.env`.

### 5.7 Logout
1. Click the avatar top-right
2. Click "Se deconnecter" / "تسجيل الخروج"
3. Must redirect to /login

---

## 6. Test Content Access

### 6.1 Free Content (no login required)
1. Go to http://localhost:3000/content/browse
2. Click any content marked "Gratuit" (green badge)
3. Video or description must be visible

### 6.2 Paid Content (blocked, no login)
1. Click content marked "Premium" (yellow badge)
2. Must show a lock icon and "Abonnez-vous" / "S'abonner maintenant"

### 6.3 Paid Content (logged in as admin)
1. Log in as admin
2. Go to any premium content
3. Everything must be accessible (admin bypasses all restrictions)

---

## 7. Test Admin Dashboard

### 7.1 Overview
- http://localhost:3000/admin — stats cards

### 7.2 Content Management
- http://localhost:3000/admin/content — table of all content
- http://localhost:3000/admin/content/new — create new content form

### 7.3 User Management
- http://localhost:3000/admin/users — list with search

### 7.4 Manual Activation
- http://localhost:3000/admin/manual-activation
- Select a user, choose a plan, set days, click Activate
- That user now has an active subscription

### 7.5 Analytics
- http://localhost:3000/admin/analytics — charts

---

## 8. Test Security

### 8.1 Route Protection
1. Go to http://localhost:3000/admin while NOT logged in
2. Must redirect to /login

### 8.2 Role Protection
1. Log in as student
2. Try to go to http://localhost:3000/admin
3. Must redirect to /login (student cannot access admin)

### 8.3 Security Headers
1. Open DevTools (F12) → Network tab
2. Refresh any page
3. Click the main request
4. Check Response Headers. You should see:
   - `x-frame-options: DENY`
   - `x-content-type-options: nosniff`
   - `x-xss-protection: 1; mode=block`
   - `content-security-policy: default-src 'self'; script-src ...`
   - `permissions-policy: camera=(), microphone=(), geolocation=()`
   - `referrer-policy: strict-origin-when-cross-origin`

### 8.4 Rate Limiting on Registration
```powershell
$body = '{"email":"test2024@test.com","password":"test12345","fullName":"Test"}'
for ($i = 1; $i -le 5; $i++) {
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "Attempt $i - Status: $($r.StatusCode)"
  } catch {
    Write-Host "Attempt $i - Status: $($_.Exception.Response.StatusCode.value__)"
  }
}
```
The 4th attempt should return 429 (Too Many Requests).

---

## 9. Test API Endpoints

### Content list
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/content" -UseBasicParsing | ConvertTo-Json -Depth 2
```

### Current session (should be null when not logged in)
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/session" -UseBasicParsing
```

### Login status (rate limit check)
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login-status?email=admin@edutunisia.tn" -UseBasicParsing
```
Returns: `{ "blocked": false, "remaining": 5 }`

### Current user (must be logged in first)
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users/me" -UseBasicParsing
```

---

## Validation Checklist

- [ ] Home page loads with "Al-Aman" logo
- [ ] FR / عربي button works on all pages
- [ ] Admin login → redirects to /admin
- [ ] Teacher login → redirects to /teacher
- [ ] Student login → redirects to /student
- [ ] Wrong password shows error with remaining attempts count
- [ ] 6 wrong passwords → rate limit blocks (shows blocked message)
- [ ] Rate limit persists after page refresh (not just in-memory)
- [ ] Forgot password shows reset link in terminal
- [ ] Reset password flow works (new password can login)
- [ ] Free content accessible without login
- [ ] Paid content shows lock screen for non-subscribers
- [ ] Admin can see stats, manage content and users
- [ ] Manual activation creates subscription
- [ ] Security headers present in F12 → Network
- [ ] Unauthenticated access to /admin redirects to /login
- [ ] Student cannot access /admin (redirected)
- [ ] Logout works
- [ ] Arabic RTL works (right-to-left layout)
