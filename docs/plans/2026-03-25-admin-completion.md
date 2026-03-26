# Admin Completion + Simple Products — Implementation Plan (v4)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create Jess admin user, add admin nav link, complete remaining admin sections, add a simple product catalog for non-wizard products (Grabkreuzfoto, card packs, etc.), and verify EVERY batch on Vercel production with Playwright.

**Architecture:** Server-side rendered pages with Supabase. Admin-only access via `role: 'admin'`. Header becomes auth-aware via server component wrapper. Simple products use a new `products` table — customer selects product, uploads photo if needed, picks size/material, and pays. Must login before ordering (redirect-back flow). All UI via next-intl. Every batch verified on `trauerpost.vercel.app` with Playwright E2E.

**Tech Stack:** Next.js 16, Supabase (DB + Auth + RLS), Tailwind CSS v4, next-intl, Playwright 1.58.2

**Plan QA fixes applied:**
- C1: Products RLS uses `TO anon, authenticated` for public SELECT
- C2: Product order requires login — redirect to `/login?redirect=/products/[slug]`
- H1: Shopping-bag SVG included for AdminSidebar
- H2: ALL admin translations added in Batch 1 (not deferred)
- H3: Hard navigation uses locale prefix
- M3: JSONB fields cast with `as SizeOption[]`

**Review-plan fixes applied:**
- R1: Product order API route (`/api/orders/product`) — was completely missing
- R2: Server-side price calculation — never trust client-side price
- R3: Photo upload constraints — 10MB, JPEG/PNG/WebP only, private Storage bucket
- R4: Bulk shipment API (`/api/admin/orders/bulk-status`) — replaces N+1 per-order loop

**Plan QA v2 fixes applied:**
- C1: `card_type` made nullable — product orders use `null` not fake "sterbebild"
- H1: Step numbering fixed in Task 3.2 (was two Step 7s)
- M1: Payment noted as deferred for MVP — orders created as "paid" without Stripe

**CRITICAL RULE:** After every batch: `git push` → wait for Vercel deploy → run Playwright against `https://trauerpost.vercel.app` using `playwright.prod.config.ts`. A batch is NOT done until production tests pass.

---

## Batch 1: Jess Admin User + Admin Nav + All Translations

### Task 1.1: Create Jess admin user in Supabase

**Files:**
- Create: `scripts/create-admin-user.ts`

**Step 1: Write the script**

```typescript
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createAdminUser(): Promise<void> {
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: "jess@trauerpost.com",
    password: "SoundGarden!",
    email_confirm: true,
  });

  if (authError) {
    // If user already exists, find them
    if (authError.message.includes("already")) {
      console.log("Auth user already exists, looking up...");
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existing = users?.find((u) => u.email === "jess@trauerpost.com");
      if (existing) {
        console.log("Found existing auth user:", existing.id);
        await ensureCustomerRow(existing.id);
      }
      return;
    }
    console.error("Auth error:", authError.message);
    return;
  }

  console.log("Auth user created:", authData.user.id);
  await ensureCustomerRow(authData.user.id);
}

async function ensureCustomerRow(authUserId: string): Promise<void> {
  // Check if customer row exists
  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", authUserId)
    .single();

  if (existing) {
    // Update to admin
    await supabase.from("customers").update({ role: "admin" }).eq("id", existing.id);
    console.log("Updated existing customer to admin:", existing.id);
  } else {
    const { data: customer, error } = await supabase
      .from("customers")
      .insert({
        email: "jess@trauerpost.com",
        name: "Jess",
        customer_type: "regular",
        role: "admin",
        credits_remaining: 0,
        auth_user_id: authUserId,
      })
      .select()
      .single();

    if (error) {
      console.error("Customer error:", error.message);
      return;
    }
    console.log("Admin customer created:", customer.id);
  }
  console.log("Done! Login: jess@trauerpost.com / SoundGarden!");
}

createAdminUser();
```

**Step 2: Run**

Run: `cd C:\Users\fires\OneDrive\Git\BENJEMIN && npx tsx scripts/create-admin-user.ts`
Expected: "Auth user created" + "Admin customer created" + "Done!"

**Step 3: Commit**

```bash
git add scripts/create-admin-user.ts
git commit -m "chore: add script to create Jess admin user"
```

### Task 1.2: Add ALL admin translations (DE + EN)

**Files:**
- Modify: `src/messages/de.json`
- Modify: `src/messages/en.json`

**Why first:** The existing admin pages use `getTranslations("admin.dashboard")` etc. but these namespaces DON'T EXIST in the JSON files. This causes English fallback on production. Must fix before adding new features.

**Step 1: Add full admin namespace to `de.json`**

