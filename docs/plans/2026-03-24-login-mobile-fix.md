# Login Mobile Fix — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix mobile login failure and add comprehensive mobile E2E test coverage.

**Architecture:** The root cause is a missing Supabase auth middleware — after `signInWithPassword()` sets cookies client-side, the server-side dashboard page calls `getUser()` but expired/stale tokens are never refreshed because the middleware only handles i18n routing. Secondary issues: `100vh` doesn't work correctly on iOS Safari, and all E2E tests run only on desktop Chromium.

**Tech Stack:** Next.js 16, Supabase SSR 0.9.0, next-intl, Playwright 1.58.2, Tailwind CSS v4

**Root Cause Analysis (from plan-qa + review-plan):**
1. **CRITICAL**: No Supabase auth middleware → tokens expire → server `getUser()` returns null → redirect loop to `/login`
2. **HIGH**: `100vh` on iOS includes address bar → submit button cut off
3. **HIGH**: Only Chromium tested → Safari/Firefox bugs invisible

---

## Batch 1: Fix Supabase Auth Middleware (Root Cause)

### Task 1.1: Create Supabase middleware utility

**Files:**
- Create: `src/lib/supabase/middleware.ts`

**Step 1: Write the file**

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT use getSession() — it reads from cookies without
  // server verification. getUser() contacts the Supabase Auth server
  // and refreshes expired tokens automatically.
  await supabase.auth.getUser();

  return supabaseResponse;
}
```

**Step 2: Verify file compiles**

Run: `cd C:\Users\fires\OneDrive\Git\BENJEMIN && npx tsc --noEmit src/lib/supabase/middleware.ts`
Expected: No errors (or only unrelated errors from other files)

### Task 1.2: Compose middleware with next-intl

**Files:**
- Modify: `src/middleware.ts`

**Step 1: Read current middleware**

Current content (3 lines):
```typescript
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
export default createMiddleware(routing);
export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

**Step 2: Replace with composed middleware**

```typescript
import { type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const handleI18n = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // Step 1: Refresh Supabase auth token (writes updated cookies to response)
  const supabaseResponse = await updateSession(request);

  // Step 2: Run i18n routing on the (possibly cookie-updated) request
  const intlResponse = handleI18n(request);

  // Step 3: Merge Supabase auth cookies into the i18n response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

**Step 3: Verify TypeScript compiles**

Run: `cd C:\Users\fires\OneDrive\Git\BENJEMIN && npx tsc --noEmit`
Expected: No new errors

**Step 4: Run existing login E2E tests to verify no regression**

Run: `cd C:\Users\fires\OneDrive\Git\BENJEMIN && npx playwright test e2e/login.spec.ts --reporter=list`
Expected: All 11 existing tests PASS

**Step 5: Commit**

```bash
cd C:\Users\fires\OneDrive\Git\BENJEMIN
git add src/lib/supabase/middleware.ts src/middleware.ts
git commit -m "fix: add Supabase auth middleware to refresh tokens on every request

