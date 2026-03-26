# User Registration Flow — Implementation Plan

**Goal:** Allow new users to register, create an account, and immediately use the card builder + order flow. Currently registration is completely missing — the "Register" link on the login page is a dead `<span>`.

**Tech Stack:** Next.js 16, Supabase Auth (`admin.createUser`), Supabase DB (customers table), next-intl

**Review fixes applied:**
- R1: Replaced `auth.signUp()` with `auth.admin.createUser()` + `signInWithPassword()` — avoids email confirmation blocking auto-login. Verified: `admin.createUser` + `email_confirm: true` + `signInWithPassword` returns a valid session.
- R2: Added atomic rollback — if customer INSERT fails, delete the auth user with `admin.deleteUser()`.
- R3: Added `passwordConfirm` to API route with server-side validation.

---

## Current State

- Login page has "Noch kein Konto? Jetzt registrieren" — but `<span>` is not clickable
- Only `signInWithPassword` exists — no `signUp` anywhere
- `customers` table has `auth_user_id` FK to `auth.users` — but no INSERT policy for self-registration
- Dashboard requires both auth user AND customer record — signup without customer = broken dashboard
- No email verification flow

## RLS Issue (CRITICAL)

The `customers` table has:
- `SELECT` — only own record (`auth_user_id = auth.uid()`)
- `UPDATE` — only own record
- **NO `INSERT` policy for authenticated users** — a newly registered user CANNOT create their own customer record via the anon key

**Fix:** The registration API route uses the **service role key** (server-side only) for both `admin.createUser()` and customer INSERT.

---

## Batch 1: Registration Page + API

### Task 1.1: Create registration API route

**File:** Create `src/app/api/auth/register/route.ts`

**Steps:**

1. Accept POST with form data: `email`, `password`, `passwordConfirm`, `name`, `locale`
2. Validate server-side:
   - `email` required
   - `name` required (non-empty after trim)
   - `password` min 6 chars
   - `password === passwordConfirm` — if mismatch, redirect with `?error=passwordMismatch`
3. Create auth user with **service role key** (NOT `auth.signUp`):
   ```typescript
   const adminSupabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.supabase_Secert!,
     { auth: { autoRefreshToken: false, persistSession: false } }
   );

   const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
     email,
     password,
     email_confirm: true,  // Skip email verification for MVP
   });
   ```
4. If auth user created, insert customer record (same admin client):
   ```typescript
   const { error: customerError } = await adminSupabase.from("customers").insert({
     email,
     name: name.trim(),
     auth_user_id: authData.user.id,
     customer_type: "one_time",
     role: "customer",
     credits_remaining: 0,
   });

   // R2 ROLLBACK: if customer insert fails, delete auth user
   if (customerError) {
     await adminSupabase.auth.admin.deleteUser(authData.user.id);
     return NextResponse.redirect(
       new URL(`/${locale}/register?error=${encodeURIComponent(customerError.message)}`, request.url), 303
     );
   }
   ```
5. Sign in to get session (uses anon key client with cookies, same as login route):
   ```typescript
   const pendingCookies = [];
   const cookieStore = await cookies();
   const supabase = createServerClient(url, anonKey, {
     cookies: {
       getAll() { return cookieStore.getAll(); },
       setAll(c) { c.forEach((cookie) => pendingCookies.push(cookie)); },
     },
   });

   const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
   ```
6. Set auth cookies on redirect response (same pattern as login route)
7. Redirect to `/{locale}/dashboard`
8. On any error: redirect back to `/{locale}/register?error=...`

**Error cases:**
- Email already registered → Supabase returns "User already registered" → show "Diese E-Mail ist bereits registriert"
- Weak password → "Passwort muss mindestens 6 Zeichen haben"
- Passwords don't match → "Passwörter stimmen nicht überein"
- Name empty → "Name ist erforderlich"
- Customer insert fails → auth user deleted (rollback), show DB error

### Task 1.2: Create registration page

**File:** Create `src/app/[locale]/register/page.tsx`

**Steps:**

1. Same layout as login page (split panel — brand left, form right)
2. Form fields: Name, Email, Password, Password confirm
3. Form submits to `/api/auth/register` (same pattern as LoginForm)
4. Show error from query param if present
5. Link at bottom: "Bereits ein Konto? Jetzt anmelden" → links to `/login`

