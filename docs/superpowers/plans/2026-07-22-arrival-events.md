# Arrival/Departure Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the per-user `/arrivals` page with a feed of free-form arrival/departure events any guest can add, edit, or delete — each with a description, transportation mode, optional arrival and/or departure date+time, and a multiselect of the people it's about.

**Architecture:** Two new tables (`arrival_events` + `arrival_event_people` join) with open RLS (any authenticated guest can CRUD any row — same model as the `cars` table). A new `ArrivalEventsSection` component owns the form + list + CRUD; a new `ArrivalEventCard` renders one event. The old `arrivals` table is dropped, so the home page checklist and the "who hasn't arrived" nudge switch to the new model via a shared pure helper.

**Tech Stack:** Existing stack only — Next.js 16 static export, Supabase JS v2, Tailwind v4, Vitest. No new dependencies, no storage buckets (this feature has no photos).

## Global Constraints

- All UI strings in `src/lib/i18n/pt.json` / `en.json` — never hardcoded; Portuguese default; the two files MUST keep identical key structure (enforced at compile time via `typeof pt`)
- No server-side code; `'use client'` on components using hooks/browser APIs
- `arrival_events` + `arrival_event_people` RLS: authenticated can select/insert/update/delete **any** row — no owner check, no admin check (same intentional open model as the `cars` table)
- Transportation values: exactly `Carro`, `Trem`, `Avião`
- Form validation (client-side, not DB): description non-empty, transportation selected, ≥1 person selected, and at least one of arrival_date/departure_date filled
- The old `arrivals` table is dropped; its data is NOT migrated
- Node: `nvm use 22` before any npm command
- Working directory: `/Users/gusfaria/Documents/PROJECTS/Gustavo-Philipe__40-anos`

---

## File Map

```
supabase/migrations/006_arrival_events.sql  — new: drop arrivals, create 2 tables + RLS
src/types/database.ts                        — modify: add ArrivalEvent* types; remove Arrival + ProfileWithArrival
src/lib/arrival-event.ts                     — new: ArrivalEventFormValue, isArrivalEventFormValid, hasLoggedArrival
src/lib/arrival-event.test.ts                — new
src/lib/checklist.ts                         — modify: checklistItems takes hasArrival boolean
src/lib/checklist.test.ts                    — modify: match new signature
src/lib/i18n/pt.json, en.json                — modify: add keys to existing `arrivals` section
src/components/ArrivalEventCard.tsx          — new: display card
src/components/ArrivalEventsSection.tsx      — new: form + list + CRUD
src/app/arrivals/page.tsx                    — replace: render ArrivalEventsSection
src/app/page.tsx                             — modify: query arrival_events, new nudge + checklist logic
```

---

### Task 1: Migration + types

**Files:**
- Create: `supabase/migrations/006_arrival_events.sql`
- Modify: `src/types/database.ts`

**Interfaces:**
- Produces: `arrival_events` + `arrival_event_people` tables; drops `arrivals`
- Produces types: `ArrivalEvent`, `ArrivalEventPerson`, `ArrivalEventWithPeople`
- Removes types: `Arrival`, `ProfileWithArrival` (both only referenced by checklist + home, updated in later tasks)

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/006_arrival_events.sql`:

```sql
-- Replace per-user arrivals with free-form arrival/departure events

drop table if exists public.arrivals cascade;

create table public.arrival_events (
  id             uuid        primary key default gen_random_uuid(),
  description    text        not null,
  transportation text        not null,
  arrival_date   date,
  arrival_time   time,
  departure_date date,
  departure_time time,
  created_by     uuid        references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);

create table public.arrival_event_people (
  id       uuid primary key default gen_random_uuid(),
  event_id uuid references public.arrival_events(id) on delete cascade not null,
  user_id  uuid references public.profiles(id) on delete cascade not null
);

alter table public.arrival_events       enable row level security;
alter table public.arrival_event_people enable row level security;

