# Itinerary Calendar — Design Document

**Feature:** Replace the Programação (`/schedule`) markdown page with a read-only October 2026 calendar that aggregates arrivals, departures, and activities into a single filterable view.
**Builds on:** v1 (live) + `2026-07-22-arrival-events-design.md` (arrival_events) + the existing `activities` table.

---

## 1. Overview

Today `/schedule` (Programação) is an admin-editable markdown info page. This feature turns it into a **read-only itinerary calendar** for October 2026 that pulls together three kinds of items already stored elsewhere in the app:

- **Chegadas** — arrival events that have an `arrival_date`
- **Saídas** — arrival events that have a `departure_date`
- **Atividades** — activities that have an `activity_date`

It is a pure **visualization layer** — no new tables, no editing on this page. Guests still add arrivals on `/arrivals` and admins still manage activities via the admin panel. The old `schedule` markdown content is dropped (the info_pages row can remain in the DB, simply unused).

One arrival event can appear **twice**: as a Chegada pill on its arrival day and a Saída pill on its departure day.

---

## 2. Data Sources (read-only)

No migration, no schema change. The page queries:

- `arrival_events` with `arrival_event_people(*, profiles(*))` — same nested select already used on `/arrivals`. Each event yields:
  - a Chegada item on `arrival_date` (if non-null), labeled with the involved people's names + transportation
  - a Saída item on `departure_date` (if non-null), same labeling
- `activities` — each row with a non-null `activity_date` yields an Atividade item on that date, labeled with its `title`

Items are bucketed by calendar date (`YYYY-MM-DD`) for rendering. A pure helper builds the per-day buckets so it can be unit-tested without a DB.

---

## 3. Item Model (in-memory, not persisted)

A normalized shape the calendar renders, produced by a pure mapping function from the raw rows:

```
CalendarItem = {
  type: 'arrival' | 'departure' | 'activity'
  date: string            // YYYY-MM-DD
  label: string           // e.g. "Gui + Marina"  or  "Magic Kingdom"
  emoji: string           // transport emoji for arrival/departure, 🎢 for activity
  time: string | null     // HH:MM if known
  detail: ...             // enough to render the day-detail panel
}
```

- Arrival/departure emoji derives from `transportation`: `Avião → ✈️`, `Carro → 🚗`, `Trem → 🚆` (fallback 🛬/🛫).
- Activity emoji: 🎢 (fixed for now).

---

## 4. Layout (responsive)

### Desktop / tablet (≥ md)
- October 2026 rendered as a **calendar grid**: weekday columns (Dom–Sáb / Sun–Sat), week rows, one cell per day.
- Trip days (Oct 9–18) are visually emphasized; other October days render muted/empty.
- Each day cell shows the day number and a stack of **pills** for that day's items (matching the reference screenshot: rounded, colored, emoji + short label).

### Phone (< md)
- The grid collapses into a **vertical stack of day cards**, one per trip-window day (Oct 9–18).
- Each card shows the weekday + date header and that day's pills inline (no cramped cells).

Both breakpoints render from the same per-day buckets; only the container layout differs.

---

## 5. Pills & Colors

| Type | Color | Example label |
|---|---|---|
| Chegada (arrival) | green | ✈️ Gui + Marina |
| Saída (departure) | amber | 🚗 Ana |
| Atividade (activity) | orange | 🎢 Magic Kingdom |

Pills are compact: emoji + label, truncated if long. A day with many items simply stacks more pills (grid cell grows / card scrolls).

---

## 6. Filters

A row of filter chips above the calendar: **Tudo / Chegadas / Saídas / Atividades**. Selecting one narrows which pill types render (client-side, instant, no reload). Default: Tudo (all shown). Single-select (one active filter at a time; "Tudo" clears it).

---

## 7. Interaction

- Tapping a **day** (desktop cell or phone card) opens a **day-detail panel** for that date showing the full items: arrival/departure times, all people involved, transportation; for activities the title, time, cost, and ticket link.
- The panel is read-only. Editing continues to live on `/arrivals` (arrivals) and the admin panel (activities).
- Days with no items are not clickable (or open an empty panel — pick the simpler: non-clickable).

---

## 8. i18n

New `itinerary` (or reuse/extend `schedule`) i18n section: month/weekday names can come from the browser `toLocaleDateString` (locale-aware, matching existing date formatting), so only the chrome needs keys: filter chip labels (Tudo/Chegadas/Saídas/Atividades → All/Arrivals/Departures/Activities), the day-detail panel labels (reusing `arrivals.*` and `activities.*` where possible), and an empty state. Keep pt/en key parity.

---

## 9. Error Handling

- Both source queries are independent; if one returns nothing the calendar still renders the others.
- No writes, so no save/delete failure modes.

## 10. Testing

- Unit: the pure `buildCalendarItems(events, activities)` (or `bucketByDay`) mapping — arrival-only event yields one arrival item; event with both dates yields an arrival item and a departure item on the correct days; activity with a date yields one activity item; null dates are skipped; transportation → emoji mapping.
- Unit: filter logic (given items + active filter → visible items).
- Manual: desktop grid vs. phone stack; filter chips; day-detail panel; an arrival event appearing on two different days.

## 11. Out of Scope

- Adding/editing items from the calendar (read-only by decision)
- Multi-month or continuous scroll (October only)
- A generic "event type" system beyond the three existing sources
- Drag/drop, week/day zoom levels

## 12. Decisions Log

| Question | Decision |
|---|---|
| Read-only or add-hub | Read-only aggregator |
| Where it lives | Replaces Programação `/schedule` (= itinerary); old markdown dropped |
| Month scope | October 2026 only |
| Desktop cell content | Text + emoji pills (not dots), per reference screenshot |
| Phone layout | Grid stacks into vertical day cards (trip window Oct 9–18) |
| Filters | Chips: Tudo / Chegadas / Saídas / Atividades, single-select |
| Colors | Chegada green, Saída amber, Atividade orange |
| Interaction | Tap a day → read-only day-detail panel |