### Task 1.3: Create RegisterForm component

**File:** Create `src/components/auth/RegisterForm.tsx`

**Steps:**

1. Mirror LoginForm structure — `<form method="POST">` with `formAction="/api/auth/register"`
2. Fields: name (text), email (email), password (password), passwordConfirm (password)
3. Client-side validation (JS, before submit): passwords match, min 6 chars — shows inline error, prevents submit
4. Hidden fields: `locale`, `redirect` (if present in URL)
5. All labels via `useTranslations("register")`
6. Note: server ALSO validates `passwordConfirm` — client validation is UX only, server is the gate

### Task 1.4: Fix login page register link

**File:** Modify `src/app/[locale]/login/page.tsx`

**Steps:**

1. Replace dead `<span>` with `<Link href="/register">`
2. Import `Link` from `@/i18n/routing`

### Task 1.5: Add translations

**Files:** Modify `src/messages/de.json`, `src/messages/en.json`

Add `register` namespace:
```json
{
  "register": {
    "title": "Konto erstellen",
    "subtitle": "Erstellen Sie ein Konto, um Erinnerungskarten zu gestalten.",
    "name": "Vollständiger Name",
    "namePlaceholder": "Max Mustermann",
    "email": "E-Mail-Adresse",
    "emailPlaceholder": "name@beispiel.de",
    "password": "Passwort",
    "passwordPlaceholder": "Mindestens 6 Zeichen",
    "passwordConfirm": "Passwort bestätigen",
    "passwordConfirmPlaceholder": "Passwort wiederholen",
    "submit": "Registrieren",
    "loading": "Wird registriert...",
    "hasAccount": "Bereits ein Konto?",
    "login": "Jetzt anmelden",
    "passwordMismatch": "Passwörter stimmen nicht überein",
    "passwordTooShort": "Passwort muss mindestens 6 Zeichen haben",
    "nameRequired": "Name ist erforderlich",
    "emailExists": "Diese E-Mail ist bereits registriert"
  }
}
```

### Task 1.6: Verify build + commit

```bash
npx tsc --noEmit && npx next build
git commit -m "feat: user registration — signup page, API with atomic rollback"
```

**Verification:** Open `/de/register`, fill form, submit → redirects to dashboard with customer record in DB. Also verify: fill mismatched passwords → error shown, fill existing email → error shown.

---

## Batch 2: E2E Tests

### Task 2.1: Write registration E2E tests

**File:** Create `e2e/registration.spec.ts`

**Tests:**

1. Registration page loads with form fields (name, email, password, passwordConfirm)
2. Register link on login page navigates to `/register`
3. Password mismatch shows client-side error (submit blocked)
4. Successful registration → redirects to dashboard → customer record exists
5. Duplicate email → shows error message
6. After registration → can navigate to builder (verify auth works)
7. **Negative test:** registration with empty name → server returns error
8. **Cleanup:** each test that creates a user deletes it after (service key cleanup)

### Task 2.2: Commit + push

```bash
git commit -m "test: E2E tests for user registration flow"
git push
```

---

## Summary

| Batch | Tasks | Description |
|-------|-------|-------------|
| 1 | 1.1–1.6 | Registration API (atomic) + page + form + translations + login link fix |
| 2 | 2.1–2.2 | E2E tests for registration flow + cleanup |

**Total: 2 batches, 8 tasks. New files: 3, Modified files: 3.**

**Critical design decisions:**
- **`auth.admin.createUser()`** with service key (NOT `auth.signUp`) — bypasses email confirmation, returns confirmed user immediately
- **`signInWithPassword()`** after user creation — gets session + cookies for auto-login
- **Atomic rollback** — if customer INSERT fails, auth user is deleted. No orphan users.
- **Server-side `passwordConfirm` validation** — client validates for UX, server validates for security
- Password min 6 chars (Supabase default)
- New users get `customer_type: "one_time"`, `role: "customer"`, `credits_remaining: 0`

**What's NOT in scope:**
- Email verification (add later with Supabase email templates)
- OAuth (Google/Facebook login)
- Password reset flow
- Company name field (can add to profile later)
