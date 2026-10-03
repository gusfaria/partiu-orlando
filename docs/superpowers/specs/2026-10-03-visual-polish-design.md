# Visual Polish ("Crest & Passport") — Design Document

**Feature:** Refine the existing Partiu Orlando look rather than replace it. Keep the nav, the 🏰 mark, fonts and palette, and add a travel-document layer: boarding pass, ticket stubs, passport page, mono labels and gold rules.
**Aesthetic source:** Direction "C · Crest & Passport" from the 2026-10-03 brainstorm (inspired by the trip's navy/gold bottles and backpacks in `inspo/`), merged with the current site. Mockups are saved in `.superpowers/brainstorm/32124-1791066726/content/`. The approved screens are `current-plus-c.html` (home), `pass-and-schedule.html` (flip-board and schedule chips), `inner-pages-v2.html` (arrivals, cars, profile) and `activities-top-stub.html` (option A).

---

## 1. Overview

The 2026-07-29 "small world" system gave the app tokens and a kit, but the result reads as a generic app with a badge: faint scattered motifs, white tickets clashing on the navy home, and identical plain white cards on every inner page. This pass keeps that foundation and makes it feel like a trip:

- **Presentation only.** No data, query, route, RLS or behavior changes. All existing copy stays. The only new copy is the translated page eyebrows (§3.1).
- **Unchanged:** `Nav.tsx`, the 🏰 emoji, the fonts (Fredoka / Space Mono / Inter) and the color tokens in `globals.css`.

## 2. Shared kit (`src/components/brand/`)

Built once and used by every page. Literal Tailwind class lookups only (no dynamic class names), as before.

| Component | Purpose |
|---|---|
| `PageHeader` | Mono uppercase eyebrow (`font-ticket`, tracking-widest, navy/60) above the `font-display` title, with a 2px gold rule filling the remaining width to the right of the title. Props: `eyebrow`, `title`. |
| `BrandButton` (update) | `primary` = navy background, gold text, 3px gold bottom "pressed" shadow. `secondary` = white, navy text, 1.5px navy border (the "selected"/undo state, e.g. "Não vou mais"). Add a `quiet` variant: mono uppercase text link with an underline (Editar). Add a `danger-quiet` variant: the same, in a darker orange-red that passes AA on white (Excluir). |
| `TicketBand` | Full-width navy strip for the top of a ticket card: date on the left (mono weekday, Fredoka gold day number, mono month), free mono meta text on the right. Ends in a dashed tear line with cream notch circles on both card edges. |
| `TicketLegs` | Row of 2–3 equal cells split by dashed dividers. Each cell has a mono label and a Fredoka value (an optional mono sub-value such as a time). Used for Chegada/Saída and Retirada/Devolução/Lugares. Shows "—" in navy/30 for an empty value. |
| `FilterChip` | Pill with a mono uppercase label and an optional color dot. Active = navy background with gold text. Idle = transparent with a navy/25 border. |
| `BoardingPass` | Home countdown (§4.1). |
| `SplitFlap` | 3-letter split-flap airport code display used inside `BoardingPass`. |

**Retired:** `ScallopedBadge` and `SunburstBg` go once nothing imports them (home and login). `TicketCard` stays for login and admin, restyled to match (§5).

## 3. Cross-cutting rules

### 3.1 Page eyebrows (new copy, PT + EN)
Add keys to `pt.json` / `en.json` and render them through `PageHeader`:

| Page | PT | EN |
|---|---|---|
| Programação | Out 2026 · 9 → 18 | Oct 2026 · 9 → 18 |
| Chegadas e Saídas | Quem chega quando | Who lands when |
| Atividades | Parques & passeios | Parks & outings |
| A Casa | Nosso lar em Kissimmee | Our home in Kissimmee |
| Carros | Frota da família | The family fleet |
| Meu Perfil | Passaporte | Passport |
| Admin | Bastidores | Backstage |

### 3.2 Card surface (inner pages, on cream)
White, rounded-2xl, navy/8 border, `0 4px 0` navy/6 shadow, with internal dividers as dashed navy/20. Card meta labels use mono uppercase at 9–10px, tracking-widest, navy/55.

### 3.3 Accessibility
- On white or cream, gold is used only for fills, rules, underlines and borders, never for text. Gold text appears only on navy.
- `SplitFlap` respects `prefers-reduced-motion`: it shows the first code with no animation. The flipping code sits in an `aria-hidden` element, with a static visually-hidden "GIG, JFK, LAX → MCO" for screen readers.
- Buttons keep a visible focus ring (`focus-visible:ring-2 ring-gold ring-offset-2`).

## 4. Pages

### 4.1 Home `/`
- **Backdrop:** the full-bleed navy backdrop and the optional hero photo at 15% stay. `SunburstBg` is replaced by one radial glow (lighter navy at top center, fading to navy).
- **Crest:** an 84px circle with a 2px gold border and an inner dashed gold ring (an outline offset), containing a large 🏰. Below it are the "Partiu Orlando" Fredoka title in cream and a mono gold "GUSTAVO · PHILIPE" with short gold rules on either side.
- **BoardingPass** (cream card on navy, with a 6px dark bottom shadow):
  - Left: a mono label "Cartão de embarque" / "Boarding pass" (new i18n key). The route is `SplitFlap` origin ✈ fixed "MCO" (gold flap tiles) with "Orlando" under MCO only. Below that are **Ida** 9 out and **Volta** 18 out, from the existing trip dates (new i18n keys for the labels and dates).
  - Right stub: gold fill, dashed left edge with notches, and the existing countdown strings `countdown_prefix` / days / `countdown_label`. It uses the existing `daysUntilTrip` logic unchanged.
  - Origins list: a hand-edited constant `TRIP_ORIGINS = ['GIG', 'JFK', 'LAX']` in `src/lib/` (not derived from arrival data, which has no airport field). It cycles every ~3.2 s, letters flip through A–Z with a ~45 ms tick, and each letter starts staggered by ~120 ms.
- **Cards** (facts, checklist, missing arrivals): outlined, with a 1px gold/35 border, a white/3 fill and a mono gold label followed by a gold/25 hairline. Body text is cream/85. The "Ver detalhes da casa →" link is in gold Fredoka. Checklist items get a small gold-outlined checkbox glyph (decorative). Avatars get a gold ring.

### 4.2 Programação `/schedule`
- Header via `PageHeader`.
- **Only the filter chips change**, to `FilterChip`. Each filter keeps its existing color as the dot: arrival = teal, departure = coral, activity = gold, marker = pink, and "Tudo" has no dot. The active state becomes navy/gold for all five filters. This replaces the current colored-fill active states in `FILTER_STYLE`.
- Day cards, pills, month grid, detail panel and mobile stacking are unchanged.

### 4.3 Atividades `/activities` — `ActivityCard`
- `TicketBand` on top: the date comes from `activity_date` (when it's missing, the band shows a mono "—"). The right side shows `HH:MM · $ cost` when present.
- Below the tear line, at full width: the title (Fredoka 18), the description, then a row with the sign-up `BrandButton` (primary "Vou!" / secondary "Não vou mais") on the left and "Comprar ingressos →" (mono, gold underline) on the right.
- Acompanhantes stepper: a dashed-gold pill with circular −/+ buttons (same behavior).
- Confirmados: overlapping avatar stack (with the existing `+N` badges) and the mono label "Confirmados · N", from the existing headcount math.
- **Not changed here:** how the description renders mixed PT/EN text (see §7).

### 4.4 Chegadas e Saídas `/arrivals` — `ArrivalEventCard`, `ArrivalEventsSection`
- Card top: a mono label `<transport emoji> <transportation> · <description>`, then the avatar stack and the names in Fredoka.
- `TicketLegs`: ↓ Chegada (date "09 out" + mono time) | ↑ Saída. A missing side shows "—".
- Footer, dashed-divided and right-aligned: `quiet` Editar and `danger-quiet` Excluir.
- The add/edit form uses `PageHeader`, the primary button, and inputs restyled per §5.

### 4.5 Carros `/cars` — `CarCard`, `CarsSection`, `InfoPage`
- The photo stays flush at the top of the card (no inner rounding inset). Below it: a mono label `company · location`, then Fredoka `brand — color`.
- `TicketLegs`: Retirada | Devolução | Lugares.
- Footer: small avatar plus mono "por <name>" (existing `added_by` string) on the left, and quiet Editar/Excluir on the right.
- `InfoPage` header goes through `PageHeader`. The gallery and markdown are unchanged.

### 4.6 A Casa `/house` — `HouseContent`
- `PageHeader`. Markdown prose: `h2`/`h3` in Fredoka navy with a short gold underline bar, list bullets in gold, links underlined with gold decoration. Carousel and map unchanged.

### 4.7 Meu Perfil `/profile`
- A "passport page" card: a navy top strip with the mono gold "PASSAPORTE · PARTIU ORLANDO" (i18n) and 🏰 on the right.
- The photo is a 72×88 rounded-rect portrait with the mono label "Viajante"/"Traveler" (i18n) and the name in Fredoka beside it. "Trocar foto" becomes a `quiet` link.
- Fields: mono label above, underline-only input (navy/35 bottom border, gold on focus). The selected color swatch gets a white plus navy double ring.
- Primary Salvar button. A decorative MRZ line at the bottom (`aria-hidden`, mono navy/40, truncated): `P<BRA` + the uppercase name with diacritics stripped + `<<ORLANDO<2026<<<<…`.

### 4.8 Login `/login`
- On the existing navy screen, the `ScallopedBadge` is replaced by the home crest block (🏰 ring, title, mono rule). The existing "A FAMILY ADVENTURE · EST. 2026" stays as the mono line. The form card uses the §3.2 surface, the primary button and the §5 inputs.

### 4.9 Admin `/admin/*`
- `PageHeader` on each admin page, buttons mapped to `BrandButton` variants, inputs per §5. No layout changes.

## 5. Form inputs (all forms)
Mono uppercase 10px label. Input: white, navy/20 border, rounded-lg, and `focus:ring-2 ring-gold` (as today, now applied consistently). The profile page alone uses the underline style.

## 6. Testing
- Extend `brand.test.tsx`: render tests for `PageHeader`, `TicketBand` (with and without a date), `TicketLegs` (empty cell → "—"), `FilterChip` active state, and `BrandButton` variants.
- `SplitFlap`: a unit test for the pure next-letter step function, and a test that reduced motion renders the first code statically.
- An i18n parity test (if one doesn't already exist) confirming every new key exists in both `pt.json` and `en.json`.
- Existing test suite must stay green. `npm run build` (static export) must pass.
- Manual: the user checks every page on localhost at phone width and desktop width before merge, consistent with earlier phases.

## 7. Out of scope / next
- **Bilingual activity descriptions.** The user has PT and EN text mixed in a single description and it looks bad. This is a separate design conversation next. It likely involves a data change (per-language description fields), so it's not part of this styling pass.
- Nav changes, new pages, new content beyond §3.1 eyebrows, and dark mode.

## 8. Decisions log (2026-10-03 brainstorm)
- Chose direction C over A (neon stickers) and B (literal Mary Blair). Then narrowed to "improve, don't replace": keep the nav, 🏰 and fonts.
- No drawn castle crest. The 🏰 emoji in a gold ring is the mark.
- Home: the boarding pass with the flip-board was approved. The origin city names were dropped as too long ("Rio de Janeiro"); "Orlando" stays under MCO.
- Schedule: keep the current layout. Adopt only the new filter chips.
- Activities: the date stub on the side squished the content, so the stub moved to a top navy band (option A over the lighter chip option B).
- Eyebrows and the passport MRZ line kept. Every new string is translated PT + EN.
