# Small-World Rollout (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the already-shipped "small world" design system (navy/gold/cream, Fredoka/Space Mono, brand component kit) to every remaining page and component so the whole app is visually consistent with the login/nav/home restyle.

**Architecture:** Pure presentational restyle. The tokens (`bg-navy`/`text-gold`/`font-display`/`font-ticket`/…), and the `TicketCard`/`BrandButton`/`ScallopedBadge` components already exist from Phase 1. Each task swaps the old orange/gray Tailwind utilities on a group of files to the brand palette per the mapping table below. No data, logic, i18n, or component-API changes.

**Tech Stack:** Next.js 16 static export, Tailwind v4, existing brand components. No new deps.

## Global Constraints

- **This is presentational only** — do NOT change any hooks, queries, handlers, props, i18n keys, or behavior. Only `className` strings, heading fonts, and (where noted) wrapping existing markup in `TicketCard`.
- **Class mapping table (apply everywhere in the file being restyled):**
  | Old | New |
  |---|---|
  | `bg-orange-500` | `bg-gold` |
  | `hover:bg-orange-600` | `hover:brightness-105` |
  | `text-white` **on a gold button** | `text-navy` |
  | `text-orange-500` / `text-orange-600` (links/accents on white) | `text-navy` + add `underline decoration-gold decoration-2 underline-offset-2` (or `hover:underline hover:decoration-gold` for hover-only) |
  | `focus:ring-orange-400` | `focus:ring-gold` |
  | active chip/tab `bg-orange-500 text-white` | `bg-gold text-navy` |
  | active tab border `border-orange-500 text-orange-600` | `border-gold text-navy` |
  | `ring-orange-400` (selected) | `ring-gold` |
  | `hover:border-orange-300` | `hover:border-gold` |
  | page wrapper `bg-gray-50` | remove (body is already cream) |
  | heading `text-gray-900` on h1/h2 | `text-navy` **and add `font-display`** |
  | `text-gray-400/500` mono-ish labels | keep, or add `font-ticket` where it's a label/caption |
- **Never** put gold or coral text on a white/cream background (fails AA) — links on white cards use navy text with a gold underline. Gold-on-navy is fine.
- Delete/error affordances stay red (`text-red-600` / `border-red-200`) — semantic, leave as-is.
- No dynamic Tailwind class names — keep literal-string lookup records.
- Existing test suite (46 tests) must stay green; `npm run build` must pass after every task.
- Node: `nvm use 22` before any npm command. Working dir: `/Users/gusfaria/Documents/PROJECTS/Gustavo-Philipe__40-anos`. Do NOT push (feature branch `feat/small-world-rollout`; controller integrates).

---

### Task 1: Itinerary (schedule) — calendar, pills, day detail

**Files:**
- Modify: `src/components/ItineraryPill.tsx`, `src/components/ItineraryDayDetail.tsx`, `src/components/ItineraryCalendar.tsx`

- [ ] **Step 1: Restyle ItineraryPill color record**

In `src/components/ItineraryPill.tsx`, replace the `COLORS` record so pill types use the brand palette (literal classes, no dynamic names):

```tsx
const COLORS: Record<CalendarItem['type'], string> = {
  arrival:   'bg-teal/15 text-teal border-teal/40',
  departure: 'bg-coral/15 text-coral border-coral/40',
  activity:  'bg-gold/15 text-navy border-gold/50',
}
```

(These are on white day cells, so the text uses the saturated brand color for arrival/departure and navy for the gold pill to stay readable.)

- [ ] **Step 2: Restyle ItineraryCalendar chrome**

In `src/components/ItineraryCalendar.tsx`, apply the mapping table: the page `<h1>` gets `font-display` and `text-navy`; the filter chips' active state `bg-orange-500 text-white` → `bg-gold text-navy` (inactive `bg-gray-100 text-gray-600` stays); the selected-day cell `ring-orange-400` → `ring-gold` and `hover:border-orange-300` → `hover:border-gold`. Leave all data logic (`buildCalendarItems`, `itemsForDay`, filter state, queries) untouched.

- [ ] **Step 3: Restyle ItineraryDayDetail**

In `src/components/ItineraryDayDetail.tsx`, apply the mapping: any `text-orange-500` ticket/link → navy + gold underline; the type labels/`font-ticket` where captions appear; the buy-tickets link uses `text-navy underline decoration-gold decoration-2 underline-offset-2`. Keep the close button and all props/logic.