create policy "arrival_events: read all"   on public.arrival_events for select to authenticated using (true);
create policy "arrival_events: insert all" on public.arrival_events for insert to authenticated with check (true);
create policy "arrival_events: update all" on public.arrival_events for update to authenticated using (true);
create policy "arrival_events: delete all" on public.arrival_events for delete to authenticated using (true);

create policy "aep: read all"   on public.arrival_event_people for select to authenticated using (true);
create policy "aep: insert all" on public.arrival_event_people for insert to authenticated with check (true);
create policy "aep: update all" on public.arrival_event_people for update to authenticated using (true);
create policy "aep: delete all" on public.arrival_event_people for delete to authenticated using (true);
```

- [ ] **Step 2: Run it in Supabase**

The controller runs this via the Supabase Management API (token in `.env.local` as `SUPABASE_ACCESS_TOKEN`) — do NOT attempt to run it yourself. Your deliverable is the file + types + commit. Verify only that the SQL is syntactically well-formed.

- [ ] **Step 3: Update types**

In `src/types/database.ts`: DELETE the `Arrival` type (currently around line 10-18) and the `ProfileWithArrival` type (currently around line 51-53). Then append after the `CarWithCreator` type:

```ts
export type ArrivalEvent = {
  id: string
  description: string
  transportation: string
  arrival_date: string | null
  arrival_time: string | null
  departure_date: string | null
  departure_time: string | null
  created_by: string | null
  created_at: string
}

export type ArrivalEventPerson = {
  id: string
  event_id: string
  user_id: string
}

export type ArrivalEventWithPeople = ArrivalEvent & {
  arrival_event_people: (ArrivalEventPerson & { profiles: Profile | null })[]
}
```

- [ ] **Step 4: Verify build fails only where expected**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm run build
```

Expected: build FAILS with type errors in `src/lib/checklist.ts`, `src/lib/checklist.test.ts`, and `src/app/page.tsx` (they still import the now-deleted `Arrival`). This is expected — those files are fixed in Tasks 3 and 5. Confirm the ONLY errors are "Arrival"/"ProfileWithArrival" not found in those three files; if any other file errors, investigate.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/006_arrival_events.sql src/types/database.ts
git commit -m "feat: add arrival_events tables and types, drop arrivals"
```

---

### Task 2: i18n + validation & query helpers

**Files:**
- Create: `src/lib/arrival-event.ts`, `src/lib/arrival-event.test.ts`
- Modify: `src/lib/i18n/pt.json`, `src/lib/i18n/en.json`

**Interfaces:**
- Consumes: `ArrivalEventWithPeople` type from Task 1
- Produces: `ArrivalEventFormValue = { description, transportation, arrival_date, arrival_time, departure_date, departure_time, personIds: string[] }`
- Produces: `isArrivalEventFormValid(v: ArrivalEventFormValue): boolean`
- Produces: `hasLoggedArrival(userId: string, events: ArrivalEventWithPeople[]): boolean`
- Produces i18n keys: additions to the existing `arrivals` section

- [ ] **Step 1: Write the failing test**

Create `src/lib/arrival-event.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { isArrivalEventFormValid, hasLoggedArrival, type ArrivalEventFormValue } from './arrival-event'
import type { ArrivalEventWithPeople } from '@/types/database'

const validForm: ArrivalEventFormValue = {
  description: 'Chegando do aeroporto',
  transportation: 'Avião',
  arrival_date: '2026-10-09',
  arrival_time: '',
  departure_date: '',
  departure_time: '',
  personIds: ['u1'],
}

describe('isArrivalEventFormValid', () => {
  it('accepts a form with an arrival date only', () => {
    expect(isArrivalEventFormValid(validForm)).toBe(true)
  })
  it('accepts a form with a departure date only', () => {
    expect(isArrivalEventFormValid({ ...validForm, arrival_date: '', departure_date: '2026-10-18' })).toBe(true)
  })
  it('rejects when neither date is set', () => {
    expect(isArrivalEventFormValid({ ...validForm, arrival_date: '', departure_date: '' })).toBe(false)
  })
  it('rejects empty description', () => {
    expect(isArrivalEventFormValid({ ...validForm, description: '  ' })).toBe(false)
  })
  it('rejects empty transportation', () => {
    expect(isArrivalEventFormValid({ ...validForm, transportation: '' })).toBe(false)
  })
  it('rejects when no people are selected', () => {
    expect(isArrivalEventFormValid({ ...validForm, personIds: [] })).toBe(false)
  })
})

