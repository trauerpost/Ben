# Card Creation Experience — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the card creation wizard so a funeral director can create a memorial/funeral/thank-you card, preview it, generate a print-ready PDF, save the order, and download or send the PDF to the print house. Simplicity is the top priority.

**Client direction:** Focus on the card generator experience first. Shop/products/payment come later. Process and functionality matter more than design polish.

**Tech Stack:** Next.js 16, Supabase, Tailwind CSS v4, jsPDF + svg2pdf.js, next-intl, Resend (email)

**Plan QA fixes applied:**
- C1: Internal CardType uses DB values (`sterbebild`/`trauerkarte`/`dankkarte`), NOT `erinnerungsbild`/`dankeskarte`. Friendly names in UI only.
- H1: Removed `folded` format from sterbebild — single card only per client spec.
- H2: `doc.svg()` expects SVGElement, not string — added DOMParser step.
- H3: Resend env var is `resend_Key` (not `RESEND_API_KEY`).
- M1: StepIndicator labels converted from hardcoded English to `useTranslations`.
- M2: Summary table updated to include Task 5.5 (email).

**Review-plan fixes applied:**
- R1: PDF generation moved to SERVER-SIDE (API route) to avoid CORS with Unsplash images.
- R2: Resend sender domain — use `onboarding@resend.dev` for MVP, verify `trauerpost.com` later.
- R3: Login required before ordering — no guest orders (simpler RLS, more secure).
- R4: Error handling added to PDF generation + email sending.
- R5: localStorage draft versioning to prevent crashes after state schema changes.

---

## Card Types & Dimensions (from client)

| Type | German | Dimensions | Format |
|------|--------|-----------|--------|
| Memorial card | Erinnerungsbild | 140 × 105 mm | Single card (front + back) |
| Funeral card (folded) | Trauerkarte (gefaltet) | 370 × 115 mm → folds to 185 × 115 mm | 4 panels |
| Funeral card (single) | Trauerkarte (einfach) | 185 × 115 mm | Single card |
| Thank-you card (folded) | Dankeskarte (gefaltet) | 370 × 115 mm → folds to 185 × 115 mm | 4 panels |
| Thank-you card (single) | Dankeskarte (einfach) | 185 × 115 mm | Single card |

---

## Current State

- 7-step wizard exists: Size → Background → Photo → Text → Decorations → Preview → Order
- Wrong sizes (A6 105×148mm, A5 148×210mm — client uses different dimensions)
- No card type selection (Erinnerungsbild vs Trauerkarte vs Dankeskarte)
- PDF generator exists (jsPDF + svg2pdf.js) but hardcoded A6 and not wired to wizard
- Order step is a placeholder (`alert("Order placed!")`)
- No save to Supabase
- No PDF download
- No folded card concept in the wizard

---

## New Wizard Flow (7 steps, simplified)

```
1. Card Type     → Erinnerungsbild / Trauerkarte / Dankeskarte + single/folded
2. Background    → Gallery or upload (existing, just needs dimension-aware cropping)
3. Photo         → Upload portrait (existing, works as-is)
4. Text          → Name, dates, message + font controls (existing, add text templates)
5. Decorations   → Borders, corners, dividers (existing, works as-is)
6. Preview       → Real-size preview + PDF download button
7. Order         → Quantity + contact → save to DB + download PDF
```

Key change: Step 1 becomes **Card Type** (replaces Size). The size is determined by the card type automatically.

---

## Batch 1: Card Types + Correct Dimensions

### Task 1.1: Update wizard state with card types and real dimensions

**Files:**
- Modify: `src/lib/editor/wizard-state.ts`

**Steps:**

1. Replace `CardSize` type and `CARD_DIMENSIONS`:

**IMPORTANT — Naming:** Internal `CardType` values MUST match the existing DB constraint:
`'sterbebild' | 'trauerkarte' | 'dankkarte'`. Use friendly German names only in UI labels.

