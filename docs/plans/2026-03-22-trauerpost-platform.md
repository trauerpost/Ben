# Trauerpost Self-Service Platform — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a self-service memorial card builder platform where customers can design, preview, pay for, and order printed memorial cards (Sterbebilder, Trauer- & Dankkarten).

**Architecture:** Next.js App Router with Supabase (database, auth, storage). Canvas-based card editor (Fabric.js) for full customization. Two customer types: one-time (pay per order) and regular (pre-paid credit packages). Admin panel for managing regular customers. Multilingual (German default + English). Storage: Supabase Storage for now, migrate to Cloudflare R2 when scaling to thousands of images.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, Supabase, next-intl, Fabric.js, jspdf + svg2pdf.js (PDF generation), Stripe (wired later)

**Supabase:** Project already exists. Credentials in `.env` (DO NOT commit). URL from `.env`.

**Total tasks:** ~30 across 9 batches.

---

## Batch 1: Project Foundation

### Task 1.1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`

**Step 1: Initialize project**

Run:
```bash
cd C:/Users/fires/OneDrive/Git/BENJEMIN
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
```
Expected: Project scaffolded with all config files. Note: Next.js 15 uses **Tailwind v4** which uses CSS-based config (no `tailwind.config.ts`).

**Step 2: Verify it runs**

Run:
```bash
npm run dev
```
Expected: Dev server starts at `http://localhost:3000`, default Next.js page loads.

**Step 3: Clean up defaults**

Replace default `src/app/page.tsx` with minimal placeholder:
```tsx
export default function HomePage(): JSX.Element {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <h1 className="text-4xl font-light text-gray-800">Trauerpost</h1>
    </main>
  );
}
```

Keep `src/app/globals.css` with the Tailwind v4 import (created by create-next-app):
```css
@import "tailwindcss";
```

**Step 4: Create `.env.local` from existing `.env` credentials**

Create `.env.local` with Next.js naming convention (copy values from existing `.env`):
```env
NEXT_PUBLIC_SUPABASE_URL=<supabase_url from .env>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase_key from .env>
```

Note: `SUPABASE_SERVICE_ROLE_KEY` will be needed later for admin operations — get it from Supabase Dashboard → Settings → API when needed.

Verify `.env.local` is in `.gitignore`.

**Step 5: Commit**

```bash
git add .
git commit -m "feat: initialize Next.js project with TypeScript + Tailwind"
git push -u origin main
```

---

### Task 1.2: Configure Tailwind v4 Brand Theme

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Add brand colors and fonts via CSS `@theme`**

Tailwind v4 uses CSS-based configuration. Add to `src/app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-brand-primary: #6B9B7D;
  --color-brand-primary-hover: #5A8A6C;
  --color-brand-primary-light: #E8F2EC;
  --color-brand-dark: #1A1A1A;
  --color-brand-gray: #6B7280;
  --color-brand-light-gray: #F5F5F5;
  --color-brand-border: #E5E7EB;
  --font-sans: "Inter", system-ui, sans-serif;
}
```

These become usable as `bg-brand-primary`, `text-brand-dark`, etc.

**Step 2: Verify colors render**

Run: `npm run dev` — create a temporary test in the page with `text-brand-primary` class to confirm green text renders. Then revert.

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: configure brand colors and typography (Tailwind v4)"
```

---

### Task 1.3: Set Up Folder Structure

**Files:**
- Create directories and placeholder files

**Step 1: Create directory structure**

```bash
mkdir -p src/components/layout
mkdir -p src/components/ui
mkdir -p src/components/editor
mkdir -p src/components/cards
mkdir -p src/lib
mkdir -p src/i18n
mkdir -p src/messages
mkdir -p src/app/\[locale\]
mkdir -p src/app/api
mkdir -p public/images/templates
mkdir -p public/images/assets
```

Directories explained:
- `components/layout` — Header, Footer, LanguageSwitcher
- `components/ui` — Reusable UI (Button, Card, Input, Modal)
- `components/editor` — Card builder/customizer components
- `components/cards` — Card preview, gallery, template browser
- `lib` — Supabase client, utilities, constants
- `i18n` — Internationalization config
- `messages` — Translation JSON files (de.json, en.json)
- `app/[locale]` — Locale-prefixed routes
- `app/api` — API routes (payments, PDF generation, email)
- `public/images` — Static assets, card templates

**Step 2: Commit**

```bash
git add .
git commit -m "feat: set up project folder structure"
```

---

### Task 1.4: Set Up i18n (German Default + English)

**Files:**
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/request.ts`
- Create: `src/messages/de.json`
- Create: `src/messages/en.json`
- Create: `src/middleware.ts`
- Modify: `next.config.ts`
- Install: `next-intl`

