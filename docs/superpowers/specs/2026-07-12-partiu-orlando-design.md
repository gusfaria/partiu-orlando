# Partiu Orlando — Technical Design Document

**Trip:** October 9–17, 2026  
**Guests:** 11 people  
**Purpose:** Group trip organizer for Gustavo's 40th birthday and cousin Philipe's birthday in Orlando

---

## 1. Overview

A private web app where the trip admin (Gus) manages all content and creates accounts for guests. Guests log in to view trip info, enter their arrival/departure dates, and sign up for activities.

---

## 2. Stack

| Layer | Tool | Hosting |
|---|---|---|
| Frontend | Next.js (static export) | GitHub Pages |
| Auth + Database + API | Supabase (free tier) | Supabase Cloud |
| CI/CD | GitHub Actions | GitHub |

**Static export note:** The app is built with `output: 'export'` in `next.config.js`. Removing this one line allows deployment to Vercel, Railway, or any Node host with zero other changes.

---

## 3. Authentication

- Supabase email/password auth
- Admin (Gus) creates all accounts manually — auth users via Supabase dashboard, profile display names via admin panel in the app
- Guests log in with their real email + initial password `orlando2026` (Gus distributes via WhatsApp)
- Session persisted in localStorage via Supabase JS client
- No public sign-up page — invite-only

---

## 4. Data Model

### `profiles`
Extends Supabase `auth.users`. Created automatically on user creation via a database trigger.

| Column | Type | Notes |
|---|---|---|
| id | uuid | FK → auth.users.id |
| name | text | Display name (e.g. "João") |
| is_admin | boolean | Default false |
| avatar_color | text | Hex color for avatar initials circle |
| created_at | timestamptz | |

### `arrivals`
One row per guest (unique on user_id).

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → profiles.id, unique |
| arrival_date | date | |
| departure_date | date | |
| notes | text | Optional (e.g. "flight lands at 11pm") |
| updated_at | timestamptz | |

### `activities`
Created and managed by admin only.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| title | text | e.g. "Magic Kingdom" |
| description | text | |
| activity_date | date | |
| activity_time | time | Optional |
| cost_per_person | numeric | Informational only, no tracking |
| cost_notes | text | e.g. "Gus compra, me pague depois" |
| ticket_url | text | Link to buy tickets |
| display_order | integer | Controls sort order |
| created_at | timestamptz | |

### `activity_signups`
Many-to-many between guests and activities.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| activity_id | uuid | FK → activities.id |
| user_id | uuid | FK → profiles.id |
| plus_guests | integer | Extra people (kids, etc.) the user is bringing. Default 0. |
| created_at | timestamptz | |

Unique constraint on `(activity_id, user_id)`. No capacity limits.

**Guest logic:** when signing up, users can increment `plus_guests` to indicate additional people they're bringing (e.g. children). The activity card shows the user's avatar with a `+N` badge when `plus_guests > 0`. Total headcount = number of signups + sum of all `plus_guests`.

### `info_pages`
Key/value store for markdown content pages edited by admin.

| Column | Type | Notes |
|---|---|---|
| slug | text | PK — `schedule`, `house`, `cars`, `explore` |
| title | text | Page display title |
| content | text | Markdown body |
| updated_at | timestamptz | |

---

## 5. Row-Level Security (RLS)

| Table | Rule |
|---|---|
| profiles | Authenticated users can read all; can update only their own |
| arrivals | Authenticated users can read all; can insert/update only their own |
| activities | Authenticated users can read all; only admin can insert/update/delete |
| activity_signups | Authenticated users can read all; can insert/delete only their own |
| info_pages | Authenticated users can read all; only admin can update |

---

## 6. Pages & Features

### `/login`
- Email + password form
- No sign-up link

### `/` — Home
- Trip countdown ("X dias para a viagem!")
- Welcome title + subtitle
- Social nudge: list of guests who haven't filled in arrivals yet (with avatar)

### `/schedule`
- Renders `schedule` info_page as markdown

### `/arrivals`
- Table of all 11 guests with arrival date, departure date, notes
- Current user's row has an Edit button for inline editing
- Guests with no dates show "Não preenchido" placeholder

### `/activities`
- Cards for each activity sorted by display_order
- Each card: title, date/time, description, cost info, ticket link, attendee avatars
- Sign up / Unsign button per card
- No capacity limits

### `/house`
- Renders `house` info_page as markdown

### `/cars`
- Renders `cars` info_page as markdown

### `/explore`
- Renders `explore` info_page as markdown

### `/admin` (admin only, redirects non-admins to `/`)
- **Users tab:** List all profiles; edit display name and avatar color; note on how to create new auth users via Supabase dashboard
- **Activities tab:** Create, edit, delete activities with all fields
- **Content tab:** Edit info_pages (schedule, house, cars, explore) with a textarea markdown editor

---

## 7. Navigation

Sticky top nav on all authenticated pages:
- Logo: "Partiu Orlando 🌴" → links to `/`
- Links: Schedule | Arrivals | Activities | House | Cars | Explore
- Admin link (visible only when `is_admin = true`)
- Language toggle: PT | EN button
- User avatar circle (initials + color)
- Logout button (desktop) / in mobile hamburger

Mobile: hamburger collapses to a full-width dropdown with all links.

---

## 8. Internationalization (i18n)

- Default language: **Portuguese (pt-BR)**
- Secondary language: **English (en)**
- Language toggle button in nav switches instantly (no page reload)
- All UI strings in `src/lib/i18n/pt.json` and `src/lib/i18n/en.json` — never hardcoded
- Implementation: lightweight React context + `useI18n()` hook
- Admin-authored content (activity descriptions, info pages) is not translated — it's whatever language Gus writes it in

---

## 9. Design Aesthetic

- Warm, fun, vacation feel
- Primary color: orange (`#f97316`)
- Guest avatars: colored circles with first-letter initials (no photos at launch)
- Responsive — most guests will view on mobile

---

## 10. Future Considerations (out of scope for v1)

- Photo sharing / gallery
- Push/email reminders to fill in arrivals
- Remove `output: 'export'` to unlock SSR and deploy to Vercel/Railway

---

## 11. Decisions Log

| Question | Decision |
|---|---|
| Initial guest passwords | Shared password `orlando2026`, Gus distributes via WhatsApp |
| Language | Portuguese default, English toggle in nav |
| Activity capacity | No limits — everyone can always sign up |
| Kids / extra guests | `plus_guests` counter on signup — parents bring kids as +N, shown as avatar badge |
| Cost tracking | Informational only — no payment or splitting in app |
| User creation in app | Auth users created via Supabase dashboard; display names editable via admin panel |
