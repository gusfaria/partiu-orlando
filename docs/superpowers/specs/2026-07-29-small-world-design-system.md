# "Small World" Visual System — Phase 1 Design Document

**Feature:** Establish a cut-paper / "it's a small world" visual identity for Partiu Orlando and apply it to the three highest-traffic surfaces (login, nav, home) as the flagship.
**Aesthetic source:** User PRD + `inspo/` references (esp. `1.webp` brand board). Mary Blair mid-century cut-paper look — deep navy, golden yellow, coral/teal/pink pops, cream, scalloped ticket shapes, arch badges.

---

## 1. Overview

The app today is functional but visually plain: a single orange accent, white cards on gray, system/Inter font. This introduces a reusable design system — color tokens, fonts, and a small kit of "cut-paper" components — and applies it to **login, nav, and home**. Remaining pages (itinerary, arrivals, activities, house, cars, explore, profile, admin) keep their current styling for now and get restyled in later phases using the same kit.

This is deliberately scoped to a foundation + flagship so the direction can be seen live before a full rollout. New PRD content sections (Our Story, Then & Now gallery, Guestbook) are out of scope — separate future features.

---

## 2. Design Tokens

### Colors (base = cream, chrome = navy)
Confirmed decision: **cream page background with navy "chrome"** (nav, hero panels, footer, headings), NOT a full-dark base — keeps forms and logistics tables readable while making navy the signature color.

| Token | Hex | Use |
|---|---|---|
| `cream` | `#FFF9EF` | page background, light cards |
| `navy` | `#1A2536` | nav bar, hero panels, headings, footer |
| `gold` | `#E5A93C` | primary accent (replaces orange), buttons, active states |
| `coral` | `#E76F51` | pop accent |
| `teal` | `#52A098` | pop accent |
| `pink` | `#E8A5A5` | pop accent |

Implemented as Tailwind v4 `@theme` tokens in `globals.css` (e.g. `--color-navy`, `--color-gold`, …), giving utilities like `bg-navy`, `text-gold`, `border-coral`.

### Fonts (via `next/font/google`, static-export safe)
- **Fredoka** — display/headings (rounded, high personality)
- **Space Mono** — ticket-stub subheads, labels, the countdown units
- **Inter** — body text (already in use, retained)

Exposed as `--font-display`, `--font-mono`, `--font-sans` theme tokens; applied through CSS variables set on `<body>`.

### Cleanup
`globals.css` currently carries leftover create-next-app defaults (a `prefers-color-scheme: dark` block, `body { font-family: Arial }`, unused `--background`/`--foreground`). These are removed/replaced so they don't fight the new system.

---

## 3. Core Components (the reusable kit)

Small, focused, presentational components in `src/components/brand/`:

- **`TicketCard`** — a card with a scalloped/perforated edge and an optional monospace label strip along the top (park-ticket look). Props: `label?`, `accent?` (gold/coral/teal/pink), `children`. Built with CSS `radial-gradient` scallop mask + border; no images.
- **`ScallopedBadge`** — the wavy-bordered arch badge from the logo, used for the hero centerpiece. Props: `children`, sizing. SVG scalloped border.
- **`BrandButton`** — chunky rounded button, gold fill, soft paper-shadow, subtle press animation. Variants: `primary` (gold), `secondary` (navy outline).
- **`SunburstBg`** — decorative layer of low-opacity inline-SVG cut-paper motifs (gold sunburst, starbursts, a palm silhouette, a looping coaster line). Absolutely-positioned, `pointer-events-none`, `aria-hidden`. Props to pick which motifs + placement.

All decorations are inline SVG (no new deps, no external image requests), so they stay crisp and static-export-friendly.

---

## 4. Flagship Surfaces

### `/login`
- Navy full-bleed backdrop with `SunburstBg` (floating starbursts + palm).
- Centerpiece: `ScallopedBadge` reading **PARTIU ORLANDO** with **40 + 45** and a mono tagline (e.g. "A FAMILY ADVENTURE · EST. 2026").
- The login form sits in a cream `TicketCard` with a mono "BOARDING PASS"-style label; inputs and the submit `BrandButton` restyled. PT/EN toggle kept.

### Nav (shared — changes app-wide immediately)
- Navy bar; **Fredoka** wordmark "Partiu Orlando" with a small sun/castle glyph; gold active-link state; mono nothing here (keep legible).
- Mobile hamburger menu panel restyled to navy/cream.
- Note: because Nav is shared, every page instantly gets the navy bar even before its body is restyled. This is an accepted transitional look during rollout.

### `/` Home
- Hero: navy panel with `ScallopedBadge` + a **ticket-stub countdown** (big Fredoka number, mono "DIAS PARA A VIAGEM" label) inside a `TicketCard`.
- Trip-facts, checklist, and "who hasn't arrived" blocks become cut-paper `TicketCard`s with accent colors (facts=teal, checklist=gold, nudge=coral).
- Existing hero image (if set) framed in a scalloped/arch treatment.
- All data logic unchanged — purely presentational swap.

---

## 5. Scope Boundaries & Transitional State

- **In scope:** design tokens + fonts + cleanup (global, safe/additive), the 4 brand components, and restyling `login`, `Nav`, `home`.
- **Out of scope (later phases):** itinerary, arrivals, activities, house, cars, explore, profile, admin bodies. They keep using `orange-*` utilities until their phase. **Known transitional inconsistency:** the navy/gold nav will sit above still-orange page bodies until each is migrated — acceptable and intended for a phased rollout.
- **Out of scope (future features):** Our Story section, Then & Now gallery, Guestbook/RSVP.

## 6. Accessibility & Constraints

- Contrast: navy `#1A2536` on cream `#FFF9EF` and gold on navy both meet AA for text sizes used; body copy stays near-black on cream.
- All decorative SVG layers are `aria-hidden` + `pointer-events-none`.
- No layout/behavior change to forms — same inputs, same flows, same i18n keys.
- Static export only; `next/font` self-hosts the Google fonts at build time (no runtime font CDN calls).

## 7. Testing

- Unit: none required (purely presentational); existing test suite must stay green.
- Build: `npm run build` passes; `/login`, `/`, and all routes still compile.
- Manual: login page badge + form; nav on desktop + mobile; home hero/countdown/cards; confirm other pages still render (with the transitional navy nav) and are readable.

## 8. Decisions Log

| Question | Decision |
|---|---|
| Overall aesthetic | Mary Blair "small world" cut-paper, per PRD + brand board |
| Base vs chrome | Cream base + navy chrome (not full dark) — readability |
| Primary accent | Golden yellow `#E5A93C` replaces orange |
| Fonts | Fredoka (display) + Space Mono (labels) + Inter (body) |
| Scope of phase 1 | Tokens + component kit + login/nav/home only |
| New PRD sections | Deferred to future features |
| Remaining pages | Later phases; transitional orange bodies accepted |
