# Bifold Card QA Test Matrix

**Created**: 2026-04-08
**Personas**: QA Expert (20yr) + Software Architect + End User
**Scope**: All bifold Sterbebild templates (TI04-TI09) + negative tests (TE01, TE02, TD01, TD02)
**Total tests**: 1,116

---

## Templates Reference

| ID | Name | Photo? | Pages | Key Features |
|----|------|--------|-------|--------------|
| TI04 | Klassisch Elegant | No | outside-spread, front (text only) | Text-only, no photo, Pinyon Script name |
| TI05 | Foto & Gedenken | Yes | outside-spread, front (photo), back (text) | Full photo front, text back |
| TI06 | Portrait & Spruch | Yes | outside-spread, front (photo+text L-form) | Photo left 35%, text right, quote bottom |
| TI07 | Kreuz & Rose | Yes | outside-spread, front (ornament+text), back (photo) | Cross-rose ornament, rounded photo |
| TI08 | Ovales Portrait | Yes | outside-spread, front (cross+text), back (photo) | Thin cross ornament, ellipse photo |
| TI09 | Blumen & Vers | Yes | outside-spread, front (ornament+name+photo), back (quote) | Floral divider, closing verse |
| TE01 | Klassische Trauerkarte | No | front, back (single) | NOT bifold - negative test |
| TE02 | Trauerkarte mit Foto | Yes | front, back (single) | NOT bifold - negative test |
| TD01 | Klassische Dankeskarte | No | front, back (single) | NOT bifold - negative test |
| TD02 | Dankeskarte mit Foto | Yes | front, back (single) | NOT bifold - negative test |

## Pages Reference (Bifold)

| Page ID | Label | Canvas | Notes |
|---------|-------|--------|-------|
| outside-left | Aussen links | Shared canvas "outside-spread" (left half) | Cover photo, thumbnailCrop="left" |
| outside-right | Aussen rechts | Shared canvas "outside-spread" (right half) | Cover photo, thumbnailCrop="right" |
| front | Innen links | Own canvas | Photo page (TI05), text+photo (TI06/TI09), ornament+text (TI07/TI08) |
| back | Innen rechts | Own canvas | Text page (TI05), photo page (TI07/TI08), quote page (TI09) |

## Font Families (21 total)

| Category | Fonts |
|----------|-------|
| Serif (10) | Playfair Display, Cormorant Garamond, Libre Baskerville, Lora, EB Garamond, Source Serif Pro, Cormorant SC, EB Garamond SC, Cormorant Infant, Crimson Pro |
| Script (5) | Great Vibes, Dancing Script, Tangerine, Pinyon Script, Alex Brush |
| Sans (5) | Inter, Montserrat, Raleway, Open Sans, Fira Sans |
| Display SC (1) | Playfair Display SC |

## Font Colors (6)