```typescript
// Internal values match DB: sterbebild, trauerkarte, dankkarte
export type CardType = "sterbebild" | "trauerkarte" | "dankkarte";
export type CardFormat = "single" | "folded";

export interface CardDimensions {
  widthMm: number;
  heightMm: number;
  label: string;
  description: string;
}

export const CARD_CONFIGS: Record<CardType, {
  label: string;
  availableFormats: CardFormat[];  // sterbebild only has "single"
  formats: Partial<Record<CardFormat, CardDimensions>>;
}> = {
  sterbebild: {
    label: "Erinnerungsbild",
    availableFormats: ["single"],  // NO folded — only single card
    formats: {
      single: { widthMm: 140, heightMm: 105, label: "Erinnerungsbild", description: "140 × 105 mm" },
    },
  },
  trauerkarte: {
    label: "Trauerkarte",
    availableFormats: ["single", "folded"],
    formats: {
      single: { widthMm: 185, heightMm: 115, label: "Trauerkarte (einfach)", description: "185 × 115 mm" },
      folded: { widthMm: 370, heightMm: 115, label: "Trauerkarte (gefaltet)", description: "370 × 115 mm (gefaltet: 185 × 115 mm)" },
    },
  },
  dankkarte: {
    label: "Dankeskarte",
    availableFormats: ["single", "folded"],
    formats: {
      single: { widthMm: 185, heightMm: 115, label: "Dankeskarte (einfach)", description: "185 × 115 mm" },
      folded: { widthMm: 370, heightMm: 115, label: "Dankeskarte (gefaltet)", description: "370 × 115 mm (gefaltet: 185 × 115 mm)" },
    },
  },
};
```

2. Update `WizardState` interface:

```typescript
export interface WizardState {
  currentStep: number;
  cardType: CardType | null;       // replaces `size`
  cardFormat: CardFormat | null;   // new: single or folded
  backImageUrl: string | null;
  photoUrl: string | null;
  photoCrop: { x: number; y: number; width: number; height: number } | null;
  text: string;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  textAlign: "left" | "center" | "right";
  decorations: { ... };           // unchanged
}
```

3. Add actions: `SET_CARD_TYPE`, `SET_CARD_FORMAT`
4. Update `isStepValid` step 1: `state.cardType !== null`
5. Add helper: `getCardDimensions(state): CardDimensions` — returns the mm dimensions for the current card type + format
6. **R5 fix — Draft versioning:** Add `DRAFT_VERSION = 2` constant. When loading draft from localStorage, check version. If missing or outdated → discard and start fresh. This prevents crashes when the state schema changes (old drafts had `size` field, new drafts have `cardType`).

**Verification:** `npx tsc --noEmit` passes. No runtime test needed yet.

### Task 1.2: Replace StepSize with StepCardType

**Files:**
- Rename: `src/components/wizard/steps/StepSize.tsx` → `StepCardType.tsx`

**Steps:**

1. Show 3 card type options as large buttons with icons:
   - Erinnerungsbild — small icon + "140 × 105 mm"
   - Trauerkarte — medium icon + dimensions
   - Dankeskarte — medium icon + dimensions

2. After selecting type, show format toggle (only for Trauerkarte/Dankeskarte):
   - "Einfach (single)" — 185 × 115 mm
   - "Gefaltet (folded)" — 370 × 115 mm → 185 × 115 mm per panel
   - Erinnerungsbild always uses `single` format (auto-set, no toggle)

3. Visual size preview showing actual proportions

4. All text via `useTranslations("wizard.cardType")`

**Verification:** Visual check — card types display correctly, format toggle appears for Trauerkarte/Dankeskarte.

### Task 1.3: Update WizardShell to use new step

**Files:**
- Modify: `src/components/wizard/WizardShell.tsx`

**Steps:**
1. Import `StepCardType` instead of `StepSize`
2. Update step 1 rendering
3. Update `StepIndicator.tsx`: replace hardcoded English `STEP_LABELS` array with `useTranslations("wizard.steps")`. Current labels are `["Size", "Background", "Photo", "Text", "Decorations", "Preview", "Order"]` — change step 1 to "Card Type" / "Kartentyp"

### Task 1.4: Add translations for card types

**Files:**
- Modify: `src/messages/de.json`
- Modify: `src/messages/en.json`

Add `wizard.cardType` namespace with all labels.

### Task 1.5: Commit + push + verify

```bash
git add -A && git commit -m "feat: replace size step with card type selection — real dimensions"
```

**Verification:** `npx next build` passes. Playwright test: wizard step 1 shows card types.

---

## Batch 2: Card Layout Engine (render cards at correct dimensions)

### Task 2.1: Create CardRenderer component

**Files:**
- Create: `src/components/wizard/CardRenderer.tsx`

This component renders the card as a structured HTML layout at the correct aspect ratio. It becomes the single source of truth for how a card looks — used by both Preview and PDF.