Add under root level:
```json
"admin": {
  "sidebar": {
    "dashboard": "Dashboard",
    "orders": "Bestellungen",
    "customers": "Kunden",
    "templates": "Vorlagen",
    "promoCodes": "Gutscheine",
    "invoices": "Rechnungen",
    "shipments": "Versand",
    "reports": "Berichte",
    "products": "Produkte"
  },
  "dashboard": {
    "title": "Dashboard",
    "newOrders": "Neue Bestellungen",
    "inProduction": "In Druckbearbeitung",
    "revenue": "Umsatz",
    "uniqueCustomers": "Einzelkunden",
    "lowCredit": "Geringes Guthaben",
    "recentOrders": "Letzte Bestellungen",
    "date": "Datum",
    "type": "Typ",
    "qty": "Menge",
    "status": "Status",
    "price": "Preis",
    "quickActions": "Schnellaktionen",
    "newOrder": "Neue Bestellung",
    "viewShipments": "Sendungen anzeigen"
  },
  "orders": {
    "title": "Bestellungen",
    "all": "Alle",
    "new": "Neu",
    "printing": "In Druck",
    "ready": "Abholbereit",
    "shipped": "Versendet",
    "completed": "Abgeschlossen",
    "cancelled": "Storniert",
    "search": "Suche nach Kunde...",
    "startPrinting": "Druck starten",
    "markShipped": "Als versendet markieren",
    "readyForPickup": "Abholbereit",
    "markDelivered": "Als zugestellt markieren",
    "confirmStatus": "Status wirklich ändern?",
    "statusUpdated": "Status aktualisiert",
    "noOrders": "Keine Bestellungen."
  },
  "customers": {
    "title": "Kunden",
    "name": "Name",
    "email": "E-Mail",
    "company": "Firma",
    "type": "Typ",
    "phone": "Telefon",
    "credits": "Guthaben",
    "role": "Rolle",
    "backToList": "Zurück zur Liste",
    "creditsRemaining": "Guthaben",
    "creditHistory": "Guthaben-Verlauf",
    "orderHistory": "Bestellverlauf",
    "date": "Datum",
    "amount": "Betrag",
    "balanceAfter": "Saldo danach",
    "description": "Beschreibung",
    "noTransactions": "Noch keine Transaktionen.",
    "noOrders": "Noch keine Bestellungen.",
    "cardType": "Kartentyp",
    "qty": "Menge",
    "status": "Status",
    "price": "Preis",
    "addCredits": "Guthaben hinzufügen",
    "addCreditsFor": "Guthaben hinzufügen für",
    "creditAmount": "Anzahl Credits",
    "cancel": "Abbrechen"
  },
  "products": {
    "title": "Produkte",
    "name": "Name",
    "category": "Kategorie",
    "price": "Preis",
    "active": "Aktiv",
    "actions": "Aktionen",
    "addProduct": "Produkt hinzufügen",
    "editProduct": "Produkt bearbeiten",
    "noProducts": "Noch keine Produkte."
  },
  "promoCodes": {
    "title": "Gutscheine",
    "code": "Code",
    "type": "Typ",
    "value": "Wert",
    "uses": "Nutzungen",
    "expires": "Gültig bis",
    "active": "Aktiv",
    "createCode": "Code erstellen",
    "percent": "Prozent",
    "fixed": "Festbetrag",
    "maxUses": "Max. Nutzungen",
    "expiryDate": "Ablaufdatum",
    "assignCustomer": "Kunde zuordnen",
    "noCodes": "Noch keine Gutscheine."
  },
  "invoices": {
    "title": "Rechnungen",
    "invoiceNumber": "Rechnungs-Nr.",
    "date": "Datum",
    "customer": "Kunde",
    "amount": "Betrag",
    "status": "Status",
    "viewPdf": "PDF anzeigen",
    "resend": "Erneut senden",
    "noInvoices": "Noch keine Rechnungen."
  },
  "shipments": {
    "title": "Offene Sendungen",
    "orderDate": "Bestelldatum",
    "customer": "Kunde",
    "cardType": "Kartentyp",
    "qty": "Menge",
    "status": "Status",
    "daysSince": "Tage seit Bestellung",
    "markAllShipped": "Alle als versendet markieren",
    "noShipments": "Keine offenen Sendungen.",
    "overdue": "Überfällig"
  },
  "reports": {
    "title": "Berichte",
    "ordersPerMonth": "Bestellungen pro Monat",
    "month": "Monat",
    "count": "Anzahl",
    "totalRevenue": "Gesamtumsatz",
    "topCustomers": "Top 10 Kunden",
    "orderCount": "Bestellungen",
    "totalSpent": "Gesamtausgaben",
    "creditUsage": "Guthaben-Übersicht",
    "totalSold": "Gesamt verkauft",
    "totalUsed": "Gesamt verbraucht",
    "totalRemaining": "Gesamt verbleibend"
  }
}
```

**Step 2: Add same structure to `en.json`** (English equivalents)

**Step 3: Add nav keys**