**Step 1: Install next-intl**

```bash
npm install next-intl
```

**Step 2: Create request config**

`src/i18n/request.ts`:
```ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as "de" | "en")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

**Step 4: Create routing config**

`src/i18n/routing.ts`:
```ts
import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["de", "en"],
  defaultLocale: "de",
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

**Step 5: Create translation files**

`src/messages/de.json`:
```json
{
  "common": {
    "siteName": "Trauerpost",
    "tagline": "Würdevolle Erinnerungskarten — individuell gestaltet",
    "nav": {
      "home": "Startseite",
      "templates": "Vorlagen",
      "builder": "Gestalten",
      "pricing": "Preise",
      "contact": "Kontakt",
      "login": "Anmelden"
    },
    "footer": {
      "about": "Über uns",
      "privacy": "Datenschutz",
      "terms": "AGB",
      "imprint": "Impressum",
      "copyright": "© {year} Trauerpost. Alle Rechte vorbehalten."
    }
  },
  "home": {
    "hero": {
      "headline": "Erinnerungen bewahren",
      "subheadline": "Gestalten Sie persönliche Trauer- und Erinnerungskarten — einfach, würdevoll und in wenigen Minuten.",
      "cta": "Jetzt gestalten"
    }
  }
}
```

`src/messages/en.json`:
```json
{
  "common": {
    "siteName": "Trauerpost",
    "tagline": "Dignified memorial cards — individually designed",
    "nav": {
      "home": "Home",
      "templates": "Templates",
      "builder": "Design",
      "pricing": "Pricing",
      "contact": "Contact",
      "login": "Sign in"
    },
    "footer": {
      "about": "About us",
      "privacy": "Privacy",
      "terms": "Terms",
      "imprint": "Imprint",
      "copyright": "© {year} Trauerpost. All rights reserved."
    }
  },
  "home": {
    "hero": {
      "headline": "Preserving memories",
      "subheadline": "Design personal memorial and mourning cards — simple, dignified, and in just a few minutes.",
      "cta": "Start designing"
    }
  }
}
```

**Step 6: Create middleware for locale detection**

`src/middleware.ts`:
```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

**Step 7: Update next.config.ts**

```ts
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https" as const,
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
```

**Step 8: Restructure app directory for locale routing**

Move `src/app/page.tsx` and `src/app/layout.tsx` to locale-based routing:

`src/app/[locale]/layout.tsx`:
```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps): Promise<JSX.Element> {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "de" | "en")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} dir="ltr">
      <body className={`${inter.className} bg-white text-brand-dark antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

`src/app/[locale]/page.tsx`:
```tsx
import { useTranslations } from "next-intl";

export default function HomePage(): JSX.Element {
  const t = useTranslations("home");

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-light text-brand-dark mb-4">
          {t("hero.headline")}
        </h1>
        <p className="text-lg text-brand-gray max-w-xl mx-auto mb-8">
          {t("hero.subheadline")}
        </p>
        <a
          href="#"
          className="inline-block bg-brand-primary text-white px-8 py-3 rounded-lg text-lg hover:bg-brand-primary-hover transition-colors"
        >
          {t("hero.cta")}
        </a>
      </div>
    </main>
  );
}
```

Keep `src/app/layout.tsx` as a minimal root layout (required by Next.js):
```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return children as JSX.Element;
}
```

**Step 9: Verify i18n works**

Run: `npm run dev`
- Visit `http://localhost:3000` → should redirect to `/de`
- Visit `http://localhost:3000/de` → German text
- Visit `http://localhost:3000/en` → English text

**Step 10: Commit**

