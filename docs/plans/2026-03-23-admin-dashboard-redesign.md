# Admin Dashboard Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the basic admin panel into a full-featured management dashboard with 8 sections: Dashboard, Orders, Customers, Templates/Assets, Promo Codes, Invoices, Open Shipments, and Reports.

**Architecture:** Server-side rendered pages with Supabase queries. Admin-only access via existing `is_admin()` RLS + layout auth check. Client components for interactive features (modals, filters, status updates). API routes for email triggers on status changes. All UI text via next-intl translations from the start.

**Tech Stack:** Next.js 16, Supabase (DB + Auth + RLS), Tailwind CSS, next-intl, Playwright E2E

---

## Database Changes (Migration 002)

New tables:
- `promo_codes` — discount codes with usage tracking
- `invoices` — issued invoice records with PDF URLs

Modified tables:
- `orders` — add `promo_code_id`, `invoice_id`, `shipment_notes`, `shipped_at`, `pickup_ready_at` columns + new status `ready_for_pickup`

Note: Open Shipments is a **filtered view** of the `orders` table, not a separate table.

## Status Map (admin filter → DB status)

| Admin Filter | DB Status | Description |
|---|---|---|
| New | `paid` | Paid, waiting to be processed |
| Printing | `in_production` | Currently being printed |
| Ready for Pickup | `ready_for_pickup` | Printed, customer needs to pick up |
| Shipped | `shipped` | Sent to customer |
| Completed | `completed` | Customer received |
| Cancelled | `cancelled` | Order cancelled |

---

## Batch 1: Database Schema + API Routes (foundation)

### Task 1.1: Create migration 002

**Files:**
- Create: `supabase/migrations/002_admin_features.sql`

**SQL:**
```sql
-- Promo codes
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  customer_id UUID REFERENCES customers(id),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices (with sequence for thread-safe numbering)
CREATE SEQUENCE invoice_number_seq;

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  invoice_number TEXT UNIQUE NOT NULL DEFAULT (
    'INV-' || to_char(now(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 5, '0')
  ),
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT NOT NULL CHECK (status IN ('draft', 'issued', 'paid', 'cancelled')) DEFAULT 'draft',
  pdf_url TEXT,
  issued_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add new status: ready_for_pickup
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('draft', 'pending_payment', 'paid', 'in_production', 'ready_for_pickup', 'shipped', 'completed', 'cancelled'));

-- Add columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_ready_at TIMESTAMPTZ;

-- RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to promo_codes"
  ON promo_codes FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to invoices"
  ON invoices FOR ALL USING (is_admin());
CREATE POLICY "Customers can view own invoices"
  ON invoices FOR SELECT USING (customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  ));
```

**Run:** Execute via Supabase Management API (token `sbp_...` in .env).

**Verify:** Query `SELECT count(*) FROM information_schema.tables WHERE table_name IN ('promo_codes', 'invoices')` returns 2.

### Task 1.2: Update TypeScript types

**Files:**
- Modify: `src/lib/supabase/types.ts`

**Changes:**

1. Add `'ready_for_pickup'` to `OrderStatus`:
```typescript
export type OrderStatus = "draft" | "pending_payment" | "paid" | "in_production" | "ready_for_pickup" | "shipped" | "completed" | "cancelled";
```

2. Add new fields to `Order` interface:
```typescript
// Add to Order interface:
promo_code_id: string | null;
invoice_id: string | null;
shipment_notes: string | null;
shipped_at: string | null;
pickup_ready_at: string | null;
```

3. Add new interfaces:
```typescript
export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  currency: string;
  max_uses: number | null;
  current_uses: number;
  customer_id: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Invoice {
  id: string;
  order_id: string;
  customer_id: string | null;
  invoice_number: string;
  amount_cents: number;
  currency: string;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  pdf_url: string | null;
  issued_at: string;
  created_at: string;
}
```

4. Add to Database type:
```typescript
promo_codes: { Row: PromoCode; Insert: PromoCodeInsert; Update: PromoCodeUpdate; };
invoices: { Row: Invoice; Insert: InvoiceInsert; Update: InvoiceUpdate; };
```

### Task 1.3: API route — order status update + email trigger

**Files:**
- Create: `src/app/api/admin/orders/[id]/status/route.ts`

**Behavior:**
- PATCH `{ status: "in_production" | "ready_for_pickup" | "shipped" | "completed" }`
- Validates: status is one of the allowed values
- Validates: order exists
- Updates order status in DB
- If `shipped` → set `shipped_at = now()`
- If `ready_for_pickup` → set `pickup_ready_at = now()`
- Sends email to customer (if email available):
  - `shipped` → "Ihre Karten wurden verschickt" / "Your cards have been shipped"
  - `ready_for_pickup` → "Ihre Karten sind zur Abholung bereit" / "Your cards are ready for pickup"
- **Error handling:**
  - Missing order → 404 `{ error: "Order not found" }`
  - Invalid status → 400 `{ error: "Invalid status" }`
  - DB error → 500 `{ error: "Failed to update order" }`
  - Email failure → update status anyway, return `{ success: true, emailSent: false, warning: "Status updated but email failed" }`