In both `de.json` and `en.json`, under `common.nav`, add:
```json
"dashboard": "Dashboard",
"admin": "Admin",
"products": "Produkte"
```
(English: `"products": "Products"`)

**Step 4: Commit**

```bash
git add src/messages/de.json src/messages/en.json
git commit -m "feat: add all admin + product translation namespaces (DE + EN)"
```

### Task 1.3: Make Header auth-aware with admin link

**Files:**
- Create: `src/components/layout/HeaderWrapper.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/app/[locale]/layout.tsx`

**Step 1: Create HeaderWrapper (server component)**

`src/components/layout/HeaderWrapper.tsx`:
```typescript
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Header from "./Header";

export default async function HeaderWrapper(): Promise<React.ReactElement> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let isLoggedIn = false;

  if (user) {
    isLoggedIn = true;
    const { data: customer } = await supabase
      .from("customers")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();
    isAdmin = customer?.role === "admin";
  }

  return <Header isLoggedIn={isLoggedIn} isAdmin={isAdmin} />;
}
```

**Step 2: Update Header to accept props + show conditional links**

Modify `src/components/layout/Header.tsx`:

```typescript
interface HeaderProps {
  isLoggedIn?: boolean;
  isAdmin?: boolean;
}

export default function Header({ isLoggedIn = false, isAdmin = false }: HeaderProps) {
```

Add "Produkte" to `navLinks`:
```typescript
const navLinks = [
  { label: t("nav.templates"), href: "/templates" as const },
  { label: t("nav.products"), href: "/products" as const },
  { label: t("nav.builder"), href: "/builder" as const },
  { label: t("nav.pricing"), href: "/pricing" as const },
  { label: t("nav.contact"), href: "/contact" as const },
];
```

Desktop auth area — replace login button `<div>`:
```typescript
<div className="hidden md:flex items-center gap-4">
  <LanguageSwitcher />
  {isLoggedIn ? (
    <>
      {isAdmin && (
        <Link href="/admin" className="text-sm text-brand-gray hover:text-brand-dark transition-colors">
          {t("nav.admin")}
        </Link>
      )}
      <Link href="/dashboard" className="text-sm bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-primary-hover transition-colors">
        {t("nav.dashboard")}
      </Link>
    </>
  ) : (
    <Link href="/login" className="text-sm bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-primary-hover transition-colors">
      {t("nav.login")}
    </Link>
  )}
</div>
```

Mobile menu — same conditional logic:
```typescript
{isLoggedIn ? (
  <>
    {isAdmin && (
      <Link href="/admin" className="text-brand-gray hover:text-brand-dark transition-colors" onClick={() => setMobileMenuOpen(false)}>
        {t("nav.admin")}
      </Link>
    )}
    <Link href="/dashboard" className="text-brand-primary font-medium" onClick={() => setMobileMenuOpen(false)}>
      {t("nav.dashboard")}
    </Link>
  </>
) : (
  <Link href="/login" className="text-brand-primary font-medium" onClick={() => setMobileMenuOpen(false)}>
    {t("nav.login")}
  </Link>
)}
```

**Step 3: Update layout to use HeaderWrapper**

In `src/app/[locale]/layout.tsx`:
- `import HeaderWrapper from "@/components/layout/HeaderWrapper";`
- Replace `<Header />` with `<HeaderWrapper />`

**Step 4: Fix LoginForm locale redirect (H3 fix)**

In `src/components/auth/LoginForm.tsx`, change:
```typescript
window.location.href = "/dashboard";
```
to:
```typescript
// Get locale from current URL path
const locale = window.location.pathname.split("/")[1] || "de";
window.location.href = `/${locale}/dashboard`;
```

**Step 5: Write E2E test**

Create: `e2e/admin-nav.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Admin Nav Link", () => {
  test("admin user sees Admin + Dashboard links in header", async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("jess@trauerpost.com");
    await page.locator("#login-password").fill("SoundGarden!");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    const adminLink = page.getByRole("link", { name: "Admin" });
    await expect(adminLink).toBeVisible();

    const dashboardLink = page.getByRole("link", { name: "Dashboard" });
    await expect(dashboardLink).toBeVisible();

    // Click Admin → goes to admin dashboard
    await adminLink.click();
    await page.waitForURL(/\/admin/, { timeout: 10000 });
    expect(page.url()).toContain("/admin");
  });

  test("regular user sees Dashboard but NOT Admin link", async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("test@trauerpost.com");
    await page.locator("#login-password").fill("Test1234!");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    await expect(page.getByRole("link", { name: "Admin" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  });

  test("unauthenticated user sees Anmelden only", async ({ page }) => {
    await page.goto("/de");
    await expect(page.getByRole("link", { name: "Anmelden" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Admin" })).not.toBeVisible();
  });
});
```

**Step 6: Run locally, fix any broken existing tests, commit, push, production test**

