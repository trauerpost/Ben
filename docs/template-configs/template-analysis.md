# Template Element Analysis — Grid 1000×1000

Each card spread = 140×105mm = 1000×1000 grid units.
Left half = X 0-500, Right half = X 500-1000.
1 unit = 0.14mm (X) / 0.105mm (Y).

---

## Template R1: Brigitte Musterfrau (Reference: WhatsApp 07.39.46)

**Layout type:** Photo left + text right with decorative lines

| Element | Type | X start | Y start | X end | Y end | Font | Style | Notes |
|---------|------|---------|---------|-------|-------|------|-------|-------|
| Photo | image | 0 | 0 | 450 | 650 | — | cover, no border | Portrait crop |
| Line 1 (top) | decoration | 470 | 150 | 950 | 152 | — | thin line, #ccc | Horizontal rule above heading |
| Heading | text | 470 | 160 | 950 | 200 | Serif 10px | italic | "In liebevoller Erinnerung" |
| Name | text | 470 | 220 | 950 | 300 | Serif 22px | bold | "Brigitte Musterfrau" |
| Birth date | text | 470 | 310 | 950 | 340 | Serif 11px | normal | "* 31. Juli 1950" |
| Death date | text | 470 | 345 | 950 | 375 | Serif 11px | normal | "† 20. Februar 2021" |
| Line 2 (mid) | decoration | 470 | 400 | 950 | 402 | — | thin line, #ccc | Horizontal rule below dates |
| Quote | text | 470 | 420 | 950 | 560 | Serif 10px | italic | Multi-line poem |
| Author | text | 470 | 570 | 950 | 600 | Serif 9px | normal | "(Albert Schweitzer)" |

**Fixed decorations:** 2 horizontal lines (above heading, below dates)
**No ornament image.** Lines are CSS borders.

---

## Template R2: Thilde Muster (Reference: WhatsApp 07.40.59)

**Layout type:** Photo left (small, framed) + text right + quote bottom-right

| Element | Type | X start | Y start | X end | Y end | Font | Style | Notes |
|---------|------|---------|---------|-------|-------|------|-------|-------|
| Photo | image | 30 | 30 | 330 | 500 | — | cover, thin border 1px #ddd | Square-ish portrait |
| Name | text | 380 | 100 | 950 | 180 | Serif 18px | small-caps, bold | "THILDE MUSTER" |
| Birth date | text | 380 | 200 | 950 | 230 | Serif 11px | normal | "* 4.6.1942" |
| Death date | text | 380 | 240 | 950 | 270 | Serif 11px | normal | "† 6.1.2021" |
| Quote | text | 380 | 500 | 950 | 750 | Serif 10px | small-caps | Multi-line, centered |

**Fixed decorations:** None (clean design)
**Note:** Name and quote use SMALL-CAPS (not uppercase transform — letter-spacing wider)

---

## Template R3: Franziska Muster (Reference: WhatsApp 07.41.17)

**Layout type:** 3-column — ornament left, text center, photo right (framed)

| Element | Type | X start | Y start | X end | Y end | Font | Style | Notes |
|---------|------|---------|---------|-------|-------|------|-------|-------|
| Cross+Rose ornament | decoration | 30 | 50 | 150 | 550 | — | SVG/PNG, contain | Vertical cross with rose |
| Name line 1 | text | 160 | 200 | 550 | 280 | Serif 24px | normal | "Franziska" |
| Name line 2 | text | 160 | 280 | 550 | 360 | Serif 24px | normal | "Muster" |
| Birth date | text | 160 | 380 | 550 | 410 | Serif 11px | normal | "* 1.12.1954" |
| Birth place | text | 160 | 415 | 550 | 440 | Serif 10px | normal | "in Starnberg" |
| Death date | text | 160 | 460 | 550 | 490 | Serif 11px | normal | "† 23.1.2021" |
| Death place | text | 160 | 495 | 550 | 520 | Serif 10px | normal | "in Augsburg" |
| Divider | text | 160 | 560 | 550 | 590 | Serif 12px | normal, centered | "★ ★ ★" |
| Photo | image | 580 | 50 | 960 | 650 | — | cover, thin border | Portrait, with margin |

**Fixed decorations:** Cross+Rose SVG in left column
**Note:** Name splits across 2 lines (first name / last name)

---

## Template R4: Erna Musterfrau (Reference: WhatsApp 07.42.05)

**Layout type:** Cross + line left, text center-left, oval photo right

| Element | Type | X start | Y start | X end | Y end | Font | Style | Notes |
|---------|------|---------|---------|-------|-------|------|-------|-------|
| Cross (simple) | decoration | 30 | 50 | 80 | 200 | — | SVG, simple cross | Small, top-left |
| Horizontal line top | decoration | 80 | 125 | 450 | 127 | — | thin line 1px #999 | Extends right from cross center |
| Name line 1 | text | 100 | 250 | 450 | 330 | Serif 26px | normal, light weight | "Erna" |
| Name line 2 | text | 100 | 330 | 450 | 410 | Serif 26px | normal, light weight | "Musterfrau" |
| Birth date | text | 100 | 430 | 450 | 460 | Serif 11px | normal | "* 1.12.1934" |
| Birth place | text | 100 | 465 | 450 | 490 | Serif 10px | normal | "in Starnberg" |
| Death date | text | 100 | 520 | 450 | 550 | Serif 11px | normal | "† 20. 1. 2021" |
| Death place | text | 100 | 555 | 450 | 580 | Serif 10px | normal | "in Augsburg" |
| Horizontal line bottom | decoration | 30 | 700 | 450 | 702 | — | thin line 1px #999 | Below text area |
| Photo (OVAL) | image | 520 | 100 | 950 | 750 | — | cover, clip: ellipse(50%) | Oval/ellipse crop! |

**Fixed decorations:** Simple cross top-left + 2 horizontal lines
**Note:** Photo is OVAL (ellipse clip-path), not rectangular!

---

## Summary: Element Inventory per Template

| Template | Photo | Ornament | Lines | Heading | Name | Dates | Places | Quote | Author | Divider |
|----------|-------|----------|-------|---------|------|-------|--------|-------|--------|---------|
| R1 (Brigitte) | ✓ large left | ✗ | 2 horizontal | "In liebevoller..." | ✓ bold | ✓ | ✗ | ✓ italic | ✓ | ✗ |
| R2 (Thilde) | ✓ small left | ✗ | ✗ | ✗ | ✓ small-caps | ✓ | ✗ | ✓ small-caps | ✗ | ✗ |
| R3 (Franziska) | ✓ right framed | Cross+Rose | ✗ | ✗ | ✓ 2-line | ✓ | ✓ italic | ✗ | ✗ | ✓ ★★★ |
| R4 (Erna) | ✓ right OVAL | Simple cross | 2 horizontal | ✗ | ✓ light | ✓ | ✓ | ✗ | ✗ | ✗ |

**New elements discovered:**
1. **Horizontal decorative lines** (HR) — fixed position, not dynamic
2. **Small-caps** text style (not just uppercase)
3. **Oval/ellipse photo crop** (clip-path: ellipse)
4. **Name split across 2 lines** (first name / last name)
5. **Cross extends into horizontal line** (connected decoration)