Composes Supabase session refresh with next-intl middleware.
Without this, expired auth tokens caused server-side getUser() to return null,
redirecting authenticated users back to /login (especially on mobile where
browsers aggressively manage cookies)."
```

---

## Batch 2: Reproduce & Fix Mobile Viewport Issues

### Task 2.1: Write failing mobile login test

**Files:**
- Modify: `playwright.config.ts` (add devices import)
- Create: `e2e/login-mobile.spec.ts`

**Step 1: Update Playwright config to add mobile projects**

Change the import line in `playwright.config.ts`:
```typescript
import { defineConfig, devices } from "@playwright/test";
```

Add to the `projects` array:
```typescript
projects: [
  {
    name: "chromium",
    use: { browserName: "chromium" },
  },
  {
    name: "mobile-safari",
    use: { ...devices["iPhone 14"] },
  },
  {
    name: "mobile-chrome",
    use: { ...devices["Pixel 5"] },
  },
],
```

**Step 2: Write mobile login test file**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Login — Mobile Safari (iPhone 14)", () => {
  test.use({ ...({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }) });

  test("login form is fully visible without scrolling", async ({ page }) => {
    await page.goto("/de/login");

    // Brand panel should be hidden on mobile
    const brandPanel = page.locator("section > div").first();
    // The left panel has hidden lg:flex — should not be visible
    await expect(page.locator(".hidden.lg\\:flex")).not.toBeVisible();

    // Form elements must be visible
    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Anmelden" })).toBeVisible();
  });

  test("submit button is not cut off by iOS viewport", async ({ page }) => {
    await page.goto("/de/login");
    const submitButton = page.getByRole("button", { name: "Anmelden" });
    await expect(submitButton).toBeVisible();

    // Button should be within viewport (not below the fold)
    const box = await submitButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThan(844); // iPhone 14 height
  });

  test("successful mobile login redirects to dashboard", async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("test@trauerpost.com");
    await page.locator("#login-password").fill("Test1234!");
    await page.getByRole("button", { name: "Anmelden" }).click();

    // Should redirect to dashboard — NOT back to login
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain("/dashboard");
  });

  test("session persists after page reload on mobile", async ({ page }) => {
    // Login first
    await page.goto("/de/login");
    await page.locator("#login-email").fill("test@trauerpost.com");
    await page.locator("#login-password").fill("Test1234!");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Reload the page
    await page.reload();

    // Should still be on dashboard, not redirected to login
    await expect(page.getByText("Dashboard")).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain("/dashboard");
  });

  test("shows error on invalid credentials (mobile)", async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("fake@test.com");
    await page.locator("#login-password").fill("wrongpassword");
    await page.getByRole("button", { name: "Anmelden" }).click();

    const error = page.locator(".bg-red-50");
    await expect(error).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Login — Small Mobile (iPhone SE)", () => {
  test.use({ ...({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true }) });

  test("login form fits on small screen", async ({ page }) => {
    await page.goto("/de/login");
    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Anmelden" })).toBeVisible();

    // Button within viewport
    const box = await page.getByRole("button", { name: "Anmelden" }).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThan(667);
  });
});

test.describe("Login — Android (Pixel 5)", () => {
  test.use({ ...({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true }) });

  test("login works on Android viewport", async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("test@trauerpost.com");
    await page.locator("#login-password").fill("Test1234!");
    await page.getByRole("button", { name: "Anmelden" }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain("/dashboard");
  });
});
```

**Step 3: Run mobile tests to see which fail**

Run: `cd C:\Users\fires\OneDrive\Git\BENJEMIN && npx playwright test e2e/login-mobile.spec.ts --reporter=list`
Expected: Some tests may fail (especially viewport-related ones). This establishes the baseline.

**Step 4: Commit test file**

```bash
git add e2e/login-mobile.spec.ts playwright.config.ts
git commit -m "test: add mobile login E2E tests — iPhone 14, iPhone SE, Pixel 5

Tests mobile viewport layout, successful login, session persistence,
and error handling across 3 mobile viewports."
```

### Task 2.2: Fix 100vh → 100dvh on login page

**Files:**
- Modify: `src/app/[locale]/login/page.tsx:8`

**Step 1: Change viewport height unit**

In `src/app/[locale]/login/page.tsx`, line 8, change:
```
min-h-[calc(100vh-4rem)]
```
to:
```
min-h-[calc(100dvh-4rem)]
```

**Step 2: Apply same fix to other pages using 100vh**

Check these files and apply the same change:
- `src/components/wizard/WizardShell.tsx:59` — `min-h-[calc(100vh-4rem)]` → `min-h-[calc(100dvh-4rem)]`
- `src/app/[locale]/admin/layout.tsx:36` — `min-h-[calc(100vh-4rem)]` → `min-h-[calc(100dvh-4rem)]`

Do NOT change `src/components/home/HeroSection.tsx` (`90vh` is intentional for hero).
Do NOT change `src/app/[locale]/layout.tsx` (`min-h-screen` is fine).

**Step 3: Run mobile tests again**

Run: `cd C:\Users\fires\OneDrive\Git\BENJEMIN && npx playwright test e2e/login-mobile.spec.ts --reporter=list`
Expected: Viewport-related tests should now PASS

**Step 4: Run ALL existing tests to verify no regression**

Run: `cd C:\Users\fires\OneDrive\Git\BENJEMIN && npx playwright test --reporter=list`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/app/[locale]/login/page.tsx src/components/wizard/WizardShell.tsx src/app/[locale]/admin/layout.tsx
git commit -m "fix: use dvh instead of vh for mobile viewport compatibility