**Steps:**

1. Props: `state: WizardState`, `panel: "front" | "back" | "inside-left" | "inside-right" | "full"`, `scale?: number`

2. Layout logic based on card type:

   **Erinnerungsbild (single, 140 × 105 mm):**
   - Front: background image + name + dates at bottom
   - Back: photo (left half) + text (right half)

   **Trauerkarte/Dankeskarte (single, 185 × 115 mm):**
   - Front: background image + title text overlay
   - Back: blank or small text

   **Trauerkarte/Dankeskarte (folded, 370 × 115 mm):**
   - Front cover (185 × 115): background image + title
   - Inside left (185 × 115): photo
   - Inside right (185 × 115): text (name, dates, message)
   - Back cover (185 × 115): blank or small text

3. Each panel renders at the correct aspect ratio using CSS `aspect-ratio`
4. All content (text, photo, decorations) is positioned within the panel
5. The component must render identical output for preview AND PDF export

**Verification:** Renders 3 card types at correct aspect ratios visually.

### Task 2.2: Update StepPreview to use CardRenderer

**Files:**
- Modify: `src/components/wizard/steps/StepPreview.tsx`

**Steps:**

1. Flat mode: show all panels side by side using `CardRenderer`
   - Erinnerungsbild: 2 panels (front + back)
   - Folded cards: 4 panels (front, inside-left, inside-right, back)
   - Single cards: 2 panels (front + back)

2. 3D folding mode: update to work with both single and folded formats
   - Single: flip animation only (front ↔ back)
   - Folded: full 4-panel fold with slider (existing, just update dimensions)

3. Remove hardcoded 3:4 aspect ratios — use actual card proportions

**Verification:** Preview shows correct layout for each card type.

### Task 2.3: Commit + push + verify

```bash
git commit -m "feat: card layout engine with correct dimensions per card type"
```

---

## Batch 3: Text Templates + Multi-Zone Text

### Task 3.1: Add text templates per card type

**Files:**
- Create: `src/lib/editor/text-templates.ts`

**Steps:**

1. Define templates per card type:

```typescript
export const TEXT_TEMPLATES: Record<CardType, { label: string; text: string }[]> = {
  sterbebild: [
    { label: "Klassisch", text: "In liebevoller Erinnerung an\n\n[Name]\n\n* [Geburtsdatum]    † [Sterbedatum]\n\n[Gebet oder Spruch]" },
    { label: "Schlicht", text: "[Name]\n[Geburtsdatum] – [Sterbedatum]" },
    { label: "Mit Spruch", text: "In stillem Gedenken\n\n[Name]\n* [Geburtsdatum]    † [Sterbedatum]\n\nWas man tief in seinem Herzen besitzt,\nkann man nicht durch den Tod verlieren." },
  ],
  trauerkarte: [
    { label: "Traueranzeige", text: "In stiller Trauer nehmen wir Abschied von\n\n[Name]\n\n* [Geburtsdatum]    † [Sterbedatum]\n\nDie Trauerfeier findet am [Datum]\num [Uhrzeit] in [Ort] statt.\n\nIn Liebe und Dankbarkeit\n[Familie]" },
    { label: "Kurz", text: "[Name]\n[Geburtsdatum] – [Sterbedatum]\n\nTrauerfeier: [Datum], [Uhrzeit]\n[Ort]" },
  ],
  dankkarte: [
    { label: "Dank", text: "Herzlichen Dank\n\nfür die liebevolle Anteilnahme\nam Heimgang unseres lieben\n\n[Name]\n\nFür die tröstenden Worte, Gebete,\nBlumen und Spenden danken wir\nvon ganzem Herzen.\n\n[Familie]" },
    { label: "Kurz", text: "Danke\nfür Ihre Anteilnahme\n\n[Familie]" },
  ],
};
```

2. User can pick a template → fills the text field (editable after selection)
3. Placeholder brackets `[Name]` etc. are just text — the user replaces them manually

### Task 3.2: Add template selector to StepText

**Files:**
- Modify: `src/components/wizard/steps/StepText.tsx`

**Steps:**

1. At the top of StepText, add a row of template buttons
2. Clicking a template fills the text textarea with the template's content
3. Only show templates for the selected `cardType`
4. After selecting a template, the text is fully editable
5. If user already has text, show "This will replace your current text" confirmation

### Task 3.3: Commit + push + verify