Black (#1A1A1A), Dark Gray (#4A4A4A), Dark Blue (#1B3A5C), Dark Green (#2D5A3D), Dark Red (#7A2C2C), Gold (#8B7D3C)

## Text Fields (11)

heading, name, birthDate, deathDate, quote, quoteAuthor, relationshipLabels, closingVerse, locationBirth, locationDeath, dividerSymbol

## Output Paths (4)

1. **Canvas** - Fabric.js interactive canvas (what user sees while editing)
2. **Thumbnail** - SpreadNavigator at bottom (per-page mini previews)
3. **Preview** - Vorschau modal (server-side renderSpreadHTML via card-to-html-v2)
4. **PDF** - Downloaded file (Puppeteer rendering of HTML)

---

# PERSONA 1: QA Expert (20 Years Experience)

---

## Category 1: Template Load - Default State (T001-T060)

Each template must load with correct placeholder data, correct layout, no technical artifacts.

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| T001 | Template Load | TI04 | outside-left | Load template | Canvas | Cover photo (TREE.jpg) visible on left half | Screenshot | P0 |
| T002 | Template Load | TI04 | outside-right | Load template | Canvas | Cover photo (TREE.jpg) visible on right half | Screenshot | P0 |
| T003 | Template Load | TI04 | front | Load template | Canvas | Text elements visible: heading, labels, name (Pinyon Script), quote, author, dates | Screenshot | P0 |
| T004 | Template Load | TI04 | front | Load template | Canvas | No photo element present (requiresPhoto=false) | Screenshot | P0 |
| T005 | Template Load | TI04 | all | Load template | Thumbnail | All 4 page thumbnails visible in SpreadNavigator | Screenshot | P0 |
| T006 | Template Load | TI04 | front | Load template | Canvas | Name "Sieglinde Musterfrau" in Pinyon Script font | Screenshot | P1 |
| T007 | Template Load | TI04 | front | Load template | Canvas | Quote text italic, left-aligned | Screenshot | P1 |
| T008 | Template Load | TI04 | front | Load template | Canvas | No "[fieldName]" placeholders visible | Screenshot | P0 |
| T009 | Template Load | TI04 | front | Load template | Canvas | No dashed borders or gray placeholder boxes | Screenshot | P0 |
| T010 | Template Load | TI04 | front | Load template | Canvas | No "undefined" or "null" text visible | Screenshot | P0 |
| T011 | Template Load | TI05 | outside-left | Load template | Canvas | Cover photo (TREE.jpg) fills left half | Screenshot | P0 |
| T012 | Template Load | TI05 | outside-right | Load template | Canvas | Cover photo (TREE.jpg) fills right half | Screenshot | P0 |
| T013 | Template Load | TI05 | front | Load template | Canvas | Placeholder photo fills entire page (1000x1000 grid) | Screenshot | P0 |
| T014 | Template Load | TI05 | back | Load template | Canvas | Heading "In stillem Gedenken" italic centered | Screenshot | P0 |
| T015 | Template Load | TI05 | back | Load template | Canvas | Name "Brigitte Musterfrau" Inter font-weight 300 | Screenshot | P1 |
| T016 | Template Load | TI05 | back | Load template | Canvas | Top line visible at y=250 | Screenshot | P1 |
| T017 | Template Load | TI05 | back | Load template | Canvas | Quote italic centered with lineHeight 1.5 | Screenshot | P1 |
| T018 | Template Load | TI05 | back | Load template | Canvas | Author "(Albert Schweitzer)" italic centered | Screenshot | P1 |
| T019 | Template Load | TI05 | back | Load template | Canvas | Mid line visible at y=490 | Screenshot | P1 |
| T020 | Template Load | TI06 | front | Load template | Canvas | Photo left ~35% width with 1px solid #ddd border | Screenshot | P0 |
| T021 | Template Load | TI06 | front | Load template | Canvas | Name "Thilde Muster" in Playfair Display SC, letter-spacing 6px | Screenshot | P1 |
| T022 | Template Load | TI06 | front | Load template | Canvas | Quote at bottom, small-caps variant, letter-spacing 1px | Screenshot | P1 |
| T023 | Template Load | TI06 | front | Load template | Canvas | L-form layout: photo top-left, text top-right, quote bottom-full | Screenshot | P0 |
| T024 | Template Load | TI07 | front | Load template | Canvas | Cross-rose-vine ornament visible left side | Screenshot | P0 |
| T025 | Template Load | TI07 | front | Load template | Canvas | Name "Franziska Muster" (multiline) Inter weight 300 | Screenshot | P1 |
| T026 | Template Load | TI07 | front | Load template | Canvas | Birth/death dates with locations visible | Screenshot | P0 |
| T027 | Template Load | TI07 | front | Load template | Canvas | Divider symbol visible | Screenshot | P1 |
| T028 | Template Load | TI07 | back | Load template | Canvas | Placeholder photo with rounded clip, 1px border | Screenshot | P0 |
| T029 | Template Load | TI08 | front | Load template | Canvas | Thin cross ornament tall (h=950) left side | Screenshot | P0 |
| T030 | Template Load | TI08 | front | Load template | Canvas | Name "Erna Musterfrau" (multiline) fontSize 42 | Screenshot | P1 |
| T031 | Template Load | TI08 | front | Load template | Canvas | Birth/death dates bold with locations | Screenshot | P1 |
| T032 | Template Load | TI08 | back | Load template | Canvas | Placeholder photo with ellipse clip | Screenshot | P0 |
| T033 | Template Load | TI09 | front | Load template | Canvas | Floral divider ornament at top center | Screenshot | P0 |
| T034 | Template Load | TI09 | front | Load template | Canvas | Heading "In liebevoller Erinnerung" italic centered | Screenshot | P1 |
| T035 | Template Load | TI09 | front | Load template | Canvas | Name "Renate Musterfrau" bold centered fontSize 19 | Screenshot | P1 |
| T036 | Template Load | TI09 | front | Load template | Canvas | Photo with rounded clip at bottom of front page | Screenshot | P0 |
| T037 | Template Load | TI09 | back | Load template | Canvas | Quote text italic left-aligned | Screenshot | P1 |
| T038 | Template Load | TI09 | back | Load template | Canvas | Horizontal line at y=430 | Screenshot | P1 |
| T039 | Template Load | TI09 | back | Load template | Canvas | Closing verse "Ruhe in Frieden" italic centered | Screenshot | P1 |
| T040 | Template Load | TI04 | all | Load template | Canvas | Card dimensions: 140x105mm | Inspect | P0 |
| T041 | Template Load | TI05 | all | Load template | Canvas | Card dimensions: 140x105mm | Inspect | P0 |
| T042 | Template Load | TI06 | all | Load template | Canvas | Card dimensions: 140x105mm | Inspect | P0 |
| T043 | Template Load | TI07 | all | Load template | Canvas | Card dimensions: 140x105mm | Inspect | P0 |
| T044 | Template Load | TI08 | all | Load template | Canvas | Card dimensions: 140x105mm | Inspect | P0 |
| T045 | Template Load | TI09 | all | Load template | Canvas | Card dimensions: 140x105mm | Inspect | P0 |
| T046 | Template Load | TI04 | outside-spread | Load template | Canvas | Outside spread = full 140mm width (827px at 150dpi) | Inspect | P1 |
| T047 | Template Load | TI05 | front | Load template | Canvas | Inner page = half width 70mm (413px at 150dpi) | Inspect | P1 |
| T048 | Template Load | TI05 | back | Load template | Canvas | Inner page = half width 70mm (413px at 150dpi) | Inspect | P1 |
| T049 | Template Load | TI04 | all | Load template | Canvas | No technical artifacts: no "[heading]", no gray boxes | Screenshot | P0 |
| T050 | Template Load | TI05 | all | Load template | Canvas | No technical artifacts | Screenshot | P0 |
| T051 | Template Load | TI06 | all | Load template | Canvas | No technical artifacts | Screenshot | P0 |
| T052 | Template Load | TI07 | all | Load template | Canvas | No technical artifacts | Screenshot | P0 |
| T053 | Template Load | TI08 | all | Load template | Canvas | No technical artifacts | Screenshot | P0 |
| T054 | Template Load | TI09 | all | Load template | Canvas | No technical artifacts | Screenshot | P0 |
| T055 | Template Load | TI04 | front | Load template | Thumbnail | Front page thumbnail shows text layout (not blank) | Screenshot | P1 |
| T056 | Template Load | TI05 | front | Load template | Thumbnail | Front page thumbnail shows photo | Screenshot | P1 |
| T057 | Template Load | TI07 | front | Load template | Thumbnail | Front page thumbnail shows ornament + text | Screenshot | P1 |
| T058 | Template Load | TI08 | back | Load template | Thumbnail | Back page thumbnail shows ellipse photo | Screenshot | P1 |
| T059 | Template Load | TI09 | front | Load template | Thumbnail | Front page thumbnail shows ornament + name + photo | Screenshot | P1 |
| T060 | Template Load | TI05 | all | Load template | Canvas | 4 pages in SpreadNavigator: Aussen links, Aussen rechts, Innen links, Innen rechts | Screenshot | P0 |

---

## Category 2: Text Editing per Template per Field (T061-T200)

For each template, edit each text field and verify across all output paths.

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| T061 | Text Edit | TI04 | front | Edit heading to "Zum Gedenken an" | Canvas | New text visible immediately | Screenshot | P0 |
| T062 | Text Edit | TI04 | front | Edit heading to "Zum Gedenken an" | Thumbnail | Thumbnail updates with new text | Screenshot | P1 |
| T063 | Text Edit | TI04 | front | Edit heading to "Zum Gedenken an" | Preview | Preview shows "Zum Gedenken an" | Screenshot | P0 |
| T064 | Text Edit | TI04 | front | Edit heading to "Zum Gedenken an" | PDF | PDF contains "Zum Gedenken an" | Open PDF | P0 |
| T065 | Text Edit | TI04 | front | Edit name to "Johann Schmidt" | Canvas | Name displays in Pinyon Script | Screenshot | P0 |
| T066 | Text Edit | TI04 | front | Edit name to "Johann Schmidt" | Preview | Preview shows name in Pinyon Script | Screenshot | P0 |
| T067 | Text Edit | TI04 | front | Edit name to "Johann Schmidt" | PDF | PDF shows name in Pinyon Script | Open PDF | P0 |
| T068 | Text Edit | TI04 | front | Edit relationshipLabels | Canvas | Multi-line labels display correctly | Screenshot | P1 |
| T069 | Text Edit | TI04 | front | Edit quote to long text (200 chars) | Canvas | Text auto-shrinks to fit, min 6pt | Screenshot | P1 |
| T070 | Text Edit | TI04 | front | Edit quoteAuthor | Canvas | Author text updates | Screenshot | P1 |
| T071 | Text Edit | TI04 | front | Edit birthDate to "* 1. Januar 1930" | Canvas | Date displays correctly | Screenshot | P1 |
| T072 | Text Edit | TI04 | front | Edit deathDate to "dagger 31. Dezember 2025" | Canvas | Date displays correctly | Screenshot | P1 |
| T073 | Text Edit | TI05 | back | Edit heading to "In Erinnerung" | Canvas | Heading updates on back page | Screenshot | P0 |
| T074 | Text Edit | TI05 | back | Edit heading to "In Erinnerung" | Preview | Preview shows updated heading | Screenshot | P0 |
| T075 | Text Edit | TI05 | back | Edit heading to "In Erinnerung" | PDF | PDF shows updated heading | Open PDF | P0 |
| T076 | Text Edit | TI05 | back | Edit name to "Maria Schmidt" | Canvas | Name Inter weight-300 centered | Screenshot | P0 |
| T077 | Text Edit | TI05 | back | Edit name to "Maria Schmidt" | Preview | Preview shows name correctly | Screenshot | P0 |
| T078 | Text Edit | TI05 | back | Edit name to "Maria Schmidt" | PDF | PDF shows name correctly | Open PDF | P0 |
| T079 | Text Edit | TI05 | back | Edit birthDate | Canvas | Date centered below name | Screenshot | P1 |
| T080 | Text Edit | TI05 | back | Edit deathDate | Canvas | Death date centered below birth date | Screenshot | P1 |
| T081 | Text Edit | TI05 | back | Edit quote (4 lines) | Canvas | Quote italic centered, lineHeight 1.5 | Screenshot | P1 |
| T082 | Text Edit | TI05 | back | Edit quoteAuthor | Canvas | Author italic centered | Screenshot | P1 |
| T083 | Text Edit | TI06 | front | Edit name to "Maria Meier" | Canvas | Name in Playfair Display SC with letter-spacing | Screenshot | P0 |
| T084 | Text Edit | TI06 | front | Edit name to "Maria Meier" | Preview | Preview shows SC name | Screenshot | P0 |
| T085 | Text Edit | TI06 | front | Edit name to "Maria Meier" | PDF | PDF shows SC name | Open PDF | P0 |
| T086 | Text Edit | TI06 | front | Edit birthDate | Canvas | Date left-aligned below name | Screenshot | P1 |
| T087 | Text Edit | TI06 | front | Edit deathDate | Canvas | Death date left-aligned | Screenshot | P1 |
| T088 | Text Edit | TI06 | front | Edit quote (long poem) | Canvas | Quote in small-caps, centered, lineHeight 1.9 | Screenshot | P1 |
| T089 | Text Edit | TI07 | front | Edit name (multiline "Maria\nSchmidt") | Canvas | Two-line name renders correctly | Screenshot | P0 |
| T090 | Text Edit | TI07 | front | Edit name (multiline) | Preview | Preview shows two-line name | Screenshot | P0 |
| T091 | Text Edit | TI07 | front | Edit name (multiline) | PDF | PDF shows two-line name | Open PDF | P0 |
| T092 | Text Edit | TI07 | front | Edit birthDate | Canvas | Date left-aligned at correct position | Screenshot | P1 |
| T093 | Text Edit | TI07 | front | Edit locationBirth to "in Munchen" | Canvas | Location below birthDate | Screenshot | P1 |
| T094 | Text Edit | TI07 | front | Edit deathDate | Canvas | Death date at correct position | Screenshot | P1 |
| T095 | Text Edit | TI07 | front | Edit locationDeath to "in Berlin" | Canvas | Location below deathDate | Screenshot | P1 |
| T096 | Text Edit | TI07 | front | Edit dividerSymbol to "--- --- ---" | Canvas | Divider symbol updates | Screenshot | P2 |
| T097 | Text Edit | TI08 | front | Edit name (multiline "Helga\nMeier") | Canvas | Name fontSize 42, two lines | Screenshot | P0 |
| T098 | Text Edit | TI08 | front | Edit name (multiline) | Preview | Preview shows two-line name | Screenshot | P0 |
| T099 | Text Edit | TI08 | front | Edit name (multiline) | PDF | PDF shows two-line name | Open PDF | P0 |
| T100 | Text Edit | TI08 | front | Edit birthDate (bold) | Canvas | Date bold, left-aligned | Screenshot | P1 |
| T101 | Text Edit | TI08 | front | Edit locationBirth | Canvas | Location below birthDate | Screenshot | P1 |
| T102 | Text Edit | TI08 | front | Edit deathDate (bold) | Canvas | Death date bold | Screenshot | P1 |
| T103 | Text Edit | TI08 | front | Edit locationDeath | Canvas | Location below deathDate | Screenshot | P1 |
| T104 | Text Edit | TI09 | front | Edit heading | Canvas | Heading italic centered | Screenshot | P1 |
| T105 | Text Edit | TI09 | front | Edit name | Canvas | Name bold centered fontSize 19 | Screenshot | P0 |
| T106 | Text Edit | TI09 | front | Edit name | Preview | Preview shows bold name | Screenshot | P0 |
| T107 | Text Edit | TI09 | front | Edit name | PDF | PDF shows bold name | Open PDF | P0 |
| T108 | Text Edit | TI09 | front | Edit birthDate | Canvas | Date centered | Screenshot | P1 |
| T109 | Text Edit | TI09 | front | Edit deathDate | Canvas | Death date centered | Screenshot | P1 |
| T110 | Text Edit | TI09 | back | Edit quote (long poem 6 lines) | Canvas | Quote italic left-aligned fits in box | Screenshot | P1 |
| T111 | Text Edit | TI09 | back | Edit quote (long poem) | Preview | Preview shows full quote | Screenshot | P1 |
| T112 | Text Edit | TI09 | back | Edit closingVerse to "In ewiger Liebe" | Canvas | Verse italic centered below line | Screenshot | P1 |
| T113 | Text Edit | TI09 | back | Edit closingVerse | Preview | Preview shows closing verse | Screenshot | P1 |
| T114 | Text Edit | TI09 | back | Edit closingVerse | PDF | PDF shows closing verse | Open PDF | P1 |
| T115 | Text Edit | TI04 | front | Edit ALL fields simultaneously | Canvas | All fields update without overlap | Screenshot | P0 |
| T116 | Text Edit | TI05 | back | Edit ALL fields simultaneously | Canvas | All fields update without overlap | Screenshot | P0 |
| T117 | Text Edit | TI06 | front | Edit ALL fields simultaneously | Canvas | All fields update without overlap | Screenshot | P0 |
| T118 | Text Edit | TI07 | front | Edit ALL fields simultaneously | Canvas | All fields update without overlap | Screenshot | P0 |
| T119 | Text Edit | TI08 | front | Edit ALL fields simultaneously | Canvas | All fields update without overlap | Screenshot | P0 |
| T120 | Text Edit | TI09 | both | Edit ALL fields simultaneously | Canvas | All fields update without overlap | Screenshot | P0 |
| T121 | Text Edit | TI04 | front | Clear heading (empty string) | Canvas | No "undefined", no placeholder text, clean layout | Screenshot | P1 |
| T122 | Text Edit | TI05 | back | Clear name (empty string) | Canvas | Empty area where name was, no crash | Screenshot | P1 |
| T123 | Text Edit | TI06 | front | Clear all text fields | Canvas | Photo still visible, no crash | Screenshot | P1 |
| T124 | Text Edit | TI07 | front | Clear name | Canvas | Ornament still visible, dates still visible | Screenshot | P1 |
| T125 | Text Edit | TI08 | front | Clear all text fields | Canvas | Cross ornament still visible | Screenshot | P1 |
| T126 | Text Edit | TI09 | both | Clear all text fields | Canvas | Ornament + photo still visible | Screenshot | P1 |
| T127 | Text Edit | TI04 | front | Type 1 character name "A" | Canvas | Single character renders, not cut off | Screenshot | P2 |
| T128 | Text Edit | TI05 | back | Type 1 character name "B" | Canvas | Single character centered correctly | Screenshot | P2 |
| T129 | Text Edit | TI04 | front | Type 100+ char name | Canvas | Text auto-shrinks, stays within bounds | Screenshot | P1 |
| T130 | Text Edit | TI05 | back | Type 100+ char name | Canvas | Text auto-shrinks, min 6pt | Screenshot | P1 |
| T131 | Text Edit | TI06 | front | Type 100+ char name | Canvas | Text auto-shrinks within SC layout | Screenshot | P1 |
| T132 | Text Edit | TI07 | front | Type 100+ char name | Canvas | Text auto-shrinks, doesn't overlap ornament | Screenshot | P1 |
| T133 | Text Edit | TI08 | front | Type 100+ char name | Canvas | Text auto-shrinks, doesn't overlap cross | Screenshot | P1 |
| T134 | Text Edit | TI09 | front | Type 100+ char name | Canvas | Text auto-shrinks, doesn't overlap photo | Screenshot | P1 |
| T135 | Text Edit | TI04 | front | Enter special chars: umlauts | Canvas | Displays correctly | Screenshot | P1 |
| T136 | Text Edit | TI05 | back | Enter special chars: emojis | Canvas | Renders or gracefully degrades | Screenshot | P2 |
| T137 | Text Edit | TI06 | front | Enter special chars: Hebrew/Arabic RTL | Canvas | Renders (may not be RTL-aware) | Screenshot | P3 |
| T138 | Text Edit | TI04 | front | Enter line breaks in quote | Canvas | Multi-line text respects \n | Screenshot | P1 |
| T139 | Text Edit | TI05 | back | Enter line breaks in quote | Preview | Preview preserves line breaks | Screenshot | P1 |
| T140 | Text Edit | TI05 | back | Enter line breaks in quote | PDF | PDF preserves line breaks | Open PDF | P1 |
| T141 | Text Edit | TI04 | front | Edit text, switch page, come back | Canvas | Text preserved after page switch | E2E | P0 |
| T142 | Text Edit | TI05 | back | Edit text, switch to front, come back | Canvas | Text preserved | E2E | P0 |
| T143 | Text Edit | TI06 | front | Edit name, edit quote, preview | Preview | Both edits visible in preview | E2E | P0 |
| T144 | Text Edit | TI07 | front | Edit birth+death+locations, preview | Preview | All 4 fields visible in preview | E2E | P0 |
| T145 | Text Edit | TI08 | front | Edit all dates+locations, download PDF | PDF | All fields in PDF | E2E | P0 |
| T146 | Text Edit | TI09 | back | Edit quote+verse, download PDF | PDF | Both fields in PDF | E2E | P0 |
| T147 | Text Edit | TI04 | front | Rapid typing (50 chars fast) | Canvas | No lag, no dropped characters | Manual | P2 |
| T148 | Text Edit | TI05 | back | Paste long text from clipboard | Canvas | Text pastes and auto-shrinks | Manual | P2 |
| T149 | Text Edit | TI07 | front | Edit dividerSymbol to each option | Canvas | Each symbol displays correctly | Screenshot | P2 |
| T150 | Text Edit | TI07 | front | dividerSymbol = "" (empty) | Canvas | No divider shown, no crash | Screenshot | P2 |
| T151 | Text Edit | TI07 | front | dividerSymbol = "--- --- ---" | Canvas | Symbol centered at correct position | Screenshot | P2 |
| T152 | Text Edit | TI07 | front | dividerSymbol = "cross symbol" | Canvas | Cross symbol renders | Screenshot | P2 |
| T153 | Text Edit | TI07 | front | dividerSymbol = "star star star" | Canvas | Stars render | Screenshot | P2 |
| T154 | Text Edit | TI07 | front | dividerSymbol = "flower flower flower" | Canvas | Flowers render | Screenshot | P2 |
| T155 | Text Edit | TI04 | front | Edit heading, Preview, Edit again, Preview | Preview | Second preview shows latest edit | E2E | P0 |
| T156 | Text Edit | TI05 | back | Edit name, PDF, Edit name again, PDF | PDF | Second PDF has latest name | E2E | P0 |
| T157 | Text Edit | TI06 | front | Edit birthDate format "01.01.1950" | Canvas | Date renders as typed | Screenshot | P2 |
| T158 | Text Edit | TI06 | front | Edit birthDate format "1. Januar 1950" | Canvas | Date renders as typed | Screenshot | P2 |
| T159 | Text Edit | TI05 | back | Type text with trailing spaces | Canvas | Spaces preserved or trimmed cleanly | Screenshot | P3 |
| T160 | Text Edit | TI05 | back | Type text with leading spaces | Canvas | Spaces preserved or trimmed cleanly | Screenshot | P3 |
| T161 | Text Edit | TI04 | front | Edit all fields, reload page, check draft | Canvas | All edits preserved in localStorage draft | E2E | P0 |
| T162 | Text Edit | TI05 | back | Edit all fields, reload page, check draft | Canvas | All edits preserved | E2E | P0 |
| T163 | Text Edit | TI06 | front | Edit all fields, reload page, check draft | Canvas | All edits preserved | E2E | P0 |
| T164 | Text Edit | TI07 | front | Edit all fields, reload page, check draft | Canvas | All edits preserved | E2E | P0 |
| T165 | Text Edit | TI08 | front | Edit all fields, reload page, check draft | Canvas | All edits preserved | E2E | P0 |
| T166 | Text Edit | TI09 | both | Edit all fields, reload page, check draft | Canvas | All edits preserved | E2E | P0 |
| T167 | Text Edit | TI04 | front | Edit heading text alignment to right | Canvas | Text right-aligned | Screenshot | P1 |
| T168 | Text Edit | TI04 | front | Edit heading text alignment to center | Canvas | Text centered | Screenshot | P1 |
| T169 | Text Edit | TI05 | back | Change text alignment on name | Canvas | Alignment changes | Screenshot | P1 |
| T170 | Text Edit | TI05 | back | Change text alignment on name | Preview | Preview reflects alignment | Screenshot | P1 |
| T171 | Text Edit | TI05 | back | Change text alignment on name | PDF | PDF reflects alignment | Open PDF | P1 |
| T172 | Text Edit | TI04 | front | Edit text, undo, verify original | Canvas | Original text restored | E2E | P0 |
| T173 | Text Edit | TI04 | front | Edit text, undo, redo, verify edit | Canvas | Edited text restored | E2E | P0 |
| T174 | Text Edit | TI05 | back | Edit name, undo, verify | Canvas | Original name restored | E2E | P0 |
| T175 | Text Edit | TI06 | front | Edit 3 fields, undo 3x, verify all original | Canvas | All 3 fields restored | E2E | P1 |
| T176 | Text Edit | TI07 | front | Edit location, switch page, switch back, undo | Canvas | Location restored after page switch + undo | E2E | P1 |
| T177 | Text Edit | TI04 | front | Edit heading text color to Dark Blue | Canvas | Text color changes to #1B3A5C | Screenshot | P1 |
| T178 | Text Edit | TI04 | front | Edit heading text color to Dark Blue | Preview | Preview shows dark blue text | Screenshot | P1 |
| T179 | Text Edit | TI04 | front | Edit heading text color to Dark Blue | PDF | PDF shows dark blue text | Open PDF | P1 |
| T180 | Text Edit | TI05 | back | Edit name color to Gold | Canvas | Name in #8B7D3C | Screenshot | P1 |
| T181 | Text Edit | TI05 | back | Edit name color to Gold | Preview | Preview shows gold name | Screenshot | P1 |
| T182 | Text Edit | TI05 | back | Edit name color to Gold | PDF | PDF shows gold name | Open PDF | P1 |
| T183 | Text Edit | TI06 | front | Edit name color to Dark Red | Canvas | Name in #7A2C2C | Screenshot | P1 |
| T184 | Text Edit | TI07 | front | Edit name color to Dark Green | Canvas | Name in #2D5A3D | Screenshot | P1 |
| T185 | Text Edit | TI08 | front | Edit name color to Dark Gray | Canvas | Name in #4A4A4A | Screenshot | P1 |
| T186 | Text Edit | TI09 | front | Edit name color to Black | Canvas | Name in #1A1A1A | Screenshot | P2 |
| T187 | Text Edit | TI04 | front | Change color, Preview, change again, Preview | Preview | Second preview shows latest color | E2E | P1 |
| T188 | Text Edit | TI05 | back | Change color, PDF, verify color in PDF | PDF | Color preserved in PDF | E2E | P1 |
| T189 | Text Edit | TI04 | front | Edit text color, undo, verify original color | Canvas | Original color restored | E2E | P1 |
| T190 | Text Edit | TI05 | back | Edit text color, undo, redo, verify new color | Canvas | New color restored | E2E | P1 |
| T191 | Text Edit | TI04 | front | Edit heading fontSize via toolbar | Canvas | Font size changes | Screenshot | P1 |
| T192 | Text Edit | TI05 | back | Edit name fontSize via toolbar | Canvas | Font size changes | Screenshot | P1 |
| T193 | Text Edit | TI06 | front | Edit quote fontSize via toolbar | Canvas | Font size changes | Screenshot | P1 |
| T194 | Text Edit | TI04 | front | Edit heading fontSize, Preview | Preview | Preview shows new size | Screenshot | P1 |
| T195 | Text Edit | TI04 | front | Edit heading fontSize, PDF | PDF | PDF shows new size | Open PDF | P1 |
| T196 | Text Edit | TI05 | back | Increase name fontSize beyond box height | Canvas | Text auto-shrinks or clips cleanly | Screenshot | P1 |
| T197 | Text Edit | TI04 | front | Set fontSize to minimum (6pt) | Canvas | Text still readable at 6pt | Screenshot | P2 |
| T198 | Text Edit | TI04 | front | Set fontSize very large (48pt) | Canvas | Text doesn't overflow canvas | Screenshot | P2 |
| T199 | Text Edit | TI05 | back | Edit fontSize, undo, verify | Canvas | Original fontSize restored | E2E | P2 |
| T200 | Text Edit | TI09 | back | Edit closingVerse fontSize, Preview, PDF | All | Consistent across all outputs | E2E | P1 |

---

## Category 3: Font Family Changes (T201-T326)

21 fonts x 6 templates = 126 base tests, plus cross-output verification.

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| T201 | Font Change | TI04 | front | Change global font to Playfair Display | Canvas | All text in Playfair Display | Screenshot | P0 |
| T202 | Font Change | TI04 | front | Change global font to Playfair Display | Preview | Preview uses Playfair Display | Screenshot | P0 |
| T203 | Font Change | TI04 | front | Change global font to Playfair Display | PDF | PDF uses Playfair Display | Open PDF | P0 |
| T204 | Font Change | TI04 | front | Change global font to Cormorant Garamond | Canvas | All text in Cormorant Garamond | Screenshot | P1 |
| T205 | Font Change | TI04 | front | Change global font to Libre Baskerville | Canvas | All text in Libre Baskerville | Screenshot | P1 |
| T206 | Font Change | TI04 | front | Change global font to Lora | Canvas | All text in Lora | Screenshot | P1 |
| T207 | Font Change | TI04 | front | Change global font to EB Garamond | Canvas | All text in EB Garamond | Screenshot | P1 |
| T208 | Font Change | TI04 | front | Change global font to Inter | Canvas | All text in Inter | Screenshot | P1 |
| T209 | Font Change | TI04 | front | Change global font to Montserrat | Canvas | All text in Montserrat | Screenshot | P1 |
| T210 | Font Change | TI04 | front | Change global font to Raleway | Canvas | All text in Raleway | Screenshot | P1 |
| T211 | Font Change | TI04 | front | Change global font to Open Sans | Canvas | All text in Open Sans | Screenshot | P1 |
| T212 | Font Change | TI04 | front | Change global font to Great Vibes | Canvas | All text in Great Vibes | Screenshot | P1 |
| T213 | Font Change | TI04 | front | Change global font to Dancing Script | Canvas | All text in Dancing Script | Screenshot | P1 |
| T214 | Font Change | TI04 | front | Change global font to Tangerine | Canvas | All text in Tangerine | Screenshot | P1 |
| T215 | Font Change | TI04 | front | Change global font to Fira Sans | Canvas | All text in Fira Sans | Screenshot | P1 |
| T216 | Font Change | TI04 | front | Change global font to Source Serif Pro | Canvas | All text in Source Serif Pro | Screenshot | P1 |
| T217 | Font Change | TI04 | front | Change global font to Pinyon Script | Canvas | All text in Pinyon Script | Screenshot | P1 |
| T218 | Font Change | TI04 | front | Change global font to Alex Brush | Canvas | All text in Alex Brush | Screenshot | P1 |
| T219 | Font Change | TI04 | front | Change global font to Cormorant SC | Canvas | All text in Cormorant SC | Screenshot | P1 |
| T220 | Font Change | TI04 | front | Change global font to EB Garamond SC | Canvas | All text in EB Garamond SC | Screenshot | P1 |
| T221 | Font Change | TI04 | front | Change global font to Playfair Display SC | Canvas | All text in Playfair Display SC | Screenshot | P1 |
| T222 | Font Change | TI04 | front | Change global font to Cormorant Infant | Canvas | All text in Cormorant Infant | Screenshot | P1 |
| T223 | Font Change | TI04 | front | Change global font to Crimson Pro | Canvas | All text in Crimson Pro | Screenshot | P1 |
| T224 | Font Change | TI05 | back | Change global font to Playfair Display | Canvas | Back page text in Playfair Display | Screenshot | P0 |
| T225 | Font Change | TI05 | back | Change global font to Playfair Display | Preview | Preview uses Playfair Display | Screenshot | P0 |
| T226 | Font Change | TI05 | back | Change global font to Playfair Display | PDF | PDF uses Playfair Display | Open PDF | P0 |
| T227 | Font Change | TI05 | back | Change global font to Great Vibes | Canvas | Script font renders correctly for memorial text | Screenshot | P1 |
| T228 | Font Change | TI05 | back | Change global font to Great Vibes | Preview | Preview shows Great Vibes | Screenshot | P1 |
| T229 | Font Change | TI05 | back | Change global font to Great Vibes | PDF | PDF shows Great Vibes | Open PDF | P1 |
| T230 | Font Change | TI05 | back | Change to each of 21 fonts | Canvas | Each font renders without fallback | Screenshot batch | P1 |
| T231 | Font Change | TI06 | front | Change global font to Cormorant Garamond | Canvas | Name still in Playfair Display SC (per-element override) | Screenshot | P0 |
| T232 | Font Change | TI06 | front | Change global font, verify per-element override | Canvas | Per-element fontFamily takes precedence over global | Screenshot | P0 |
| T233 | Font Change | TI06 | front | Change to each of 21 fonts | Canvas | Each font renders without fallback | Screenshot batch | P1 |
| T234 | Font Change | TI07 | front | Change global font to Dancing Script | Canvas | Name in Dancing Script, text flows correctly | Screenshot | P1 |
| T235 | Font Change | TI07 | front | Change global font to Dancing Script | Preview | Preview shows Dancing Script | Screenshot | P1 |
| T236 | Font Change | TI07 | front | Change global font to Dancing Script | PDF | PDF shows Dancing Script | Open PDF | P1 |
| T237 | Font Change | TI07 | front | Change to each of 21 fonts | Canvas | Each font renders | Screenshot batch | P1 |
| T238 | Font Change | TI08 | front | Change global font to Alex Brush | Canvas | Name in Alex Brush, large size | Screenshot | P1 |
| T239 | Font Change | TI08 | front | Change global font to Alex Brush | Preview | Preview shows Alex Brush | Screenshot | P1 |
| T240 | Font Change | TI08 | front | Change global font to Alex Brush | PDF | PDF shows Alex Brush | Open PDF | P1 |
| T241 | Font Change | TI08 | front | Change to each of 21 fonts | Canvas | Each font renders | Screenshot batch | P1 |
| T242 | Font Change | TI09 | front | Change global font to Crimson Pro | Canvas | Name in Crimson Pro bold | Screenshot | P1 |
| T243 | Font Change | TI09 | front | Change global font to Crimson Pro | Preview | Preview shows Crimson Pro | Screenshot | P1 |
| T244 | Font Change | TI09 | front | Change global font to Crimson Pro | PDF | PDF shows Crimson Pro | Open PDF | P1 |
| T245 | Font Change | TI09 | front | Change to each of 21 fonts | Canvas | Each font renders | Screenshot batch | P1 |
| T246 | Font Change | TI04 | front | Change font, switch page, come back | Canvas | Font preserved after navigation | E2E | P0 |
| T247 | Font Change | TI05 | back | Change font, switch to front, come back | Canvas | Font preserved | E2E | P0 |
| T248 | Font Change | TI06 | front | Change font, preview, change again, preview | Preview | Second preview shows latest font | E2E | P1 |
| T249 | Font Change | TI07 | front | Change font, undo, verify original font | Canvas | Original font restored | E2E | P1 |
| T250 | Font Change | TI08 | front | Change font, undo, redo, verify | Canvas | New font restored | E2E | P1 |
| T251 | Font Change | TI04 | front | Change font, reload page, verify draft | Canvas | Font preserved in localStorage draft | E2E | P0 |
| T252 | Font Change | TI05 | back | Change font, reload, verify draft | Canvas | Font preserved | E2E | P0 |
| T253 | Font Change | TI04 | front | Font: Tangerine (very thin script) | Canvas | Text still readable, not too thin | Screenshot | P2 |
| T254 | Font Change | TI04 | front | Font: Tangerine + long text | Canvas | Auto-shrink works with script font | Screenshot | P2 |
| T255 | Font Change | TI05 | back | Font: Tangerine at small fontSize (9pt) | Canvas | Text still legible | Screenshot | P2 |
| T256 | Font Change | TI04 | front | Font: Great Vibes + bold weight | Canvas | Bold applies or gracefully ignores | Screenshot | P2 |
| T257 | Font Change | TI05 | back | Font: Inter + italic style | Canvas | Italic renders for Inter | Screenshot | P2 |
| T258 | Font Change | TI06 | front | Font: Playfair Display SC + italic | Canvas | Small caps + italic combination | Screenshot | P2 |
| T259 | Font Change | TI04 | front | Rapid font switching (10 fonts in 5 seconds) | Canvas | No crashes, no font corruption | Manual | P2 |
| T260 | Font Change | TI05 | back | Font change on slow network (throttled) | Canvas | Font loads eventually, fallback shown first | Manual | P3 |
| T261 | Font Change | TI04 | front | Category filter: Serif | Canvas | Only serif fonts shown in carousel | Screenshot | P2 |
| T262 | Font Change | TI04 | front | Category filter: Script | Canvas | Only script fonts shown in carousel | Screenshot | P2 |
| T263 | Font Change | TI04 | front | Category filter: Sans | Canvas | Only sans fonts shown in carousel | Screenshot | P2 |
| T264 | Font Change | TI04 | front | Category filter: All | Canvas | All 21 fonts shown | Screenshot | P2 |
| T265 | Font Change | TI05 | back | Per-element font override on name field | Canvas | Name uses override font, other fields use global | Screenshot | P1 |
| T266 | Font Change | TI05 | back | Per-element font override, preview | Preview | Preview respects per-element override | Screenshot | P1 |
| T267 | Font Change | TI05 | back | Per-element font override, PDF | PDF | PDF respects per-element override | Open PDF | P1 |
| T268 | Font Change | TI06 | front | Global font change doesn't override template per-element font | Canvas | Playfair Display SC on name kept even after global change | Screenshot | P0 |
| T269 | Font Change | TI05 | back | Per-element override, global change, per-element still wins | Canvas | Cascade: override > template > global | E2E | P0 |
| T270 | Font Change | TI04 | front | Change font to Playfair Display, PDF, verify Google Font loaded | PDF | Font embedded/loaded in PDF (not system fallback) | Open PDF | P0 |
| T271 | Font Change | TI05 | back | Change font to Dancing Script, PDF, verify | PDF | Script font embedded in PDF | Open PDF | P0 |
| T272 | Font Change | TI06 | front | Change font to Montserrat, PDF, verify | PDF | Sans font embedded in PDF | Open PDF | P1 |
| T273 | Font Change | TI07 | front | Change font to Cormorant SC, PDF, verify | PDF | SC font embedded in PDF | Open PDF | P1 |
| T274 | Font Change | TI08 | front | Change font to Pinyon Script, PDF, verify | PDF | Script font in PDF | Open PDF | P1 |
| T275 | Font Change | TI09 | front | Change font to Lora, PDF, verify | PDF | Serif font in PDF | Open PDF | P1 |
| T276 | Font Change | TI04 | front | Font Google preload fires on mount | DevTools | Google Fonts CSS link in head | Inspect | P2 |
| T277 | Font Change | TI04 | front | All 21 fonts preloaded via single CSS link | DevTools | Single CSS link with all families | Inspect | P2 |
| T278 | Font Change | TI05 | back | Font change + text edit simultaneously | Canvas | Both changes reflected | E2E | P1 |
| T279 | Font Change | TI06 | front | Font change + color change simultaneously | Canvas | Both changes reflected | E2E | P1 |
| T280 | Font Change | TI07 | front | Font change + alignment change simultaneously | Canvas | Both changes reflected | E2E | P1 |
| T281 | Font Change | TI05 | back | Mobile: font carousel opens/closes | Canvas | Toggle button works, carousel expands | Screenshot mobile | P1 |
| T282 | Font Change | TI05 | back | Mobile: select font closes carousel | Canvas | Auto-close after selection | Manual mobile | P2 |
| T283 | Font Change | TI04 | front | Font: Cormorant Infant (unusual name) | Canvas | Font loads and renders | Screenshot | P2 |
| T284 | Font Change | TI04 | front | Font: Crimson Pro | Canvas | Font loads and renders | Screenshot | P2 |
| T285-T326 | Font Change | TI04-TI09 | various | Each remaining font x template combo | Canvas+Preview+PDF | Font renders consistently across all outputs | Screenshot batch | P2 |

---

## Category 4: Photo Upload and Management (T327-T446)

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| T327 | Photo Upload | TI05 | front | Upload portrait photo | Canvas | Photo fills entire front page, cover fit | Screenshot | P0 |
| T328 | Photo Upload | TI05 | front | Upload portrait photo | Thumbnail | Front thumbnail shows photo | Screenshot | P0 |
| T329 | Photo Upload | TI05 | front | Upload portrait photo | Preview | Preview shows uploaded photo | Screenshot | P0 |
| T330 | Photo Upload | TI05 | front | Upload portrait photo | PDF | PDF page shows uploaded photo | Open PDF | P0 |
| T331 | Photo Upload | TI06 | front | Upload portrait photo | Canvas | Photo in left 35% with border | Screenshot | P0 |
| T332 | Photo Upload | TI06 | front | Upload portrait photo | Preview | Preview shows L-form layout with photo | Screenshot | P0 |
| T333 | Photo Upload | TI06 | front | Upload portrait photo | PDF | PDF shows L-form with photo | Open PDF | P0 |
| T334 | Photo Upload | TI07 | back | Upload portrait photo | Canvas | Photo with rounded clip on back page | Screenshot | P0 |
| T335 | Photo Upload | TI07 | back | Upload portrait photo | Preview | Preview shows rounded photo | Screenshot | P0 |
| T336 | Photo Upload | TI07 | back | Upload portrait photo | PDF | PDF shows rounded photo | Open PDF | P0 |
| T337 | Photo Upload | TI08 | back | Upload portrait photo | Canvas | Photo with ellipse clip | Screenshot | P0 |
| T338 | Photo Upload | TI08 | back | Upload portrait photo | Preview | Preview shows ellipse photo | Screenshot | P0 |
| T339 | Photo Upload | TI08 | back | Upload portrait photo | PDF | PDF shows ellipse photo | Open PDF | P0 |
| T340 | Photo Upload | TI09 | front | Upload portrait photo | Canvas | Photo at bottom of front page, rounded clip | Screenshot | P0 |
| T341 | Photo Upload | TI09 | front | Upload portrait photo | Preview | Preview shows photo in correct position | Screenshot | P0 |
| T342 | Photo Upload | TI09 | front | Upload portrait photo | PDF | PDF shows photo correctly | Open PDF | P0 |
| T343 | Photo Upload | TI05 | outside-spread | Upload cover photo | Canvas | Cover photo replaces TREE.jpg | Screenshot | P0 |
| T344 | Photo Upload | TI05 | outside-left | Upload cover, check left half | Thumbnail | Left thumbnail shows new cover | Screenshot | P0 |
| T345 | Photo Upload | TI05 | outside-right | Upload cover, check right half | Thumbnail | Right thumbnail shows new cover | Screenshot | P0 |
| T346 | Photo Upload | TI05 | outside-spread | Upload cover photo | Preview | Preview shows new cover photo | Screenshot | P0 |
| T347 | Photo Upload | TI05 | outside-spread | Upload cover photo | PDF | PDF page 1 shows new cover photo | Open PDF | P0 |
| T348 | Photo Upload | TI06 | outside-spread | Upload cover photo | Canvas | Cover photo replaces TREE.jpg | Screenshot | P1 |
| T349 | Photo Upload | TI07 | outside-spread | Upload cover photo | Canvas | Cover photo replaces TREE.jpg | Screenshot | P1 |
| T350 | Photo Upload | TI08 | outside-spread | Upload cover photo | Canvas | Cover photo replaces TREE.jpg | Screenshot | P1 |
| T351 | Photo Upload | TI09 | outside-spread | Upload cover photo | Canvas | Cover photo replaces TREE.jpg | Screenshot | P1 |
| T352 | Photo Upload | TI04 | outside-spread | Upload cover photo | Canvas | Cover photo replaces TREE.jpg | Screenshot | P1 |
| T353 | Photo Replace | TI05 | front | Replace portrait photo | Canvas | New photo replaces old | Screenshot | P0 |
| T354 | Photo Replace | TI05 | front | Replace portrait photo | Preview | Preview shows new photo | Screenshot | P0 |
| T355 | Photo Replace | TI05 | front | Replace portrait photo | PDF | PDF shows new photo | Open PDF | P0 |
| T356 | Photo Replace | TI06 | front | Replace portrait photo | Canvas | New photo in L-form position | Screenshot | P0 |
| T357 | Photo Replace | TI07 | back | Replace portrait photo | Canvas | New photo with rounded clip | Screenshot | P0 |
| T358 | Photo Replace | TI08 | back | Replace portrait photo | Canvas | New photo with ellipse clip | Screenshot | P0 |
| T359 | Photo Replace | TI09 | front | Replace portrait photo | Canvas | New photo at bottom position | Screenshot | P0 |
| T360 | Photo Replace | TI05 | outside-spread | Replace cover photo | Canvas | New cover replaces previous | Screenshot | P1 |
| T361 | Photo Size | TI05 | front | Upload very large photo (10MB+) | Canvas | Photo loads (may take time), no crash | Screenshot | P1 |
| T362 | Photo Size | TI05 | front | Upload very large photo (10MB+) | Preview | Preview shows large photo | Screenshot | P1 |
| T363 | Photo Size | TI05 | front | Upload very large photo (10MB+) | PDF | PDF generates within timeout | Open PDF | P1 |
| T364 | Photo Size | TI06 | front | Upload small photo (100x100px) | Canvas | Photo upscales to fill area | Screenshot | P1 |
| T365 | Photo Size | TI07 | back | Upload small photo (100x100px) | Canvas | Photo fills rounded area (may be blurry) | Screenshot | P2 |
| T366 | Photo Size | TI08 | back | Upload small photo (100x100px) | Canvas | Photo fills ellipse (may be blurry) | Screenshot | P2 |
| T367 | Photo Aspect | TI05 | front | Upload landscape photo (16:9) | Canvas | Photo cover-crops to fill, centered | Screenshot | P1 |
| T368 | Photo Aspect | TI05 | front | Upload portrait photo (3:4) | Canvas | Photo cover-crops to fill | Screenshot | P1 |
| T369 | Photo Aspect | TI05 | front | Upload square photo (1:1) | Canvas | Photo cover-crops to fill | Screenshot | P1 |
| T370 | Photo Aspect | TI06 | front | Upload landscape in L-form slot | Canvas | Photo cover-crops correctly | Screenshot | P1 |
| T371 | Photo Aspect | TI07 | back | Upload landscape in rounded slot | Canvas | Photo cropped into rounded shape | Screenshot | P1 |
| T372 | Photo Aspect | TI08 | back | Upload landscape in ellipse slot | Canvas | Photo cropped into ellipse | Screenshot | P1 |
| T373 | Photo Aspect | TI09 | front | Upload landscape in bottom slot | Canvas | Photo cropped correctly | Screenshot | P1 |
| T374 | Photo Crop | TI05 | front | Crop uploaded photo (useCrop=true) | Canvas | Crop applied to photo | Screenshot | P1 |
| T375 | Photo Crop | TI05 | front | Crop uploaded photo | Preview | Preview shows cropped photo | Screenshot | P1 |
| T376 | Photo Crop | TI05 | front | Crop uploaded photo | PDF | PDF shows cropped photo | Open PDF | P1 |
| T377 | Photo Crop | TI06 | front | Crop photo in L-form slot | Canvas | Crop applied within border | Screenshot | P1 |
| T378 | Photo Crop | TI07 | back | Crop photo in rounded slot | Canvas | Crop applied within rounded clip | Screenshot | P1 |
| T379 | Photo Crop | TI08 | back | Crop photo in ellipse slot | Canvas | Crop applied within ellipse | Screenshot | P1 |
| T380 | Photo Crop | TI09 | front | Crop photo in bottom slot | Canvas | Crop applied within rounded clip | Screenshot | P1 |
| T381 | Photo Crop | TI05 | front | Crop, undo, verify original crop | Canvas | Original crop restored | E2E | P1 |
| T382 | Photo Crop | TI05 | front | Crop, preview, crop again, preview | Preview | Latest crop in preview | E2E | P1 |
| T383 | Photo Format | TI05 | front | Upload JPEG photo | Canvas | JPEG renders correctly | Screenshot | P1 |
| T384 | Photo Format | TI05 | front | Upload PNG photo | Canvas | PNG renders correctly | Screenshot | P1 |
| T385 | Photo Format | TI05 | front | Upload PNG with transparency | Canvas | Transparency handled (white bg or preserved) | Screenshot | P2 |
| T386 | Photo Format | TI05 | front | Upload WebP photo | Canvas | WebP renders or error shown | Screenshot | P2 |
| T387 | Photo Format | TI05 | front | Upload HEIC photo (iPhone) | Canvas | HEIC converts or error message shown | Manual | P2 |
| T388 | Photo Format | TI05 | front | Upload SVG (invalid image type) | Canvas | Error message or graceful rejection | Manual | P2 |
| T389 | Photo Format | TI05 | front | Upload non-image file (.txt) | Canvas | Error message shown, no crash | Manual | P1 |
| T390 | Photo Persist | TI05 | front | Upload photo, switch page, come back | Canvas | Photo preserved after navigation | E2E | P0 |
| T391 | Photo Persist | TI05 | front | Upload photo, reload page | Canvas | Photo preserved in draft | E2E | P0 |
| T392 | Photo Persist | TI06 | front | Upload photo, reload page | Canvas | Photo preserved in draft | E2E | P0 |
| T393 | Photo Persist | TI07 | back | Upload photo, reload page | Canvas | Photo preserved in draft | E2E | P0 |
| T394 | Photo Persist | TI08 | back | Upload photo, reload page | Canvas | Photo preserved in draft | E2E | P0 |
| T395 | Photo Persist | TI09 | front | Upload photo, reload page | Canvas | Photo preserved in draft | E2E | P0 |
| T396 | Photo + Cover | TI05 | both | Upload cover AND portrait photo | Canvas | Both photos independent, correct pages | Screenshot | P0 |
| T397 | Photo + Cover | TI05 | both | Upload both, preview | Preview | Both photos visible in preview | Screenshot | P0 |
| T398 | Photo + Cover | TI05 | both | Upload both, PDF | PDF | Both photos in PDF | Open PDF | P0 |
| T399 | Photo + Cover | TI07 | both | Upload cover AND portrait photo | Canvas | Cover on outside, portrait on back (rounded) | Screenshot | P0 |
| T400 | Photo + Cover | TI08 | both | Upload cover AND portrait photo | Canvas | Cover on outside, portrait on back (ellipse) | Screenshot | P0 |
| T401 | Photo + Cover | TI09 | both | Upload cover AND portrait photo | Canvas | Cover on outside, portrait on front (bottom) | Screenshot | P0 |
| T402 | Photo Delete | TI05 | front | Delete portrait photo | Canvas | Photo removed, placeholder or empty | Screenshot | P1 |
| T403 | Photo Delete | TI05 | front | Delete portrait photo, undo | Canvas | Photo restored | E2E | P1 |
| T404 | Photo Delete | TI06 | front | Delete portrait photo | Canvas | L-form layout without photo | Screenshot | P1 |
| T405 | Photo Delete | TI07 | back | Delete portrait photo | Canvas | Back page without photo | Screenshot | P1 |
| T406 | Photo Delete | TI08 | back | Delete portrait photo | Canvas | Back page without photo | Screenshot | P1 |
| T407 | Photo Delete | TI09 | front | Delete portrait photo | Canvas | Front page without bottom photo | Screenshot | P1 |
| T408 | Photo Dark | TI05 | outside-spread | Upload very dark cover photo | Canvas | Fold line still visible against dark bg | Screenshot | P2 |
| T409 | Photo Dark | TI05 | front | Upload very dark portrait | Canvas | Photo displays correctly | Screenshot | P2 |
| T410 | Photo Light | TI05 | outside-spread | Upload very light/white cover | Canvas | Card edges distinguishable from background | Screenshot | P2 |
| T411 | Photo Light | TI07 | back | Upload very light portrait | Canvas | Photo border visible against light photo | Screenshot | P2 |
| T412 | Photo Face | TI05 | front | Upload portrait with face at top | Canvas | Face not cropped off (face centering) | Screenshot | P1 |
| T413 | Photo Face | TI06 | front | Upload portrait with face at top | Canvas | Face visible in L-form slot | Screenshot | P1 |
| T414 | Photo Face | TI07 | back | Upload portrait with face at top | Canvas | Face visible in rounded slot | Screenshot | P1 |
| T415 | Photo Face | TI08 | back | Upload portrait with face at top | Canvas | Face visible in ellipse slot | Screenshot | P1 |
| T416 | Photo Face | TI09 | front | Upload portrait with face at top | Canvas | Face visible in bottom slot | Screenshot | P1 |
| T417 | Photo Clip | TI06 | front | Verify imageBorder "1px solid #ddd" | Canvas | Thin border around photo | Screenshot | P1 |
| T418 | Photo Clip | TI07 | back | Verify imageClip "rounded" | Canvas | Rounded corners on photo | Screenshot | P1 |
| T419 | Photo Clip | TI07 | back | Verify imageBorder "1px solid #ddd" | Canvas | Border around rounded photo | Screenshot | P1 |
| T420 | Photo Clip | TI08 | back | Verify imageClip "ellipse" | Canvas | Elliptical clip on photo | Screenshot | P1 |
| T421 | Photo Clip | TI06 | front | Photo border visible in preview | Preview | Border renders in HTML preview | Screenshot | P1 |
| T422 | Photo Clip | TI06 | front | Photo border visible in PDF | PDF | Border renders in PDF | Open PDF | P1 |
| T423 | Photo Clip | TI07 | back | Rounded clip visible in preview | Preview | Rounded corners in HTML | Screenshot | P1 |
| T424 | Photo Clip | TI07 | back | Rounded clip visible in PDF | PDF | Rounded corners in PDF | Open PDF | P1 |
| T425 | Photo Clip | TI08 | back | Ellipse clip visible in preview | Preview | Ellipse clip in HTML | Screenshot | P1 |
| T426 | Photo Clip | TI08 | back | Ellipse clip visible in PDF | PDF | Ellipse clip in PDF | Open PDF | P1 |
| T427 | Photo imageFit | TI05 | front | Verify imageFit "cover" behavior | Canvas | Photo covers entire area, centered crop | Screenshot | P1 |
| T428 | Photo imageFit | TI06 | front | Verify imageFit "cover" on L-form | Canvas | Photo covers 350x500 area | Screenshot | P1 |
| T429 | Photo imageFit | TI07 | back | Verify imageFit "cover" on back | Canvas | Photo covers 700x670 area | Screenshot | P1 |
| T430 | Photo imageFit | TI08 | back | Verify imageFit "cover" on back | Canvas | Photo covers 800x750 area | Screenshot | P1 |
| T431 | Photo imageFit | TI07 | front | Verify ornament imageFit "contain" | Canvas | Ornament fully visible, not cropped | Screenshot | P1 |
| T432 | Photo imageFit | TI08 | front | Verify ornament imageFit "contain" | Canvas | Cross fully visible, not cropped | Screenshot | P1 |
| T433 | Photo imageFit | TI09 | front | Verify ornament imageFit "contain" | Canvas | Floral divider fully visible | Screenshot | P1 |
| T434 | Photo Drag | TI05 | front | Drag photo on canvas | Canvas | Photo moves to new position | Manual | P1 |
| T435 | Photo Drag | TI06 | front | Drag photo in L-form | Canvas | Photo stays within bounds | Manual | P1 |
| T436 | Photo Resize | TI05 | front | Resize photo on canvas | Canvas | Photo resizes maintaining aspect | Manual | P1 |
| T437 | Photo Resize | TI06 | front | Resize photo in L-form | Canvas | Photo resizes | Manual | P1 |
| T438 | Photo Resize | TI07 | back | Resize photo (rounded) | Canvas | Photo + clip resize together | Manual | P1 |
| T439 | Photo Resize | TI08 | back | Resize photo (ellipse) | Canvas | Photo + clip resize together | Manual | P1 |
| T440 | Photo Resize | TI09 | front | Resize photo (rounded bottom) | Canvas | Photo + clip resize together | Manual | P1 |
| T441 | Photo Upload | TI04 | front | Attempt to add photo to text-only template | Canvas | Photo can be added (requiresPhoto=false but addable) | Manual | P2 |
| T442 | Photo Upload | TI05 | front | Upload, crop, replace, verify crop reset | Canvas | Old crop cleared on new photo | E2E | P1 |
| T443 | Photo Upload | TI05 | front | Upload, switch template, photo gone | Canvas | Photo cleared on template switch | E2E | P1 |
| T444 | Photo Upload | TI06 | front | Upload, switch template to TI07, photo position changes | Canvas | Photo moves to back page (TI07 layout) | E2E | P1 |
| T445 | Photo Upload | TI05 | front | Upload photo, drag off-canvas | Canvas | Photo stays within canvas bounds | Manual | P2 |
| T446 | Photo Upload | TI05 | front | Upload rotated EXIF photo (90 deg) | Canvas | Photo orientation corrected | Screenshot | P2 |

---

## Category 5: Page Navigation (T447-T506)

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| T447 | Navigation | TI04 | outside-left | Click Aussen links tab | Canvas | Outside-spread canvas shown, left half | Screenshot | P0 |
| T448 | Navigation | TI04 | outside-right | Click Aussen rechts tab | Canvas | Outside-spread canvas shown, right half | Screenshot | P0 |
| T449 | Navigation | TI04 | front | Click Innen links tab | Canvas | Front page canvas shown | Screenshot | P0 |
| T450 | Navigation | TI04 | back | Click Innen rechts tab | Canvas | Back page canvas shown (if exists) | Screenshot | P1 |
| T451 | Navigation | TI05 | outside-left to front | Click Innen links | Canvas | Switches from cover to photo page | Screenshot | P0 |
| T452 | Navigation | TI05 | front to back | Click Innen rechts | Canvas | Switches from photo to text page | Screenshot | P0 |
| T453 | Navigation | TI05 | back to outside-right | Click Aussen rechts | Canvas | Switches from text to cover right | Screenshot | P0 |
| T454 | Navigation | TI05 | outside-right to outside-left | Click Aussen links | Canvas | Switches to cover left (same canvas) | Screenshot | P0 |
| T455 | Navigation | TI06 | all | Navigate through all 4 pages sequentially | Canvas | Each page loads with correct content | E2E | P0 |
| T456 | Navigation | TI07 | all | Navigate through all 4 pages sequentially | Canvas | Each page loads correctly | E2E | P0 |
| T457 | Navigation | TI08 | all | Navigate through all 4 pages sequentially | Canvas | Each page loads correctly | E2E | P0 |
| T458 | Navigation | TI09 | all | Navigate through all 4 pages sequentially | Canvas | Each page loads correctly | E2E | P0 |
| T459 | Navigation | TI05 | outside-left | Click thumbnail in SpreadNavigator | Canvas | Navigates to correct page | Screenshot | P0 |
| T460 | Navigation | TI05 | front | Click front thumbnail | Canvas | Navigates to front page | Screenshot | P0 |
| T461 | Navigation | TI05 | back | Click back thumbnail | Canvas | Navigates to back page | Screenshot | P0 |
| T462 | Navigation | TI05 | front to back to front | Rapid switching (3 clicks in 1 sec) | Canvas | Ends on correct page, no corruption | Manual | P1 |
| T463 | Navigation | TI07 | all | 10 rapid page switches | Canvas | No crash, final page correct | Manual | P1 |
| T464 | Navigation | TI05 | front | Edit text on front, navigate to back, back to front | Canvas | Text edits preserved | E2E | P0 |
| T465 | Navigation | TI05 | back | Edit text on back, navigate to front, back to back | Canvas | Text edits preserved | E2E | P0 |
| T466 | Navigation | TI07 | front | Edit on front, go to back, go to front | Canvas | Ornament + text still correct | E2E | P0 |
| T467 | Navigation | TI05 | front | Upload photo on front, go to back, go to front | Canvas | Photo preserved | E2E | P0 |
| T468 | Navigation | TI05 | outside-left | Thumbnail shows left half of outside-spread | Thumbnail | Left crop of cover photo | Screenshot | P1 |
| T469 | Navigation | TI05 | outside-right | Thumbnail shows right half of outside-spread | Thumbnail | Right crop of cover photo | Screenshot | P1 |
| T470 | Navigation | TI05 | front | Thumbnail shows photo page | Thumbnail | Portrait photo visible | Screenshot | P1 |
| T471 | Navigation | TI05 | back | Thumbnail shows text page | Thumbnail | Text layout visible | Screenshot | P1 |
| T472 | Navigation | TI04 | all | Active page highlighted in SpreadNavigator | Canvas | Selected tab/thumbnail has ring/highlight | Screenshot | P1 |
| T473 | Navigation | TI05 | all | Active page highlighted in SpreadNavigator | Canvas | Selected tab has visual indicator | Screenshot | P1 |
| T474 | Navigation | TI05 | outside-left | Fold line visible on outside-left | Canvas | Dashed fold line at center | Screenshot | P1 |
| T475 | Navigation | TI05 | outside-right | Fold line visible on outside-right | Canvas | Dashed fold line at center | Screenshot | P1 |
| T476 | Navigation | TI05 | front | Fold line NOT visible on front page | Canvas | No fold line on inner pages | Screenshot | P1 |
| T477 | Navigation | TI05 | back | Fold line NOT visible on back page | Canvas | No fold line on inner pages | Screenshot | P1 |
| T478 | Navigation | TI04 | outside-left | Edit cover, thumbnail left updates | Thumbnail | Left thumbnail reflects edit | Screenshot | P1 |
| T479 | Navigation | TI04 | outside-right | Edit cover, thumbnail right updates | Thumbnail | Right thumbnail reflects edit | Screenshot | P1 |
| T480 | Navigation | TI05 | front | Edit photo, thumbnail updates | Thumbnail | Front thumbnail shows new photo | Screenshot | P1 |
| T481 | Navigation | TI05 | back | Edit text, thumbnail updates | Thumbnail | Back thumbnail shows text change | Screenshot | P1 |
| T482 | Navigation | TI06 | front | Navigate to front, canvas width = 413px | Canvas | Inner page half-width | Inspect | P1 |
| T483 | Navigation | TI06 | back | Navigate to back, canvas width = 413px | Canvas | Inner page half-width | Inspect | P1 |
| T484 | Navigation | TI05 | outside-spread | Navigate to outside, canvas width = 827px | Canvas | Full spread width | Inspect | P1 |
| T485 | Navigation | TI04 | all | Keyboard navigation (if supported) | Canvas | Arrow keys or tabs work | Manual | P3 |
| T486 | Navigation | TI05 | all | Page labels in German | Canvas | Labels match: Aussen links, Aussen rechts, Innen links, Innen rechts | Screenshot | P1 |
| T487 | Navigation | TI05 | front | Select element on front, switch page, switch back | Canvas | No element selected after return | E2E | P2 |
| T488 | Navigation | TI05 | back | Undo on back, switch to front, undo on front | Canvas | Per-page undo stacks work correctly | E2E | P1 |
| T489 | Navigation | TI07 | front | Undo on front, switch to back, switch to front, redo | Canvas | Redo works after page switch | E2E | P1 |
| T490 | Navigation | TI05 | all | Navigate all pages, preview, all pages in preview | Preview | Preview shows all pages in correct order | E2E | P0 |
| T491 | Navigation | TI05 | all | Navigate all pages, PDF, all pages in PDF | PDF | PDF has correct page count/order | E2E | P0 |
| T492 | Navigation | TI05 | front | Switch pages during photo upload | Canvas | Photo upload completes on correct page | Manual | P2 |
| T493 | Navigation | TI04 | all | Pages maintain independent state | Canvas | Each page's Fabric.js canvas serialized independently | Inspect | P1 |
| T494 | Navigation | TI05 | front | Inside pages NOT visible when on outside-spread | Canvas | Only cover visible on outside tab | Screenshot | P0 |
| T495 | Navigation | TI05 | outside-spread | Outside spread NOT visible when on inside page | Canvas | Only inner page visible on inside tab | Screenshot | P0 |
| T496 | Navigation | TI04 | front | Text-only template front has no photo slot | Canvas | No "click to add photo" on front for TI04 | Screenshot | P1 |
| T497 | Navigation | TI07 | front | Front shows ornament + text (not photo) | Canvas | Ornament on left, text fields on right | Screenshot | P0 |
| T498 | Navigation | TI07 | back | Back shows photo (not text) | Canvas | Photo fills most of back page | Screenshot | P0 |
| T499 | Navigation | TI08 | front | Front shows cross + text (not photo) | Canvas | Cross on left, text on right | Screenshot | P0 |
| T500 | Navigation | TI08 | back | Back shows photo (not text) | Canvas | Ellipse photo fills back page | Screenshot | P0 |
| T501 | Navigation | TI09 | front | Front shows ornament + name + dates + photo | Canvas | All elements present | Screenshot | P0 |
| T502 | Navigation | TI09 | back | Back shows quote + line + verse | Canvas | Text elements only | Screenshot | P0 |
| T503 | Navigation | TI05 | front | Upload photo on wrong page (attempt on outside) | Canvas | Photo goes to correct slot or error | Manual | P2 |
| T504 | Navigation | TI05 | all | Switch pages 20 times rapidly | Canvas | No memory leak (Performance tab) | Inspect | P2 |
| T505 | Navigation | TI04 | front | Scroll SpreadNavigator horizontally | Canvas | All thumbnails accessible | Manual | P2 |
| T506 | Navigation | TI05 | all | Touch-swipe between pages (mobile) | Canvas | Swipe navigation works if implemented | Manual mobile | P3 |

---

## Category 6: Cover Mode Switch - Vollbild/Halbbild (T507-T546)

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| T507 | Cover Mode | TI05 | outside-spread | Default cover mode = Vollbild | Canvas | Cover photo fills entire spread | Screenshot | P0 |
| T508 | Cover Mode | TI05 | outside-spread | Switch to Halbbild | Canvas | Cover photo only on left half | Screenshot | P0 |
| T509 | Cover Mode | TI05 | outside-spread | Switch to Halbbild | Thumbnail | Left thumbnail shows photo, right shows blank/color | Screenshot | P0 |
| T510 | Cover Mode | TI05 | outside-spread | Switch to Halbbild | Preview | Preview shows half-cover layout | Screenshot | P0 |
| T511 | Cover Mode | TI05 | outside-spread | Switch to Halbbild | PDF | PDF page 1 shows half-cover | Open PDF | P0 |
| T512 | Cover Mode | TI05 | outside-spread | Switch Halbbild to Vollbild | Canvas | Cover photo fills entire spread again | Screenshot | P0 |
| T513 | Cover Mode | TI05 | outside-spread | Switch Halbbild to Vollbild | Preview | Preview shows full-cover | Screenshot | P0 |
| T514 | Cover Mode | TI05 | outside-spread | Switch Halbbild to Vollbild | PDF | PDF page 1 shows full-cover | Open PDF | P0 |
| T515 | Cover Mode | TI06 | outside-spread | Switch to Halbbild | Canvas | Half-cover layout | Screenshot | P1 |
| T516 | Cover Mode | TI07 | outside-spread | Switch to Halbbild | Canvas | Half-cover layout | Screenshot | P1 |
| T517 | Cover Mode | TI08 | outside-spread | Switch to Halbbild | Canvas | Half-cover layout | Screenshot | P1 |
| T518 | Cover Mode | TI09 | outside-spread | Switch to Halbbild | Canvas | Half-cover layout | Screenshot | P1 |
| T519 | Cover Mode | TI04 | outside-spread | Switch to Halbbild | Canvas | Half-cover layout | Screenshot | P1 |
| T520 | Cover Mode | TI05 | outside-spread | Vollbild, upload new cover, switch to Halbbild | Canvas | New cover shows in half mode | E2E | P1 |
| T521 | Cover Mode | TI05 | outside-spread | Halbbild, upload new cover, switch to Vollbild | Canvas | New cover fills full spread | E2E | P1 |
| T522 | Cover Mode | TI05 | outside-spread | Switch mode, switch page, come back | Canvas | Mode preserved | E2E | P0 |
| T523 | Cover Mode | TI05 | outside-spread | Switch mode, reload page | Canvas | Mode preserved in draft | E2E | P0 |
| T524 | Cover Mode | TI05 | outside-spread | Switch mode, undo | Canvas | Previous mode restored | E2E | P1 |
| T525 | Cover Mode | TI05 | outside-spread | Switch mode, undo, redo | Canvas | New mode restored | E2E | P1 |
| T526 | Cover Mode | TI05 | outside-spread | Rapid mode toggle (5 times in 2 sec) | Canvas | No crash, final state correct | Manual | P2 |
| T527 | Cover Mode | TI05 | outside-spread | Halbbild: right half shows what? | Canvas | Right half shows background color/pattern | Screenshot | P1 |
| T528 | Cover Mode | TI05 | outside-left | Halbbild: left thumbnail shows photo | Thumbnail | Photo visible in left thumbnail | Screenshot | P1 |
| T529 | Cover Mode | TI05 | outside-right | Halbbild: right thumbnail shows blank | Thumbnail | No photo in right thumbnail | Screenshot | P1 |
| T530 | Cover Mode | TI06 | outside-spread | Halbbild, Preview, full-width check | Preview | Preview correctly shows half-cover | Screenshot | P1 |
| T531 | Cover Mode | TI07 | outside-spread | Halbbild, PDF, dimension check | PDF | PDF dimensions still correct | Open PDF | P1 |
| T532 | Cover Mode | TI05 | outside-spread | Switch template while in Halbbild mode | Canvas | Mode resets to default for new template | E2E | P1 |
| T533 | Cover Mode | TI05 | outside-spread | Halbbild with dark cover photo | Canvas | Fold line visible against photo edge | Screenshot | P2 |
| T534 | Cover Mode | TI05 | outside-spread | Halbbild with light cover photo | Canvas | Photo edge distinguishable from blank half | Screenshot | P2 |
| T535 | Cover Mode | TI05 | outside-spread | Vollbild, crop cover photo, switch to Halbbild | Canvas | Crop preserved in half mode | E2E | P2 |
| T536 | Cover Mode | TI06 | outside-spread | Halbbild, Preview, Canvas matches Preview | All | Visual consistency across outputs | Screenshot | P1 |
| T537 | Cover Mode | TI07 | outside-spread | Halbbild, PDF, Preview matches PDF | All | Visual consistency | Screenshot | P1 |
| T538 | Cover Mode | TI08 | outside-spread | Halbbild, Preview, verify | All | Consistent | Screenshot | P1 |
| T539 | Cover Mode | TI09 | outside-spread | Halbbild, Preview, verify | All | Consistent | Screenshot | P1 |
| T540 | Cover Mode | TI04 | outside-spread | Halbbild, Preview, verify | All | Consistent | Screenshot | P1 |
| T541 | Cover Mode | TI05 | outside-spread | Vollbild: cover photo doesn't bleed to inner pages | Canvas | Inner pages unaffected by cover | Screenshot | P0 |
| T542 | Cover Mode | TI05 | outside-spread | Halbbild: cover photo doesn't bleed to inner pages | Canvas | Inner pages unaffected | Screenshot | P0 |
| T543 | Cover Mode | TI05 | outside-spread | Mode switch button accessible (not hidden) | Canvas | Button visible and labeled | Screenshot | P1 |
| T544 | Cover Mode | TI05 | outside-spread | Mode switch button not visible on inner pages | Canvas | Button hidden on front/back tabs | Screenshot | P1 |
| T545 | Cover Mode | TI04 | outside-spread | Text-only template: mode switch available? | Canvas | Button should exist (cover photo still has mode) | Screenshot | P2 |
| T546 | Cover Mode | TI05 | outside-spread | Halbbild + custom cover photo, PDF, print-quality | PDF | Photo resolution maintained in half mode | Open PDF | P2 |

---

## Category 7: Template Switching (T547-T582)

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| T547 | Template Switch | TI04 to TI05 | all | Switch from TI04 to TI05 | Canvas | TI05 layout loads with TI05 placeholder data | Screenshot | P0 |
| T548 | Template Switch | TI05 to TI06 | all | Switch from TI05 to TI06 | Canvas | TI06 layout loads, L-form | Screenshot | P0 |
| T549 | Template Switch | TI06 to TI07 | all | Switch from TI06 to TI07 | Canvas | TI07 layout with ornament | Screenshot | P0 |
| T550 | Template Switch | TI07 to TI08 | all | Switch from TI07 to TI08 | Canvas | TI08 layout with cross + ellipse | Screenshot | P0 |
| T551 | Template Switch | TI08 to TI09 | all | Switch from TI08 to TI09 | Canvas | TI09 layout with floral divider | Screenshot | P0 |
| T552 | Template Switch | TI09 to TI04 | all | Switch from TI09 to TI04 | Canvas | TI04 text-only layout, no photo | Screenshot | P0 |
| T553 | Template Switch | TI05 to TI04 | all | Switch photo template to text-only | Canvas | Photo slot removed, text layout changed | Screenshot | P0 |
| T554 | Template Switch | TI04 to TI07 | all | Switch text-only to ornament+photo | Canvas | Ornament and photo slot appear | Screenshot | P0 |
| T555 | Template Switch | TI05 | all | Edit text, switch template, edits gone | Canvas | Old edits NOT preserved (fresh template data) | E2E | P0 |
| T556 | Template Switch | TI05 | all | Upload photo, switch template, photo gone | Canvas | Old photo NOT preserved | E2E | P0 |
| T557 | Template Switch | TI07 | all | Change font, switch template, font reset | Canvas | Font reset to template default | E2E | P1 |
| T558 | Template Switch | TI05 | all | Switch template, switch back, original placeholder data | Canvas | Fresh placeholder data, not user's old edits | E2E | P1 |
| T559 | Template Switch | TI05 to TI06 | all | Switch, verify SpreadNavigator updates | Thumbnail | Page count and labels correct for new template | Screenshot | P1 |
| T560 | Template Switch | TI04 to TI05 | all | Switch, verify page labels update | Canvas | Labels change from TI04 to TI05 layout | Screenshot | P1 |
| T561 | Template Switch | TI05 | all | Switch template, preview, correct template shown | Preview | Preview matches new template | E2E | P0 |
| T562 | Template Switch | TI05 | all | Switch template, PDF, correct template | PDF | PDF matches new template | E2E | P0 |
| T563 | Template Switch | TI05 | all | Switch template, reload, draft cleared or updated | Canvas | Draft shows new template | E2E | P1 |
| T564 | Template Switch | TI04 to TI05 | all | Confirmation dialog before switch? | Canvas | User warned about losing edits (if implemented) | Manual | P2 |
| T565 | Template Switch | TI05 to TI07 | all | Photo page changes position (front to back) | Canvas | Photo slot on correct page for TI07 | Screenshot | P0 |
| T566 | Template Switch | TI06 to TI08 | all | Photo clip changes (border to ellipse) | Canvas | Ellipse clip on TI08 | Screenshot | P0 |
| T567 | Template Switch | TI07 to TI09 | all | Ornament changes (cross to floral) | Canvas | Floral divider on TI09 | Screenshot | P0 |
| T568 | Template Switch | TI05 to TI07 | all | Fields change (no locationBirth to has locationBirth) | Canvas | Location fields appear | Screenshot | P1 |
| T569 | Template Switch | TI07 to TI05 | all | Fields change (locationBirth to no locationBirth) | Canvas | Location fields disappear | Screenshot | P1 |
| T570 | Template Switch | TI05 to TI09 | all | New field appears (closingVerse) | Canvas | Closing verse visible with placeholder | Screenshot | P1 |
| T571 | Template Switch | TI09 to TI05 | all | Field disappears (closingVerse) | Canvas | No closing verse on TI05 | Screenshot | P1 |
| T572 | Template Switch | TI04 to TI05 | all | Dimensions remain 140x105mm | Canvas | Same dimensions | Inspect | P1 |
| T573 | Template Switch | TI05 to TE01 | all | Switch bifold to single card | Canvas | No bifold pages, only front/back (Vorderseite/Ruckseite) | Screenshot | P1 |
| T574 | Template Switch | TE01 to TI05 | all | Switch single to bifold | Canvas | 4 bifold pages appear | Screenshot | P1 |
| T575 | Template Switch | TI05 | all | Rapid template switching (5 templates in 3 sec) | Canvas | No crash, final template renders correctly | Manual | P2 |
| T576 | Template Switch | TI05 to TI06 | all | Switch after undo/redo operations | Canvas | Undo history cleared for new template | E2E | P2 |
| T577 | Template Switch | TI07 | all | Switch while on back page (photo page) | Canvas | New template starts on first page | E2E | P1 |
| T578 | Template Switch | TI05 | all | Switch while preview modal open | Preview | Modal closes, new template loads | Manual | P2 |
| T579 | Template Switch | TI05 | all | Template picker shows all 6 bifold templates | Canvas | TI04-TI09 visible in picker | Screenshot | P1 |
| T580 | Template Switch | TI05 | all | Template picker shows correct thumbnails | Canvas | Each template has representative thumbnail | Screenshot | P1 |
| T581 | Template Switch | TI05 | all | Current template highlighted in picker | Canvas | Active template visually distinguished | Screenshot | P2 |
| T582 | Template Switch | TI05 | all | Template picker accessible on all pages | Canvas | Picker button/panel visible from any page | Screenshot | P1 |

---

## Category 8: Preview (Vorschau) (T583-T632)

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| T583 | Preview | TI04 | all | Click Vorschau button | Preview | Modal opens with card preview | Screenshot | P0 |
| T584 | Preview | TI04 | all | Preview shows outside-spread | Preview | Cover photo visible | Screenshot | P0 |
| T585 | Preview | TI04 | all | Preview shows front page | Preview | Text layout visible | Screenshot | P0 |
| T586 | Preview | TI05 | all | Preview shows all 3 spreads | Preview | Cover + photo page + text page | Screenshot | P0 |
| T587 | Preview | TI05 | all | Preview shows correct order | Preview | Outside first, then inner pages | Screenshot | P0 |
| T588 | Preview | TI06 | all | Preview shows L-form layout | Preview | Photo left, text right, quote bottom | Screenshot | P0 |
| T589 | Preview | TI07 | all | Preview shows ornament + text + photo | Preview | All elements in correct positions | Screenshot | P0 |
| T590 | Preview | TI08 | all | Preview shows cross + text + ellipse photo | Preview | All elements correct | Screenshot | P0 |
| T591 | Preview | TI09 | all | Preview shows ornament + name + photo + quote + verse | Preview | All elements correct | Screenshot | P0 |
| T592 | Preview | TI05 | all | Preview reflects text edits | Preview | Edited text visible | E2E | P0 |
| T593 | Preview | TI05 | all | Preview reflects font changes | Preview | Correct font rendered | E2E | P0 |
| T594 | Preview | TI05 | all | Preview reflects color changes | Preview | Correct text color | E2E | P0 |
| T595 | Preview | TI05 | all | Preview reflects photo upload | Preview | Uploaded photo visible | E2E | P0 |
| T596 | Preview | TI05 | all | Preview reflects cover photo change | Preview | New cover visible | E2E | P0 |
| T597 | Preview | TI05 | all | Preview reflects cover mode (Halbbild) | Preview | Half-cover layout | E2E | P0 |
| T598 | Preview | TI05 | all | Preview reflects element drag/resize | Preview | Moved elements in new position | E2E | P1 |
| T599 | Preview | TI05 | all | Preview matches canvas | Preview+Canvas | Visual comparison shows match | Visual compare | P0 |
| T600 | Preview | TI06 | all | Preview matches canvas | Preview+Canvas | Visual comparison shows match | Visual compare | P0 |
| T601 | Preview | TI07 | all | Preview matches canvas | Preview+Canvas | Visual comparison shows match | Visual compare | P0 |
| T602 | Preview | TI08 | all | Preview matches canvas | Preview+Canvas | Visual comparison shows match | Visual compare | P0 |
| T603 | Preview | TI09 | all | Preview matches canvas | Preview+Canvas | Visual comparison shows match | Visual compare | P0 |
| T604 | Preview | TI04 | all | Preview matches canvas | Preview+Canvas | Visual comparison shows match | Visual compare | P0 |
| T605 | Preview | TI05 | all | Close preview modal | Canvas | Canvas still functional after close | E2E | P0 |
| T606 | Preview | TI05 | all | Open preview, close, edit, open again | Preview | Second preview reflects new edits | E2E | P0 |
| T607 | Preview | TI05 | all | Preview scale fits modal | Preview | Card scales to fit without scrolling | Screenshot | P1 |
| T608 | Preview | TI05 | all | Preview shows fold line? | Preview | Fold line NOT in preview (print artifact) | Screenshot | P1 |
| T609 | Preview | TI05 | all | Preview shows grid? | Preview | Grid NOT in preview | Screenshot | P1 |
| T610 | Preview | TI05 | all | Preview shows bleed zone? | Preview | Bleed NOT in preview | Screenshot | P1 |
| T611 | Preview | TI05 | all | Preview shows safe zone? | Preview | Safe zone NOT in preview | Screenshot | P1 |
| T612 | Preview | TI05 | all | Preview loading time < 3 seconds | Preview | Modal opens within 3 seconds | Timer | P1 |
| T613 | Preview | TI05 | all | Preview with large photo (10MB) | Preview | Preview renders within reasonable time | Timer | P2 |
| T614 | Preview | TI07 | all | Preview: ornament renders (not broken image) | Preview | Ornament PNG loads in HTML preview | Screenshot | P0 |
| T615 | Preview | TI08 | all | Preview: cross ornament renders | Preview | Cross PNG loads in HTML preview | Screenshot | P0 |
| T616 | Preview | TI09 | all | Preview: floral divider renders | Preview | Floral SVG loads in HTML preview | Screenshot | P0 |
| T617 | Preview | TI05 | all | Preview: lines render correctly | Preview | Top line and mid line visible | Screenshot | P1 |
| T618 | Preview | TI09 | all | Preview: horizontal line renders | Preview | Line visible between quote and verse | Screenshot | P1 |
| T619 | Preview | TI06 | all | Preview: photo border renders | Preview | 1px solid #ddd border on photo | Screenshot | P1 |
| T620 | Preview | TI07 | all | Preview: rounded clip renders | Preview | Rounded corners on photo | Screenshot | P1 |
| T621 | Preview | TI08 | all | Preview: ellipse clip renders | Preview | Elliptical clip on photo | Screenshot | P1 |
| T622 | Preview | TI05 | all | Preview dimensions correct for print | Preview | Proportions match 140x105mm | Inspect | P1 |
| T623 | Preview | TI05 | all | Preview text not cut off | Preview | All text fully visible within bounds | Screenshot | P0 |
| T624 | Preview | TI07 | all | Preview text not overlapping ornament | Preview | Text and ornament don't overlap | Screenshot | P0 |
| T625 | Preview | TI08 | all | Preview text not overlapping cross | Preview | Text and cross don't overlap | Screenshot | P0 |
| T626 | Preview | TI05 | all | Preview mobile viewport | Preview | Preview scales correctly on mobile | Screenshot mobile | P1 |
| T627 | Preview | TI05 | all | Preview ESC key closes modal | Preview | Modal closes on ESC | Manual | P2 |
| T628 | Preview | TI05 | all | Preview click outside closes modal | Preview | Modal closes on backdrop click | Manual | P2 |
| T629 | Preview | TI05 | all | Preview from different pages (start on back) | Preview | Same preview regardless of active page | E2E | P1 |
| T630 | Preview | TI04 | all | Text-only template preview (no photo) | Preview | Clean text layout, no photo placeholder | Screenshot | P0 |
| T631 | Preview | TI05 | all | Preview auto-shrunk text matches canvas | Preview+Canvas | Auto-shrunk text same size in both | Visual compare | P1 |
| T632 | Preview | TI05 | all | Preview with per-element overrides | Preview | Overrides (position, size, font) reflected | E2E | P1 |

---

## Category 9: PDF Download (T633-T692)

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| T633 | PDF | TI04 | all | Download PDF | PDF | PDF file downloads successfully | Browser | P0 |
| T634 | PDF | TI04 | all | PDF page count | PDF | Correct number of pages (2: outside + inner) | Open PDF | P0 |
| T635 | PDF | TI04 | all | PDF page 1 dimensions | PDF | 140x105mm (full spread) | PDF properties | P0 |
| T636 | PDF | TI04 | all | PDF page 2-3 dimensions | PDF | 70x105mm each (half pages) | PDF properties | P0 |
| T637 | PDF | TI05 | all | Download PDF | PDF | PDF downloads | Browser | P0 |
| T638 | PDF | TI05 | all | PDF page 1: cover photo | PDF | Cover photo fills page 1 | Open PDF | P0 |
| T639 | PDF | TI05 | all | PDF page 2: portrait photo | PDF | Photo fills inner-left page | Open PDF | P0 |
| T640 | PDF | TI05 | all | PDF page 3: text | PDF | Text layout on inner-right page | Open PDF | P0 |
| T641 | PDF | TI06 | all | Download PDF with L-form layout | PDF | Photo+text L-form on inner page | Open PDF | P0 |
| T642 | PDF | TI07 | all | Download PDF with ornament | PDF | Ornament+text front, photo back | Open PDF | P0 |
| T643 | PDF | TI08 | all | Download PDF with cross+ellipse | PDF | Cross+text front, ellipse photo back | Open PDF | P0 |
| T644 | PDF | TI09 | all | Download PDF with floral+verse | PDF | All elements present | Open PDF | P0 |
| T645 | PDF | TI05 | all | PDF reflects text edits | PDF | Edited text in PDF | Open PDF | P0 |
| T646 | PDF | TI05 | all | PDF reflects font changes | PDF | Correct font in PDF | Open PDF | P0 |
| T647 | PDF | TI05 | all | PDF reflects color changes | PDF | Correct text color in PDF | Open PDF | P0 |
| T648 | PDF | TI05 | all | PDF reflects photo upload | PDF | Uploaded photo in PDF | Open PDF | P0 |
| T649 | PDF | TI05 | all | PDF reflects cover photo | PDF | Custom cover in PDF | Open PDF | P0 |
| T650 | PDF | TI05 | all | PDF reflects Halbbild mode | PDF | Half-cover in PDF | Open PDF | P0 |
| T651 | PDF | TI05 | all | PDF reflects element position changes | PDF | Moved elements in new positions | Open PDF | P1 |
| T652 | PDF | TI05 | all | PDF matches preview | PDF+Preview | Visual comparison shows match | Visual compare | P0 |
| T653 | PDF | TI06 | all | PDF matches preview | PDF+Preview | Visual comparison shows match | Visual compare | P0 |
| T654 | PDF | TI07 | all | PDF matches preview | PDF+Preview | Visual comparison shows match | Visual compare | P0 |
| T655 | PDF | TI08 | all | PDF matches preview | PDF+Preview | Visual comparison shows match | Visual compare | P0 |
| T656 | PDF | TI09 | all | PDF matches preview | PDF+Preview | Visual comparison shows match | Visual compare | P0 |
| T657 | PDF | TI04 | all | PDF matches preview | PDF+Preview | Visual comparison shows match | Visual compare | P0 |
| T658 | PDF | TI05 | all | PDF does NOT contain fold line | PDF | No fold line artifact | Open PDF | P0 |
| T659 | PDF | TI05 | all | PDF does NOT contain grid | PDF | No grid overlay | Open PDF | P0 |
| T660 | PDF | TI05 | all | PDF does NOT contain safe zone | PDF | No safe zone overlay | Open PDF | P0 |
| T661 | PDF | TI05 | all | PDF does NOT contain bleed marks | PDF | No bleed overlay | Open PDF | P0 |
| T662 | PDF | TI05 | all | PDF text is selectable (not rasterized) | PDF | Text selectable in PDF viewer | Open PDF | P1 |
| T663 | PDF | TI05 | all | PDF photo resolution (print quality) | PDF | Photo at least 150 DPI | Inspect PDF | P1 |
| T664 | PDF | TI05 | all | PDF file size reasonable (< 20MB) | PDF | File size under limit | File properties | P2 |
| T665 | PDF | TI05 | all | PDF generation time < 10 seconds | PDF | Download starts within 10 sec | Timer | P1 |
| T666 | PDF | TI05 | all | PDF with large photo (10MB) | PDF | PDF generates (may be larger) | Browser | P1 |
| T667 | PDF | TI05 | all | PDF font embedding | PDF | Google Fonts embedded/linked | Inspect PDF | P1 |
| T668 | PDF | TI05 | all | PDF with script font (Dancing Script) | PDF | Script font renders in PDF | Open PDF | P1 |
| T669 | PDF | TI05 | all | PDF with SC font (Playfair Display SC) | PDF | Small caps render in PDF | Open PDF | P1 |
| T670 | PDF | TI07 | all | PDF ornament renders (not broken) | PDF | Cross-rose PNG visible in PDF | Open PDF | P0 |
| T671 | PDF | TI08 | all | PDF cross ornament renders | PDF | Cross PNG visible | Open PDF | P0 |
| T672 | PDF | TI09 | all | PDF floral divider renders | PDF | Floral SVG visible | Open PDF | P0 |
| T673 | PDF | TI06 | all | PDF photo border | PDF | Border visible around photo | Open PDF | P1 |
| T674 | PDF | TI07 | all | PDF rounded clip renders | PDF | Rounded corners on photo | Open PDF | P1 |
| T675 | PDF | TI08 | all | PDF ellipse clip renders | PDF | Elliptical clip on photo | Open PDF | P1 |
| T676 | PDF | TI05 | all | PDF lines render | PDF | Horizontal lines visible | Open PDF | P1 |
| T677 | PDF | TI09 | all | PDF line between quote and verse | PDF | Line renders | Open PDF | P1 |
| T678 | PDF | TI05 | all | Double-download: same PDF twice | PDF | Both files identical | File compare | P2 |
| T679 | PDF | TI05 | all | Edit, download, edit, download again | PDF | Second PDF reflects new edits | Open PDF | P1 |
| T680 | PDF | TI05 | all | PDF with auto-shrunk text | PDF | Text at shrunk size, not original | Open PDF | P1 |
| T681 | PDF | TI05 | all | PDF with empty text fields | PDF | Clean layout, no artifacts | Open PDF | P1 |
| T682 | PDF | TI05 | all | PDF filename includes template name | PDF | Filename meaningful (not "download.pdf") | Browser | P2 |
| T683 | PDF | TI04 | all | PDF text-only (no photo) | PDF | Clean text layout in PDF | Open PDF | P0 |
| T684 | PDF | TI05 | all | PDF page order: cover, inner-left, inner-right | PDF | Pages in printable order | Open PDF | P0 |
| T685 | PDF | TI05 | all | PDF suitable for professional printing | PDF | Resolution, color space, bleed adequate | Print shop review | P1 |
| T686 | PDF | TI05 | all | PDF on Chrome browser | PDF | Downloads successfully | Browser | P0 |
| T687 | PDF | TI05 | all | PDF on Firefox browser | PDF | Downloads successfully | Browser | P1 |
| T688 | PDF | TI05 | all | PDF on Safari browser | PDF | Downloads successfully | Browser | P2 |
| T689 | PDF | TI05 | all | PDF on mobile Chrome | PDF | Downloads or opens in viewer | Browser mobile | P2 |
| T690 | PDF | TI05 | all | PDF download during slow network | PDF | Download completes or shows error | Manual | P2 |
| T691 | PDF | TI05 | all | PDF download button disabled during generation | Canvas | Button shows loading state | Screenshot | P1 |
| T692 | PDF | TI05 | all | PDF error handling (server down) | Canvas | Error message shown to user | Manual | P1 |

---

## Category 10: Undo/Redo (T693-T732)

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| T693 | Undo/Redo | TI05 | back | Text edit, Ctrl+Z | Canvas | Text reverted | E2E | P0 |
| T694 | Undo/Redo | TI05 | back | Text edit, Ctrl+Z, Ctrl+Shift+Z | Canvas | Text restored | E2E | P0 |
| T695 | Undo/Redo | TI05 | front | Photo upload, Ctrl+Z | Canvas | Photo removed | E2E | P0 |
| T696 | Undo/Redo | TI05 | front | Photo upload, Ctrl+Z, Ctrl+Shift+Z | Canvas | Photo restored | E2E | P0 |
| T697 | Undo/Redo | TI05 | back | Font change, Ctrl+Z | Canvas | Font reverted | E2E | P1 |
| T698 | Undo/Redo | TI05 | back | Color change, Ctrl+Z | Canvas | Color reverted | E2E | P1 |
| T699 | Undo/Redo | TI05 | front | Element drag, Ctrl+Z | Canvas | Element returns to original position | E2E | P1 |
| T700 | Undo/Redo | TI05 | front | Element resize, Ctrl+Z | Canvas | Element returns to original size | E2E | P1 |
| T701 | Undo/Redo | TI05 | back | Element delete, Ctrl+Z | Canvas | Element restored | E2E | P0 |
| T702 | Undo/Redo | TI05 | front | 10 edits, undo 10x, all original | Canvas | All changes reverted | E2E | P1 |
| T703 | Undo/Redo | TI05 | front | 10 edits, undo 10x, redo 10x, all edits back | Canvas | All changes re-applied | E2E | P1 |
| T704 | Undo/Redo | TI05 | back | Undo past beginning (extra Ctrl+Z) | Canvas | No crash, stays at initial state | E2E | P1 |
| T705 | Undo/Redo | TI05 | back | Redo past end (extra Ctrl+Shift+Z) | Canvas | No crash, stays at current state | E2E | P1 |
| T706 | Undo/Redo | TI05 | front | Undo, edit, redo branch destroyed | Canvas | Redo stack cleared after new edit | E2E | P1 |
| T707 | Undo/Redo | TI05 | front | Undo on page A, switch to page B, undo on B | Canvas | Per-page undo stacks independent | E2E | P0 |
| T708 | Undo/Redo | TI05 | back | Undo on back, switch to front, switch to back, redo | Canvas | Redo works after page switch | E2E | P1 |
| T709 | Undo/Redo | TI06 | front | Undo/redo on L-form layout | Canvas | Photo and text undo/redo correctly | E2E | P1 |
| T710 | Undo/Redo | TI07 | front | Undo/redo with ornament present | Canvas | Ornament unaffected by undo | E2E | P1 |
| T711 | Undo/Redo | TI08 | back | Undo/redo photo on ellipse page | Canvas | Photo with ellipse clip undone/redone | E2E | P1 |
| T712 | Undo/Redo | TI09 | back | Undo/redo quote edit | Canvas | Quote text reverts/restores | E2E | P1 |
| T713 | Undo/Redo | TI05 | back | Undo, preview, shows undone state | Preview | Preview shows pre-undo state | E2E | P1 |
| T714 | Undo/Redo | TI05 | back | Undo, PDF, shows undone state | PDF | PDF shows pre-undo state | E2E | P1 |
| T715 | Undo/Redo | TI05 | all | Undo button in toolbar (not just Ctrl+Z) | Canvas | Toolbar undo button works | Screenshot | P1 |
| T716 | Undo/Redo | TI05 | all | Redo button in toolbar (not just Ctrl+Shift+Z) | Canvas | Toolbar redo button works | Screenshot | P1 |
| T717 | Undo/Redo | TI05 | all | Undo button disabled when nothing to undo | Canvas | Button grayed out at beginning | Screenshot | P2 |
| T718 | Undo/Redo | TI05 | all | Redo button disabled when nothing to redo | Canvas | Button grayed out when no redo | Screenshot | P2 |
| T719 | Undo/Redo | TI05 | front | Rapid undo (10x Ctrl+Z in 1 second) | Canvas | No crash, correct final state | Manual | P2 |
| T720 | Undo/Redo | TI05 | all | Undo after template switch | Canvas | Undo history cleared (can't undo to prev template) | E2E | P1 |
| T721 | Undo/Redo | TI05 | back | Undo alignment change | Canvas | Alignment reverted | E2E | P2 |
| T722 | Undo/Redo | TI05 | back | Undo fontSize change | Canvas | FontSize reverted | E2E | P2 |
| T723 | Undo/Redo | TI05 | outside-spread | Undo cover photo change | Canvas | Previous cover restored | E2E | P1 |
| T724 | Undo/Redo | TI05 | outside-spread | Undo cover mode switch | Canvas | Previous mode restored | E2E | P1 |
| T725 | Undo/Redo | TI05 | front | Undo crop | Canvas | Previous crop restored | E2E | P1 |
| T726 | Undo/Redo | TI04 | front | Undo on text-only template | Canvas | Works correctly | E2E | P1 |
| T727 | Undo/Redo | TI05 | front | Undo, reload page, draft shows undone state? | Canvas | Draft updated after undo | E2E | P2 |
| T728 | Undo/Redo | TI05 | all | Memory: undo history doesn't grow unbounded | DevTools | Memory stays reasonable after 100 edits | Inspect | P3 |
| T729 | Undo/Redo | TI05 | front | Mac: Cmd+Z / Cmd+Shift+Z | Canvas | Mac shortcuts work | Manual Mac | P1 |
| T730 | Undo/Redo | TI05 | back | Undo while text is being edited (cursor in field) | Canvas | Undo applies to text input, not canvas | Manual | P2 |
| T731 | Undo/Redo | TI05 | front | Undo photo replace (replace photo, undo, old photo) | Canvas | Original photo restored | E2E | P1 |
| T732 | Undo/Redo | TI05 | front | Undo add text element | Canvas | Added element removed | E2E | P1 |

---

## Category 11: Element Manipulation (T733-T772)

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| T733 | Element | TI05 | back | Click text element, selected | Canvas | Selection handles visible | Screenshot | P0 |
| T734 | Element | TI05 | back | Drag text element to new position | Canvas | Element moves | Manual | P0 |
| T735 | Element | TI05 | back | Drag element, preview | Preview | New position reflected | E2E | P1 |
| T736 | Element | TI05 | back | Drag element, PDF | PDF | New position in PDF | E2E | P1 |
| T737 | Element | TI05 | back | Resize text element | Canvas | Element resizes | Manual | P0 |
| T738 | Element | TI05 | back | Resize element, text reflows | Canvas | Text wraps/shrinks in new size | Screenshot | P1 |
| T739 | Element | TI05 | back | Delete element (keyboard Delete) | Canvas | Element removed | Manual | P0 |
| T740 | Element | TI05 | back | Delete element, hidden=true (not destroyed) | Canvas | Template element hidden, can be undone | E2E | P1 |
| T741 | Element | TI05 | back | Add new text element | Canvas | New text element appears | Manual | P1 |
| T742 | Element | TI05 | front | Add new photo element | Canvas | New photo element appears | Manual | P1 |
| T743 | Element | TI05 | back | Add element, preview, shows added element | Preview | New element visible | E2E | P1 |
| T744 | Element | TI05 | back | Add element, PDF, shows added element | PDF | New element in PDF | E2E | P1 |
| T745 | Element | TI05 | back | Drag element outside canvas bounds | Canvas | Element constrained to canvas | Manual | P1 |
| T746 | Element | TI05 | back | Resize element to minimum (50x50 grid) | Canvas | Element doesn't go below 50 grid units | Manual | P2 |
| T747 | Element | TI05 | back | Resize element to maximum (1000x1000 grid) | Canvas | Element fills entire page | Manual | P2 |
| T748 | Element | TI07 | front | Click ornament, not draggable? | Canvas | Ornament may be fixed (check behavior) | Manual | P2 |
| T749 | Element | TI07 | front | Attempt to delete ornament | Canvas | Ornament deletable or protected | Manual | P2 |
| T750 | Element | TI05 | back | Select element, contextual toolbar appears | Canvas | Toolbar with font/color/align options | Screenshot | P1 |
| T751 | Element | TI05 | back | Deselect element, contextual toolbar hides | Canvas | Toolbar disappears | Screenshot | P1 |
| T752 | Element | TI05 | back | Overlap: drag element over another | Canvas | Z-order correct, top element visible | Manual | P2 |
| T753 | Element | TI05 | back | Multiple selection (if supported) | Canvas | Multiple elements selected | Manual | P3 |
| T754 | Element | TI05 | back | Click empty area, deselect | Canvas | No element selected | Manual | P1 |
| T755 | Element | TI06 | front | Drag name into photo area | Canvas | Element overlaps photo (allowed or prevented) | Manual | P2 |
| T756 | Element | TI05 | back | Delete ALL text elements | Canvas | Empty page, no crash | Manual | P2 |
| T757 | Element | TI05 | back | Delete all, add new, preview | Preview | New elements visible, deleted ones gone | E2E | P2 |
| T758 | Element | TI05 | front | Double-click text to enter edit mode | Canvas | Text cursor appears, can type | Manual | P0 |
| T759 | Element | TI05 | front | Click photo element, replace photo option | Canvas | Photo replacement UI appears | Manual | P0 |
| T760 | Element | TI05 | back | Tab between elements (if supported) | Canvas | Focus moves to next element | Manual | P3 |
| T761 | Element | TI05 | back | Element position saved to ElementOverride | Canvas | Override persists x,y in state | Inspect | P1 |
| T762 | Element | TI05 | back | Element size saved to ElementOverride | Canvas | Override persists w,h in state | Inspect | P1 |
| T763 | Element | TI05 | back | Element font override saved | Canvas | Override persists fontFamily | Inspect | P1 |
| T764 | Element | TI05 | back | Drag + resize, reload, draft preserves overrides | Canvas | Overrides in localStorage draft | E2E | P1 |
| T765 | Element | TI05 | back | Contextual toolbar: font family dropdown | Canvas | Can change font for individual element | Screenshot | P1 |
| T766 | Element | TI05 | back | Contextual toolbar: font size | Canvas | Can change size for individual element | Screenshot | P1 |
| T767 | Element | TI05 | back | Contextual toolbar: text color | Canvas | Can change color for individual element | Screenshot | P1 |
| T768 | Element | TI05 | back | Contextual toolbar: text alignment | Canvas | Can change alignment for individual element | Screenshot | P1 |
| T769 | Element | TI05 | back | Per-element override, global change, override wins | Canvas | Cascade: element override > template > global | E2E | P0 |
| T770 | Element | TI05 | front | Drag photo element, crop preserved | Canvas | Crop stays after drag | E2E | P2 |
| T771 | Element | TI07 | front | Drag text near ornament edge | Canvas | Text stays readable, doesn't go under ornament | Manual | P2 |
| T772 | Element | TI05 | back | Touch: drag element on mobile | Canvas | Touch drag works | Manual mobile | P2 |

---

## Category 12: Canvas Overlays (Grid, Fold Line, Bleed, Safe Zone) (T773-T802)

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| T773 | Overlay | TI05 | outside-left | Fold line visible | Canvas | Dashed line at spread center | Screenshot | P1 |
| T774 | Overlay | TI05 | outside-right | Fold line visible | Canvas | Dashed line at spread center | Screenshot | P1 |
| T775 | Overlay | TI05 | front | No fold line on inner pages | Canvas | No fold line | Screenshot | P1 |
| T776 | Overlay | TI05 | back | No fold line on inner pages | Canvas | No fold line | Screenshot | P1 |
| T777 | Overlay | TI05 | outside-spread | Toggle grid on | Canvas | Grid overlay visible | Screenshot | P1 |
| T778 | Overlay | TI05 | outside-spread | Toggle grid off | Canvas | Grid overlay hidden | Screenshot | P1 |
| T779 | Overlay | TI05 | front | Toggle grid on inner page | Canvas | Grid visible on inner page | Screenshot | P1 |
| T780 | Overlay | TI05 | all | Grid NOT in preview | Preview | No grid lines | Screenshot | P0 |
| T781 | Overlay | TI05 | all | Grid NOT in PDF | PDF | No grid lines | Open PDF | P0 |
| T782 | Overlay | TI05 | all | Fold line NOT in preview | Preview | No fold line | Screenshot | P0 |
| T783 | Overlay | TI05 | all | Fold line NOT in PDF | PDF | No fold line | Open PDF | P0 |
| T784 | Overlay | TI05 | all | Safe zone NOT in PDF | PDF | No safe zone | Open PDF | P0 |
| T785 | Overlay | TI05 | all | Bleed NOT in PDF | PDF | No bleed | Open PDF | P0 |
| T786 | Overlay | TI05 | outside-spread | Fold line on top of all elements | Canvas | Fold line renders above photo/text | Screenshot | P2 |
| T787 | Overlay | TI05 | front | Grid on top of all elements | Canvas | Grid renders above photo/text | Screenshot | P2 |
| T788 | Overlay | TI05 | outside-spread | Fold line not selectable/draggable | Canvas | Can't interact with fold line | Manual | P2 |
| T789 | Overlay | TI05 | front | Grid not selectable/draggable | Canvas | Can't interact with grid | Manual | P2 |
| T790 | Overlay | TI05 | outside-spread | Toggle fold line visibility (if feature exists) | Canvas | Fold line toggles | Manual | P2 |
| T791 | Overlay | TI04 | outside-spread | Fold line visible on text-only template | Canvas | Fold line present | Screenshot | P1 |
| T792 | Overlay | TI06 | outside-spread | Fold line visible | Canvas | Fold line present | Screenshot | P1 |
| T793 | Overlay | TI07 | outside-spread | Fold line visible | Canvas | Fold line present | Screenshot | P1 |
| T794 | Overlay | TI08 | outside-spread | Fold line visible | Canvas | Fold line present | Screenshot | P1 |
| T795 | Overlay | TI09 | outside-spread | Fold line visible | Canvas | Fold line present | Screenshot | P1 |
| T796 | Overlay | TI05 | outside-spread | Dark cover photo: fold line color contrasts | Canvas | Fold line visible against dark bg | Screenshot | P2 |
| T797 | Overlay | TI05 | outside-spread | Light cover photo: fold line color contrasts | Canvas | Fold line visible against light bg | Screenshot | P2 |
| T798 | Overlay | TI05 | all | Bleed zone visible on canvas | Canvas | Bleed area shown (if feature enabled) | Screenshot | P2 |
| T799 | Overlay | TI05 | all | Safe zone visible on canvas | Canvas | Safe area shown (if feature enabled) | Screenshot | P2 |
| T800 | Overlay | TI05 | front | Overlays re-draw after element drag | Canvas | Overlays stay on top after moving elements | Manual | P2 |
| T801 | Overlay | TI05 | front | Overlays re-draw after page switch | Canvas | Correct overlays for current page | E2E | P1 |
| T802 | Overlay | TI05 | outside-spread | Overlays re-draw after cover mode switch | Canvas | Fold line adjusts if needed | E2E | P2 |

---

## Category 13: Draft Save/Restore (T803-T832)

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| T803 | Draft | TI05 | all | localStorage key = "trauerpost_canvas_builder_draft" | Canvas | Draft saves to correct key | Inspect storage | P1 |
| T804 | Draft | TI05 | all | Draft version = 1 | Canvas | Version field present | Inspect storage | P2 |
| T805 | Draft | TI05 | all | Draft contains cardType | Canvas | "sterbebild" saved | Inspect storage | P1 |
| T806 | Draft | TI05 | all | Draft contains cardFormat | Canvas | "single" saved | Inspect storage | P1 |
| T807 | Draft | TI05 | all | Draft contains templateId | Canvas | "TI05" saved | Inspect storage | P1 |
| T808 | Draft | TI05 | all | Draft contains activePageId | Canvas | Current page saved | Inspect storage | P1 |
| T809 | Draft | TI05 | all | Draft contains pagesData for all pages | Canvas | All page canvases serialized | Inspect storage | P1 |
| T810 | Draft | TI05 | all | Edit, auto-save fires | Canvas | Draft updated in localStorage | Inspect storage | P0 |
| T811 | Draft | TI05 | all | Reload page, draft restores | Canvas | All edits restored from draft | E2E | P0 |
| T812 | Draft | TI05 | all | Reload, correct template loaded | Canvas | TI05 template loaded (not default) | E2E | P0 |
| T813 | Draft | TI05 | all | Reload, correct page active | Canvas | Returns to last active page | E2E | P1 |
| T814 | Draft | TI05 | all | Reload, text edits preserved | Canvas | All text changes present | E2E | P0 |
| T815 | Draft | TI05 | all | Reload, photo preserved | Canvas | Uploaded photo still visible | E2E | P0 |
| T816 | Draft | TI05 | all | Reload, font changes preserved | Canvas | Correct font loaded | E2E | P0 |
| T817 | Draft | TI05 | all | Reload, color changes preserved | Canvas | Correct colors | E2E | P0 |
| T818 | Draft | TI05 | all | Reload, element positions preserved | Canvas | Dragged elements in new positions | E2E | P1 |
| T819 | Draft | TI05 | all | Reload, cover mode preserved | Canvas | Vollbild/Halbbild correct | E2E | P1 |
| T820 | Draft | TI05 | all | Clear localStorage, reload, fresh start | Canvas | Default template loads | Manual | P1 |
| T821 | Draft | TI05 | all | Corrupt localStorage, reload, no crash | Canvas | Graceful fallback to default | Manual | P1 |
| T822 | Draft | TI05 | all | Draft size doesn't exceed localStorage limit (~5MB) | Canvas | Draft fits in localStorage | Inspect | P2 |
| T823 | Draft | TI05 | all | Draft with large photo, storage limit | Canvas | Photo base64 doesn't exceed limit | Inspect | P2 |
| T824 | Draft | TI06 | all | Draft restore for TI06 layout | Canvas | L-form layout correct after restore | E2E | P1 |
| T825 | Draft | TI07 | all | Draft restore for TI07 layout | Canvas | Ornament + photo correct | E2E | P1 |
| T826 | Draft | TI08 | all | Draft restore for TI08 layout | Canvas | Cross + ellipse correct | E2E | P1 |
| T827 | Draft | TI09 | all | Draft restore for TI09 layout | Canvas | Floral + verse correct | E2E | P1 |
| T828 | Draft | TI04 | all | Draft restore for TI04 layout | Canvas | Text-only correct | E2E | P1 |
| T829 | Draft | TI05 | all | Switch template, draft updates to new template | Canvas | Old template draft overwritten | E2E | P1 |
| T830 | Draft | TI05 | all | Private browsing mode, no crash | Canvas | Works without localStorage (or warns) | Manual | P2 |
| T831 | Draft | TI05 | all | Multiple tabs, draft conflict | Canvas | Last save wins (no corruption) | Manual | P3 |
| T832 | Draft | TI05 | all | Draft auto-save frequency | Canvas | Saves after each edit (debounced) | Inspect | P2 |

---

## Category 14: Negative Tests (T833-T892)

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| T833 | Negative | TE01 | all | Load TE01, page count | Canvas | 2 pages only (Vorderseite, Ruckseite), NOT 4 bifold pages | Screenshot | P0 |
| T834 | Negative | TE01 | all | Load TE01, no cover photo | Canvas | No outside-spread, no TREE.jpg | Screenshot | P0 |
| T835 | Negative | TE01 | all | Load TE01, no fold line | Canvas | No fold line visible | Screenshot | P0 |
| T836 | Negative | TE01 | all | Load TE01, no Aussen links/rechts labels | Canvas | Labels are Vorderseite/Ruckseite | Screenshot | P0 |
| T837 | Negative | TE01 | all | Load TE01, dimensions 185x115mm | Canvas | Different dimensions from bifold | Inspect | P0 |
| T838 | Negative | TE02 | all | Load TE02, 2 pages only | Canvas | NOT bifold layout | Screenshot | P0 |
| T839 | Negative | TE02 | all | Load TE02, no cover spread | Canvas | No outside-spread | Screenshot | P0 |
| T840 | Negative | TE02 | all | Load TE02, photo on front | Canvas | Photo in first page (400x1000 slot) | Screenshot | P0 |
| T841 | Negative | TD01 | all | Load TD01, 2 pages only | Canvas | NOT bifold layout | Screenshot | P0 |
| T842 | Negative | TD01 | all | Load TD01, no photo | Canvas | Text-only like TE01 but dankkarte | Screenshot | P0 |
| T843 | Negative | TD02 | all | Load TD02, 2 pages only | Canvas | NOT bifold layout | Screenshot | P0 |
| T844 | Negative | TD02 | all | Load TD02, photo on front | Canvas | Photo on first page | Screenshot | P0 |
| T845 | Negative | TI04 | front | Cover photo does NOT leak to front page | Canvas | Front page has no cover photo overlay | Screenshot | P0 |
| T846 | Negative | TI05 | front | Cover photo does NOT leak to front page | Canvas | Front page shows only portrait photo | Screenshot | P0 |
| T847 | Negative | TI05 | back | Cover photo does NOT leak to back page | Canvas | Back page shows only text | Screenshot | P0 |
| T848 | Negative | TI05 | front | Back page text does NOT appear on front | Canvas | Front page has no text elements from back | Screenshot | P0 |
| T849 | Negative | TI05 | back | Front page photo does NOT appear on back | Canvas | Back page has no photo element | Screenshot | P0 |
| T850 | Negative | TI07 | front | Back page photo does NOT appear on front | Canvas | Front page has ornament+text only | Screenshot | P0 |
| T851 | Negative | TI07 | back | Front page ornament does NOT appear on back | Canvas | Back page has photo only | Screenshot | P0 |
| T852 | Negative | TI08 | front | Back page photo does NOT appear on front | Canvas | Front has cross+text only | Screenshot | P0 |
| T853 | Negative | TI08 | back | Front page cross does NOT appear on back | Canvas | Back has photo only | Screenshot | P0 |
| T854 | Negative | TI09 | front | Back page quote does NOT appear on front | Canvas | Front has ornament+name+photo only | Screenshot | P0 |
| T855 | Negative | TI09 | back | Front page photo does NOT appear on back | Canvas | Back has quote+verse only | Screenshot | P0 |
| T856 | Negative | TI05 | all | PDF does NOT contain fold line | PDF | No fold line artifact in PDF | Open PDF | P0 |
| T857 | Negative | TI05 | all | PDF does NOT contain grid overlay | PDF | No grid in PDF | Open PDF | P0 |
| T858 | Negative | TI05 | all | PDF does NOT contain safe zone | PDF | No safe zone in PDF | Open PDF | P0 |
| T859 | Negative | TI05 | all | PDF does NOT contain bleed overlay | PDF | No bleed in PDF | Open PDF | P0 |
| T860 | Negative | TI05 | all | Preview does NOT contain fold line | Preview | No fold line in preview | Screenshot | P0 |
| T861 | Negative | TI05 | all | Preview does NOT contain grid | Preview | No grid in preview | Screenshot | P0 |
| T862 | Negative | TI04 | front | No photo placeholder on text-only template | Canvas | No empty photo frame or "add photo" prompt | Screenshot | P1 |
| T863 | Negative | TI04 | front | No "undefined" text anywhere | Canvas | No undefined values | Screenshot | P0 |
| T864 | Negative | TI05 | all | No "null" text anywhere | Canvas | No null values | Screenshot | P0 |
| T865 | Negative | TI05 | all | No "[fieldName]" brackets visible | Canvas | No raw field names | Screenshot | P0 |
| T866 | Negative | TI05 | all | No dashed placeholder borders | Canvas | No developer artifacts | Screenshot | P0 |
| T867 | Negative | TI05 | all | No gray placeholder boxes | Canvas | No unfilled slots | Screenshot | P0 |
| T868 | Negative | TI05 | all | No console errors on load | DevTools | Console clean | Inspect | P1 |
| T869 | Negative | TI05 | all | No console errors after editing | DevTools | Console clean | Inspect | P1 |
| T870 | Negative | TI05 | all | No console errors on preview | DevTools | Console clean | Inspect | P1 |
| T871 | Negative | TI05 | all | No console errors on PDF download | DevTools | Console clean | Inspect | P1 |
| T872 | Negative | TI04 | all | Text-only: no photo-related UI elements | Canvas | No photo upload button on non-photo pages | Screenshot | P1 |
| T873 | Negative | TE01 | all | Single card: no cover mode toggle | Canvas | No Vollbild/Halbbild button | Screenshot | P1 |
| T874 | Negative | TE01 | all | Single card: PDF has NO bifold pages | PDF | PDF pages match single card layout | Open PDF | P0 |
| T875 | Negative | TI05 | front | Inner page width != full spread width | Canvas | Inner page is half width (413px not 827px) | Inspect | P0 |
| T876 | Negative | TI05 | outside-spread | Outside spread NOT split into two canvases | Canvas | Single canvas for outside-spread | Inspect | P1 |
| T877 | Negative | TI05 | all | Auto-shrink doesn't go below minFontSize (6pt) | Canvas | Text clips rather than shrinking below 6pt | Screenshot | P1 |
| T878 | Negative | TI05 | back | Empty closingVerse field doesn't show on TI05 | Canvas | TI05 has no closingVerse field | Screenshot | P1 |
| T879 | Negative | TI05 | back | No locationBirth/locationDeath on TI05 | Canvas | TI05 doesn't use location fields | Screenshot | P1 |
| T880 | Negative | TI04 | front | No dividerSymbol on TI04 | Canvas | TI04 doesn't use divider | Screenshot | P1 |
| T881 | Negative | TI05 | front | Placeholder photo is placeholder-man.jpg | Canvas | Correct placeholder for TI05 | Screenshot | P1 |
| T882 | Negative | TI06 | front | Placeholder photo is placeholder-woman.png | Canvas | Correct placeholder for TI06 | Screenshot | P1 |
| T883 | Negative | TI05 | all | No XSS from user text input | Canvas | Script tags rendered as text, not executed | Inspect | P1 |
| T884 | Negative | TI05 | all | No XSS in preview (renderSpreadHTML) | Preview | HTML-escaped user input | Inspect | P1 |
| T885 | Negative | TI05 | all | No XSS in PDF | PDF | HTML-escaped user input | Inspect | P1 |
| T886 | Negative | TI05 | all | Invalid template ID, graceful error | Canvas | Error message or default template | Manual | P2 |
| T887 | Negative | TI05 | all | No infinite loop on auto-shrink | Canvas | Text reaches minFontSize and stops | Inspect | P2 |
| T888 | Negative | TI05 | all | clampGrid enforces 0-1000 range | Canvas | Element can't go below 0 or above 1000 | Inspect | P2 |
| T889 | Negative | TI05 | all | clampSize enforces min 50 | Canvas | Element can't be smaller than 50 grid units | Inspect | P2 |
| T890 | Negative | TI05 | all | Double-click outside canvas, no error | Canvas | No crash on misclick | Manual | P3 |
| T891 | Negative | TI05 | outside-spread | Outside spread elements isolated from inner | Canvas | Editing cover doesn't affect inner pages Fabric state | E2E | P0 |
| T892 | Negative | TI05 | all | Browser back button, no crash | Canvas | Navigates away cleanly | Manual | P2 |

---

## Category 15: Visual Consistency (T893-T940)

Canvas vs Thumbnail vs Preview vs PDF for each template.

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| T893 | Consistency | TI04 | all | Canvas matches Preview | Canvas+Preview | Visual match | Visual compare | P0 |
| T894 | Consistency | TI04 | all | Preview matches PDF | Preview+PDF | Visual match | Visual compare | P0 |
| T895 | Consistency | TI04 | all | Canvas matches PDF | Canvas+PDF | Visual match | Visual compare | P0 |
| T896 | Consistency | TI04 | all | Thumbnail matches Canvas | Thumb+Canvas | Visual match (scaled) | Visual compare | P1 |
| T897 | Consistency | TI05 | all | Canvas matches Preview | Canvas+Preview | Visual match | Visual compare | P0 |
| T898 | Consistency | TI05 | all | Preview matches PDF | Preview+PDF | Visual match | Visual compare | P0 |
| T899 | Consistency | TI05 | all | Canvas matches PDF | Canvas+PDF | Visual match | Visual compare | P0 |
| T900 | Consistency | TI05 | all | Thumbnail matches Canvas | Thumb+Canvas | Visual match | Visual compare | P1 |
| T901 | Consistency | TI06 | all | Canvas matches Preview | Canvas+Preview | Visual match | Visual compare | P0 |
| T902 | Consistency | TI06 | all | Preview matches PDF | Preview+PDF | Visual match | Visual compare | P0 |
| T903 | Consistency | TI06 | all | Canvas matches PDF | Canvas+PDF | Visual match | Visual compare | P0 |
| T904 | Consistency | TI06 | all | Thumbnail matches Canvas | Thumb+Canvas | Visual match | Visual compare | P1 |
| T905 | Consistency | TI07 | all | Canvas matches Preview | Canvas+Preview | Visual match | Visual compare | P0 |
| T906 | Consistency | TI07 | all | Preview matches PDF | Preview+PDF | Visual match | Visual compare | P0 |
| T907 | Consistency | TI07 | all | Canvas matches PDF | Canvas+PDF | Visual match | Visual compare | P0 |
| T908 | Consistency | TI07 | all | Thumbnail matches Canvas | Thumb+Canvas | Visual match | Visual compare | P1 |
| T909 | Consistency | TI08 | all | Canvas matches Preview | Canvas+Preview | Visual match | Visual compare | P0 |
| T910 | Consistency | TI08 | all | Preview matches PDF | Preview+PDF | Visual match | Visual compare | P0 |
| T911 | Consistency | TI08 | all | Canvas matches PDF | Canvas+PDF | Visual match | Visual compare | P0 |
| T912 | Consistency | TI08 | all | Thumbnail matches Canvas | Thumb+Canvas | Visual match | Visual compare | P1 |
| T913 | Consistency | TI09 | all | Canvas matches Preview | Canvas+Preview | Visual match | Visual compare | P0 |
| T914 | Consistency | TI09 | all | Preview matches PDF | Preview+PDF | Visual match | Visual compare | P0 |
| T915 | Consistency | TI09 | all | Canvas matches PDF | Canvas+PDF | Visual match | Visual compare | P0 |
| T916 | Consistency | TI09 | all | Thumbnail matches Canvas | Thumb+Canvas | Visual match | Visual compare | P1 |
| T917 | Consistency | TI05 | all | After text edit: all 4 outputs consistent | All | Canvas=Thumb=Preview=PDF | Visual compare | P0 |
| T918 | Consistency | TI05 | all | After font change: all 4 outputs consistent | All | Canvas=Thumb=Preview=PDF | Visual compare | P0 |
| T919 | Consistency | TI05 | all | After color change: all 4 outputs consistent | All | Canvas=Thumb=Preview=PDF | Visual compare | P0 |
| T920 | Consistency | TI05 | all | After photo upload: all 4 outputs consistent | All | Canvas=Thumb=Preview=PDF | Visual compare | P0 |
| T921 | Consistency | TI05 | all | After element drag: all 4 outputs consistent | All | Canvas=Thumb=Preview=PDF | Visual compare | P1 |
| T922 | Consistency | TI05 | all | After cover mode switch: all 4 outputs consistent | All | Canvas=Thumb=Preview=PDF | Visual compare | P0 |
| T923 | Consistency | TI05 | all | After undo: all 4 outputs consistent | All | Canvas=Thumb=Preview=PDF | Visual compare | P1 |
| T924 | Consistency | TI07 | all | Ornament position: canvas vs preview vs PDF | All | Ornament in same position | Visual compare | P0 |
| T925 | Consistency | TI08 | all | Cross position: canvas vs preview vs PDF | All | Cross in same position | Visual compare | P0 |
| T926 | Consistency | TI09 | all | Floral divider: canvas vs preview vs PDF | All | Divider in same position | Visual compare | P0 |
| T927 | Consistency | TI07 | back | Rounded clip: canvas vs preview vs PDF | All | Same roundness | Visual compare | P0 |
| T928 | Consistency | TI08 | back | Ellipse clip: canvas vs preview vs PDF | All | Same ellipse shape | Visual compare | P0 |
| T929 | Consistency | TI06 | front | Photo border: canvas vs preview vs PDF | All | Same 1px border | Visual compare | P1 |
| T930 | Consistency | TI05 | back | Line elements: canvas vs preview vs PDF | All | Same line position/style | Visual compare | P1 |
| T931 | Consistency | TI05 | back | Auto-shrunk text size: canvas vs preview vs PDF | All | Same font size after shrink | Visual compare | P1 |
| T932 | Consistency | TI04 | front | Text-only layout: canvas vs preview vs PDF | All | Same text positioning | Visual compare | P0 |
| T933 | Consistency | TI05 | front | Full-page photo: canvas vs preview vs PDF | All | Same photo crop/position | Visual compare | P0 |
| T934 | Consistency | TI06 | front | Small-caps text: canvas vs preview vs PDF | All | Small caps render in all | Visual compare | P1 |
| T935 | Consistency | TI07 | front | Letter spacing: canvas vs preview vs PDF | All | Same spacing | Visual compare | P2 |
| T936 | Consistency | TI05 | back | Line height: canvas vs preview vs PDF | All | Same line spacing on quote | Visual compare | P1 |
| T937 | Consistency | TI04 | front | Pinyon Script name: canvas vs preview vs PDF | All | Script font consistent | Visual compare | P1 |
| T938 | Consistency | TI05 | all | Desktop viewport: all outputs consistent | All | Match at 1920x1080 | Visual compare | P0 |
| T939 | Consistency | TI05 | all | Tablet viewport: canvas renders correctly | Canvas | Canvas scales for tablet | Screenshot tablet | P2 |
| T940 | Consistency | TI05 | all | Mobile viewport: canvas renders correctly | Canvas | Canvas scales or shows mobile guard | Screenshot mobile | P1 |

---

## Category 16: Dimensions (T941-T960)

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| T941 | Dimensions | TI05 | outside-spread | Canvas width for outside = 827px (140mm at 150dpi) | Canvas | Width matches | Inspect | P0 |
| T942 | Dimensions | TI05 | front | Canvas width for inner = 413px (70mm at 150dpi) | Canvas | Width matches | Inspect | P0 |
| T943 | Dimensions | TI05 | back | Canvas width for inner = 413px | Canvas | Width matches | Inspect | P0 |
| T944 | Dimensions | TI05 | all | Canvas height = 620px (105mm at 150dpi) | Canvas | Height matches | Inspect | P1 |
| T945 | Dimensions | TI05 | all | PDF page 1 = 140x105mm | PDF | Dimensions correct | PDF properties | P0 |
| T946 | Dimensions | TI05 | all | PDF page 2 = 70x105mm | PDF | Dimensions correct | PDF properties | P0 |
| T947 | Dimensions | TI05 | all | PDF page 3 = 70x105mm | PDF | Dimensions correct | PDF properties | P0 |
| T948 | Dimensions | TE01 | all | Single card: canvas = 185x115mm equivalent | Canvas | Different from bifold | Inspect | P1 |
| T949 | Dimensions | TE01 | all | Single card: PDF page = 185x115mm | PDF | Correct dimensions | PDF properties | P1 |
| T950 | Dimensions | TI05 | all | Preview scales to fit modal | Preview | Card visible without scrolling | Screenshot | P1 |
| T951 | Dimensions | TI05 | all | Preview maintains aspect ratio | Preview | Not distorted | Screenshot | P1 |
| T952 | Dimensions | TI05 | all | Thumbnail aspect ratio matches canvas | Thumbnail | Correct proportions | Screenshot | P1 |
| T953 | Dimensions | TI04 | all | TI04 dimensions = 140x105mm | Canvas | Correct | Inspect | P1 |
| T954 | Dimensions | TI06 | all | TI06 dimensions = 140x105mm | Canvas | Correct | Inspect | P1 |
| T955 | Dimensions | TI07 | all | TI07 dimensions = 140x105mm | Canvas | Correct | Inspect | P1 |
| T956 | Dimensions | TI08 | all | TI08 dimensions = 140x105mm | Canvas | Correct | Inspect | P1 |
| T957 | Dimensions | TI09 | all | TI09 dimensions = 140x105mm | Canvas | Correct | Inspect | P1 |
| T958 | Dimensions | TI05 | all | Zoom in: canvas dimensions maintained | Canvas | Zoom doesn't change actual dimensions | Inspect | P2 |
| T959 | Dimensions | TI05 | all | Zoom out: canvas dimensions maintained | Canvas | Zoom doesn't change actual dimensions | Inspect | P2 |
| T960 | Dimensions | TI05 | all | PDF printable at 100% scale | PDF | Prints at exactly 140x105mm | Print test | P1 |

---

## Category 17: Edge Cases (T961-T1000)

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| T961 | Edge Case | TI05 | all | Browser refresh during editing (F5) | Canvas | Draft saves, state restored on reload | Manual | P0 |
| T962 | Edge Case | TI05 | all | Close tab, reopen, draft restores | Canvas | Draft restored from localStorage | Manual | P0 |
| T963 | Edge Case | TI05 | all | Network disconnect, edit, reconnect, preview | Preview | Preview works after reconnect | Manual | P1 |
| T964 | Edge Case | TI05 | all | Network disconnect, edit, PDF download | PDF | Error message (PDF needs server) | Manual | P1 |
| T965 | Edge Case | TI05 | all | Very slow network (3G throttle), load template | Canvas | Template loads eventually, loading indicator | Manual | P2 |
| T966 | Edge Case | TI05 | all | Very slow network, upload photo | Canvas | Upload completes or shows progress | Manual | P2 |
| T967 | Edge Case | TI05 | all | Memory pressure: open 5 templates, switch rapidly | Canvas | No out-of-memory crash | DevTools | P2 |
| T968 | Edge Case | TI05 | all | 100 undo/redo operations | Canvas | No memory leak, works correctly | DevTools | P2 |
| T969 | Edge Case | TI05 | all | 50 photo uploads (replace repeatedly) | Canvas | No memory leak from old photos | DevTools | P2 |
| T970 | Edge Case | TI05 | all | Type text, switch templates rapidly, type again | Canvas | No ghost text from previous template | Manual | P1 |
| T971 | Edge Case | TI05 | all | Zoom to 200%, edit, preview, PDF | All | All outputs correct at 200% zoom | E2E | P2 |
| T972 | Edge Case | TI05 | all | Zoom to 50%, edit, preview, PDF | All | All outputs correct at 50% zoom | E2E | P2 |
| T973 | Edge Case | TI05 | front | Upload GIF photo | Canvas | First frame shown or error | Manual | P3 |
| T974 | Edge Case | TI05 | front | Upload very wide panorama (10000x500px) | Canvas | Photo cover-crops correctly | Screenshot | P2 |
| T975 | Edge Case | TI05 | front | Upload very tall photo (500x10000px) | Canvas | Photo cover-crops correctly | Screenshot | P2 |
| T976 | Edge Case | TI05 | front | Upload 1x1 pixel photo | Canvas | Fills area (extremely blurry) or error | Screenshot | P3 |
| T977 | Edge Case | TI05 | all | Right-click context menu on canvas | Canvas | No broken context menu | Manual | P3 |
| T978 | Edge Case | TI05 | back | Copy-paste text from Word (rich text) | Canvas | Formatting stripped, plain text pasted | Manual | P2 |
| T979 | Edge Case | TI05 | back | Paste image from clipboard | Canvas | Image added or ignored | Manual | P3 |
| T980 | Edge Case | TI05 | all | Ctrl+S (browser save) doesn't interfere | Canvas | Default browser save or draft save | Manual | P3 |
| T981 | Edge Case | TI05 | all | Screen reader announces elements | Canvas | Accessible labels present (if implemented) | Accessibility | P3 |
| T982 | Edge Case | TI05 | all | Keyboard-only navigation | Canvas | Can reach all controls via Tab | Accessibility | P3 |
| T983 | Edge Case | TI05 | all | High contrast mode | Canvas | Canvas visible in high contrast | Accessibility | P3 |
| T984 | Edge Case | TI05 | all | Dark mode (if supported) | Canvas | Canvas renders correctly in dark mode | Screenshot | P3 |
| T985 | Edge Case | TI05 | all | Chrome latest | Canvas+Preview+PDF | All features work | E2E | P0 |
| T986 | Edge Case | TI05 | all | Firefox latest | Canvas+Preview+PDF | All features work | E2E | P1 |
| T987 | Edge Case | TI05 | all | Safari latest | Canvas+Preview+PDF | All features work | E2E | P2 |
| T988 | Edge Case | TI05 | all | Edge latest | Canvas+Preview+PDF | All features work | E2E | P2 |
| T989 | Edge Case | TI05 | all | Mobile Chrome (Android) | Canvas | Canvas functional or mobile guard | Manual mobile | P1 |
| T990 | Edge Case | TI05 | all | Mobile Safari (iOS) | Canvas | Canvas functional or mobile guard | Manual mobile | P1 |
| T991 | Edge Case | TI05 | all | iPad landscape | Canvas | Canvas renders at tablet size | Manual tablet | P2 |
| T992 | Edge Case | TI05 | all | iPad portrait | Canvas | Canvas renders or warns | Manual tablet | P2 |
| T993 | Edge Case | TI05 | all | Window resize during editing | Canvas | Canvas scales correctly | Manual | P2 |
| T994 | Edge Case | TI05 | all | Print from preview (Ctrl+P on preview modal) | Canvas | Prints at correct dimensions | Manual | P3 |
| T995 | Edge Case | TI05 | all | Screenshot from preview (for sharing) | Preview | Preview looks good as screenshot | Manual | P3 |
| T996 | Edge Case | TI05 | all | UTF-8 text: Chinese characters | Canvas | Renders with fallback font | Screenshot | P3 |
| T997 | Edge Case | TI05 | all | UTF-8 text: Math symbols | Canvas | Renders or shows placeholder | Screenshot | P3 |
| T998 | Edge Case | TI05 | all | Very long quote (500+ words) | Canvas | Text auto-shrinks, readable at minimum | Screenshot | P2 |
| T999 | Edge Case | TI05 | all | Empty template (all fields cleared), PDF | PDF | PDF generates with empty fields | Open PDF | P2 |
| T1000 | Edge Case | TI05 | all | All fields + photo + cover + mode + font + color, PDF | PDF | Complete card renders in PDF | E2E | P0 |

---

# PERSONA 2: Software Architect Review

---

## Architecture Gaps Identified

### Data Flow Analysis
```
User Edit -> Fabric.js Canvas State -> WizardState (textContent, photo, overrides)
                                    -> fabricToWizardState() -> card-to-html-v2.ts (renderSpreadHTML)
                                    -> Preview (server-side HTML)
                                    -> PDF (Puppeteer renders same HTML)
```

### Identified Gaps:

1. **Race condition: thumbnail update vs page switch** - When user switches pages rapidly, the thumbnail update (which requires canvas serialization) may race with the new page load.

2. **State sync: Fabric.js canvas to WizardState** - The `fabricToWizardState()` function extracts state FROM the canvas. If canvas hasn't finished rendering when this runs, state may be stale.

3. **Font loading race** - Google Fonts load asynchronously. If `renderSpreadHTML` fires before fonts load, preview/PDF may use fallback fonts.

4. **Draft auto-save debounce** - If user edits very quickly, debounced save may lose intermediate states.

5. **Per-page undo stack isolation** - Each page needs its own undo history. If history is global, undoing on page B affects page A.

6. **Cover mode + outside-spread shared canvas** - `outside-left` and `outside-right` share one Fabric.js canvas. Cover mode switch must re-render the shared canvas correctly for both thumbnail crops.

7. **Element override cascade correctness** - The merge cascade (override > template > global) in `getMergedElement()` must be tested for every combination.

8. **Photo base64 in draft** - Large photos stored as base64 in localStorage can exceed the 5-10MB limit.

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| ARCH-001 | Race Condition | TI05 | all | Switch page during thumbnail render | Thumbnail | No corrupt thumbnail | DevTools | P1 |
| ARCH-002 | Race Condition | TI05 | all | Preview while canvas is still rendering | Preview | Preview waits for render complete | DevTools | P1 |
| ARCH-003 | Race Condition | TI05 | all | PDF download while fonts still loading | PDF | PDF waits for font load | DevTools | P1 |
| ARCH-004 | Race Condition | TI05 | all | Auto-save during page switch | Draft | Draft not corrupted by partial state | Inspect storage | P1 |
| ARCH-005 | Race Condition | TI05 | all | Upload photo while switching pages | Canvas | Photo goes to correct page | E2E | P1 |
| ARCH-006 | State Sync | TI05 | all | fabricToWizardState() captures all element overrides | Canvas | All positions/fonts/colors extracted | Inspect | P0 |
| ARCH-007 | State Sync | TI05 | all | WizardState to renderSpreadHTML produces same layout | Preview | HTML layout matches canvas | Visual compare | P0 |
| ARCH-008 | State Sync | TI05 | back | Text edit in Fabric to textContent updates | Canvas | WizardState.textContent has new text | Inspect | P0 |
| ARCH-009 | State Sync | TI05 | front | Photo in Fabric to photo state updates | Canvas | WizardState.photo has new photo data | Inspect | P0 |
| ARCH-010 | State Sync | TI05 | all | ElementOverride position to renderSpreadHTML position | Preview | Dragged element at new position in HTML | Visual compare | P1 |
| ARCH-011 | Font Loading | TI05 | all | Preview with custom Google Font | Preview | Font loaded via renderFontLinks() | Inspect | P0 |
| ARCH-012 | Font Loading | TI05 | all | PDF: fontLinks in HTML head | PDF | Google Fonts CSS in Puppeteer HTML | Inspect | P0 |
| ARCH-013 | Font Loading | TI05 | all | buildFontUrl() includes all used fonts | Preview | URL has textContent.fontFamily + per-element fonts | Inspect | P1 |
| ARCH-014 | Font Loading | TI06 | front | Per-element Playfair Display SC in font URL | Preview | SC font included in Google Fonts URL | Inspect | P1 |
| ARCH-015 | Font Loading | TI04 | front | Pinyon Script per-element font in URL | Preview | Pinyon Script in Google Fonts URL | Inspect | P1 |
| ARCH-016 | Undo Architecture | TI05 | front | Undo history per page (not global) | Canvas | Each page has own history array | Inspect | P0 |
| ARCH-017 | Undo Architecture | TI05 | all | saveToHistory() called after each edit | Canvas | History entry for every action | DevTools | P1 |
| ARCH-018 | Undo Architecture | TI05 | all | Undo history serializes full canvas state | Canvas | Each entry is complete Fabric JSON | Inspect | P1 |
| ARCH-019 | Undo Architecture | TI05 | all | Undo history capped (prevent memory leak) | DevTools | Max entries enforced | Inspect | P2 |
| ARCH-020 | Cascade | TI05 | back | getMergedElement: override.fontFamily wins | Canvas | Per-element font beats global | E2E | P0 |
| ARCH-021 | Cascade | TI05 | back | getMergedElement: template.fontFamily beats global | Canvas | Template font beats global when no override | E2E | P0 |
| ARCH-022 | Cascade | TI05 | back | getMergedElement: global fontFamily as fallback | Canvas | Global font when no template or override font | E2E | P0 |
| ARCH-023 | Cascade | TI05 | back | getMergedElement: override.fontColor wins | Canvas | Per-element color beats global | E2E | P1 |
| ARCH-024 | Cascade | TI05 | back | getMergedElement: override.textAlign wins | Canvas | Per-element align beats global | E2E | P1 |
| ARCH-025 | Storage | TI05 | all | Draft with photo < 5MB localStorage limit | Canvas | Draft saves successfully | Inspect | P1 |
| ARCH-026 | Storage | TI05 | all | Draft with 10MB photo exceeds localStorage | Canvas | Graceful degradation (warn or compress) | Manual | P1 |
| ARCH-027 | Storage | TI05 | all | DraftEnvelope schema validates on restore | Canvas | Invalid draft doesn't crash app | Manual | P1 |
| ARCH-028 | Canvas Lifecycle | TI05 | all | Fabric.js canvas disposed on unmount | DevTools | No memory leak from undisposed canvas | Inspect | P2 |
| ARCH-029 | Canvas Lifecycle | TI05 | all | Page switch disposes old canvas cleanly | DevTools | Old canvas resources freed | Inspect | P2 |
| ARCH-030 | Canvas Lifecycle | TI05 | all | Overlays (fold line, grid) cleaned up on page switch | Canvas | No leftover overlays from previous page | E2E | P1 |
| ARCH-031 | HTML Render | TI05 | all | renderSpreadHTML produces valid HTML | Preview | No unclosed tags, no broken attributes | Inspect | P1 |
| ARCH-032 | HTML Render | TI05 | all | renderSpreadHTML escapes user text (XSS) | Preview | script tags escaped | Inspect | P0 |
| ARCH-033 | HTML Render | TI07 | all | renderSpreadHTML handles ornament paths | Preview | Ornament image src correct | Inspect | P1 |
| ARCH-034 | HTML Render | TI08 | all | renderSpreadHTML handles ellipse clip-path | Preview | CSS clip-path: ellipse() present | Inspect | P1 |
| ARCH-035 | HTML Render | TI07 | all | renderSpreadHTML handles rounded border-radius | Preview | CSS border-radius present | Inspect | P1 |
| ARCH-036 | PDF Pipeline | TI05 | all | Puppeteer receives same HTML as preview | PDF | HTML identical (minus scaling) | Inspect | P1 |
| ARCH-037 | PDF Pipeline | TI05 | all | Puppeteer page size matches card dimensions | PDF | Page size set correctly | Inspect | P0 |
| ARCH-038 | PDF Pipeline | TI05 | all | Puppeteer waits for fonts before PDF | PDF | networkidle or font-load wait | Inspect | P0 |
| ARCH-039 | PDF Pipeline | TI05 | all | Puppeteer timeout handling | PDF | Error message after timeout | Manual | P1 |
| ARCH-040 | PDF Pipeline | TI05 | all | PDF API error returns meaningful error to client | Canvas | User sees error message, not generic 500 | Manual | P1 |
| ARCH-041 | Shared Canvas | TI05 | outside-spread | Outside-left and outside-right share one canvas | Canvas | Same canvasPageId "outside-spread" | Inspect | P1 |
| ARCH-042 | Shared Canvas | TI05 | outside-left | ThumbnailCrop "left" shows left half | Thumbnail | Crop correct | Screenshot | P1 |
| ARCH-043 | Shared Canvas | TI05 | outside-right | ThumbnailCrop "right" shows right half | Thumbnail | Crop correct | Screenshot | P1 |
| ARCH-044 | Shared Canvas | TI05 | outside-spread | Cover mode affects shared canvas rendering | Canvas | Vollbild/Halbbild changes full canvas | E2E | P1 |
| ARCH-045 | Error Boundary | TI05 | all | Fabric.js error doesn't crash entire page | Canvas | Error boundary catches and shows message | Manual | P2 |
| ARCH-046 | Error Boundary | TI05 | all | Preview API error shows user-friendly message | Preview | Not a raw stack trace | Manual | P1 |
| ARCH-047 | Error Boundary | TI05 | all | PDF API error shows user-friendly message | PDF | Not a raw stack trace | Manual | P1 |
| ARCH-048 | Concurrency | TI05 | all | Two browser tabs editing same draft | Canvas | Last-write-wins, no corruption | Manual | P3 |

---

# PERSONA 3: End User (Grieving Family Member)

---

## User Journey: "Memorial card for my mother Maria"

### Step 1: "I want to make a memorial card for my mother Maria who died last week"

What could go wrong: Landing page doesn't clearly show "Start making a card". No templates visible without scrolling. German language confusing for non-German speakers.

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| USER-001 | Journey | - | - | Open builder page | Canvas | Clear CTA: "Vorlage wahlen" or templates visible | Screenshot | P0 |
| USER-002 | Journey | - | - | Template picker shows beautiful cards | Canvas | Cards look finished, not empty boxes | Screenshot | P0 |
| USER-003 | Journey | - | - | Each template has a preview thumbnail | Canvas | User can see what they'll get | Screenshot | P0 |
| USER-004 | Journey | - | - | Template names are meaningful in German | Canvas | "Foto & Gedenken" not "TI05" | Screenshot | P0 |

### Step 2: "I picked this nice forest template"

What could go wrong: Template loads blank. Technical artifacts visible. Loading takes too long.

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| USER-005 | Journey | TI05 | all | Select template, loads in < 2 seconds | Canvas | Card appears quickly with sample data | Timer | P0 |
| USER-006 | Journey | TI05 | all | Card looks like a FINISHED product on first load | Canvas | Sample photo, sample text, beautiful layout | Screenshot | P0 |
| USER-007 | Journey | TI05 | all | User immediately understands it's a 4-page card | Canvas | SpreadNavigator shows 4 clear page previews | Screenshot | P0 |
| USER-008 | Journey | TI05 | all | Page labels understandable (Aussen/Innen) | Canvas | Labels match physical card (outside/inside) | Screenshot | P1 |

### Step 3: "I want to put her photo on the cover"

What could go wrong: Photo upload button not obvious. Cover photo doesn't appear where expected. Photo stretched or distorted.

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| USER-009 | Journey | TI05 | outside-spread | Upload cover photo button is obvious | Canvas | Clear "Foto hochladen" or camera icon | Screenshot | P0 |
| USER-010 | Journey | TI05 | outside-spread | After upload: photo looks good (not stretched) | Canvas | Photo properly cover-cropped | Screenshot | P0 |
| USER-011 | Journey | TI05 | outside-spread | User knows they're on the "cover" (outside) | Canvas | "Aussen" tab clearly active | Screenshot | P0 |
| USER-012 | Journey | TI05 | front | User can also upload portrait photo on inner page | Canvas | Clear upload UI on front page | Screenshot | P0 |

### Step 4: "I want to write her name and the dates"

What could go wrong: Text field not clickable/editable. Can't find where name goes. Name doesn't fit.

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| USER-013 | Journey | TI05 | back | Click on name text, cursor appears, can type | Canvas | Text editable on click or double-click | Manual | P0 |
| USER-014 | Journey | TI05 | back | Type "Maria Schmidt", immediately visible | Canvas | Name updates live as user types | Screenshot | P0 |
| USER-015 | Journey | TI05 | back | Type birth date "* 15. Marz 1950" | Canvas | Date renders correctly with asterisk | Screenshot | P0 |
| USER-016 | Journey | TI05 | back | Type death date "dagger 8. April 2026" | Canvas | Date renders correctly with dagger | Screenshot | P0 |
| USER-017 | Journey | TI05 | back | Long name "Maria Magdalena Schmidt-Oberfeldhofer" | Canvas | Name auto-shrinks, stays readable | Screenshot | P0 |

### Step 5: "I want to pick a nice font"

What could go wrong: Font picker not visible. Font previews don't load. Script fonts illegible at small sizes.

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| USER-018 | Journey | TI05 | back | Font carousel visible and labeled | Canvas | "Fonts" or carousel clearly visible | Screenshot | P0 |
| USER-019 | Journey | TI05 | back | Font preview shows "Aa" in actual font | Canvas | Each font button rendered in its own font | Screenshot | P0 |
| USER-020 | Journey | TI05 | back | Click font, all text changes immediately | Canvas | Instant visual feedback | Screenshot | P0 |
| USER-021 | Journey | TI05 | back | Script font "Great Vibes" looks elegant for memorial | Canvas | Script font readable and beautiful | Screenshot | P1 |
| USER-022 | Journey | TI05 | back | User can scroll through all fonts | Canvas | Carousel scrollable, no fonts hidden | Screenshot | P1 |

### Step 6: "I want to see what it looks like before I print"

What could go wrong: Preview button not obvious. Preview doesn't match canvas. Preview shows technical artifacts.

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| USER-023 | Journey | TI05 | all | "Vorschau" button clearly visible | Canvas | Button labeled and prominent | Screenshot | P0 |
| USER-024 | Journey | TI05 | all | Preview shows exactly what will be printed | Preview | WYSIWYG - no surprises | Visual compare | P0 |
| USER-025 | Journey | TI05 | all | Preview includes ALL pages (cover + inner) | Preview | User can see entire card | Screenshot | P0 |
| USER-026 | Journey | TI05 | all | Preview loads in < 3 seconds | Preview | Not too long for grieving user | Timer | P0 |
| USER-027 | Journey | TI05 | all | No grid, fold lines, or dev artifacts in preview | Preview | Clean, professional look | Screenshot | P0 |

### Step 7: "I want to download the PDF to send to the print shop"

What could go wrong: Download button not obvious. PDF takes too long. PDF doesn't match preview. Wrong dimensions.

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| USER-028 | Journey | TI05 | all | Download button clearly visible | Canvas | "PDF herunterladen" or download icon | Screenshot | P0 |
| USER-029 | Journey | TI05 | all | PDF generates with loading indicator | Canvas | Spinner or progress during generation | Screenshot | P0 |
| USER-030 | Journey | TI05 | all | PDF downloads to user's device | PDF | File appears in downloads folder | Browser | P0 |
| USER-031 | Journey | TI05 | all | PDF matches the preview exactly | PDF+Preview | Visual match | Visual compare | P0 |
| USER-032 | Journey | TI05 | all | PDF has meaningful filename | PDF | Not "download.pdf" but "Erinnerungsbild-TI05.pdf" | Browser | P1 |
| USER-033 | Journey | TI05 | all | PDF accepted by print shop (dimensions correct) | PDF | 140x105mm pages | PDF properties | P0 |

### Step 8: "Wait, I want to change the quote"

What could go wrong: Can't find quote field. After editing, have to re-download PDF. Preview shows old quote.

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| USER-034 | Journey | TI05 | back | Navigate to back page to find quote | Canvas | User can find and click quote text | Manual | P0 |
| USER-035 | Journey | TI05 | back | Edit quote, new text appears immediately | Canvas | Quote updates live | Screenshot | P0 |
| USER-036 | Journey | TI05 | back | Other edits (name, dates) still preserved | Canvas | Only quote changed | Screenshot | P0 |
| USER-037 | Journey | TI05 | back | Photo still on front page after quote edit | Canvas | Navigate to front, photo still there | E2E | P0 |

### Step 9: "Actually, I only want the photo on the left half of the cover"

What could go wrong: Cover mode switch not discoverable. "Vollbild/Halbbild" confusing terminology. Switch loses cover photo.

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| USER-038 | Journey | TI05 | outside-spread | Cover mode toggle is discoverable | Canvas | Button/toggle visible when on cover page | Screenshot | P0 |
| USER-039 | Journey | TI05 | outside-spread | Terminology understandable (Vollbild/Halbbild) | Canvas | Labels clear to non-technical user | Screenshot | P1 |
| USER-040 | Journey | TI05 | outside-spread | Switch to Halbbild, photo moves to left half | Canvas | Photo on left, right half clean | Screenshot | P0 |
| USER-041 | Journey | TI05 | outside-spread | Cover photo NOT lost after mode switch | Canvas | Same photo, different layout | Screenshot | P0 |
| USER-042 | Journey | TI05 | front | Inner pages unaffected by cover mode switch | Canvas | Front page photo still full | E2E | P0 |

### Step 10: "Let me check the preview again"

What could go wrong: Preview doesn't reflect cover mode change. Preview caches old version.

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| USER-043 | Journey | TI05 | all | Second preview reflects ALL changes | Preview | New quote + Halbbild cover + all other edits | Screenshot | P0 |
| USER-044 | Journey | TI05 | all | No cached/stale preview | Preview | Fresh render every time | E2E | P0 |
| USER-045 | Journey | TI05 | all | Preview still loads quickly (< 3 sec) | Preview | Not slower on subsequent opens | Timer | P1 |

### Step 11: "OK, download the PDF"

What could go wrong: Second PDF has old data (cached). PDF doesn't match updated preview.

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| USER-046 | Journey | TI05 | all | Second PDF reflects ALL latest changes | PDF | New quote + Halbbild cover | Open PDF | P0 |
| USER-047 | Journey | TI05 | all | Second PDF matches second preview | PDF+Preview | Visual match | Visual compare | P0 |
| USER-048 | Journey | TI05 | all | PDF filename different from first (or overwrites) | PDF | No confusion with multiple downloads | Browser | P2 |

### Step 12: "The print shop says dimensions are wrong -- let me re-download"

What could go wrong: No way to verify dimensions. Re-download produces different result. User has to redo all changes.

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| USER-049 | Journey | TI05 | all | Third download, same PDF (idempotent) | PDF | Same content, same dimensions | Open PDF | P0 |
| USER-050 | Journey | TI05 | all | All user's work preserved (didn't lose edits) | Canvas | Card still has all customizations | Screenshot | P0 |
| USER-051 | Journey | TI05 | all | Dimensions info visible somewhere in UI | Canvas | "140 x 105 mm" shown on card info | Screenshot | P2 |
| USER-052 | Journey | TI05 | all | PDF pages correctly sized for print shop | PDF | Page 1: 140x105mm, Pages 2-3: 70x105mm | PDF properties | P0 |

### Additional User Trust Tests

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| USER-053 | Trust | TI05 | all | No English error messages (German user) | Canvas | All errors in German | Manual | P1 |
| USER-054 | Trust | TI05 | all | No blank/white areas where content should be | Canvas | Every area has intentional content | Screenshot | P0 |
| USER-055 | Trust | TI05 | all | Card looks professional enough to pay for | Canvas | Comparable to Kartenmacherei quality | Visual compare | P0 |
| USER-056 | Trust | TI05 | all | Loading states show progress (not frozen UI) | Canvas | Spinners, progress bars where needed | Screenshot | P1 |
| USER-057 | Trust | TI05 | all | Accidental close, draft saves, user can return | Canvas | Work preserved on tab close/reload | Manual | P0 |
| USER-058 | Trust | TI07 | all | Ornament template looks respectful/appropriate | Canvas | Religious ornaments tasteful | Visual review | P0 |
| USER-059 | Trust | TI08 | all | Oval portrait looks dignified | Canvas | Photo in elegant oval frame | Visual review | P0 |
| USER-060 | Trust | TI09 | all | Floral design looks comforting | Canvas | Flowers/verse combination appropriate | Visual review | P0 |
| USER-061 | Trust | TI04 | all | Text-only template looks complete without photo | Canvas | Elegant typography, not "missing photo" | Visual review | P0 |
| USER-062 | Trust | TI05 | all | User can go back and change template without losing work? | Canvas | Warning about data loss before switch | Manual | P1 |
| USER-063 | Trust | TI05 | all | PDF can be reopened in Adobe Reader | PDF | PDF valid and readable | Open in Reader | P0 |
| USER-064 | Trust | TI05 | all | PDF can be opened in Mac Preview | PDF | PDF valid on macOS | Open on Mac | P1 |
| USER-065 | Trust | TI05 | all | PDF can be sent via email (< 10MB) | PDF | File size reasonable | File properties | P1 |
| USER-066 | Trust | TI05 | all | User doesn't need a tutorial to use the builder | Canvas | UI intuitive, self-explanatory | User testing | P0 |
| USER-067 | Trust | TI05 | all | Error states are comforting, not technical | Canvas | "Etwas ist schiefgelaufen" not "500 Internal Server Error" | Manual | P0 |
| USER-068 | Trust | TI05 | all | Mobile user redirected to desktop or warned | Canvas | Mobile guard or responsive layout | Screenshot mobile | P1 |

---

# Summary

| Section | Test Range | Count |
|---------|-----------|-------|
| Cat 1: Template Load | T001-T060 | 60 |
| Cat 2: Text Editing | T061-T200 | 140 |
| Cat 3: Font Changes | T201-T326 | 126 |
| Cat 4: Photo Management | T327-T446 | 120 |
| Cat 5: Page Navigation | T447-T506 | 60 |
| Cat 6: Cover Mode | T507-T546 | 40 |
| Cat 7: Template Switch | T547-T582 | 36 |
| Cat 8: Preview | T583-T632 | 50 |
| Cat 9: PDF Download | T633-T692 | 60 |
| Cat 10: Undo/Redo | T693-T732 | 40 |
| Cat 11: Element Manipulation | T733-T772 | 40 |
| Cat 12: Canvas Overlays | T773-T802 | 30 |
| Cat 13: Draft Save/Restore | T803-T832 | 30 |
| Cat 14: Negative Tests | T833-T892 | 60 |
| Cat 15: Visual Consistency | T893-T940 | 48 |
| Cat 16: Dimensions | T941-T960 | 20 |
| Cat 17: Edge Cases | T961-T1000 | 40 |
| ARCH: Architecture | ARCH-001 to ARCH-048 | 48 |
| USER: End User Journey | USER-001 to USER-068 | 68 |
| **TOTAL** | | **1,116** |

---

## Priority Distribution

| Priority | Count | Description |
|----------|-------|-------------|
| P0 | ~320 | Blocks release - must pass before any deployment |
| P1 | ~450 | Must fix before production - critical quality |
| P2 | ~230 | Should fix - noticeable quality issues |
| P3 | ~116 | Nice to have - polish items |

---

## PERSONA 3B: User Journey — GAPS FOUND (USER-069 to USER-200)

The original USER tests only cover TI05 and use "Screenshot"/"Manual" verification. These tests fill the gaps: all templates, Gemini-scored, and focused on what makes a USER lose trust.

### "The thumbnails don't match what I see"

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| USER-069 | Thumbnail Trust | TI05 | outside-left | Fresh load | Thumbnail | LEFT half of forest clearly visible (not blank) | Gemini >= 80 | P0 |
| USER-070 | Thumbnail Trust | TI05 | outside-right | Fresh load | Thumbnail | RIGHT half of forest clearly visible (not blank, not white) | Gemini >= 80 | P0 |
| USER-071 | Thumbnail Trust | TI05 | front | Fresh load | Thumbnail | Bark/photo clearly visible (not blank) | Gemini >= 80 | P0 |
| USER-072 | Thumbnail Trust | TI05 | back | Fresh load | Thumbnail | Text layout visible (heading, name, lines) | Gemini >= 80 | P0 |
| USER-073 | Thumbnail Trust | TI04 | outside-left | Fresh load | Thumbnail | LEFT half of forest | Gemini >= 80 | P0 |
| USER-074 | Thumbnail Trust | TI04 | outside-right | Fresh load | Thumbnail | RIGHT half of forest | Gemini >= 80 | P0 |
| USER-075 | Thumbnail Trust | TI04 | front | Fresh load | Thumbnail | Text layout (heading, name, quote) visible | Gemini >= 80 | P0 |
| USER-076 | Thumbnail Trust | TI06 | front | Fresh load | Thumbnail | L-form layout: photo left, text right | Gemini >= 80 | P0 |
| USER-077 | Thumbnail Trust | TI07 | front | Fresh load | Thumbnail | Ornament + text visible | Gemini >= 80 | P0 |
| USER-078 | Thumbnail Trust | TI07 | back | Fresh load | Thumbnail | Rounded photo visible | Gemini >= 80 | P0 |
| USER-079 | Thumbnail Trust | TI08 | front | Fresh load | Thumbnail | Cross + text visible | Gemini >= 80 | P0 |
| USER-080 | Thumbnail Trust | TI08 | back | Fresh load | Thumbnail | Oval/ellipse photo visible | Gemini >= 80 | P0 |
| USER-081 | Thumbnail Trust | TI09 | front | Fresh load | Thumbnail | Ornament + name + photo visible | Gemini >= 80 | P0 |
| USER-082 | Thumbnail Trust | TI09 | back | Fresh load | Thumbnail | Quote text visible | Gemini >= 80 | P0 |

### "I edited something and the thumbnail didn't update"

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| USER-083 | Thumbnail Update | TI05 | back | Type "Maria Schmidt" on name | Thumbnail | Thumbnail shows "Maria Schmidt" (not old name) | Gemini >= 80 | P0 |
| USER-084 | Thumbnail Update | TI05 | back | Change font to Great Vibes | Thumbnail | Thumbnail shows script font (not old font) | Gemini >= 80 | P0 |
| USER-085 | Thumbnail Update | TI05 | outside-spread | Upload cover photo (Woman.jpg) | Thumbnail | BOTH Außen links AND Außen rechts show new photo | Gemini >= 80 | P0 |
| USER-086 | Thumbnail Update | TI05 | front | Upload portrait photo | Thumbnail | Innen links thumbnail shows new portrait | Gemini >= 80 | P0 |
| USER-087 | Thumbnail Update | TI05 | outside-spread | Switch to Halbbild | Thumbnail | Außen links shows photo, Außen rechts shows white/blank | Gemini >= 80 | P0 |
| USER-088 | Thumbnail Update | TI04 | front | Edit heading text | Thumbnail | Updated heading visible in thumbnail | Gemini >= 80 | P1 |
| USER-089 | Thumbnail Update | TI07 | back | Upload photo (rounded clip) | Thumbnail | Rounded photo visible in thumbnail | Gemini >= 80 | P1 |
| USER-090 | Thumbnail Update | TI08 | back | Upload photo (ellipse clip) | Thumbnail | Ellipse photo visible in thumbnail | Gemini >= 80 | P1 |

### "I edited the text but the preview/PDF shows something different"

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| USER-091 | Edit→Preview | TI05 | back | Type "Maria Schmidt", open preview | Preview | Preview shows "Maria Schmidt" (Gemini verified) | Gemini >= 80 | P0 |
| USER-092 | Edit→PDF | TI05 | back | Type "Maria Schmidt", download PDF | PDF | PDF page 3 shows "Maria Schmidt" (Gemini verified) | Gemini >= 80 | P0 |
| USER-093 | Edit→Preview | TI05 | back | Change font to Great Vibes, preview | Preview | Preview shows Great Vibes font | Gemini >= 80 | P0 |
| USER-094 | Edit→PDF | TI05 | back | Change font to Great Vibes, PDF | PDF | PDF page 3 shows Great Vibes font | Gemini >= 80 | P0 |
| USER-095 | Edit→Preview | TI05 | back | Change color to gold (#8B7D3C), preview | Preview | Gold text visible in preview | Gemini >= 80 | P0 |
| USER-096 | Edit→PDF | TI05 | back | Change color to gold, PDF | PDF | Gold text in PDF | Gemini >= 80 | P0 |
| USER-097 | Edit→Preview | TI05 | back | Change alignment to left, preview | Preview | Left-aligned text in preview | Gemini >= 80 | P1 |
| USER-098 | Edit→PDF | TI05 | back | Change alignment to left, PDF | PDF | Left-aligned text in PDF | Gemini >= 80 | P1 |
| USER-099 | Edit→Preview | TI07 | front | Edit "Maria\nSchmidt" multiline, preview | Preview | Two-line name in preview | Gemini >= 80 | P0 |
| USER-100 | Edit→PDF | TI07 | front | Edit "Maria\nSchmidt" multiline, PDF | PDF | Two-line name in PDF | Gemini >= 80 | P0 |
| USER-101 | Edit→Preview | TI09 | back | Edit closing verse, preview | Preview | Verse visible in preview | Gemini >= 80 | P0 |
| USER-102 | Edit→PDF | TI09 | back | Edit closing verse, PDF | PDF | Verse in PDF | Gemini >= 80 | P0 |

### "My changes disappeared when I switched pages"

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| USER-103 | State Loss | TI05 | back→front→back | Edit name, switch to front, switch back | Canvas | Name "Maria Schmidt" still there | E2E + Gemini | P0 |
| USER-104 | State Loss | TI05 | back→outside→back | Edit name, switch to Außen, switch back | Canvas | Name still there | E2E + Gemini | P0 |
| USER-105 | State Loss | TI05 | outside→front→outside | Upload cover, switch to front, switch back | Canvas | Cover photo still there | E2E + Gemini | P0 |
| USER-106 | State Loss | TI05 | front→back→front | Upload portrait, switch to back, switch back | Canvas | Portrait still there | E2E + Gemini | P0 |
| USER-107 | State Loss | TI07 | front→back→front | Edit all text, switch to photo page, switch back | Canvas | All text preserved | E2E + Gemini | P0 |
| USER-108 | State Loss | TI05 | all | Edit on ALL 4 pages, navigate full circle | Canvas | All 4 pages have their edits | E2E + Gemini | P0 |
| USER-109 | State Loss | TI05 | back | Edit font, switch page, switch back | Canvas | Font preserved (not reset to default) | E2E + Gemini | P0 |
| USER-110 | State Loss | TI05 | back | Edit color, switch page, switch back | Canvas | Color preserved | E2E + Gemini | P0 |

### "The cover photo doesn't appear in preview/PDF"

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| USER-111 | Cover→Preview | TI05 | outside | Upload Woman.jpg cover, preview | Preview | Outside section shows Woman.jpg, NOT TREE.jpg | Gemini >= 80 | P0 |
| USER-112 | Cover→PDF | TI05 | outside | Upload Woman.jpg cover, PDF | PDF | Page 1 shows Woman.jpg, NOT TREE.jpg | Gemini >= 80 | P0 |
| USER-113 | Cover→Preview | TI05 | outside | Halbbild + Woman.jpg, preview | Preview | Woman.jpg on left half, white right half | Gemini >= 80 | P0 |
| USER-114 | Cover→PDF | TI05 | outside | Halbbild + Woman.jpg, PDF | PDF | Page 1: Woman.jpg left half, white right | Gemini >= 80 | P0 |
| USER-115 | Cover Leak | TI04 | all | Upload cover (TI04 has no inner photo) | Preview | Inside section shows TEXT ONLY, NO cover photo | Gemini >= 80 | P0 |
| USER-116 | Cover Leak | TI04 | all | Upload cover, PDF | PDF | Pages 2-3 have text only, NO cover photo | Gemini >= 80 | P0 |

### "The inner page text is cut off on the canvas"

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| USER-117 | Text Overflow | TI05 | back | Load template, check name | Canvas | "Brigitte Musterfrau" FULLY readable, not "Brigitte M..." | Gemini >= 80 | P0 |
| USER-118 | Text Overflow | TI05 | back | Load template, check all text | Canvas | ALL text (heading, dates, quote, author) fully visible | Gemini >= 80 | P0 |
| USER-119 | Text Overflow | TI07 | front | Load template, check name | Canvas | "Franziska\nMuster" fully readable | Gemini >= 80 | P0 |
| USER-120 | Text Overflow | TI08 | front | Load template, check name | Canvas | "Erna\nMusterfrau" fully readable | Gemini >= 80 | P0 |
| USER-121 | Text Overflow | TI09 | back | Load template, check quote | Canvas | Full quote readable | Gemini >= 80 | P0 |
| USER-122 | Text Overflow | TI04 | front | Load template, all 7 text elements | Canvas | ALL text within canvas bounds | Gemini >= 80 | P0 |
| USER-123 | Text Overflow | TI06 | front | Load template, L-form layout | Canvas | Name + dates + quote all visible | Gemini >= 80 | P0 |

### User Journey per TEMPLATE (not just TI05)

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| USER-124 | Full Journey | TI04 | all | Load→edit name→edit quote→preview→PDF | All | Text-only card renders consistently across all 3 paths | Gemini >= 80 | P0 |
| USER-125 | Full Journey | TI06 | all | Load→edit name→upload photo→preview→PDF | All | L-form layout with custom photo and name | Gemini >= 80 | P0 |
| USER-126 | Full Journey | TI07 | all | Load→edit name→edit dates→upload photo→preview→PDF | All | Cross ornament + custom text + photo on back | Gemini >= 80 | P0 |
| USER-127 | Full Journey | TI08 | all | Load→edit name→upload photo→preview→PDF | All | Thin cross + custom text + oval photo | Gemini >= 80 | P0 |
| USER-128 | Full Journey | TI09 | all | Load→edit all fields→upload photo→preview→PDF | All | Floral + name + photo front, quote+verse back | Gemini >= 80 | P0 |

### Cross-output VISUAL CONSISTENCY (Gemini compares)

| # | Category | Template | Page | Action | Output | Expected Result | Verify Method | Priority |
|---|----------|----------|------|--------|--------|-----------------|---------------|----------|
| USER-129 | Canvas=Preview | TI05 | back | Edit name+font, screenshot canvas + preview | Canvas vs Preview | Same name, same font, same layout | Gemini compare >= 80 | P0 |
| USER-130 | Preview=PDF | TI05 | back | Edit name+font, screenshot preview + PDF page | Preview vs PDF | Same name, same font, same layout | Gemini compare >= 80 | P0 |
| USER-131 | Canvas=Preview | TI05 | outside | Upload cover, screenshot canvas + preview | Canvas vs Preview | Same cover photo | Gemini compare >= 80 | P0 |
| USER-132 | Preview=PDF | TI05 | outside | Upload cover, screenshot preview + PDF page 1 | Preview vs PDF | Same cover photo | Gemini compare >= 80 | P0 |
| USER-133 | Canvas=Preview | TI07 | front | Default load, canvas vs preview | Canvas vs Preview | Ornament + text match | Gemini compare >= 80 | P0 |
| USER-134 | Canvas=Preview | TI08 | back | Default load, canvas vs preview | Canvas vs Preview | Ellipse photo match | Gemini compare >= 80 | P0 |
| USER-135 | All 3 match | TI05 | all | Full edit → canvas screenshot → preview screenshot → PDF page PNGs | All | All 3 outputs visually consistent | Gemini compare >= 80 | P0 |
| USER-136 | All 3 match | TI07 | all | Full edit → all 3 outputs | All | All 3 outputs visually consistent | Gemini compare >= 80 | P0 |

---

## Automation Recommendations

1. **Playwright E2E** (highest ROI): T001-T060 (template load), T583-T632 (preview), T833-T892 (negative), T893-T940 (visual consistency)
2. **Unit tests**: ARCH-006 to ARCH-024 (state sync, cascade), T888-T889 (clamp functions)
3. **Visual regression** (Gemini scorer): T893-T940 (canvas vs preview vs PDF comparison)
4. **Manual only**: T408-T416 (photo edge cases), USER-055 (Kartenmacherei comparison), T985-T992 (cross-browser)