- Requires admin auth check (verify `is_admin()` via Supabase)

### Task 1.4: API route — add credits to customer

**Files:**
- Create: `src/app/api/admin/customers/[id]/credits/route.ts`

**Behavior:**
- POST `{ amount: number, description: string }`
- Validates: amount > 0, description not empty
- Validates: customer exists
- Updates `customers.credits_remaining += amount`
- Creates `credit_transactions` record with `balance_after`
- Returns `{ success: true, new_balance: number }`
- **Error handling:**
  - Missing customer → 404
  - Invalid amount (≤ 0) → 400
  - DB error → 500

---

## Batch 2: Admin Layout + Dashboard + Translations

### Task 2.1: Add admin translations (DE + EN)

**Files:**
- Modify: `src/messages/de.json` — add `admin` namespace
- Modify: `src/messages/en.json` — add `admin` namespace

**Add all admin UI strings from the start** — sidebar labels, KPI titles, button labels, filter names, table headers, empty states, confirmation messages. This prevents hardcoded English strings in Batches 3-8.

### Task 2.2: Redesign admin sidebar

**Files:**
- Modify: `src/app/[locale]/admin/layout.tsx`

**Changes:**
- 8 sidebar links with icons: Dashboard, Orders, Customers, Templates, Promo Codes, Invoices, Shipments, Reports
- Active link highlight (compare current pathname)
- Collapsible on mobile (hamburger button)
- Badge on Orders showing count of `status = 'paid'` (new orders)
- All labels via `useTranslations('admin')`

### Task 2.3: Redesign admin dashboard home

**Files:**
- Modify: `src/app/[locale]/admin/page.tsx`

**Changes:**
- 5 KPI cards:
  1. New Orders Today — `status = 'paid' AND created_at >= today`
  2. Pending Printing — `status = 'in_production'`
  3. Ready to Ship — `status IN ('ready_for_pickup', 'shipped')` not yet completed
  4. Revenue This Month — `SUM(price_cents) WHERE created_at >= first_of_month`
  5. Low Credit Alerts — regular customers with `credits_remaining < 5`
- Recent orders list (last 5)
- Quick action buttons (New order, View shipments)

---

## Batch 3: Orders Management

### Task 3.1: Orders list with filters and actions

**Files:**
- Modify: `src/app/[locale]/admin/orders/page.tsx`
- Create: `src/components/admin/OrderStatusBadge.tsx`
- Create: `src/components/admin/OrderActions.tsx`

**Changes:**
- Status filter tabs using the Status Map above: All | New | Printing | Ready | Shipped | Completed | Cancelled
- Search by customer name/email
- Each row has action dropdown:
  - If `paid` → "Start Printing" (→ `in_production`)
  - If `in_production` → "Mark as Shipped" / "Ready for Pickup"
  - If `ready_for_pickup` → "Mark as Picked Up" (→ `completed`)
  - If `shipped` → "Mark as Delivered" (→ `completed`)
- Status change calls `PATCH /api/admin/orders/[id]/status`
- Shows confirmation toast after update
- Click row → opens detail modal

### Task 3.2: Order detail modal

**Files:**
- Create: `src/components/admin/OrderDetailModal.tsx`

**Shows:**
- Card preview (back image from `card_data`, photo, text)
- Customer info (name, email, company)
- Order timeline (created → paid → in_production → shipped/ready → completed)
- Action buttons for status updates
- Link to invoice (if exists)
- Shipment notes field (editable)

### Task 3.3: E2E test — order status flow

**Files:**
- Create: `e2e/admin-orders.spec.ts`

**Tests:**
- Admin can see orders list
- Admin can filter by status
- Admin can change order status (positive test)
- Invalid status change shows error (negative test)
- Status change shows confirmation toast

---

## Batch 4: Customer Management

### Task 4.1: Customer list with credit management

**Files:**
- Modify: `src/app/[locale]/admin/customers/page.tsx`
- Create: `src/components/admin/AddCreditsModal.tsx`

**Changes:**
- Filter tabs: All | Regular | One-time
- Search by name/email/company
- "Add Credits" button per customer → modal with amount input + description textarea
- Modal calls `POST /api/admin/customers/[id]/credits`
- Credits column: green if ≥ 10, orange if 5-9, red if < 5
- Click customer name → navigates to detail page

### Task 4.2: Customer detail page

**Files:**
- Create: `src/app/[locale]/admin/customers/[id]/page.tsx`

**Shows:**
- Customer info card (name, email, company, phone, type, role)
- Credits section: current balance + "Add Credits" button
- Credit transaction history table (date, amount, balance_after, description)
- Order history table for this customer only
- Back button to customer list

### Task 4.3: E2E test — customer + credits

**Files:**
- Create: `e2e/admin-customers.spec.ts`

