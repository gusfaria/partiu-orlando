# Guest Car Rentals — Design Document

**Feature:** Guests add/edit/delete their own car rental entries on the Cars page
**Builds on:** v1 (live) + `2026-07-18-photos-and-dashboard-design.md` (avatar upload pattern, resize helpers)

---

## 1. Overview

Today the Cars page (`/cars`) shows admin-curated markdown content and an admin-managed photo gallery. This feature adds a second section where **any guest** can record a car rental: company, pick-up location, dates, brand, color, seat count, and an optional photo of the car. Any authenticated guest can edit or delete any entry — a car rental is tied to a couple, not to a single login, so ownership isn't enforced.

Ride coordination itself stays on WhatsApp — this feature is informational only, no sign-up/join mechanic.

---

## 2. Data Model

### `cars` (new table)

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| created_by | uuid | FK → profiles.id. Shown on the card for reference; does not restrict edit/delete |
| rental_company | text | e.g. "Enterprise" |
| location | text | Single field, covers pick-up and drop-off (per decision) |
| pickup_date | date | |
| dropoff_date | date | |
| brand | text | e.g. "Toyota" |
| color | text | e.g. "Prata" |
| seats | integer | Car capacity |
| photo_path | text, nullable | Path within the `car-photos` storage bucket |
| created_at | timestamptz | |

### Storage: `car-photos` bucket (new)

- Public read
- **Any authenticated user can insert/update/delete any object** — not folder-restricted like `avatars`, because any guest can edit any car entry
- Resize on upload: max 1200px wide, JPEG quality 0.85 (reuses `resizeImage` from `src/lib/image-resize.ts`, same helper avatars/gallery photos use)

### RLS on `cars`

| Operation | Rule |
|---|---|
| select | authenticated: all rows |
| insert | authenticated: any row (`created_by` set to `auth.uid()` client-side) |
| update | authenticated: any row |
| delete | authenticated: any row |

No admin gate, no owner gate — matches the "anyone can edit" decision.

---

## 3. UI on `/cars`

Page structure, top to bottom (existing sections untouched):

1. Page title (from `info_pages.cars.title`)
2. Existing photo gallery (admin-managed, `site_photos` where section='cars')
3. Existing markdown content (admin-managed, `info_pages.cars.content`)
4. **New: "Carros dos Convidados" section**
   - "+ Adicionar carro" button opens a form (modal or inline card, matching the Admin Activities form style)
   - Form fields: rental company, location, pick-up date, drop-off date, brand, color, seats (number), optional photo upload
   - List of car cards below, each showing: photo thumbnail (or none), brand + color, company + location, pick-up → drop-off dates (formatted per locale like Arrivals), seats, and the adder's name + avatar (`AvatarCircle`) for reference
   - Every card has **Editar** and **Excluir** buttons, visible to all guests (not gated by `created_by`)
   - Editar reopens the same form, pre-filled, updating in place
   - Excluir requires `confirm()` (same pattern as admin delete flows), then removes the storage photo (if any) and the row

---

## 4. i18n

New `cars` top-level i18n section (pt/en), covering: section title, add button, form field labels (rental_company, location, pickup_date, dropoff_date, brand, color, seats, photo), save/cancel/edit/delete, empty state ("Nenhum carro cadastrado ainda").

---

## 5. Error Handling

- Photo upload: same `resizeImage` rejection (`Error('invalid-file')`) for non-images or files > 20MB, shown via existing-style inline error message
- Delete: storage removal errors are non-blocking (matches the existing `deleteSitePhoto` behavior) — the DB row is still removed so the UI doesn't get stuck
- Required fields: rental_company, location, pickup_date, dropoff_date, brand, color, seats. Photo is optional. Save button disabled until required fields are filled.

## 6. Testing

- Unit: date formatting helper (if extracted) or reuse existing pattern from Arrivals — no new pure-logic module beyond what Arrivals/Admin Activities already established, so no dedicated new unit test file expected
- Manual: create/edit/delete a car entry as one guest, confirm a second guest can also edit/delete it; upload + remove a photo; confirm RLS allows all these ops for a non-admin authenticated user; confirm gallery/markdown sections above are unaffected

## 7. Out of Scope

- Ride sign-up/join mechanic (coordination stays on WhatsApp)
- Separate pick-up vs. drop-off locations
- Cost/payment tracking for rentals
- Folder-restricted photo ownership (any guest can replace any car's photo, consistent with "anyone can edit")

## 8. Decisions Log

| Question | Decision |
|---|---|
| Ownership model | Tied to a couple, not a single login — anyone can edit/delete any entry |
| Seats field | Yes, tracked as integer capacity |
| Ride sign-up | No — WhatsApp coordination |
| Photo upload | Direct guest upload, optional, not admin-managed |
| Location fields | Single field covering pick-up/drop-off |