- [ ] **Step 4: Verify**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test && npm run build
```

Expected: 46 tests pass; build succeeds; `/schedule` compiles. Then grep to confirm no orange remains in these three files:

```bash
grep -n "orange-" src/components/ItineraryPill.tsx src/components/ItineraryDayDetail.tsx src/components/ItineraryCalendar.tsx || echo "no orange — good"
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ItineraryPill.tsx src/components/ItineraryDayDetail.tsx src/components/ItineraryCalendar.tsx
git commit -m "style: apply small-world palette to itinerary calendar"
```

---

### Task 2: Arrivals — section + card

**Files:**
- Modify: `src/components/ArrivalEventsSection.tsx`, `src/components/ArrivalEventCard.tsx`

- [ ] **Step 1: Restyle ArrivalEventsSection**

Apply the mapping in `src/components/ArrivalEventsSection.tsx`: page `<h1>` → `font-display text-navy`; the "+ Adicionar" and Save buttons `bg-orange-500 ... hover:bg-orange-600` (white text) → `bg-gold text-navy hover:brightness-105`; all form input `focus:ring-orange-400` → `focus:ring-gold`; the people multiselect selected chip `border-orange-400 bg-orange-50 text-orange-700` → `border-gold bg-gold/10 text-navy`. Keep every handler, the two-table save logic, validation, and i18n keys intact.

- [ ] **Step 2: Restyle ArrivalEventCard**

Apply the mapping in `src/components/ArrivalEventCard.tsx`: any orange accents → gold; keep the Edit (neutral) and Delete (red) buttons' semantics; add `font-display` to the person-name/title line if it's a heading. Transportation/date lines stay navy/gray.

- [ ] **Step 3: Verify**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test && npm run build
grep -n "orange-" src/components/ArrivalEventsSection.tsx src/components/ArrivalEventCard.tsx || echo "no orange — good"
```

Expected: 46 tests pass; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/ArrivalEventsSection.tsx src/components/ArrivalEventCard.tsx
git commit -m "style: apply small-world palette to arrivals"
```

---

### Task 3: Activities + Cars — pages, cards, section

**Files:**
- Modify: `src/app/activities/page.tsx`, `src/components/ActivityCard.tsx`, `src/components/CarsSection.tsx`, `src/components/CarCard.tsx`

- [ ] **Step 1: Restyle activities**

`src/app/activities/page.tsx`: `<h1>` → `font-display text-navy`; loading text stays. `src/components/ActivityCard.tsx`: the sign-up button (`bg-orange-500 text-white hover:bg-orange-600` when not signed up) → `bg-gold text-navy hover:brightness-105`; the signed-up state stays neutral gray; the "buy tickets" link `text-orange-500 hover:underline` → `text-navy underline decoration-gold decoration-2 underline-offset-2`; activity title gets `font-display`; the `+guests` counter's accent (`bg-orange-50 border-orange-100`) → `bg-gold/10 border-gold/30`, and the attendee `+N` badge `bg-orange-500` → `bg-gold text-navy`.

- [ ] **Step 2: Restyle cars**

`src/components/CarsSection.tsx`: section `<h2>` → `font-display text-navy`; "+ Adicionar carro" and Save buttons → `bg-gold text-navy hover:brightness-105`; input `focus:ring-orange-400` → `focus:ring-gold`. `src/components/CarCard.tsx`: brand/color title → `font-display`; any orange accents → gold; keep Edit/Delete semantics (red delete).

- [ ] **Step 3: Verify**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test && npm run build
grep -n "orange-" src/app/activities/page.tsx src/components/ActivityCard.tsx src/components/CarsSection.tsx src/components/CarCard.tsx || echo "no orange — good"
```