```bash
# Local test
npx playwright test e2e/admin-nav.spec.ts e2e/login.spec.ts --project=chromium --reporter=list

# Fix any tests that break (e.g., tests looking for "Anmelden" button after login — now shows "Dashboard")

# Commit + push
git add src/components/layout/HeaderWrapper.tsx src/components/layout/Header.tsx src/app/[locale]/layout.tsx src/components/auth/LoginForm.tsx e2e/admin-nav.spec.ts
git commit -m "feat: auth-aware header — Admin link for admins, Dashboard for users, Anmelden for guests"
git push origin master

# Production test (wait for deploy)
sleep 120
npx playwright test e2e/admin-nav.spec.ts --project=chromium --config=playwright.prod.config.ts --reporter=list
```

Expected: 3/3 pass on production.

---

## Batch 2: Customer Detail + Credits

### Task 2.1: Customer detail page + AddCreditsModal + E2E

**Files:**
- Create: `src/app/[locale]/admin/customers/[id]/page.tsx`
- Create: `src/components/admin/AddCreditsModal.tsx`
- Modify: `src/app/[locale]/admin/customers/page.tsx` — clickable customer names
- Create: `e2e/admin-customers.spec.ts`

**Step 1: Write customer detail page**

`src/app/[locale]/admin/customers/[id]/page.tsx` — Server component:
- Fetch customer by ID from `customers` table
- Fetch credit transactions for this customer
- Fetch orders for this customer
- Display: info card, credits box with AddCreditsModal, transaction history table, order history table
- If customer not found → `redirect("/admin/customers")`
- All text via `getTranslations("admin.customers")`

**Step 2: Write AddCreditsModal**

`src/components/admin/AddCreditsModal.tsx` — Client component:
- Props: `customerId: string`, `customerName: string`
- Form: amount (number, min 1) + description (textarea, required)
- Submit: `POST /api/admin/customers/{customerId}/credits`
- On success: close modal, `router.refresh()`
- On error: show error in red box
- Uses `useTranslations("admin.customers")`

**Step 3: Make customer names clickable in list**

In `src/app/[locale]/admin/customers/page.tsx`, add `import { Link } from "@/i18n/routing"` and change the name cell:
```typescript
<td className="py-3 px-2">
  <Link href={`/admin/customers/${c.id}`} className="text-brand-primary hover:underline">
    {c.name}
  </Link>
</td>
```

**Step 4: Write E2E test**

`e2e/admin-customers.spec.ts`:
```typescript
import { test, expect } from "@playwright/test";

test.describe("Admin — Customer Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("jess@trauerpost.com");
    await page.locator("#login-password").fill("SoundGarden!");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  });

  test("customer list has clickable names", async ({ page }) => {
    await page.goto("/de/admin/customers");
    const link = page.locator("table a").first();
    await expect(link).toBeVisible();
  });

  test("click customer name → detail page", async ({ page }) => {
    await page.goto("/de/admin/customers");
    const link = page.locator("table a").first();
    await link.click();
    await page.waitForURL(/\/admin\/customers\//, { timeout: 10000 });
    // Should show credits section
    await expect(page.getByText("Guthaben")).toBeVisible();
  });

  test("add credits modal opens", async ({ page }) => {
    await page.goto("/de/admin/customers");
    await page.locator("table a").first().click();
    await page.waitForURL(/\/admin\/customers\//, { timeout: 10000 });
    await page.getByText("Guthaben hinzufügen").click();
    await expect(page.locator("input[type=number]")).toBeVisible();
  });

  test("adding 0 credits fails (negative test)", async ({ page }) => {
    await page.goto("/de/admin/customers");
    await page.locator("table a").first().click();
    await page.waitForURL(/\/admin\/customers\//, { timeout: 10000 });
    await page.getByText("Guthaben hinzufügen").click();
    // Try to submit with invalid amount
    await page.locator("input[type=number]").fill("0");
    await page.locator("textarea").fill("test");
    await page.getByRole("button", { name: "Guthaben hinzufügen" }).last().click();
    // Should show error
    await expect(page.locator(".bg-red-50")).toBeVisible({ timeout: 5000 });
  });
});
```

**Step 5: Commit, push, production test**

```bash
npx playwright test e2e/admin-customers.spec.ts --project=chromium --reporter=list
git add src/app/[locale]/admin/customers/ src/components/admin/AddCreditsModal.tsx e2e/admin-customers.spec.ts
git commit -m "feat: customer detail page with credit history + add credits modal"
git push origin master
sleep 120
npx playwright test e2e/admin-customers.spec.ts --project=chromium --config=playwright.prod.config.ts --reporter=list
```

Expected: 4/4 pass on production.

---

## Batch 3: Simple Products (Grabkreuzfoto etc.)

### Task 3.1: Database — products table + RLS

