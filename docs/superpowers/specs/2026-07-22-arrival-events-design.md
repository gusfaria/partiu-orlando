# Arrival/Departure Events — Design Document

**Feature:** Replace the per-user Arrivals table with free-form arrival/departure event entries any guest can add
**Builds on:** v1 (live) + `2026-07-20-guest-car-rentals-design.md` (open-RLS "anyone can edit any entry" pattern)

---

## 1. Overview

Today `/arrivals` shows one row per guest (11 fixed rows), each editable only by that guest, with a single arrival date and departure date. This feature replaces it with a feed of free-form events: any guest can log an arrival and/or departure for themselves and/or others (e.g. "Guilherme e família chegando de carro"), with a description, transportation mode, and date/time for arrival and/or departure. Any guest can edit or delete any entry — same permission model as the Cars feature.

This sets up (but does not build) two future directions the trip organizer wants: a calendar/grid visualization, and a broader "event type" system that could eventually include activities. Both are explicitly out of scope here.

---

## 2. Data Model

### `arrival_events` (new table, replaces `arrivals`)

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| description | text | Free text, required |
| transportation | text | One of: `Carro`, `Trem`, `Avião` — required |
| arrival_date | date, nullable | |
| arrival_time | time, nullable | |
| departure_date | date, nullable | |
| departure_time | time, nullable | |
| created_by | uuid, nullable | FK → profiles(id) on delete set null. Display-only ("added by"), does not restrict edit/delete |
| created_at | timestamptz | |

Form-level validation (not DB-enforced, matching the pattern used for `cars`): at least one of arrival_date/departure_date must be set; description, transportation, and at least one participant are required.

### `arrival_event_people` (new join table)

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| event_id | uuid | FK → arrival_events(id) on delete cascade |
| user_id | uuid | FK → profiles(id) on delete cascade |

Many-to-many: one event can list multiple people (a family); one person can appear in multiple events (e.g. their own arrival and a shared departure entry with others).

### RLS

Both tables: authenticated can select/insert/update/delete **any** row — no owner or admin gate, identical in spirit to the `cars` table policy from the Guest Car Rentals feature.

### Removal of `arrivals`

The existing `arrivals` table (one row per user, `arrival_date`/`departure_date`/`notes`) is dropped as part of this migration. Its data is not migrated — the trip organizer will re-enter arrival info as events after this ships (the old table only ever held sparse single-user rows, not worth a migration script).

---

## 3. UI — replaces `/arrivals` page entirely

- "+ Adicionar" button opens a form:
  - Multiselect of guests (checkbox list of all registered profiles) — who this entry is about
  - Description (free text)
  - Transportation (select: Carro / Trem / Avião)
  - Arrival date (date input) + arrival time (optional time input)
  - Departure date (date input) + departure time (optional time input)
  - Save disabled until: description non-empty, transportation selected, at least one person selected, and at least one of arrival_date/departure_date filled
- List of event cards below, each showing:
  - Avatars of all people in the event (reusing `AvatarCircle`)
  - Description
  - Transportation
  - Formatted arrival date/time and/or departure date/time (locale-aware, matching existing Arrivals/Cars date formatting)
  - Edit and Delete buttons, visible to all guests (not gated by `created_by`)
- Empty state when no events exist yet

---

## 4. Ripple Effects

Two existing pieces of UI read the old `arrivals` table and must be updated to read the new model instead:

1. **Home page "checklist"** (`src/lib/checklist.ts`, consumed by `src/app/page.tsx`) — the "✈️ Preencha suas datas de chegada" item currently checks `arrival?.arrival_date`. New logic: check whether the current user appears in `arrival_event_people` for any event with a non-null `arrival_date` or `departure_date`.
2. **Home page "who hasn't filled arrivals yet" nudge** (`src/app/page.tsx`) — currently filters `profiles` against the `arrivals` table by `user_id`. New logic: filter against profiles that appear in at least one `arrival_event_people` row on a qualifying event.

---

## 5. Error Handling

- Same non-blocking pattern as Cars: deleting an event removes the row (and its `arrival_event_people` rows via cascade) without needing to touch any storage bucket (no photos in this feature)
- Required-field validation happens client-side before save is enabled

## 6. Testing

- Unit: a pure function for the "has this user logged an arrival/departure" check (used by both the checklist and the home nudge), testable in isolation like the existing `checklistItems` function
- Manual: create an event with 2+ people selected, confirm it appears once with both avatars; confirm any guest (not just the creator) can edit/delete it; confirm the home checklist item disappears once the logged-in user is included in a qualifying event

## 7. Out of Scope

- Calendar/grid visualization of arrivals and departures
- "Atividade" as a selectable event type on this same table
- A unified generic-events system merging with the existing Activities feature
- Migrating old `arrivals` table data into the new model

## 8. Decisions Log

| Question | Decision |
|---|---|
| Replace or add alongside old Arrivals page | Fully replace |
| Entry shape | One entry may have arrival date, departure date, or both |
| Transportation granularity | One field per entry (not separate arrival vs. departure transportation) |
| Non-registered people (e.g. kids) | Not needed — all guests will have logins, so the people multiselect covers everyone |
| Edit/delete permissions | Anyone can edit/delete any entry (same as Cars) |
| Event "type" field | Not built now — arrival/departure is implied by which date fields are filled; a future "Atividade" type is out of scope |