```bash
git commit -m "feat: text templates per card type — auto-fill with editable placeholders"
```

---

## Batch 4: PDF Generation (print-ready, SERVER-SIDE)

> **R1 fix:** PDF generated on the server, NOT in the browser. Server-side Node.js can fetch
> Unsplash images without CORS restrictions. The client sends the wizard state to an API route,
> the server builds the SVG, converts to PDF, uploads to Supabase Storage, and returns the URL.

### Task 4.1: Create server-side SVG renderer for card panels

**Files:**
- Create: `src/lib/editor/card-to-svg.ts` (runs on server only — uses Node.js fetch)

**Steps:**

1. Function: `async cardPanelToSVG(state: WizardState, panel: string): Promise<string>`
2. Generates an SVG string at the exact mm dimensions (using `viewBox`)
3. Embeds:
   - Background image: **fetch from URL on server** → convert to base64 data URL (no CORS issue)
   - Photo: fetch from Supabase Storage URL → base64
   - Text as `<text>` elements with font, size, color, alignment
   - Decorations as `<image>` elements (fetch → base64)
4. SVG must be self-contained (all images as base64, no external references)
5. Error handling: if any image fetch fails → use placeholder color background + log warning

### Task 4.2: Create PDF generation API route

**Files:**
- Modify: `src/app/api/generate-pdf/route.ts` (replace placeholder)
- Modify: `src/lib/editor/pdf-generator.ts` (server-side only now)

**Steps:**

1. The API route receives wizard state as JSON, generates PDF server-side, uploads to Supabase Storage, returns the PDF URL:

```typescript
// POST /api/generate-pdf — receives wizard state, returns { pdfUrl }
// Server-side: no CORS issues with image fetching

export async function generateCardPDF(state: WizardState): Promise<Buffer> {
  const dims = getCardDimensions(state);

  if (state.cardFormat === "folded") {
    // Create multi-page PDF: page 1 = outside (front + back), page 2 = inside (left + right)
    const doc = new jsPDF({
      orientation: dims.widthMm > dims.heightMm ? "landscape" : "portrait",
      unit: "mm",
      format: [dims.widthMm, dims.heightMm],
    });

    // IMPORTANT: doc.svg() expects SVGElement, not string. Parse first.
    const parser = new DOMParser();

    // Page 1: Outside spread (back cover left, front cover right)
    const outsideSVGStr = await cardPanelToSVG(state, "outside-spread");
    const outsideSVG = parser.parseFromString(outsideSVGStr, "image/svg+xml").documentElement;
    await doc.svg(outsideSVG as unknown as SVGElement, { x: 0, y: 0, width: dims.widthMm, height: dims.heightMm });

    // Page 2: Inside spread (inside-left, inside-right)
    doc.addPage([dims.widthMm, dims.heightMm]);
    const insideSVGStr = await cardPanelToSVG(state, "inside-spread");
    const insideSVG = parser.parseFromString(insideSVGStr, "image/svg+xml").documentElement;
    await doc.svg(insideSVG as unknown as SVGElement, { x: 0, y: 0, width: dims.widthMm, height: dims.heightMm });

    return doc.output("blob");
  } else {
    // Single card: page 1 = front, page 2 = back
    const panelWidth = dims.widthMm;
    const panelHeight = dims.heightMm;

    const doc = new jsPDF({
      orientation: panelWidth > panelHeight ? "landscape" : "portrait",
      unit: "mm",
      format: [panelWidth, panelHeight],
    });

    const parser = new DOMParser();

    const frontSVGStr = await cardPanelToSVG(state, "front");
    const frontSVG = parser.parseFromString(frontSVGStr, "image/svg+xml").documentElement;
    await doc.svg(frontSVG as unknown as SVGElement, { x: 0, y: 0, width: panelWidth, height: panelHeight });

    doc.addPage([panelWidth, panelHeight]);
    const backSVGStr = await cardPanelToSVG(state, "back");
    const backSVG = parser.parseFromString(backSVGStr, "image/svg+xml").documentElement;
    await doc.svg(backSVG as unknown as SVGElement, { x: 0, y: 0, width: panelWidth, height: panelHeight });

    return Buffer.from(doc.output("arraybuffer"));
  }
}
```

2. The API route (`/api/generate-pdf`) calls `generateCardPDF(state)`, uploads the result to Supabase Storage (`card-pdfs` bucket), and returns `{ pdfUrl }`.

