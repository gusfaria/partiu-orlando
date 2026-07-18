# Photos & Home Dashboard — Design Document

**Feature:** Image support (avatars, galleries, hero) + home page dashboard
**Builds on:** `2026-07-12-partiu-orlando-design.md` (v1, live at gusfaria.github.io/partiu-orlando)

---

## 1. Overview

Three image capabilities, one storage mechanism:

1. **Guest avatars** — each guest uploads their own profile photo
2. **Photo galleries** — admin-managed photo grids on the House and Cars pages
3. **Hero image** — admin-selected banner photo on the home page

Plus a **home page redesign**: hero + trip facts card + personal to-do checklist.

---

## 2. Storage

Supabase Storage, two public-read buckets:

| Bucket | Write access | Content |
|---|---|---|
| `avatars` | Authenticated users, own folder only (`{user_id}/*`) | Profile photos |
| `photos` | Admin only | Gallery + hero images |

- Public read URLs served via Supabase CDN; the static site renders plain `<img>` tags
- **Client-side resizing before upload** using browser canvas (no new dependencies):
  - Avatars → max 400×400px, JPEG quality 0.85
  - Gallery/hero photos → max 1600px wide, JPEG quality 0.85
- Free tier budget: 1 GB storage / ~2 GB bandwidth per month — resized images keep usage well under 5% of that

---

## 3. Data Model Changes

### `profiles` (alter)

Add column: `avatar_url text` (nullable). When set, UI shows the photo; when null, colored initial.

### `site_photos` (new)

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| section | text | `house`, `cars`, or `hero` |
| storage_path | text | Path within the `photos` bucket |
| caption | text | Optional |
| display_order | integer | Sort within section |
| created_at | timestamptz | |

RLS: authenticated read all; admin insert/update/delete.

### Storage RLS policies

- `avatars` bucket: authenticated users can insert/update/delete objects only under a folder matching their `auth.uid()`; public read
- `photos` bucket: only admin (via `public.is_admin()`) can insert/update/delete; public read

All changes ship as `supabase/migrations/004_photos.sql`.

---

## 4. Features

### 4.1 Profile page (`/profile`)

- Reached from the avatar in the nav (avatar becomes a link)
- Contains: avatar upload (with instant preview), display name edit, fallback color picker
- Uploading replaces any previous avatar file (same path overwrite) so storage never accumulates
- `AvatarCircle` gains optional `avatarUrl` prop: renders `<img>` in the circle when present, initial otherwise. All existing usages (nav, arrivals, activities, admin users) pass the URL through — one component change updates the whole app

### 4.2 Galleries on House and Cars pages

- Photo grid between the page title and markdown content (2 columns mobile, 3 desktop)
- Tap a photo → opens full-size image in a new tab
- Captions shown under photos when present
- Pages with zero photos show no gallery section (no empty state)

### 4.3 Home dashboard (`/`)

Order top to bottom:
1. **Hero image** — first `site_photos` row with section `hero` (if none, current layout unchanged); countdown displayed over a soft gradient at the bottom of the hero, or below it on small screens
2. **Title + subtitle** (existing)
3. **Countdown** (existing, moves onto/near hero)
4. **Trip facts card** — dates "9–18 de outubro", "Solara Resort — 8923 Coconut Breeze Dr, Kissimmee, FL", link to `/house`
5. **Personal checklist** — for the logged-in user only; each item links to where it's completed and disappears once done:
   - "📸 Adicione sua foto" → `/profile` (done when `avatar_url` set)
   - "✈️ Preencha suas datas" → `/arrivals` (done when arrival_date set)
6. **Social nudge** — existing "who hasn't filled arrivals" list stays

Trip facts are UI strings in the i18n files (address is the same in both languages).

### 4.4 Admin "Fotos" tab (`/admin/photos`)

- Section selector: Casa | Carros | Capa (hero)
- Upload button (multiple files allowed), each uploads resized
- Grid of current photos with: caption input (saves on blur), up/down reorder buttons, delete button (with confirm)
- Hero section: only the first photo (by display_order) is shown on home; admin can keep spares

---

## 5. New/Changed Files

```
supabase/migrations/004_photos.sql          — new
src/lib/image-resize.ts                     — new: canvas resize helper
src/lib/photos.ts                           — new: upload/list/delete/public-URL helpers
src/components/AvatarCircle.tsx             — add avatarUrl prop
src/components/PhotoGallery.tsx             — new: grid used by house/cars
src/components/InfoPage.tsx                 — render gallery for its slug
src/app/page.tsx                            — dashboard redesign
src/app/profile/page.tsx                    — new
src/app/admin/photos/page.tsx               — new
src/app/admin/layout.tsx                    — add Fotos tab
src/components/Nav.tsx                      — avatar links to /profile
src/lib/i18n/pt.json, en.json               — new strings (profile, checklist, facts, admin photos)
src/types/database.ts                       — SitePhoto type, avatar_url on Profile
```

---

## 6. Error Handling

- Upload failures show an inline error message (i18n `common.error`); no partial DB rows — insert `site_photos` row only after storage upload succeeds
- Non-image files rejected client-side (`accept="image/*"` + type check)
- Files over 20 MB rejected before resize attempt with a friendly message

## 7. Testing

- Unit: image-resize helper (dimension math), checklist completion logic
- Manual: avatar upload as non-admin guest, gallery CRUD as admin, RLS denial (guest cannot write to `photos` bucket), mobile layout

## 8. Out of Scope

- Shared guest photo album (still v2+)
- Image cropping UI, lightbox/carousel
- Decorative images inside markdown content (galleries cover the need)

## 9. Decisions Log

| Question | Decision |
|---|---|
| Who uploads avatars | Each guest, own photo, via /profile |
| Gallery placement | Grid above markdown on House/Cars (option B) |
| Storage | Supabase Storage, 2 buckets, client-side resize |
| Home page | Hero image + trip facts + personal checklist + existing social nudge |