**Tests:**
- Admin sees customer list
- Admin can search customers
- Admin can add credits (positive test)
- Adding 0 or negative credits fails (negative test)
- Credit transaction appears in history
- Customer detail page shows correct data

---

## Batch 5: Promo Codes

### Task 5.1: Promo codes list + create

**Files:**
- Create: `src/app/[locale]/admin/promo-codes/page.tsx`
- Create: `src/components/admin/CreatePromoModal.tsx`

**Features:**
- Table: Code, Type (% / fixed), Value, Uses (current/max), Expires, Active, Actions
- "Create Code" button → modal:
  - Code (text, auto-generate option)
  - Type: percent / fixed (radio)
  - Value: number
  - Max uses: number (optional)
  - Expiry date: date picker (optional)
  - Assign to customer: dropdown (optional)
- Toggle active/inactive via switch
- Delete with confirmation

### Task 5.2: E2E test — promo codes

**Files:**
- Create: `e2e/admin-promo.spec.ts`

**Tests:**
- Admin can create promo code (positive)
- Duplicate code rejected (negative)
- Admin can deactivate promo code
- Expired codes show as inactive

---

## Batch 6: Invoices

### Task 6.1: Invoices list

**Files:**
- Create: `src/app/[locale]/admin/invoices/page.tsx`

**Features:**
- Table: Invoice #, Date, Customer, Amount (EUR), Status, Actions
- Filter by: status (draft/issued/paid), date range
- Search by customer name or invoice number
- "View PDF" button (opens pdf_url in new tab)
- "Resend" button → calls `/api/send-email` with invoice data
- Invoice numbers auto-generated via `invoice_number_seq`

### Task 6.2: E2E test — invoices

**Files:**
- Create: `e2e/admin-invoices.spec.ts`

**Tests:**
- Admin can see invoices list
- Admin can filter by status
- Resend button triggers action (mock email)

---

## Batch 7: Open Shipments

### Task 7.1: Shipments tracker

**Files:**
- Create: `src/app/[locale]/admin/shipments/page.tsx`

**Features:**
- Filtered view of orders: `status IN ('paid', 'in_production', 'ready_for_pickup', 'shipped')`
- Columns: Order date, Customer, Card type, Qty, Current Status, Days since order
- "Days since order" = `now() - created_at`, red highlight if > 3 days
- Checkbox per row for bulk selection
- Bulk action: "Mark all as Shipped" → calls status API for each selected order
- **Rate limiting:** max 10 emails per batch, queue the rest with 1-second delay
- Status change triggers email per customer

### Task 7.2: E2E test — shipments

**Files:**
- Create: `e2e/admin-shipments.spec.ts`

**Tests:**
- Shows only open orders (not completed/cancelled)
- Days since order calculated correctly
- Overdue orders highlighted in red
- Bulk status change works

---

## Batch 8: Reports + Final Polish

### Task 8.1: Reports page

**Files:**
- Create: `src/app/[locale]/admin/reports/page.tsx`

**Features (simple tables, no chart library):**
- Orders per month (last 12 months): month, count, total revenue
- Top 10 customers by order count: name, company, order count, total spent
- Credit usage summary: total sold, total used, total remaining
- All queries use Supabase aggregate functions (count, sum)

### Task 8.2: Full E2E regression

**Files:**
- Update: existing `e2e/login.spec.ts` — verify admin access with new sidebar (8 links instead of 4)

**Run:** `npx playwright test --workers=1` — ALL tests must pass (existing 48 + new admin tests).

### Task 8.3: Commit + deploy

**Run:**
```bash
git add -A
git commit -m "feat: complete admin dashboard redesign — 8 sections, 22 tasks"
git push
```

---

## Summary

| Batch | Tasks | Description |
|-------|-------|-------------|
| 1 | 1.1–1.4 | DB migration + API routes + types |
| 2 | 2.1–2.3 | Translations + layout + dashboard KPIs |
| 3 | 3.1–3.3 | Orders management + status flow |
| 4 | 4.1–4.3 | Customer management + credits |
| 5 | 5.1–5.2 | Promo codes CRUD |
| 6 | 6.1–6.2 | Invoices list + resend |
| 7 | 7.1–7.2 | Open shipments tracker + bulk actions |
| 8 | 8.1–8.3 | Reports + regression + deploy |

**Total: 22 tasks across 8 batches**

## QA Fixes Applied
- ~~`shipments` table~~ → removed, Open Shipments is a filtered view of `orders`
- ~~`next_invoice_number()` COUNT-based~~ → replaced with `invoice_number_seq` sequence
- ~~`ready_for_pickup` missing~~ → added to DB constraint + OrderStatus type
- ~~No error handling in API routes~~ → added full error handling spec per route
- ~~Ambiguous filter names~~ → added explicit Status Map table
- ~~Translations at end~~ → moved to Batch 2 Task 2.1 (before any UI)
- ~~"~20 tasks"~~ → corrected to 22 tasks
- Added rate limiting for bulk email (max 10/batch)
- Added negative tests for every validator (credits, status, promo codes)