3. **R4 fix — Error handling:**
   - Wrap `generateCardPDF` in try-catch
   - If image fetch fails → use solid color fallback, log warning
   - If PDF generation fails entirely → return 500 with clear error message
   - Client shows: "PDF-Erstellung fehlgeschlagen. Bitte versuchen Sie es erneut."

### Task 4.3: Add PDF download to StepPreview

**Files:**
- Modify: `src/components/wizard/steps/StepPreview.tsx`

**Steps:**

1. Add "Download PDF" button below the preview
2. On click: show loading spinner → POST wizard state to `/api/generate-pdf` → receive `{ pdfUrl }` → open URL in new tab or trigger download
3. Filename: `trauerpost-{cardType}-{timestamp}.pdf`
4. Button text: "PDF herunterladen" / "Download PDF"
5. **R4 fix:** On error → show red error message, hide spinner, let user retry

### Task 4.4: Commit + push + verify

```bash
git commit -m "feat: print-ready PDF generation for all card types and formats"
```

**Verification:** Download PDF for each card type. Open in PDF viewer. Verify dimensions are correct in mm.

---

## Batch 5: Save Order to Database

### Task 5.1: Wire StepOrder to save order + PDF

**Files:**
- Modify: `src/components/wizard/steps/StepOrder.tsx`
- Modify: `src/app/api/checkout/route.ts`

**Steps:**

**R3 fix:** Login is REQUIRED before ordering. No guest orders.

1. StepOrder checks auth state first:
   - If NOT logged in → show "Bitte melden Sie sich an" message + redirect to `/login?redirect=/builder`
   - After login, user returns to wizard (draft preserved in localStorage)

