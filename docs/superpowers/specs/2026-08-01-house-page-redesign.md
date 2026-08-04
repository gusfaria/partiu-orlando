# House Page Redesign — Design Document

**Feature:** Redesign `/house` — replace the photo grid with a swipeable carousel and move the address/key info above the photos, so it reads like a vacation-rental listing in the small-world brand style.
**Reference:** homedisneyvacation.com/casas/ff13289 (listing layout: photos + key info high on the page).

---

## 1. Overview

Today `/house` uses the shared `InfoPage`, which renders: title → **photo grid** → markdown content. The grid sits between the title and the content, pushing the address and details far down the page. This redesign gives the house page its own layout: title → **key info (address/dates/rooms)** → **compact photo carousel** → the rest of the content. It's a presentational/layout change plus one new component; no schema changes, no new admin fields (Option B — keep the existing markdown content).

Cars and Explore keep using `InfoPage` unchanged.

---

## 2. Content split (no new data)

The house content is a single markdown field in `info_pages` (slug `house`). To place the carousel between the "key info" and "the rest," the page splits the markdown on the **first horizontal rule (`---`)**:

- Markdown **before** the first `---` → rendered above the carousel (address, dates, rooms).
- Markdown **after** the first `---` → rendered below the carousel (the "Sobre o Solara Resort" blurb, amenities, etc.).
- If there is **no** `---`, all content renders above and the carousel goes at the bottom.

As part of this work, a `---` divider is inserted into the existing house content (via the Supabase REST API, same method used to seed it) between the facts section and the resort blurb. The admin can move/remove it anytime via Admin → Conteúdo.

---

## 3. Components

### `PhotoCarousel` (new — `src/components/PhotoCarousel.tsx`)
- Props: `section: 'house' | 'cars'` (reuses the existing `site_photos` photos; house uses it now, available to cars later).
- Reads photos via the existing `listSitePhotos(section)` + `publicUrl('photos', path)` helpers (no new data layer).
- Index-based: shows one photo at a time, full-width, fixed compact height — `h-64` (256px) on mobile, `h-80` (320px) on `md+` — `object-cover`, rounded in the paper-card style (`rounded-2xl border border-navy/10`).
- Controls: prev/next arrow buttons (gold, brand-styled) overlaid left/right; dot indicators below (current dot = gold, others = navy/20); on touch, horizontal swipe advances (native scroll-snap or a small touch handler — dependency-free).
- Tapping the current photo opens it full-size in a new tab (`target="_blank" rel="noopener noreferrer"`), matching the current gallery behavior.
- Renders **nothing** when the section has no photos (same as `PhotoGallery`).
- No external carousel library — pure React state + Tailwind.

### `HouseContent` (new — replaces InfoPage usage in `src/app/house/page.tsx`)
- `'use client'`, wrapped in `ProtectedRoute` (same pattern as InfoPage).
- Fetches the `house` info_page row (title + content), splits content on the first `---`.
- Renders: `<h1>` title (Fredoka/navy) → `MarkdownRenderer` for the top part → `PhotoCarousel section="house"` → `MarkdownRenderer` for the bottom part (only if present).
- Loading and empty states reuse the existing `t.common.loading` / `t.common.no_data` strings.

### Unchanged
- `MarkdownRenderer`, `PhotoGallery` (cars/explore still use it via InfoPage), `InfoPage` itself, `listSitePhotos`, `publicUrl`.

---

## 4. Split helper (testable)

A pure function `splitOnFirstHr(markdown: string): { before: string; after: string }` in a small module (`src/lib/markdown-split.ts`), unit-tested: splits on the first line that is exactly `---` (a markdown horizontal rule); returns the whole string as `before` and empty `after` when no `---` exists; trims each part. Keeps the page component logic simple and the split behavior verified without a DB.

---

## 5. Error / Edge Handling

- No photos → carousel renders nothing; the two markdown parts still show (page just has no photos).
- No content → the fallback `no_data` message (same as today).
- Single photo → carousel shows it with no arrows/dots (or disabled arrows).
- Content with no `---` → everything renders above an (empty-if-no-photos) carousel at the bottom.

## 6. Testing

- Unit: `splitOnFirstHr` — with a `---`, without, with multiple `---` (splits on first only), leading/trailing whitespace.
- Manual: `/house` shows address/dates up top, then the carousel (swipe on a narrow viewport, arrows on desktop, dots track position, tap opens full-size), then the resort blurb; cars/explore pages unaffected.

## 7. Out of Scope

- Structured house fact fields / badges (that was Option A — declined).
- Changing cars/explore layout.
- A lightbox/modal viewer (tap-to-new-tab is kept).
- Autoplay.

## 8. Decisions Log

| Question | Decision |
|---|---|
| Structured fields vs keep markdown | Keep markdown (Option B) |
| Carousel placement | Address/key info on top, carousel below, rest under it |
| Split mechanism | First `---` horizontal rule in the markdown |
| Carousel height | Compact — h-64 mobile / h-80 desktop, one image at a time |
| Carousel library | None — dependency-free React + Tailwind |
| Full-size view | Tap opens photo in a new tab (as today) |