Expected: 46 tests pass; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/activities/page.tsx src/components/ActivityCard.tsx src/components/CarsSection.tsx src/components/CarCard.tsx
git commit -m "style: apply small-world palette to activities and cars"
```

---

### Task 4: Info pages — InfoPage, markdown, gallery

**Files:**
- Modify: `src/components/InfoPage.tsx`, `src/components/MarkdownRenderer.tsx`, `src/components/PhotoGallery.tsx`

- [ ] **Step 1: Restyle InfoPage heading**

`src/components/InfoPage.tsx`: the page `<h1>` → add `font-display`, `text-gray-900` → `text-navy`. Keep the gallery slot, markdown, and children rendering untouched.

- [ ] **Step 2: Restyle MarkdownRenderer prose links**

`src/components/MarkdownRenderer.tsx`: the prose config currently makes links `prose-a:text-orange-500`. Change link styling so links are navy with a gold underline: `prose-a:text-navy prose-a:underline prose-a:decoration-gold prose-a:decoration-2 hover:prose-a:decoration-gold` (drop the orange). Keep `prose-headings:font-bold`; optionally add `prose-headings:font-display`.

- [ ] **Step 3: Restyle PhotoGallery**

`src/components/PhotoGallery.tsx`: any orange hover/border → gold (`hover:border-gold` etc.); the caption text can gain `font-ticket`. Keep the grid, lazy loading, and new-tab links.

- [ ] **Step 4: Verify**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test && npm run build
grep -n "orange-" src/components/InfoPage.tsx src/components/MarkdownRenderer.tsx src/components/PhotoGallery.tsx || echo "no orange — good"
```

Expected: 46 tests pass; build succeeds; `/house`, `/cars`, `/explore` compile.

- [ ] **Step 5: Commit**

```bash
git add src/components/InfoPage.tsx src/components/MarkdownRenderer.tsx src/components/PhotoGallery.tsx
git commit -m "style: apply small-world palette to info pages, markdown, gallery"
```

---

### Task 5: Profile + Admin

**Files:**
- Modify: `src/app/profile/page.tsx`, `src/app/admin/layout.tsx`, `src/app/admin/users/page.tsx`, `src/app/admin/activities/page.tsx`, `src/app/admin/content/page.tsx`, `src/app/admin/photos/page.tsx`

- [ ] **Step 1: Restyle profile**

`src/app/profile/page.tsx`: `<h1>` → `font-display text-navy`; the Upload and Save buttons → `bg-gold text-navy hover:brightness-105`; input `focus:ring-orange-400` → `focus:ring-gold`; the avatar color-swatch selected ring stays (those are literal profile colors, not brand tokens). Keep `uploadAvatar`/`refreshProfile` logic intact.

- [ ] **Step 2: Restyle admin layout tabs**

`src/app/admin/layout.tsx`: `<h1>` → `font-display text-navy`; active tab `border-orange-500 text-orange-600` → `border-gold text-navy`; inactive stays gray.

- [ ] **Step 3: Restyle admin pages**

Apply the mapping across `src/app/admin/users/page.tsx`, `admin/activities/page.tsx`, `admin/content/page.tsx`, `admin/photos/page.tsx`: all primary/save/create/upload buttons `bg-orange-500 text-white hover:bg-orange-600` → `bg-gold text-navy hover:brightness-105`; all `focus:ring-orange-400` → `focus:ring-gold`; the content-tab slug buttons and photos-tab section buttons active `bg-orange-500 text-white` → `bg-gold text-navy`; the content "Preview/Editar" link `text-orange-500` → `text-navy underline decoration-gold decoration-2 underline-offset-2`; keep the amber info banners, red delete buttons, and all CRUD logic.

- [ ] **Step 4: Verify**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test && npm run build
grep -rn "orange-" src/app/profile src/app/admin || echo "no orange — good"
```

Expected: 46 tests pass; build succeeds; all admin routes compile.

- [ ] **Step 5: Commit**

```bash
git add src/app/profile/page.tsx src/app/admin/
git commit -m "style: apply small-world palette to profile and admin"
```

---

## Self-Review

**Spec coverage:** every file the inventory grep flagged is covered — itinerary (Task 1), arrivals (Task 2), activities+cars (Task 3), info pages/markdown/gallery (Task 4), profile+admin (Task 5). `ProtectedRoute.tsx` appeared in the grep only for a neutral `text-gray-400` loading string (no orange, no brand chrome) — intentionally left as-is; not worth a change.

**Placeholder scan:** no TBD/TODO; each task lists exact files and the exact class swaps (the mapping table + per-file specifics). The one non-trivial code block (ItineraryPill `COLORS` record) is written out in full.

**Consistency:** the mapping table is applied identically across all tasks; the "no gold/coral text on white — use navy + gold underline" rule is stated globally and repeated at each link site (buy-tickets, house link, content preview) so contrast stays AA, matching the fix already made on the home page in Phase 1. No component APIs or i18n keys change, so no cross-task signature drift is possible.