2. Update StepOrder `handlePlaceOrder`:
   - Call `/api/generate-pdf` with wizard state → receive `{ pdfUrl }`
   - Save order to Supabase `orders` table:
     ```typescript
     {
       customer_id: customerId,  // from auth — no guest orders
       status: "paid",  // payment deferred
       card_type: state.cardType,
       card_data: {
         cardFormat: state.cardFormat,
         backImageUrl: state.backImageUrl,
         photoUrl: state.photoUrl,
         text: state.text,
         fontFamily: state.fontFamily,
         fontSize: state.fontSize,
         fontColor: state.fontColor,
         textAlign: state.textAlign,
         decorations: state.decorations,
       },
       quantity,
       pdf_url: pdfUrl,
       payment_method: "invoice",
     }
     ```
   - Call `/api/send-email` with order details (non-blocking — don't wait for response)
   - On success: show success message + "Download PDF" button + order number
   - Clear wizard draft from localStorage
   - **R4 fix:** On error → show error message, keep draft, let user retry

3. Update checkout API route to handle PDF + order + email in one call

### Task 5.2: Create Supabase Storage bucket for PDFs

**Steps:**
1. Create `card-pdfs` bucket (via Supabase Dashboard or migration)
2. Public: NO (private — only the customer and admins can access)
3. RLS: authenticated users can upload, admins can read all

### Task 5.3: Update StepOrder UI

**Steps:**
1. Replace hardcoded "Memorial card" with actual card type label
2. Show card dimensions
3. Add "Download PDF" button in the order summary
4. Show success state after order placed:
   - "Bestellung aufgegeben!" with order number
   - "PDF herunterladen" button
   - "Neue Karte erstellen" button (resets wizard)

### Task 5.4: Install Resend + wire email service

**Files:**
- Modify: `src/app/api/send-email/route.ts`
- Create: `src/lib/email/send-order-email.ts`

**Steps:**

1. Install Resend: `npm install resend`
2. Env var `resend_Key` already exists in `.env`. Add it to Vercel env vars too.
3. Create email helper:

```typescript
// src/lib/email/send-order-email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.resend_Key);
const BUSINESS_EMAIL = "jess@trauerpost.com";

export async function sendOrderEmails(params: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  cardType: string;
  quantity: number;
  pdfUrl: string;
}): Promise<void> {
  const { customerEmail, customerName, orderId, cardType, quantity, pdfUrl } = params;

  // Fetch PDF as attachment
  const pdfResponse = await fetch(pdfUrl);
  const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
  const filename = `trauerpost-${cardType}-${orderId.slice(0, 8)}.pdf`;

  // Email to customer
  await resend.emails.send({
    // R2 fix: use resend.dev until trauerpost.com domain is verified in Resend
    from: "Trauerpost <onboarding@resend.dev>",
    to: customerEmail,
    subject: `Ihre Bestellung #${orderId.slice(0, 8)} — Trauerpost`,
    html: `
      <h2>Vielen Dank für Ihre Bestellung!</h2>
      <p>Liebe/r ${customerName || "Kunde"},</p>
      <p>Ihre Bestellung wurde erfolgreich aufgegeben:</p>
      <ul>
        <li><strong>Kartentyp:</strong> ${cardType}</li>
        <li><strong>Menge:</strong> ${quantity}</li>
        <li><strong>Bestellnummer:</strong> ${orderId.slice(0, 8)}</li>
      </ul>
      <p>Im Anhang finden Sie Ihre Karte als PDF.</p>
      <p>Mit freundlichen Grüßen,<br/>Ihr Trauerpost-Team</p>
    `,
    attachments: [{ filename, content: pdfBuffer }],
  });

  // Email to business owner
  await resend.emails.send({
    from: "Trauerpost System <onboarding@resend.dev>",
    to: BUSINESS_EMAIL,
    subject: `Neue Bestellung #${orderId.slice(0, 8)} — ${customerName || customerEmail}`,
    html: `
      <h2>Neue Bestellung eingegangen</h2>
      <ul>
        <li><strong>Kunde:</strong> ${customerName || "—"} (${customerEmail})</li>
        <li><strong>Kartentyp:</strong> ${cardType}</li>
        <li><strong>Menge:</strong> ${quantity}</li>
        <li><strong>Bestellnummer:</strong> ${orderId.slice(0, 8)}</li>
      </ul>
      <p>PDF im Anhang. Bestellung im <a href="https://trauerpost.vercel.app/de/admin/orders">Admin-Panel</a> ansehen.</p>
    `,
    attachments: [{ filename, content: pdfBuffer }],
  });
}
```

4. Update `StepOrder.handlePlaceOrder` to call the email service after saving the order:
   - After order is saved + PDF is uploaded → POST to `/api/send-email` with order details
   - Email is sent in the background (don't block the UI)
   - If email fails, log error but don't fail the order (order is already saved)

5. Update `/api/send-email/route.ts` to use the real Resend service instead of placeholder

### Task 5.5: Commit + push + verify

```bash
git commit -m "feat: save order to Supabase with PDF + auto-email to customer and business owner"
```

**Verification:** Complete wizard → place order → verify order in admin panel → check email inbox for both customer and jess@trauerpost.com with PDF attachment.

---

## Batch 6: Admin View of Orders + E2E Tests

### Task 6.1: Update admin orders to show card details

**Files:**
- Modify: `src/app/[locale]/admin/orders/page.tsx` (if exists)

**Steps:**
1. Show card type and format in orders list
2. Add "Download PDF" link for each order
3. Show card preview thumbnail

### Task 6.2: Write E2E tests

**Files:**
- Create: `e2e/wizard-card-types.spec.ts`

**Tests:**
1. Wizard shows 3 card types
2. Selecting Trauerkarte shows format toggle (single/folded)
3. Complete wizard flow for Erinnerungsbild → reaches order step
4. Complete wizard flow for Trauerkarte (folded) → reaches order step
5. PDF download button works on preview step
6. Order placement saves to DB (check admin page)

### Task 6.3: Full regression + deploy

```bash
npx playwright test --project=chromium --config=playwright.prod.config.ts
```

---

## Summary

| Batch | Tasks | Description |
|-------|-------|-------------|
| 1 | 1.1–1.5 | Card type selection with real dimensions |
| 2 | 2.1–2.3 | Card layout engine — render at correct proportions |
| 3 | 3.1–3.3 | Text templates per card type |
| 4 | 4.1–4.4 | Print-ready PDF generation |
| 5 | 5.1–5.5 | Save order to DB + PDF upload/download + auto-email |
| 6 | 6.1–6.3 | Admin order view + E2E tests |

**Total: 6 batches, ~18 tasks. Estimated new/modified files: ~15.**

**Critical path:** Batch 1 → 2 → 4 → 5 (card types → layout → PDF → save). Batches 3 and 6 are parallel/independent.

**What's explicitly NOT in scope:**
- Payment integration (Stripe) — orders created as "paid" for MVP
- Design polish — functionality first per client direction
- N8N automation
- Print house API integration — funeral director receives PDF by email and forwards manually
