# Card Builder Wizard — Design Document

**Date:** 2026-03-22
**Task:** Step-by-step card builder wizard for memorial folding cards

---

## Product: Folding Memorial Card

A folding card like a greeting card with 3 editable panels:

```
┌─────────────────────────┐
│                         │
│     BACK (גב)           │  Full landscape image from library
│                         │
└─────────────────────────┘

         flip over ↓

┌────────────┬────────────┐
│            │            │
│   LEFT     │   RIGHT    │
│  Photo of  │  Free text │
│  deceased  │  + borders │
│  (upload)  │  + corners │
│            │  + dividers│
└────────────┴────────────┘
```

### Sizes
- **Postcard** (Postkarte): ~A6 (105 × 148 mm)
- **Large** (Groß): ~A5 (148 × 210 mm)

### Panel Details

| Panel | Content | Editable |
|-------|---------|----------|
| Back | Single full image from landscape library | Choose image only |
| Inside Left | Photo of the deceased | Upload photo, position/crop |
| Inside Right | Free text + decorations | Text, font, borders, corners, dividers |

---

## Wizard Steps

### Step 1: Choose Size
- Two options: Postcard / Large
- Visual preview of each size
- Click to select → next step

### Step 2: Choose Back Image
- Grid of landscape images from Supabase `assets` table (20+ images)
- Filter by tags (mountain, forest, ocean, flowers, etc.)
- Click to select → shows on back panel preview
- Option to upload custom background

### Step 3: Upload Photo of Deceased
- File upload (max 10MB, image only)
- Crop/position tool for the photo
- Photo placed on inside-left panel

### Step 4: Add Text
- Free text input (no predefined fields)
- Customer types whatever they want (name, dates, poem, prayer, etc.)
- 10-15 curated font options
- Font size, color, alignment controls
- Text placed on inside-right panel

### Step 5: Choose Decorations
- **Border frames** — decorative frames around entire text area
- **Corner ornaments** — small decorative elements in corners
- **Dividers** — ornamental lines between text sections
- All sourced from Supabase `assets` table (categories: border, ornament, symbol)

### Step 6: Preview
Three preview modes:
1. **Flat overview** — all 3 panels visible side by side
2. **Interactive flip** — click/swipe to flip the card
3. **3D mockup** — folding card 3D rendering (Three.js or CSS 3D transforms)

### Step 7: Order
- Choose quantity
- Regular customers: deduct from credits
- One-time customers: payment (Stripe)
- Confirm → generate PDF → email confirmation

---

## Fonts (10-15 curated options)

Serif (elegant/traditional):
1. Playfair Display
2. Cormorant Garamond
3. Libre Baskerville
4. Lora
5. EB Garamond

Sans-serif (modern/clean):
6. Inter
7. Montserrat
8. Raleway
9. Open Sans

Script/decorative (personal/emotional):
10. Great Vibes
11. Dancing Script
12. Tangerine

German-friendly:
13. Fira Sans
14. Source Serif Pro

---

## Technical Approach

- **Canvas:** Fabric.js for each panel (3 separate canvases)
- **Wizard state:** React state machine or useReducer, persisted to localStorage
- **3D preview:** CSS 3D transforms (perspective, rotateY) for flip effect; Three.js for full 3D mockup
- **PDF output:** Each panel rendered to SVG → combined into single PDF with correct fold layout
- **Data flow:** Wizard state → save to Supabase `orders` table (card_data JSON) → order page

---

## Wizard UI Layout

```
┌──────────────────────────────────────────────┐
│  Step indicator: ● ● ● ○ ○ ○ ○              │
│  "Step 2 of 7: Choose back image"            │
├──────────────────────────────────────────────┤
│                                              │
│  [Step content area]                         │
│                                              │
│  Left: options/controls                      │
│  Right: live preview of current panel        │
│                                              │
├──────────────────────────────────────────────┤
│  [← Back]                      [Next →]      │
└──────────────────────────────────────────────┘
```

Mobile: stacked vertically (controls on top, preview below).
