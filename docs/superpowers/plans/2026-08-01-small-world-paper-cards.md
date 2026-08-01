# Small-World Paper Cards (Phase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the leftover generic white-card/gray look on the internal pages with the brand "paper card" treatment — navy-tinted borders, soft navy offset shadow, and navy-tinted text — so the whole app matches the small-world system. No ticket-stub label strips or punch-holes (user chose the lighter treatment).

**Architecture:** Purely presentational. Apply one gray→navy-tint mapping table across the internal page/component files. Brand tokens (`navy`, `cream`, `gold`) already exist. No data/logic/i18n changes.

**Tech Stack:** Next.js 16 static export, Tailwind v4. No new deps/components.

## Global Constraints

- **Presentational only** — change ONLY className strings. No hooks, queries, handlers, props, state, or i18n keys.
- **Mapping table (apply everywhere in each file):**
  | Old | New |
  |---|---|
  | card shell `border border-gray-100 shadow-sm` | `border border-navy/10 shadow-[0_4px_0_rgba(26,37,54,0.08)]` |
  | `border-gray-200` | `border-navy/15` |
  | `border-gray-300` (inputs) | `border-navy/20` |
  | `text-gray-900` | `text-navy` |
  | `text-gray-700` | `text-navy/80` |
  | `text-gray-600` | `text-navy/70` |
  | `text-gray-500` | `text-navy/60` |
  | `text-gray-400` | `text-navy/50` |
  | `text-gray-300` | `text-navy/30` |
  | neutral button/chip `bg-gray-100 text-gray-600` / `text-gray-700` `hover:bg-gray-200` | `bg-navy/5 text-navy/70 hover:bg-navy/10` |
  | muted cell/hover `bg-gray-50` / `bg-gray-50/40` | `bg-cream` |
  | `hover:bg-gray-50` | `hover:bg-navy/5` |
- **Keep unchanged (do NOT remap):** red delete affordances (`text-red-*`, `border-red-*`, `bg-red-*`), amber info banners (`bg-amber-*`, `text-amber-*`), green success text (`text-green-600`), all gold/teal/coral/pink brand classes already applied, avatar swatch colors, and `bg-white` on cards (cards stay white — only their border/shadow/text change).
- No dynamic Tailwind class names. Existing 46 tests stay green; `npm run build` passes after each task. Node: `nvm use 22`. Working dir: `/Users/gusfaria/Documents/PROJECTS/Gustavo-Philipe__40-anos`. Do NOT push (branch `feat/small-world-rollout`).

---

### Task 1: Itinerary — calendar + day detail

**Files:** Modify `src/components/ItineraryCalendar.tsx`, `src/components/ItineraryDayDetail.tsx`

- [ ] **Step 1:** Apply the mapping table to both files. In `ItineraryCalendar.tsx` the empty/non-trip day cells use `bg-gray-50/40` → `bg-cream`; weekday header text and day numbers use gray → navy tints; the mobile day cards' `border-gray-100 shadow-sm` → the paper card shell. In `ItineraryDayDetail.tsx` the panel `border-gray-100 shadow-sm` → paper shell, and all `text-gray-*` / `border-gray-*` per table. (ItineraryPill.tsx is already done — do not touch.)
- [ ] **Step 2:** Verify:
```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test && npm run build
grep -n "gray-" src/components/ItineraryCalendar.tsx src/components/ItineraryDayDetail.tsx || echo "no gray — good"
```
Expected: 46 tests pass; build succeeds; no `gray-` remains in the two files.
- [ ] **Step 3:** Commit:
```bash
git add src/components/ItineraryCalendar.tsx src/components/ItineraryDayDetail.tsx
git commit -m "style: paper-card treatment for itinerary"
```

---

### Task 2: Arrivals + Activities + Cars — cards & sections