```bash
git add .
git commit -m "feat: set up i18n with next-intl (German default + English)"
```

---

### Task 1.5: Build Header Component with Language Switcher

**Files:**
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/LanguageSwitcher.tsx`
- Modify: `src/app/[locale]/layout.tsx`

**Step 1: Create LanguageSwitcher**

`src/components/layout/LanguageSwitcher.tsx`:
```tsx
"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";

export default function LanguageSwitcher(): JSX.Element {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: "de" | "en"): void {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => switchLocale("de")}
        className={`px-2 py-1 rounded transition-colors ${
          locale === "de"
            ? "bg-brand-primary text-white"
            : "text-brand-gray hover:text-brand-dark"
        }`}
      >
        DE
      </button>
      <button
        onClick={() => switchLocale("en")}
        className={`px-2 py-1 rounded transition-colors ${
          locale === "en"
            ? "bg-brand-primary text-white"
            : "text-brand-gray hover:text-brand-dark"
        }`}
      >
        EN
      </button>
    </div>
  );
}
```

**Step 2: Create Header**

`src/components/layout/Header.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header(): JSX.Element {
  const t = useTranslations("common");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: t("nav.templates"), href: "/templates" },
    { label: t("nav.builder"), href: "/builder" },
    { label: t("nav.pricing"), href: "/pricing" },
    { label: t("nav.contact"), href: "/contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-semibold text-brand-dark">
          {t("siteName")}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-brand-gray hover:text-brand-dark transition-colors text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side: Language + Login */}
        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="text-sm bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-primary-hover transition-colors"
          >
            {t("nav.login")}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-brand-border px-6 py-4">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-brand-gray hover:text-brand-dark transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="text-brand-primary font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("nav.login")}
            </Link>
            <LanguageSwitcher />
          </nav>
        </div>
      )}
    </header>
  );
}
```

**Step 3: Add Header to layout**

Update `src/app/[locale]/layout.tsx` — add `<Header />` inside the `<body>` above `{children}`:
```tsx
import Header from "@/components/layout/Header";
// ... inside body:
<Header />
<main className="pt-16">{children}</main>
```

**Step 4: Verify**

Run: `npm run dev`
- Header visible with Trauerpost logo, nav links, language switcher
- Click DE/EN — language switches, text updates
- Resize to mobile — hamburger menu appears

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add Header with navigation and language switcher"
```

---

### Task 1.6: Build Footer Component

**Files:**
- Create: `src/components/layout/Footer.tsx`
- Modify: `src/app/[locale]/layout.tsx`

**Step 1: Create Footer**

`src/components/layout/Footer.tsx`:
```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function Footer(): JSX.Element {
  const t = useTranslations("common");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-light-gray border-t border-brand-border">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Brand */}
          <div>
            <p className="text-xl font-semibold text-brand-dark mb-2">
              {t("siteName")}
            </p>
            <p className="text-sm text-brand-gray max-w-xs">
              {t("tagline")}
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-8 text-sm">
            <Link href="/about" className="text-brand-gray hover:text-brand-dark transition-colors">
              {t("footer.about")}
            </Link>
            <Link href="/privacy" className="text-brand-gray hover:text-brand-dark transition-colors">
              {t("footer.privacy")}
            </Link>
            <Link href="/terms" className="text-brand-gray hover:text-brand-dark transition-colors">
              {t("footer.terms")}
            </Link>
            <Link href="/imprint" className="text-brand-gray hover:text-brand-dark transition-colors">
              {t("footer.imprint")}
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-brand-border text-center text-sm text-brand-gray">
          {t("footer.copyright", { year: currentYear })}
        </div>
      </div>
    </footer>
  );
}
```

**Step 2: Add Footer to layout**

Update `src/app/[locale]/layout.tsx` — add `<Footer />` after `{children}`:
```tsx
import Footer from "@/components/layout/Footer";
// ... inside body:
<Header />
<main className="pt-16 min-h-screen">{children}</main>
<Footer />
```

**Step 3: Verify**