**Files:**
- Create: `supabase/migrations/20260325000003_products.sql`
- Modify: `src/lib/supabase/types.ts`

**Step 1: Write migration**

```sql
-- Simple products that don't need the card wizard
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('cross_photo', 'card_pack', 'accessory', 'print_service')),
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  requires_photo BOOLEAN DEFAULT false,
  size_options JSONB DEFAULT '[]',
  material_options JSONB DEFAULT '[]',
  preview_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: C1 fix — anon + authenticated can read active products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins have full access to products"
  ON products FOR ALL
  TO authenticated
  USING (is_admin());

-- Add product_id to orders for simple product orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- QA FIX C1: Make card_type nullable for product orders (products are NOT cards)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_card_type_check;
ALTER TABLE orders ALTER COLUMN card_type DROP NOT NULL;
ALTER TABLE orders ADD CONSTRAINT orders_card_type_check
  CHECK (card_type IS NULL OR card_type IN ('sterbebild', 'trauerkarte', 'dankkarte'));

-- Seed: Grabkreuzfoto
INSERT INTO products (name, slug, description, category, price_cents, requires_photo, size_options, material_options)
VALUES (
  'Grabkreuzfoto',
  'grabkreuzfoto',
  'Hochwertiges Foto für das Grabkreuz — wetterfest und UV-beständig. Bleibt bis zur Fertigstellung der Grabstätte.',
  'cross_photo',
  2500,
  true,
  '[{"id": "small", "label": "8x10 cm", "price_cents": 2500}, {"id": "medium", "label": "10x13 cm", "price_cents": 3500}, {"id": "large", "label": "13x18 cm", "price_cents": 4500}]'::jsonb,
  '[{"id": "plastic", "label": "Kunststoff (wetterfest)", "price_cents": 0}, {"id": "ceramic", "label": "Keramik (premium)", "price_cents": 1500}]'::jsonb
);
```

**Step 2: Run migration** via Supabase Dashboard SQL editor or `npx supabase db push`.

**Step 3: Add TypeScript types**

Add to `src/lib/supabase/types.ts`:

```typescript
// ── Products ──

export type ProductCategory = "cross_photo" | "card_pack" | "accessory" | "print_service";

export interface SizeOption {
  id: string;
  label: string;
  price_cents: number;
}

export interface MaterialOption {
  id: string;
  label: string;
  price_cents: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: ProductCategory;
  price_cents: number;
  currency: string;
  requires_photo: boolean;
  size_options: SizeOption[];  // JSONB — cast with `as SizeOption[]` when reading from DB
  material_options: MaterialOption[];  // JSONB — cast with `as MaterialOption[]`
  preview_image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
```

Also add `products` to `Database.public.Tables` and `product_id: string | null` to `Order` + `OrderInsert` + `OrderUpdate`.

**Step 4: Commit**

```bash
git add supabase/migrations/20260325000003_products.sql src/lib/supabase/types.ts
git commit -m "feat: products table with RLS for anonymous browsing + Grabkreuzfoto seed"
```

### Task 3.2: Product order API + catalog pages (customer-facing)