**Files:** Modify `src/components/ArrivalEventsSection.tsx`, `src/components/ArrivalEventCard.tsx`, `src/components/ActivityCard.tsx`, `src/components/CarsSection.tsx`, `src/components/CarCard.tsx`, `src/app/activities/page.tsx`

- [ ] **Step 1:** Apply the mapping table across all six files. Every list/form card `border border-gray-100 shadow-sm` → the paper shell; every `text-gray-*` → navy tint per table; neutral buttons (Cancel, the signed-up "Não vou mais" state `bg-gray-100 text-gray-600`, the +/− guest steppers' `border-gray-200`) → `bg-navy/5 text-navy/70 hover:bg-navy/10` / `border-navy/15`; form inputs `border-gray-300` → `border-navy/20`; `hover:bg-gray-50` on Edit buttons → `hover:bg-navy/5`. Keep red delete, keep gold primary buttons already applied. `activities/page.tsx` loading text `text-gray-400` → `text-navy/50`.
- [ ] **Step 2:** Verify:
```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test && npm run build
grep -rn "gray-" src/components/ArrivalEventsSection.tsx src/components/ArrivalEventCard.tsx src/components/ActivityCard.tsx src/components/CarsSection.tsx src/components/CarCard.tsx src/app/activities/page.tsx || echo "no gray — good"
```
Expected: 46 tests pass; build succeeds; no `gray-` remains.
- [ ] **Step 3:** Commit:
```bash
git add src/components/ArrivalEventsSection.tsx src/components/ArrivalEventCard.tsx src/components/ActivityCard.tsx src/components/CarsSection.tsx src/components/CarCard.tsx src/app/activities/page.tsx
git commit -m "style: paper-card treatment for arrivals, activities, cars"
```

---

### Task 3: Profile + Admin

**Files:** Modify `src/app/profile/page.tsx`, `src/app/admin/users/page.tsx`, `src/app/admin/activities/page.tsx`, `src/app/admin/content/page.tsx`, `src/app/admin/photos/page.tsx`

- [ ] **Step 1:** Apply the mapping table across all five files. Card/list/form shells → paper shell; all `text-gray-*` → navy tints; neutral/Cancel buttons `bg-gray-100 text-gray-700 hover:bg-gray-200` → `bg-navy/5 text-navy/70 hover:bg-navy/10`; inactive tab/chip `bg-gray-100 text-gray-600` → `bg-navy/5 text-navy/70` (active gold state already applied); inputs `border-gray-300` → `border-navy/20`; `hover:bg-gray-50` → `hover:bg-navy/5`; content-page `text-gray-500 "Markdown"` and photos-page captions → navy tints. KEEP the amber info banner (admin/users, admin/photos), red delete (admin/photos), green "saved" (admin/content), and avatar color-swatch rings.
- [ ] **Step 2:** Verify:
```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test && npm run build
grep -rn "gray-" src/app/profile src/app/admin || echo "no gray — good"
```
Expected: 46 tests pass; build succeeds; no `gray-` remains in profile/admin.
- [ ] **Step 3:** Commit:
```bash
git add src/app/profile/page.tsx src/app/admin/
git commit -m "style: paper-card treatment for profile and admin"
```

---

## Self-Review

**Spec coverage:** the 12 internal files that still carried gray classes are covered — itinerary calendar/daydetail (Task 1), arrivals/activities/cars cards+sections (Task 2), profile+admin (Task 3). ItineraryPill was already navy-fixed in the prior pass and is excluded. Login/nav/home are already fully brand-styled and out of scope.

**Consistency:** one mapping table applied to every file; the paper shell (`border-navy/10 shadow-[0_4px_0_rgba(26,37,54,0.08)]`) is the exact treatment `TicketCard` already uses, so internal cards match the brand card without adding label strips/notches (per the user's "lighter paper cards" choice). Semantic colors (red/amber/green) and already-applied brand accents are explicitly preserved, so no cross-task drift. No component APIs or i18n keys change.