Run: `npm run dev`
- Footer visible at bottom with brand name, tagline, links, copyright
- Switches language when DE/EN toggled

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add Footer component"
git push origin main
```

---

## Batch 2: Supabase Integration + Database Schema

### Task 2.1: Set Up Supabase Client

**Files:**
- Create: `src/lib/supabase/client.ts` (browser client)
- Create: `src/lib/supabase/server.ts` (server client)
- Install: `@supabase/supabase-js`, `@supabase/ssr`

**Prerequisites:** `.env.local` already created in Task 1.1 with Supabase credentials.

**Step 1: Install Supabase packages**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

**Step 2: Create browser client**

`src/lib/supabase/client.ts`:
```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Step 4: Create server client**

`src/lib/supabase/server.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — can't set cookies
          }
        },
      },
    }
  );
}
```

**Step 5: Commit**

```bash
git add src/lib/supabase/
git commit -m "feat: set up Supabase client (browser + server)"
```

---

### Task 2.2: Create Database Schema (Supabase Migration)

**Files:**
- Migration SQL via Supabase MCP

**Step 1: Design and apply schema**

Use the `mcp__supabase__apply_migration` tool to create these tables:

```sql
-- Customers table (regular customers with accounts)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  customer_type TEXT NOT NULL CHECK (customer_type IN ('regular', 'one_time')) DEFAULT 'one_time',
  role TEXT NOT NULL CHECK (role IN ('customer', 'admin')) DEFAULT 'customer',
  credits_remaining INTEGER DEFAULT 0,
  auth_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Credit packages (pre-paid bundles)
CREATE TABLE credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Credit transactions (purchase/usage log)
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) NOT NULL,
  amount INTEGER NOT NULL, -- positive = purchase, negative = usage
  balance_after INTEGER NOT NULL,
  description TEXT,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Card templates (design templates with tags)
CREATE TABLE card_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('sterbebild', 'trauerkarte', 'dankkarte')),
  preview_url TEXT,
  template_data JSONB NOT NULL, -- canvas JSON (Fabric.js state)
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Asset library (images, borders, backgrounds, symbols)
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('background', 'border', 'symbol', 'icon', 'ornament', 'photo_frame')),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  guest_email TEXT, -- for one-time customers without account
  guest_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_payment', 'paid', 'in_production', 'shipped', 'completed', 'cancelled')) DEFAULT 'draft',
  card_type TEXT NOT NULL CHECK (card_type IN ('sterbebild', 'trauerkarte', 'dankkarte')),
  card_data JSONB DEFAULT '{}'::jsonb, -- canvas state (empty for new drafts, populated after design)
  pdf_url TEXT, -- generated PDF
  quantity INTEGER NOT NULL DEFAULT 1,
  price_cents INTEGER,
  currency TEXT DEFAULT 'EUR',
  payment_method TEXT CHECK (payment_method IN ('stripe', 'credit', 'invoice')),
  payment_id TEXT, -- Stripe payment ID
  invoice_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pricing table
CREATE TABLE pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_type TEXT NOT NULL CHECK (card_type IN ('sterbebild', 'trauerkarte', 'dankkarte')),
  quantity_min INTEGER DEFAULT 1,
  quantity_max INTEGER,
  price_per_unit_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM customers
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Storage buckets (create via Supabase Dashboard or API):
-- 'templates' — card template previews
-- 'assets' — backgrounds, borders, symbols
-- 'uploads' — customer photo uploads (max 10MB)
-- 'orders' — generated PDFs

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;

-- Public read access to templates and assets (everyone can browse)
CREATE POLICY "Templates are viewable by everyone"
  ON card_templates FOR SELECT USING (is_active = true);

CREATE POLICY "Assets are viewable by everyone"
  ON assets FOR SELECT USING (is_active = true);

-- Credit packages visible to everyone
CREATE POLICY "Credit packages are viewable by everyone"
  ON credit_packages FOR SELECT USING (is_active = true);

-- Customers can see their own data
CREATE POLICY "Customers can view own data"
  ON customers FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Customers can update own data"
  ON customers FOR UPDATE USING (auth_user_id = auth.uid());

-- Orders: customers see their own orders
CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT USING (customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Customers can create orders"
  ON orders FOR INSERT WITH CHECK (true);

-- Credit transactions: customers see their own
CREATE POLICY "Customers can view own credit transactions"
  ON credit_transactions FOR SELECT USING (customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  ));

-- Pricing visible to everyone
CREATE POLICY "Pricing is viewable by everyone"
  ON pricing FOR SELECT USING (is_active = true);

-- Admin: full access to all tables
CREATE POLICY "Admins have full access to customers"
  ON customers FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to orders"
  ON orders FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to templates"
  ON card_templates FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to assets"
  ON assets FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to credit_transactions"
  ON credit_transactions FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to pricing"
  ON pricing FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to credit_packages"
  ON credit_packages FOR ALL USING (is_admin());

-- Credit deduction function (atomic — prevents race conditions)
CREATE OR REPLACE FUNCTION deduct_credit(
  p_customer_id UUID,
  p_order_id UUID,
  p_description TEXT DEFAULT 'Order credit usage'
)
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  -- Lock the customer row to prevent concurrent deductions
  SELECT credits_remaining INTO v_balance
  FROM customers
  WHERE id = p_customer_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  IF v_balance < 1 THEN
    RAISE EXCEPTION 'Insufficient credits (balance: %)', v_balance;
  END IF;

  -- Deduct
  UPDATE customers SET credits_remaining = credits_remaining - 1, updated_at = now()
  WHERE id = p_customer_id;

  -- Log transaction
  INSERT INTO credit_transactions (customer_id, amount, balance_after, description, order_id)
  VALUES (p_customer_id, -1, v_balance - 1, p_description, p_order_id);

  RETURN v_balance - 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Step 2: Verify tables created**

Use `mcp__supabase__list_tables` to confirm all 7 tables exist (customers, credit_packages, credit_transactions, card_templates, assets, orders, pricing).

**Step 3: Commit migration reference**

```bash
git add .
git commit -m "feat: create database schema — customers, orders, templates, assets, credits"
```

---

### Task 2.3: Generate TypeScript Types from Supabase

**Files:**
- Create: `src/lib/supabase/types.ts`

**Step 1: Generate types**

Use `mcp__supabase__generate_typescript_types` to generate types from the schema.

**Step 2: Save to `src/lib/supabase/types.ts`**

**Step 3: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "feat: add generated Supabase TypeScript types"
```