function event(overrides: Partial<ArrivalEventWithPeople>): ArrivalEventWithPeople {
  return {
    id: 'e1', description: '', transportation: 'Carro',
    arrival_date: null, arrival_time: null, departure_date: null, departure_time: null,
    created_by: null, created_at: '', arrival_event_people: [], ...overrides,
  }
}

describe('hasLoggedArrival', () => {
  it('true when user is in an event with an arrival date', () => {
    const events = [event({ arrival_date: '2026-10-09', arrival_event_people: [
      { id: 'p1', event_id: 'e1', user_id: 'u1', profiles: null },
    ] })]
    expect(hasLoggedArrival('u1', events)).toBe(true)
  })
  it('true when user is in an event with only a departure date', () => {
    const events = [event({ departure_date: '2026-10-18', arrival_event_people: [
      { id: 'p1', event_id: 'e1', user_id: 'u1', profiles: null },
    ] })]
    expect(hasLoggedArrival('u1', events)).toBe(true)
  })
  it('false when user is in an event with no dates', () => {
    const events = [event({ arrival_event_people: [
      { id: 'p1', event_id: 'e1', user_id: 'u1', profiles: null },
    ] })]
    expect(hasLoggedArrival('u1', events)).toBe(false)
  })
  it('false when user is not in any event', () => {
    const events = [event({ arrival_date: '2026-10-09', arrival_event_people: [
      { id: 'p1', event_id: 'e1', user_id: 'u2', profiles: null },
    ] })]
    expect(hasLoggedArrival('u1', events)).toBe(false)
  })
  it('false for empty event list', () => {
    expect(hasLoggedArrival('u1', [])).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test
```

Expected: FAIL — `arrival-event` module not found.

- [ ] **Step 3: Implement the helper module**

Create `src/lib/arrival-event.ts`:

```ts
import type { ArrivalEventWithPeople } from '@/types/database'

export type ArrivalEventFormValue = {
  description: string
  transportation: string
  arrival_date: string
  arrival_time: string
  departure_date: string
  departure_time: string
  personIds: string[]
}

export function isArrivalEventFormValid(v: ArrivalEventFormValue): boolean {
  return v.description.trim() !== '' &&
    v.transportation.trim() !== '' &&
    v.personIds.length > 0 &&
    (v.arrival_date !== '' || v.departure_date !== '')
}

export function hasLoggedArrival(userId: string, events: ArrivalEventWithPeople[]): boolean {
  return events.some(e =>
    (e.arrival_date != null || e.departure_date != null) &&
    e.arrival_event_people.some(p => p.user_id === userId)
  )
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test
```

Expected: PASS (11 new assertions across the two describe blocks). Note: `npm run build` still fails at this task (checklist/home not yet updated) — that's fine, only run `npm test` here.

- [ ] **Step 5: Add i18n strings**

In `src/lib/i18n/pt.json`, REPLACE the entire existing `arrivals` section with:

```json
"arrivals": {
  "title": "Chegadas e Saídas",
  "add": "Adicionar",
  "edit": "Editar",
  "delete": "Excluir",
  "save": "Salvar",
  "cancel": "Cancelar",
  "description": "Descrição",
  "transportation": "Transporte",
  "transport_car": "Carro",
  "transport_train": "Trem",
  "transport_plane": "Avião",
  "people": "Pessoas",
  "arrival_date": "Data de chegada",
  "arrival_time": "Horário de chegada",
  "departure_date": "Data de saída",
  "departure_time": "Horário de saída",
  "arrival": "Chegada",
  "departure": "Saída",
  "empty": "Nenhuma chegada ou saída registrada ainda.",
  "added_by": "Adicionado por"
}
```

In `src/lib/i18n/en.json`, REPLACE the entire existing `arrivals` section with:

```json
"arrivals": {
  "title": "Arrivals & Departures",
  "add": "Add",
  "edit": "Edit",
  "delete": "Delete",
  "save": "Save",
  "cancel": "Cancel",
  "description": "Description",
  "transportation": "Transportation",
  "transport_car": "Car",
  "transport_train": "Train",
  "transport_plane": "Plane",
  "people": "People",
  "arrival_date": "Arrival date",
  "arrival_time": "Arrival time",
  "departure_date": "Departure date",
  "departure_time": "Departure time",
  "arrival": "Arrival",
  "departure": "Departure",
  "empty": "No arrivals or departures logged yet.",
  "added_by": "Added by"
}
```

Note: the transportation VALUES stored in the DB are always the Portuguese `Carro`/`Trem`/`Avião` (per Global Constraints); `transport_car/train/plane` are display labels for the select options only.

- [ ] **Step 6: Verify tests + i18n parity**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test
```

Expected: all tests pass. (Build still fails until Task 5 — do not run `npm run build` as a gate here.)

- [ ] **Step 7: Commit**

```bash
git add src/lib/arrival-event.ts src/lib/arrival-event.test.ts src/lib/i18n/
git commit -m "feat: add arrival-event helpers, validation, and i18n strings"
```

---

### Task 3: ArrivalEventCard + checklist rewrite

**Files:**
- Create: `src/components/ArrivalEventCard.tsx`
- Modify: `src/lib/checklist.ts`, `src/lib/checklist.test.ts`

**Interfaces:**
- Consumes: `ArrivalEventWithPeople` type; `AvatarCircle`; i18n `arrivals.*`
- Produces: `<ArrivalEventCard event onEdit onDelete />`
- Produces (changed): `checklistItems(profile: Profile, hasArrival: boolean): ChecklistItem[]`

- [ ] **Step 1: Update the checklist test**

Replace `src/lib/checklist.test.ts` with:

```ts
import { describe, it, expect } from 'vitest'
import { checklistItems } from './checklist'
import type { Profile } from '@/types/database'

const profile = (avatar_url: string | null): Profile =>
  ({ id: 'u1', name: 'Ana', is_admin: false, avatar_color: '#fff', avatar_url, created_at: '' })

describe('checklistItems', () => {
  it('lists both when nothing done', () => {
    expect(checklistItems(profile(null), false).map(i => i.key)).toEqual(['photo', 'arrival'])
  })
  it('omits photo when avatar set', () => {
    expect(checklistItems(profile('http://x/a.jpg'), false).map(i => i.key)).toEqual(['arrival'])
  })
  it('omits arrival when the user has logged an arrival', () => {
    expect(checklistItems(profile(null), true).map(i => i.key)).toEqual(['photo'])
  })
  it('empty when all done', () => {
    expect(checklistItems(profile('http://x/a.jpg'), true)).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test
```

Expected: FAIL — `checklistItems` still takes an `Arrival | null` second arg.

- [ ] **Step 3: Update checklist.ts**

Replace `src/lib/checklist.ts` with:

```ts
import type { Profile } from '@/types/database'

export type ChecklistItem = { key: 'photo' | 'arrival'; href: string }

export function checklistItems(profile: Profile, hasArrival: boolean): ChecklistItem[] {
  const items: ChecklistItem[] = []
  if (!profile.avatar_url) items.push({ key: 'photo', href: '/profile' })
  if (!hasArrival) items.push({ key: 'arrival', href: '/arrivals' })
  return items
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test
```

Expected: PASS (4 checklist tests + the arrival-event tests from Task 2).

- [ ] **Step 5: Create ArrivalEventCard**

Create `src/components/ArrivalEventCard.tsx`:

```tsx
'use client'
import { useI18n } from '@/lib/i18n/context'
import { AvatarCircle } from './AvatarCircle'
import type { ArrivalEventWithPeople } from '@/types/database'

type Props = {
  event: ArrivalEventWithPeople
  onEdit: () => void
  onDelete: () => void
}

export function ArrivalEventCard({ event, onEdit, onDelete }: Props) {
  const { t, lang } = useI18n()

  function fmt(dateStr: string | null, timeStr: string | null): string | null {
    if (!dateStr) return null
    const date = new Date(dateStr + 'T00:00:00').toLocaleDateString(
      lang === 'pt' ? 'pt-BR' : 'en-US',
      { day: '2-digit', month: '2-digit', year: 'numeric' }
    )
    return timeStr ? `${date} ${timeStr.slice(0, 5)}` : date
  }

  const people = event.arrival_event_people.filter(p => p.profiles != null)
  const arrival = fmt(event.arrival_date, event.arrival_time)
  const departure = fmt(event.departure_date, event.departure_time)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {people.map(p => (
          <AvatarCircle key={p.id} name={p.profiles!.name} color={p.profiles!.avatar_color}
            avatarUrl={p.profiles!.avatar_url} size="sm" />
        ))}
        <span className="text-sm font-semibold text-gray-900">
          {people.map(p => p.profiles!.name).join(', ')}
        </span>
      </div>

      <p className="text-sm text-gray-700">{event.description}</p>
      <p className="text-xs text-gray-400 mt-0.5">🚗 {event.transportation}</p>

      <div className="mt-2 space-y-0.5">
        {arrival && (
          <p className="text-sm text-gray-600">↓ {t.arrivals.arrival}: {arrival}</p>
        )}
        {departure && (
          <p className="text-sm text-gray-600">↑ {t.arrivals.departure}: {departure}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
        <button onClick={onEdit}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          {t.arrivals.edit}
        </button>
        <button onClick={onDelete}
          className="px-3 py-1.5 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50">
          {t.arrivals.delete}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Verify**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test
```

Expected: all tests pass. (Build still fails on `src/app/page.tsx` until Task 5 — not a gate here.)

- [ ] **Step 7: Commit**

```bash
git add src/components/ArrivalEventCard.tsx src/lib/checklist.ts src/lib/checklist.test.ts
git commit -m "feat: add ArrivalEventCard and switch checklist to hasArrival boolean"
```

---

### Task 4: ArrivalEventsSection + replace /arrivals page

**Files:**
- Create: `src/components/ArrivalEventsSection.tsx`
- Replace: `src/app/arrivals/page.tsx`

**Interfaces:**
- Consumes: `ArrivalEventWithPeople`, `Profile` types; `isArrivalEventFormValid`, `ArrivalEventFormValue` from `src/lib/arrival-event.ts`; `ArrivalEventCard` from Task 3; `useAuth()`, `useI18n()`, `supabase`; i18n `arrivals.*`, `common.confirm_delete`
- Produces: full CRUD page for arrival events

- [ ] **Step 1: Create ArrivalEventsSection**

Create `src/components/ArrivalEventsSection.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n/context'
import { supabase } from '@/lib/supabase'
import { isArrivalEventFormValid, type ArrivalEventFormValue } from '@/lib/arrival-event'
import { AvatarCircle } from './AvatarCircle'
import { ArrivalEventCard } from './ArrivalEventCard'
import { ProtectedRoute } from './ProtectedRoute'
import type { ArrivalEventWithPeople, Profile } from '@/types/database'

const EMPTY: ArrivalEventFormValue = {
  description: '', transportation: '', arrival_date: '', arrival_time: '',
  departure_date: '', departure_time: '', personIds: [],
}

function ArrivalEventsContent() {
  const { t } = useI18n()
  const { profile } = useAuth()
  const [events, setEvents] = useState<ArrivalEventWithPeople[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [form, setForm] = useState<ArrivalEventFormValue | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('arrival_events')
      .select('*, arrival_event_people(*, profiles(*))')
      .order('created_at')
    setEvents((data as ArrivalEventWithPeople[]) ?? [])
  }

  useEffect(() => {
    load()
    supabase.from('profiles').select('*').order('name').then(({ data }) => setProfiles(data ?? []))
  }, [])

  function startCreate() {
    setEditingId(null)
    setForm({ ...EMPTY })
  }

  function startEdit(event: ArrivalEventWithPeople) {
    setEditingId(event.id)
    setForm({
      description: event.description,
      transportation: event.transportation,
      arrival_date: event.arrival_date ?? '',
      arrival_time: event.arrival_time?.slice(0, 5) ?? '',
      departure_date: event.departure_date ?? '',
      departure_time: event.departure_time?.slice(0, 5) ?? '',
      personIds: event.arrival_event_people.map(p => p.user_id),
    })
  }

  function togglePerson(id: string) {
    setForm(f => {
      if (!f) return f
      const has = f.personIds.includes(id)
      return { ...f, personIds: has ? f.personIds.filter(x => x !== id) : [...f.personIds, id] }
    })
  }

  async function save() {
    if (!form || !isArrivalEventFormValid(form) || !profile) return
    setSaving(true)
    const row = {
      description: form.description,
      transportation: form.transportation,
      arrival_date: form.arrival_date || null,
      arrival_time: form.arrival_time || null,
      departure_date: form.departure_date || null,
      departure_time: form.departure_time || null,
    }
    let eventId = editingId
    if (editingId) {
      await supabase.from('arrival_events').update(row).eq('id', editingId)
      await supabase.from('arrival_event_people').delete().eq('event_id', editingId)
    } else {
      const { data } = await supabase.from('arrival_events')
        .insert({ ...row, created_by: profile.id }).select('id').single()
      eventId = data?.id ?? null
    }
    if (eventId) {
      await supabase.from('arrival_event_people')
        .insert(form.personIds.map(user_id => ({ event_id: eventId, user_id })))
    }
    setSaving(false)
    setForm(null)
    setEditingId(null)
    load()
  }

  async function remove(event: ArrivalEventWithPeople) {
    if (!confirm(t.common.confirm_delete)) return
    // arrival_event_people rows cascade-delete with the event
    await supabase.from('arrival_events').delete().eq('id', event.id)
    load()
  }

  function textField(key: 'description', label: string) {
    return (
      <div>
        <label className="block text-xs text-gray-500 mb-1">{label}</label>
        <input type="text" value={form?.[key] ?? ''}
          onChange={e => setForm(f => ({ ...f!, [key]: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
      </div>
    )
  }

  function dateTimeField(dateKey: 'arrival_date' | 'departure_date', timeKey: 'arrival_time' | 'departure_time',
    dateLabel: string, timeLabel: string) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">{dateLabel}</label>
          <input type="date" value={form?.[dateKey] ?? ''}
            onChange={e => setForm(f => ({ ...f!, [dateKey]: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{timeLabel}</label>
          <input type="time" value={form?.[timeKey] ?? ''}
            onChange={e => setForm(f => ({ ...f!, [timeKey]: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.arrivals.title}</h1>

      {!form && (
        <button onClick={startCreate}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 mb-4">
          + {t.arrivals.add}
        </button>
      )}

      {form && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t.arrivals.people}</label>
            <div className="flex flex-wrap gap-2">
              {profiles.map(p => {
                const selected = form.personIds.includes(p.id)
                return (
                  <button key={p.id} type="button" onClick={() => togglePerson(p.id)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-sm transition-colors ${
                      selected ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>
                    <AvatarCircle name={p.name} color={p.avatar_color} avatarUrl={p.avatar_url} size="sm" />
                    {p.name}
                  </button>
                )
              })}
            </div>
          </div>

          {textField('description', t.arrivals.description)}

          <div>
            <label className="block text-xs text-gray-500 mb-1">{t.arrivals.transportation}</label>
            <select value={form.transportation}
              onChange={e => setForm(f => ({ ...f!, transportation: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
              <option value="">—</option>
              <option value="Carro">{t.arrivals.transport_car}</option>
              <option value="Trem">{t.arrivals.transport_train}</option>
              <option value="Avião">{t.arrivals.transport_plane}</option>
            </select>
          </div>

          {dateTimeField('arrival_date', 'arrival_time', t.arrivals.arrival_date, t.arrivals.arrival_time)}
          {dateTimeField('departure_date', 'departure_time', t.arrivals.departure_date, t.arrivals.departure_time)}

          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving || !isArrivalEventFormValid(form)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
              {saving ? '...' : t.arrivals.save}
            </button>
            <button onClick={() => { setForm(null); setEditingId(null) }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
              {t.arrivals.cancel}
            </button>
          </div>
        </div>
      )}

      {events.length === 0 && !form && (
        <p className="text-gray-400 text-sm">{t.arrivals.empty}</p>
      )}

      <div className="space-y-3">
        {events.map(event => (
          <ArrivalEventCard key={event.id} event={event}
            onEdit={() => startEdit(event)} onDelete={() => remove(event)} />
        ))}
      </div>
    </div>
  )
}

export function ArrivalEventsSection() {
  return <ProtectedRoute><ArrivalEventsContent /></ProtectedRoute>
}
```

- [ ] **Step 2: Replace the arrivals page**

Replace `src/app/arrivals/page.tsx` with:

```tsx
import { ArrivalEventsSection } from '@/components/ArrivalEventsSection'

export default function ArrivalsPage() {
  return <ArrivalEventsSection />
}
```

- [ ] **Step 3: Verify**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test && npm run build
```

Expected: tests pass; build still fails ONLY on `src/app/page.tsx` (home, fixed in Task 5). Confirm `/arrivals` itself compiles — the only remaining error should be the home page's `Arrival` import.

- [ ] **Step 4: Commit**

```bash
git add src/components/ArrivalEventsSection.tsx src/app/arrivals/page.tsx
git commit -m "feat: replace arrivals page with free-form arrival/departure events CRUD"
```

---

### Task 5: Home page ripple

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `hasLoggedArrival` from `src/lib/arrival-event.ts`; `checklistItems(profile, hasArrival)` from Task 3; `ArrivalEventWithPeople` type

- [ ] **Step 1: Rewrite the home page data logic**

Replace `src/app/page.tsx` with:

```tsx
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { listSitePhotos, publicUrl } from '@/lib/photos'
import { checklistItems } from '@/lib/checklist'
import { hasLoggedArrival } from '@/lib/arrival-event'
import { Countdown } from '@/components/Countdown'
import { AvatarCircle } from '@/components/AvatarCircle'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import type { Profile, SitePhoto, ArrivalEventWithPeople } from '@/types/database'

function HomePage() {
  const { t } = useI18n()
  const { profile } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [events, setEvents] = useState<ArrivalEventWithPeople[]>([])
  const [hero, setHero] = useState<SitePhoto | null>(null)

  useEffect(() => {
    supabase.from('profiles').select('*').then(({ data }) => setProfiles(data ?? []))
    supabase.from('arrival_events').select('*, arrival_event_people(*, profiles(*))')
      .then(({ data }) => setEvents((data as ArrivalEventWithPeople[]) ?? []))
    listSitePhotos('hero').then(ps => setHero(ps[0] ?? null))
  }, [])

  const missing = profiles.filter(p => !hasLoggedArrival(p.id, events))
  const myHasArrival = profile ? hasLoggedArrival(profile.id, events) : false
  const todo = profile ? checklistItems(profile, myHasArrival) : []
  const checklistLabels = { photo: t.dashboard.checklist_photo, arrival: t.dashboard.checklist_arrival }

  return (
    <div className="max-w-xl mx-auto">
      {hero && (
        <img src={publicUrl('photos', hero.storage_path)} alt=""
          className="w-full h-48 md:h-64 object-cover rounded-2xl mt-2" />
      )}
      <h1 className="text-4xl font-black text-center text-orange-500 mt-6">{t.home.title}</h1>
      <p className="text-center text-gray-400 mt-1">{t.home.subtitle}</p>
      <Countdown />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-900 mb-2">{t.dashboard.facts_title}</p>
        <p className="text-sm text-gray-600">🗓️ {t.dashboard.facts_dates}</p>
        <p className="text-sm text-gray-600 mt-1">📍 {t.dashboard.facts_address}</p>
        <Link href="/house" className="inline-block text-sm text-orange-500 hover:underline font-medium mt-2">
          {t.dashboard.facts_house_link}
        </Link>
      </div>

      {todo.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mt-4">
          <p className="text-sm font-semibold text-orange-800 mb-2">{t.dashboard.checklist_title}</p>
          <div className="space-y-1.5">
            {todo.map(item => (
              <Link key={item.key} href={item.href}
                className="block text-sm text-gray-700 hover:text-orange-600">
                {checklistLabels[item.key]}
              </Link>
            ))}
          </div>
        </div>
      )}

      {missing.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mt-4">
          <p className="text-sm font-semibold text-amber-800 mb-3">{t.home.arrivals_prompt}</p>
          <div className="flex flex-wrap gap-3">
            {missing.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <AvatarCircle name={p.name} color={p.avatar_color} avatarUrl={p.avatar_url} size="sm" />
                <span className="text-sm text-gray-700">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  return <ProtectedRoute><HomePage /></ProtectedRoute>
}
```

- [ ] **Step 2: Verify full build + tests**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test && npm run build
```

Expected: all tests pass AND build succeeds (all routes, no `Arrival` references remain anywhere). Grep to confirm the old type is fully gone:

```bash
grep -rn "ProfileWithArrival\|['\"]arrivals['\"]\b" src/ | grep -v "arrival_events\|arrival-event\|/arrivals\|nav.arrivals\|t.arrivals\|home.arrivals_prompt"
```

Expected: no references to the dropped `arrivals` table or `Arrival`/`ProfileWithArrival` types remain (matches on the `/arrivals` route path, `t.arrivals.*` i18n, and `nav.arrivals` are fine).

- [ ] **Step 3: Manual end-to-end** (skip if no browser; note as concern)

1. Visit `/arrivals` — empty state + "+ Adicionar"
2. Create an event: select 2 people, description, transportation, an arrival date+time — card shows both avatars, names, transport, arrival line
3. As a different guest, edit and delete that event — confirm allowed
4. Home page: the checklist "✈️" item disappears once you're in a qualifying event; the "who hasn't arrived" nudge no longer lists you

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: home page reads arrival_events for checklist and nudge"
```

---

## Self-Review

**Spec coverage:** two tables + open RLS + drop arrivals → Task 1; form/query helpers + i18n → Task 2; display card + checklist switch → Task 3; full CRUD with people multiselect, arrival/departure date+time, transportation, replaces `/arrivals` → Task 4; home checklist + nudge ripple → Task 5. Future work (calendar, activity type) correctly omitted.

**Type consistency:** `ArrivalEventFormValue` fields are all strings except `personIds: string[]`, consistent between `isArrivalEventFormValid`, the section's form state, and save() (which converts `''` → `null` for dates/times and maps `personIds` to join rows). `ArrivalEventWithPeople` shape (`arrival_event_people: (ArrivalEventPerson & { profiles: Profile | null })[]`) matches the Supabase nested select in both the section and the home page, and the card guards `profiles != null`. `checklistItems(profile, hasArrival: boolean)` signature matches its single call site in the rewritten home page and the updated test. `hasLoggedArrival(userId, events)` used identically in home page's `missing` filter and `myHasArrival`.

**Intermediate build state:** Tasks 1–4 intentionally leave `src/app/page.tsx` failing to compile (it imports the dropped `Arrival` type until Task 5). This is called out in each task's verify step so a reviewer doesn't mistake it for a regression. `npm test` is the gate for Tasks 2–3; full `npm run build` only gates at Task 5. Since subagent-driven development builds locally and pushes only after the final review, `main` never sees a broken intermediate.