**Files:**
- Create: `src/app/api/orders/product/route.ts` — product order API (REVIEW FIX #1 + #2)
- Create: `src/app/[locale]/products/page.tsx` — lists active products
- Create: `src/app/[locale]/products/[slug]/page.tsx` — product detail + order form
- Create: `src/components/products/ProductOrderForm.tsx` — client component
- Modify: `src/components/auth/LoginForm.tsx` — login redirect-back
- Modify: `src/messages/de.json` — add `products` namespace (customer-facing)
- Modify: `src/messages/en.json` — same

**Step 1: Write product order API (REVIEW FIX #1 — missing API + FIX #2 — server-side pricing)**

`src/app/api/orders/product/route.ts`:
```typescript
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import type { SizeOption, MaterialOption } from "@/lib/supabase/types";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();

  // Auth check — must be logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json();
  const { product_id, size_id, material_id, quantity, photo_url } = body;

  // Validate required fields
  if (!product_id || !size_id || !quantity || quantity < 1) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Fetch product from DB
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", product_id)
    .eq("is_active", true)
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // REVIEW FIX #2: Calculate price SERVER-SIDE — never trust client
  const sizeOptions = product.size_options as SizeOption[];
  const materialOptions = product.material_options as MaterialOption[];

  const selectedSize = sizeOptions.find((s) => s.id === size_id);
  if (!selectedSize) {
    return NextResponse.json({ error: "Invalid size" }, { status: 400 });
  }

  let materialSurcharge = 0;
  if (material_id) {
    const selectedMaterial = materialOptions.find((m) => m.id === material_id);
    if (!selectedMaterial) {
      return NextResponse.json({ error: "Invalid material" }, { status: 400 });
    }
    materialSurcharge = selectedMaterial.price_cents;
  }

  // Photo required check
  if (product.requires_photo && !photo_url) {
    return NextResponse.json({ error: "Photo is required for this product" }, { status: 400 });
  }

  const price_cents = (selectedSize.price_cents + materialSurcharge) * quantity;

  // Find customer
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: customer?.id ?? null,
      product_id: product.id,
      status: "paid",  // Payment integration deferred — orders created as 'paid' for MVP
      card_type: null,  // QA FIX C1: products are NOT cards — card_type is nullable now
      card_data: {
        product_name: product.name,
        size: size_id,
        material: material_id,
        photo_url: photo_url ?? null,
      },
      quantity,
      price_cents,
      currency: product.currency,
      payment_method: customer ? "credit" : "stripe",
    })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  return NextResponse.json({ order_id: order.id, price_cents }, { status: 201 });
}
```

**Step 2: Write products listing page**

`src/app/[locale]/products/page.tsx` — Server component:
- Fetch all active products: `supabase.from("products").select("*").eq("is_active", true).order("sort_order")`
- Display as grid of cards: image (or placeholder), name, description, starting price, "Details" link
- No auth required (public page — RLS allows anon SELECT)

**Step 3: Write product detail page**

`src/app/[locale]/products/[slug]/page.tsx` — Server component:
- Fetch product by slug
- If not found → `notFound()`
- Check auth: `const { data: { user } } = await supabase.auth.getUser()`
- Pass `isLoggedIn={!!user}` to ProductOrderForm
- Render: name, description, image, ProductOrderForm

**Step 4: Write ProductOrderForm (client component)**

`src/components/products/ProductOrderForm.tsx`:
- Props: `product: Product`, `isLoggedIn: boolean`
- Size selector (radio buttons from `product.size_options as SizeOption[]`)
- Material selector (radio buttons from `product.material_options as MaterialOption[]`)
- Photo upload (REVIEW FIX #3 — with constraints):
  ```typescript
  <input
    type="file"
    accept="image/jpeg,image/png,image/webp"
    onChange={handlePhotoUpload}
  />
  ```
  - `handlePhotoUpload`: validate file size ≤ 10MB, validate MIME type is `image/jpeg|png|webp`
  - Upload to Supabase Storage bucket `product-photos` at path `{userId}/{timestamp}-{filename}`
  - On upload success: store the public URL in state
  - On upload failure: show error message, don't allow order submission
- Quantity selector (number input, min 1)
- Price display: client-side estimate only (label: "ca. €X.XX" — approximate)
- "Bestellen" button:
  - **If NOT logged in:** redirect to `/login?redirect=/products/{slug}`
  - **If logged in:** POST to `/api/orders/product` with `{ product_id, size_id, material_id, quantity, photo_url }`. Server calculates real price. On success → redirect to dashboard.

**Step 5: Create Supabase Storage bucket (one-time setup)**

Via Supabase Dashboard → Storage → New Bucket:
- Name: `product-photos`
- Public: NO (private — only authenticated users can upload, only admins can download)
- File size limit: 10MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

RLS policies:
```sql
-- Authenticated users can upload their own photos
CREATE POLICY "Users can upload product photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-photos');

-- Admins can read all photos (for printing)
CREATE POLICY "Admins can read product photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'product-photos' AND (SELECT is_admin()));

-- Users can read their own photos
CREATE POLICY "Users can read own product photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'product-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
```

**Step 6: Handle login redirect-back (C2 fix)**

In `src/components/auth/LoginForm.tsx`, after successful login:
```typescript
// Check for redirect parameter
const params = new URLSearchParams(window.location.search);
const redirect = params.get("redirect");
const locale = window.location.pathname.split("/")[1] || "de";

if (redirect) {
  window.location.href = `/${locale}${redirect}`;
} else {
  window.location.href = `/${locale}/dashboard`;
}
```

**Step 7: Add customer-facing product translations (Task 3.2 continued)**

`de.json` add `products` namespace:
```json
"products": {
  "title": "Produkte",
  "subtitle": "Hochwertige Trauerprodukte — einfach online bestellen",
  "startingAt": "ab",
  "details": "Details",
  "selectSize": "Größe wählen",
  "selectMaterial": "Material wählen",
  "uploadPhoto": "Foto hochladen",
  "uploadPhotoHint": "JPG, PNG oder WebP — max. 10 MB",
  "quantity": "Menge",
  "estimatedPrice": "ca.",
  "order": "Bestellen",
  "loginToOrder": "Anmelden zum Bestellen",
  "orderSuccess": "Bestellung aufgegeben!",
  "photoRequired": "Ein Foto ist erforderlich für dieses Produkt.",
  "photoTooLarge": "Die Datei ist zu groß (max. 10 MB).",
  "photoInvalidType": "Nur JPG, PNG oder WebP erlaubt.",
  "uploading": "Wird hochgeladen..."
}
```

Same in English in `en.json`.

**Step 8: Write E2E test (Task 3.2 continued)**

Create: `e2e/products.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Products Catalog", () => {
  test("products page shows Grabkreuzfoto", async ({ page }) => {
    await page.goto("/de/products");
    await expect(page.getByText("Grabkreuzfoto")).toBeVisible();
  });

  test("product detail shows size + material options", async ({ page }) => {
    await page.goto("/de/products/grabkreuzfoto");
    await expect(page.getByText("Grabkreuzfoto")).toBeVisible();
    await expect(page.getByText("8x10 cm")).toBeVisible();
    await expect(page.getByText("Kunststoff")).toBeVisible();
  });

  test("photo upload field visible for cross_photo product", async ({ page }) => {
    await page.goto("/de/products/grabkreuzfoto");
    await expect(page.locator("input[type=file]")).toBeVisible();
  });

  test("unauthenticated user clicking order → redirect to login with return URL", async ({ page }) => {
    await page.goto("/de/products/grabkreuzfoto");
    await page.getByText("Anmelden zum Bestellen").click();
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain("redirect");
    expect(page.url()).toContain("products");
  });

  test("products link visible in main nav", async ({ page }) => {
    await page.goto("/de");
    await expect(page.getByRole("link", { name: "Produkte" })).toBeVisible();
  });
});
```

**Step 9: Commit, push, production test**

```bash
npx playwright test e2e/products.spec.ts --project=chromium --reporter=list
git add src/app/[locale]/products/ src/components/products/ src/messages/ e2e/products.spec.ts src/components/auth/LoginForm.tsx
git commit -m "feat: product catalog with Grabkreuzfoto — size/material/photo options + login redirect"
git push origin master
sleep 120
npx playwright test e2e/products.spec.ts --project=chromium --config=playwright.prod.config.ts --reporter=list
```

Expected: 5/5 pass on production.

### Task 3.3: Admin product management

**Files:**
- Create: `src/app/api/admin/products/route.ts` — GET + POST
- Create: `src/app/[locale]/admin/products/page.tsx`
- Create: `src/components/admin/ProductFormModal.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx` — add products link + icon
- Create: `e2e/admin-products.spec.ts`

**Step 1: Add products link + shopping-bag icon to AdminSidebar (H1 fix)**

In `src/components/admin/AdminSidebar.tsx`, add to `sidebarLinks` array:
```typescript
{ key: "products", href: "/admin/products", icon: "shopping-bag" },
```

Add to `icons` Record:
```typescript
"shopping-bag": (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
),
```

**Step 2: Write API route, admin page, form modal**

Admin can: list all products (active + inactive), create new, edit, toggle active.

**Step 3: Write E2E test**

`e2e/admin-products.spec.ts`:
```typescript
import { test, expect } from "@playwright/test";

test.describe("Admin — Products", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("jess@trauerpost.com");
    await page.locator("#login-password").fill("SoundGarden!");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  });

  test("admin products page shows Grabkreuzfoto", async ({ page }) => {
    await page.goto("/de/admin/products");
    await expect(page.getByText("Grabkreuzfoto")).toBeVisible();
  });

  test("products link in admin sidebar", async ({ page }) => {
    await page.goto("/de/admin");
    await expect(page.getByRole("link", { name: "Produkte" })).toBeVisible();
  });
});
```

**Step 4: Commit, push, production test**

```bash
npx playwright test e2e/admin-products.spec.ts --project=chromium --reporter=list
git add -A && git commit -m "feat: admin product management with sidebar link" && git push origin master
sleep 120
npx playwright test e2e/admin-products.spec.ts --project=chromium --config=playwright.prod.config.ts --reporter=list
```

Expected: 2/2 pass on production.

---

## Batch 4: Promo Codes

### Task 4.1: Promo codes API + page + E2E

**Files:**
- Create: `src/app/api/admin/promo-codes/route.ts` — GET + POST
- Create: `src/app/[locale]/admin/promo-codes/page.tsx`
- Create: `src/components/admin/PromoCodesClient.tsx`
- Create: `src/components/admin/CreatePromoModal.tsx`
- Create: `e2e/admin-promo.spec.ts`

**API:** GET lists all promo codes, POST creates with validation (unique code, percent 1-100, etc.)
**Page:** Table: Code, Type (% / €), Value, Uses (current/max), Expires, Active toggle
**Modal:** Create new code form
**E2E tests (3):**
1. Admin sees promo codes list
2. Admin can create a new code (positive)
3. Duplicate code shows error (negative)

**Commit, push, production test** — same pattern. Expected: 3/3 on production.

---

## Batch 5: Invoices + Shipments

### Task 5.1: Invoices list page + E2E

**Files:**
- Create: `src/app/[locale]/admin/invoices/page.tsx`
- Create: `e2e/admin-invoices.spec.ts`

**Page:** Table: Invoice #, Date, Customer, Amount (€), Status, PDF link. Filter by status. Search by customer/number.
**E2E (2):** Admin sees invoices list + filter by status works.

### Task 5.2: Bulk status API + Shipments tracker + E2E

**Files:**
- Create: `src/app/api/admin/orders/bulk-status/route.ts` — REVIEW FIX #4
- Create: `src/app/[locale]/admin/shipments/page.tsx`
- Create: `src/components/admin/ShipmentsClient.tsx`
- Create: `e2e/admin-shipments.spec.ts`

**Step 1: Write bulk status API (REVIEW FIX #4 — replaces per-order loop)**

`src/app/api/admin/orders/bulk-status/route.ts`:
```typescript
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  const body = await request.json();
  const { order_ids, status } = body;

  // Validate
  if (!Array.isArray(order_ids) || order_ids.length === 0) {
    return NextResponse.json({ error: "order_ids must be a non-empty array" }, { status: 400 });
  }
  if (order_ids.length > 50) {
    return NextResponse.json({ error: "Maximum 50 orders per batch" }, { status: 400 });
  }
  const validStatuses = ["in_production", "ready_for_pickup", "shipped", "completed"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Single DB update for all orders
  const updateData: Record<string, unknown> = { status };
  if (status === "shipped") updateData.shipped_at = new Date().toISOString();
  if (status === "ready_for_pickup") updateData.pickup_ready_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("orders")
    .update(updateData)
    .in("id", order_ids)
    .select("id, customer_id, status");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Queue emails in background (don't block response)
  // For now: log. Later: integrate with email service.
  console.log(`Bulk status update: ${data?.length} orders → ${status}`);

  return NextResponse.json({
    updated: data?.length ?? 0,
    status,
  });
}
```

**Step 2: Write shipments page**

Filtered view of orders: `status IN ('paid', 'in_production', 'ready_for_pickup', 'shipped')`.
Columns: date, customer, type, qty, status, days since order (red > 3 days).
Checkboxes per row. Bulk action button calls `PATCH /api/admin/orders/bulk-status` with all selected IDs in ONE request.

**Step 3: Write E2E tests**

`e2e/admin-shipments.spec.ts` — 2 tests:
1. Admin sees open shipments list
2. Overdue orders (>3 days) show red highlight

**Commit, push, production test** — Expected: 4/4 on production.

---

## Batch 6: Reports + Full Regression

### Task 6.1: Reports page

**Files:**
- Create: `src/app/[locale]/admin/reports/page.tsx`

Simple tables (no chart library):
1. Orders per month (last 12 months)
2. Top 10 customers by order count
3. Credit usage summary (sold / used / remaining)

All via Supabase aggregate queries.

### Task 6.2: Full E2E regression on production

**Step 1: Run ALL tests against production**

```bash
npx playwright test --project=chromium --config=playwright.prod.config.ts --reporter=list
```

Expected: ALL tests pass.

**Step 2: Manual verification checklist**

1. [ ] Login as Jess → "Admin" in nav → all 9 admin sections work (incl. Products)
2. [ ] Login as test user → "Dashboard" in nav → NO admin link
3. [ ] Not logged in → "Anmelden" + "Produkte" in nav
4. [ ] `/de/products` → shows Grabkreuzfoto (no login needed)
5. [ ] `/de/products/grabkreuzfoto` → size, material, photo upload, price
6. [ ] Click "Bestellen" without login → redirects to login → after login returns to product
7. [ ] Mobile: real device on `trauerpost.vercel.app` — login + admin + products all work

---

## Summary

| Batch | Tasks | Description | E2E Tests (prod) |
|-------|-------|-------------|-----------------|
| 1 | 1.1–1.3 | Jess user + translations + auth header | `admin-nav.spec.ts` (3) |
| 2 | 2.1 | Customer detail + credits | `admin-customers.spec.ts` (4) |
| 3 | 3.1–3.3 | Products DB + catalog + admin CRUD | `products.spec.ts` (5) + `admin-products.spec.ts` (2) |
| 4 | 4.1 | Promo codes | `admin-promo.spec.ts` (3) |
| 5 | 5.1–5.2 | Invoices + shipments | `admin-invoices.spec.ts` (2) + `admin-shipments.spec.ts` (2) |
| 6 | 6.1–6.2 | Reports + full regression | ALL tests on production |

**Total: 11 tasks across 6 batches. 21 new E2E tests. Every batch verified on Vercel production.**

**Review-plan fixes applied (v3):**
1. ✅ Product order API route added (`/api/orders/product`) — was missing entirely
2. ✅ Server-side price calculation — client shows estimate, server computes real price
3. ✅ Photo upload: 10MB limit, JPEG/PNG/WebP only, private Supabase Storage bucket with RLS
4. ✅ Bulk shipment update: single `PATCH /api/admin/orders/bulk-status` replaces per-order loop