---

### Task 2.4: Tests — Supabase Connection + Queries

**Files:**
- Create: `src/lib/supabase/__tests__/client.test.ts`
- Install: `vitest`, `@testing-library/react`

**Step 1: Install test dependencies**

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom
```

**Step 2: Write tests**

- Test: Supabase client creates successfully with env vars
- Test: Can query `card_templates` table (returns array)
- Test: Can query `assets` table (returns array)
- Test: Can query `pricing` table (returns array)
- **Negative test:** Invalid Supabase URL throws error
- **Negative test:** `deduct_credit()` with 0 balance raises exception

**Step 3: Run tests**

```bash
npx vitest run
```

**Step 4: Commit**

```bash
git add .
git commit -m "test: add Supabase connection and query tests"
```

---

## Batch 3: Homepage + Template Gallery

### Task 3.1: Build Hero Section

**Files:**
- Create: `src/components/home/HeroSection.tsx`
- Modify: `src/app/[locale]/page.tsx`

Build a clean, minimal hero with:
- Headline + subheadline (from translations)
- CTA button ("Start designing")
- Optional: subtle background image or gradient
- Mobile responsive

### Task 3.2: Build Template Gallery Page

**Files:**
- Create: `src/app/[locale]/templates/page.tsx`
- Create: `src/components/cards/TemplateGrid.tsx`
- Create: `src/components/cards/TemplateCard.tsx`
- Create: `src/components/ui/TagFilter.tsx`
- Add translations for templates page

Build a browsable gallery:
- Grid of card templates fetched from Supabase `card_templates`
- Filter by category (Sterbebild, Trauerkarte, Dankkarte)
- Filter by tags
- Click a template → navigates to `/builder?template={template.id}` (URL param carries the template ID)
- Mobile: 1 column. Tablet: 2 columns. Desktop: 3-4 columns.

**Data flow contract:** `TemplateCard` links to `/builder?template=<uuid>`. Builder page reads `useSearchParams().get('template')`, fetches template from Supabase `card_templates`, loads canvas JSON into editor.

### Task 3.3: Build Asset Browser Component

**Files:**
- Create: `src/components/editor/AssetBrowser.tsx`
- Create: `src/components/editor/AssetCard.tsx`

Build a browsable asset library panel (will be used inside the card editor):
- Grid of assets fetched from Supabase `assets`
- Filter by category (background, border, symbol, etc.)
- Search by tag
- Click to select/add to canvas

---

## Batch 4: Card Builder/Editor

### Task 4.1: Set Up Canvas Library

**Files:**
- Install: `fabric`
- Create: `src/components/editor/CardCanvas.tsx`

Initialize the canvas component:
- Fixed card dimensions (standard memorial card size)
- Background layer
- Text layer
- Image layer
- Grid/snap guides

### Task 4.2: Build Card Editor Page

**Files:**
- Create: `src/app/[locale]/builder/page.tsx`
- Create: `src/components/editor/EditorToolbar.tsx`
- Create: `src/components/editor/EditorSidebar.tsx`
- Create: `src/components/editor/TextEditor.tsx`
- Create: `src/components/editor/ImageUploader.tsx`

Full editor page with:
- Canvas in center
- Sidebar with: templates, assets, text options, upload
- Toolbar: undo, redo, zoom, font, color, size
- Mobile: sidebar collapses to bottom panel
- Live preview of the card as you edit

### Task 4.3: Template Loading + Save State

**Files:**
- Create: `src/lib/editor/canvas-utils.ts`
- Create: `src/lib/editor/template-loader.ts`

- Load a template from Supabase into the canvas
- Save current canvas state as JSON
- Auto-save to localStorage (draft recovery)

**Data flow contract (Editor → Order):** When user clicks "Proceed to order", save canvas JSON to Supabase `orders` table as a new row (status='draft', card_data=canvas JSON). Navigate to `/order?id={order.id}`. Order page reads `useSearchParams().get('id')`, fetches order from Supabase, displays summary.

---

### Task 4.4: Tests — Editor Save/Load

**Files:**
- Create: `src/lib/editor/__tests__/canvas-utils.test.ts`

- Test: Save canvas state to JSON — output is valid JSON
- Test: Load canvas JSON into Fabric.js — canvas has expected objects
- Test: Auto-save writes to localStorage
- Test: Load from localStorage recovers draft
- **Negative test:** Load corrupted JSON — handles gracefully, doesn't crash

```bash
npx vitest run
git add . && git commit -m "test: add editor save/load tests"
```

---

## Batch 5: PDF Generation + Preview

### Task 5.1: PDF Generation API

**Files:**
- Create: `src/app/api/generate-pdf/route.ts`
- Install: `jspdf`, `svg2pdf.js`

API route that:
- Receives canvas JSON state
- Loads into Fabric.js → exports as SVG via `canvas.toSVG()`
- Converts SVG to high-resolution PDF via `jspdf` + `svg2pdf.js`
- Uploads PDF to Supabase Storage bucket `orders`
- Returns PDF URL

### Task 5.2: Live Preview Component

**Files:**
- Create: `src/components/editor/CardPreview.tsx`

- Shows exactly how the final PDF will look
- Toggle between front/back (if applicable)
- Zoom in/out
- "Download preview" button

---

## Batch 6: Authentication + Customer Accounts

### Task 6.1: Supabase Auth Setup

**Files:**
- Create: `src/app/[locale]/login/page.tsx`
- Create: `src/app/[locale]/signup/page.tsx`
- Create: `src/components/auth/LoginForm.tsx`
- Create: `src/components/auth/SignupForm.tsx`
- Create: `src/lib/supabase/auth.ts`

- Email/password login for regular customers
- Auth state management
- Protected routes (customer dashboard)
- Redirect after login

### Task 6.2: Customer Dashboard

**Files:**
- Create: `src/app/[locale]/dashboard/page.tsx`
- Create: `src/components/dashboard/OrderHistory.tsx`
- Create: `src/components/dashboard/CreditBalance.tsx`

For regular (logged-in) customers:
- View remaining credits
- View order history
- Re-order from past designs
- Account settings

---

## Batch 7: Order Flow + Payment Infrastructure

### Task 7.1: Order Summary Page

**Files:**
- Create: `src/app/[locale]/order/page.tsx`
- Create: `src/components/order/OrderSummary.tsx`
- Create: `src/components/order/PricingCalculator.tsx`

After finishing card design:
- Show order summary (card preview, quantity, price)
- For regular customers: show credit deduction
- For one-time customers: show payment options
- Collect delivery details

### Task 7.2: Payment Infrastructure (Stripe-ready)

**Files:**
- Create: `src/app/api/checkout/route.ts`
- Create: `src/lib/payments/stripe.ts` (placeholder)

- API route for creating payment sessions
- Stripe integration placeholder (interface ready, wired later)
- Credit deduction logic for regular customers
- Order status updates

### Task 7.3: Email Infrastructure (ready to wire)

**Files:**
- Create: `src/app/api/send-email/route.ts`
- Create: `src/lib/email/templates.ts`

- API route for sending order confirmation
- Email template: PDF attachment + invoice + order details
- Placeholder transport (console.log for now, Resend/SendGrid later)

---

### Task 7.4: Tests — Credit Deduction + Order Flow

**Files:**
- Create: `src/lib/payments/__tests__/credits.test.ts`

- Test: Regular customer with credits — deduct succeeds, balance decreases
- Test: One-time customer — no credit deduction, payment required
- **Negative test:** Regular customer with 0 credits — deduction fails with clear error
- **Negative test:** Deduct from non-existent customer — fails gracefully
- Test: Order status transitions (draft → pending_payment → paid)
- **Negative test:** Invalid status transition (draft → shipped) — rejected

```bash
npx vitest run
git add . && git commit -m "test: add credit deduction and order flow tests"
```

---

## Batch 8: Admin Panel

### Task 8.1: Admin Authentication + Layout

**Files:**
- Create: `src/app/[locale]/admin/layout.tsx`
- Create: `src/app/[locale]/admin/page.tsx`

- Admin-only layout with sidebar navigation
- Role-based access (check Supabase user metadata)
- Dashboard with key metrics (orders today, revenue, active customers)

### Task 8.2: Customer Management

**Files:**
- Create: `src/app/[locale]/admin/customers/page.tsx`
- Create: `src/components/admin/CustomerTable.tsx`
- Create: `src/components/admin/CustomerForm.tsx`
- Create: `src/components/admin/CreditManager.tsx`

- List all customers (search, filter by type)
- Create new regular customer
- Assign credit packages
- View customer order history
- Edit customer details

### Task 8.3: Template + Asset Management

**Files:**
- Create: `src/app/[locale]/admin/templates/page.tsx`
- Create: `src/app/[locale]/admin/assets/page.tsx`

- Upload/manage card templates
- Upload/manage assets with tags
- Activate/deactivate items
- Reorder display sequence

### Task 8.4: Order Management

**Files:**
- Create: `src/app/[locale]/admin/orders/page.tsx`
- Create: `src/components/admin/OrderTable.tsx`

- List all orders with status filters
- Update order status (paid → in_production → shipped → completed)
- View order details + card preview
- Download order PDF

---

## Batch 9: Polish + Deploy

### Task 9.1: Mobile Responsiveness Audit

- Test every page on mobile viewport (375px)
- Fix any overflow, spacing, or usability issues
- Ensure card editor works on tablet (mobile may need simplified view)

### Task 9.2: SEO + Meta Tags

**Files:**
- Modify: `src/app/[locale]/layout.tsx`
- Create: `src/app/sitemap.ts`

- Page titles and descriptions (per locale)
- Open Graph tags
- Sitemap generation

### Task 9.3: Deploy to Vercel

- Create Vercel account + connect GitHub repo
- Add environment variables (Supabase URL, keys)
- Deploy
- Verify live site works
- Connect `trauerpost.com` domain (if ready)

### Task 9.4: Final Verification

Run through the complete user journey:
1. Visit site (German) → switch to English → switch back
2. Browse templates → filter by category/tag
3. Select template → open builder → customize card
4. Preview PDF → proceed to order
5. Login as regular customer → verify credit deduction
6. Admin: create customer, assign credits, manage templates