100vh on iOS includes the address bar height, causing content to be
cut off. 100dvh (dynamic viewport height) adjusts when the address
bar shows/hides."
```

---

## Batch 3: Mobile Navigation Tests

### Task 3.1: Write hamburger menu → login navigation tests

**Files:**
- Create: `e2e/navigation-mobile.spec.ts`

**Step 1: Write mobile navigation test file**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Mobile Navigation", () => {
  test.use({ ...({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }) });

  test("shows hamburger menu, not desktop nav", async ({ page }) => {
    await page.goto("/de");

    // Desktop nav should be hidden
    await expect(page.locator("nav.hidden.md\\:flex")).not.toBeVisible();

    // Hamburger button should be visible
    const hamburger = page.getByLabel("Toggle menu");
    await expect(hamburger).toBeVisible();
  });

  test("hamburger → tap Login → navigates to login page", async ({ page }) => {
    await page.goto("/de");

    // Open mobile menu
    await page.getByLabel("Toggle menu").click();

    // Mobile menu should be visible
    const mobileMenu = page.locator(".md\\:hidden.bg-white");
    await expect(mobileMenu).toBeVisible();

    // Tap login link in mobile menu
    await mobileMenu.getByText("Anmelden").click();

    // Should navigate to login page
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page.locator("#login-email")).toBeVisible();
  });

  test("mobile menu closes after navigation", async ({ page }) => {
    await page.goto("/de");
    await page.getByLabel("Toggle menu").click();

    // Menu is open
    await expect(page.locator(".md\\:hidden.bg-white")).toBeVisible();

    // Navigate
    await page.locator(".md\\:hidden.bg-white").getByText("Anmelden").click();
    await page.waitForURL(/\/login/, { timeout: 10000 });

    // Hamburger menu should be closed on new page
    await expect(page.locator(".md\\:hidden.bg-white")).not.toBeVisible();
  });
});
```

**Step 2: Run tests**

Run: `cd C:\Users\fires\OneDrive\Git\BENJEMIN && npx playwright test e2e/navigation-mobile.spec.ts --reporter=list`
Expected: All 3 PASS (these test existing functionality, not broken code)

**Step 3: Commit**

```bash
git add e2e/navigation-mobile.spec.ts
git commit -m "test: add mobile navigation E2E tests — hamburger menu to login flow"
```

---

## Batch 4: Multi-Browser Testing

### Task 4.1: Add WebKit and Firefox to Playwright config

**Files:**
- Modify: `playwright.config.ts`

**Step 1: Add browser projects**

Add to the `projects` array in `playwright.config.ts`:
```typescript
{
  name: "webkit",
  use: { browserName: "webkit" },
},
{
  name: "firefox",
  use: { browserName: "firefox" },
},
```

**Step 2: Install browser binaries**

Run: `cd C:\Users\fires\OneDrive\Git\BENJEMIN && npx playwright install webkit firefox`
Expected: Downloads WebKit and Firefox binaries

**Step 3: Run login tests across all browsers**

Run: `cd C:\Users\fires\OneDrive\Git\BENJEMIN && npx playwright test e2e/login.spec.ts --reporter=list`
Expected: Tests run on Chromium + WebKit + Firefox. Note any failures — these are real cross-browser bugs.

**Step 4: Run mobile login tests**

Run: `cd C:\Users\fires\OneDrive\Git\BENJEMIN && npx playwright test e2e/login-mobile.spec.ts --reporter=list`
Expected: All PASS

**Step 5: Commit**

```bash
git add playwright.config.ts
git commit -m "test: add WebKit (Safari) and Firefox browser projects to Playwright"
```

---

## Batch 5: Edge Cases & Negative Tests

### Task 5.1: Write edge case and security tests

**Files:**
- Create: `e2e/login-edge-cases.spec.ts`

**Step 1: Write edge case test file**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Login — Edge Cases", () => {
  test("double-click submit does not cause duplicate errors", async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("test@trauerpost.com");
    await page.locator("#login-password").fill("Test1234!");

    const submitBtn = page.getByRole("button", { name: "Anmelden" });
    // Click twice rapidly
    await submitBtn.click();
    await submitBtn.click();

    // Should still redirect successfully (not show error from race condition)
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain("/dashboard");
  });

  test("back button after login shows dashboard, not login form", async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("test@trauerpost.com");
    await page.locator("#login-password").fill("Test1234!");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Go back
    await page.goBack();

    // Should NOT show login form (user is authenticated)
    // Either stays on dashboard or redirects back to dashboard
    await page.waitForTimeout(2000);
    // The key assertion: user should still have access to dashboard
    await page.goto("/de/dashboard");
    await expect(page.getByText("Dashboard")).toBeVisible({ timeout: 10000 });
  });

  test("unauthenticated mobile user accessing /dashboard redirects to /login", async ({ page }) => {
    page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/de/dashboard");
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });
});

test.describe("Login — Security (Negative Tests)", () => {
  test("SQL injection in email field is rejected", async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("'; DROP TABLE customers;--@test.com");
    await page.locator("#login-password").fill("anything");
    await page.getByRole("button", { name: "Anmelden" }).click();

    // Should show auth error, NOT crash
    const error = page.locator(".bg-red-50");
    await expect(error).toBeVisible({ timeout: 10000 });
  });

  test("XSS in email field does not execute", async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("<script>alert('xss')</script>@test.com");
    await page.locator("#login-password").fill("anything");
    await page.getByRole("button", { name: "Anmelden" }).click();

    // Should show error, no script execution
    // Check no alert dialog appeared
    let alertFired = false;
    page.on("dialog", () => { alertFired = true; });
    await page.waitForTimeout(2000);
    expect(alertFired).toBe(false);
  });

  test("very long email does not break layout", async ({ page }) => {
    await page.goto("/de/login");
    const longEmail = "a".repeat(200) + "@test.com";
    await page.locator("#login-email").fill(longEmail);
    await page.locator("#login-password").fill("anything");
    await page.getByRole("button", { name: "Anmelden" }).click();

    // Error should display without layout overflow
    const error = page.locator(".bg-red-50");
    await expect(error).toBeVisible({ timeout: 10000 });

    // Form container should not overflow viewport
    const form = page.locator("form");
    const formBox = await form.boundingBox();
    expect(formBox).not.toBeNull();
    expect(formBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  });
});
```

**Step 2: Run edge case tests**

Run: `cd C:\Users\fires\OneDrive\Git\BENJEMIN && npx playwright test e2e/login-edge-cases.spec.ts --reporter=list`
Expected: All PASS. If any FAIL, those are real bugs to fix.

**Step 3: Commit**

```bash
git add e2e/login-edge-cases.spec.ts
git commit -m "test: add login edge case and security E2E tests

Covers: double-click submit, back button after login, mobile auth redirect,
SQL injection, XSS, and long input handling."
```

---

## Batch 6: Full Test Run & Report

### Task 6.1: Run all tests and produce report

**Step 1: Run full test suite**

Run: `cd C:\Users\fires\OneDrive\Git\BENJEMIN && npx playwright test --reporter=list 2>&1 | head -100`
Expected: All tests PASS across all browsers and viewports.

**Step 2: Count test results**

Expected totals:
| File | Tests |
|------|-------|
| login.spec.ts (existing) | 11 |
| login-mobile.spec.ts (new) | 8 |
| navigation-mobile.spec.ts (new) | 3 |
| login-edge-cases.spec.ts (new) | 6 |
| Other existing (navigation, homepage, wizard, templates, api, admin) | ~24 |
| **Total per browser** | **~52** |
| **Total across 3 browsers + 2 mobile** | **~260 runs** |

**Step 3: Fix any failures**

If tests fail on specific browsers, investigate and fix. Common issues:
- WebKit: Different cookie handling → may need `sameSite` adjustments
- Firefox: Different form validation behavior → may need explicit `novalidate` handling
- Mobile: Touch event differences → may need `tap()` instead of `click()`

**Step 4: Final commit**

```bash
git add -A
git commit -m "test: all login tests passing across Chromium, WebKit, Firefox + mobile viewports"
```

---

## Summary

| Batch | Tasks | Files Changed | Tests Added |
|-------|-------|--------------|-------------|
| 1: Auth Middleware | 2 | 2 (create + modify) | 0 (fix only) |
| 2: Mobile Viewport | 2 | 4 (config + tests + CSS fixes) | 8 |
| 3: Mobile Navigation | 1 | 1 | 3 |
| 4: Multi-Browser | 1 | 1 | 0 (existing tests run on new browsers) |
| 5: Edge Cases | 1 | 1 | 6 |
| 6: Full Run | 1 | 0 | 0 (verification only) |
| **Total** | **8 tasks** | **9 files** | **17 new tests** |

**Execution order matters:** Batch 1 fixes the root cause. Batch 2 reproduces + fixes the visual issue. Batches 3-5 add coverage. Batch 6 verifies everything.
