# Guest Car Rentals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let any authenticated guest add, edit, and delete car rental entries (company, location, dates, brand, color, seats, optional photo) on the `/cars` page, with edit/delete open to all guests, not just the creator.

**Architecture:** A new `cars` table with RLS open to all authenticated users (no owner/admin gate), a new `car-photos` storage bucket (any authenticated user can write any object), and a new `CarsSection` component rendered below the existing admin-managed content on `/cars` via a new optional `children` slot on `InfoPage`.

**Tech Stack:** Existing stack only — Next.js 16 static export, Supabase JS v2, Tailwind v4, Vitest. Reuses `resizeImage` from `src/lib/image-resize.ts`. No new dependencies.

## Global Constraints

- All UI strings in `src/lib/i18n/pt.json` / `en.json` — never hardcoded; Portuguese default
- No server-side code; `'use client'` on components using hooks/browser APIs
- Photo resize: max 1200px wide, JPEG quality 0.85, reusing existing `resizeImage(file, maxDim)` (throws `Error('invalid-file')` for non-images or files > 20MB)
- `cars` table RLS: authenticated can select/insert/update/delete **any** row — no owner check, no admin check
- `car-photos` bucket: public read; any authenticated user can insert/update/delete any object — not folder-restricted
- Location is a single field (no separate pick-up/drop-off)
- No ride sign-up/join mechanic — informational only
- Node: `nvm use 22` before any npm command
- Working directory: `/Users/gusfaria/Documents/PROJECTS/Gustavo-Philipe__40-anos`

---

## File Map

```
supabase/migrations/005_cars.sql       — new: cars table + RLS + car-photos bucket + storage RLS
src/types/database.ts                  — modify: Car, CarWithCreator types
src/lib/photos.ts                      — modify: uploadCarPhoto, deleteCarPhoto
src/lib/car-form.ts                    — new: CarFormValue type + isCarFormValid
src/lib/car-form.test.ts               — new
src/lib/i18n/pt.json, en.json          — modify: new top-level "cars" section
src/components/InfoPage.tsx            — modify: optional children slot
src/components/CarCard.tsx             — new: display card with edit/delete
src/components/CarsSection.tsx         — new: form + list + CRUD orchestration
src/app/cars/page.tsx                  — modify: render CarsSection as InfoPage children
```

---

### Task 1: Migration + types

**Files:**
- Create: `supabase/migrations/005_cars.sql`
- Modify: `src/types/database.ts`

**Interfaces:**
- Produces: `cars` table, `car-photos` bucket
- Produces types: `Car = { id, created_by, rental_company, location, pickup_date, dropoff_date, brand, color, seats, photo_path, created_at }`, `CarWithCreator = Car & { profiles: Profile }`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/005_cars.sql`:

```sql
-- cars: guest-entered car rental info, open to all authenticated guests
create table public.cars (
  id              uuid        primary key default gen_random_uuid(),
  created_by      uuid        references public.profiles(id) on delete set null,
  rental_company  text        not null,
  location        text        not null,
  pickup_date     date        not null,
  dropoff_date    date        not null,
  brand           text        not null,
  color           text        not null,
  seats           integer     not null,
  photo_path      text,
  created_at      timestamptz not null default now()
);

alter table public.cars enable row level security;

-- Anyone can edit/delete any entry — a rental is tied to a couple, not a login
create policy "cars: read all"   on public.cars for select to authenticated using (true);
create policy "cars: insert all" on public.cars for insert to authenticated with check (true);
create policy "cars: update all" on public.cars for update to authenticated using (true);
create policy "cars: delete all" on public.cars for delete to authenticated using (true);

-- car-photos bucket: public read; any authenticated user can write any object
insert into storage.buckets (id, name, public) values ('car-photos', 'car-photos', true);

create policy "car-photos read"   on storage.objects for select using (bucket_id = 'car-photos');
create policy "car-photos insert" on storage.objects for insert to authenticated with check (bucket_id = 'car-photos');
create policy "car-photos update" on storage.objects for update to authenticated using (bucket_id = 'car-photos');
create policy "car-photos delete" on storage.objects for delete to authenticated using (bucket_id = 'car-photos');
```

- [ ] **Step 2: Run it in Supabase**

Dashboard → SQL Editor → New query → paste → Run. Expected: "Success. No rows returned."
Verify: Table Editor shows `cars`; Storage shows `car-photos` bucket.

- [ ] **Step 3: Update types**

In `src/types/database.ts`, append after `ProfileWithArrival`:

```ts
export type Car = {
  id: string
  created_by: string | null
  rental_company: string
  location: string
  pickup_date: string
  dropoff_date: string
  brand: string
  color: string
  seats: number
  photo_path: string | null
  created_at: string
}

export type CarWithCreator = Car & { profiles: Profile }
```

- [ ] **Step 4: Verify build**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm run build
```

Expected: build passes (no page changes yet, just types).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/005_cars.sql src/types/database.ts
git commit -m "feat: add cars table, open RLS, and car-photos bucket with types"
```

---

### Task 2: Photo helpers, form validation, i18n

**Files:**
- Modify: `src/lib/photos.ts`
- Create: `src/lib/car-form.ts`, `src/lib/car-form.test.ts`
- Modify: `src/lib/i18n/pt.json`, `src/lib/i18n/en.json`

**Interfaces:**
- Consumes: `resizeImage(file, maxDim)` from `src/lib/image-resize.ts` (existing)
- Produces: `uploadCarPhoto(file: File): Promise<string>` (returns storage path), `deleteCarPhoto(path: string): Promise<void>`
- Produces: `CarFormValue = { rental_company, location, pickup_date, dropoff_date, brand, color, seats }` (all strings — `seats` kept as string for controlled input, parsed on save), `isCarFormValid(v: CarFormValue): boolean`
- Produces i18n keys: `cars.*` (new top-level section)

- [ ] **Step 1: Write the failing test**

Create `src/lib/car-form.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { isCarFormValid, type CarFormValue } from './car-form'

const valid: CarFormValue = {
  rental_company: 'Enterprise',
  location: 'MCO Airport',
  pickup_date: '2026-10-09',
  dropoff_date: '2026-10-18',
  brand: 'Toyota',
  color: 'Prata',
  seats: '5',
}

describe('isCarFormValid', () => {
  it('accepts a fully filled form', () => {
    expect(isCarFormValid(valid)).toBe(true)
  })
  it('rejects empty rental_company', () => {
    expect(isCarFormValid({ ...valid, rental_company: '  ' })).toBe(false)
  })
  it('rejects empty pickup_date', () => {
    expect(isCarFormValid({ ...valid, pickup_date: '' })).toBe(false)
  })
  it('rejects zero seats', () => {
    expect(isCarFormValid({ ...valid, seats: '0' })).toBe(false)
  })
  it('rejects non-numeric seats', () => {
    expect(isCarFormValid({ ...valid, seats: 'abc' })).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test
```

Expected: FAIL — `car-form` module not found.

- [ ] **Step 3: Implement car-form.ts**

Create `src/lib/car-form.ts`:

```ts
export type CarFormValue = {
  rental_company: string
  location: string
  pickup_date: string
  dropoff_date: string
  brand: string
  color: string
  seats: string
}

export function isCarFormValid(v: CarFormValue): boolean {
  return v.rental_company.trim() !== '' &&
    v.location.trim() !== '' &&
    v.pickup_date !== '' &&
    v.dropoff_date !== '' &&
    v.brand.trim() !== '' &&
    v.color.trim() !== '' &&
    Number.isFinite(Number(v.seats)) && Number(v.seats) > 0
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test
```

Expected: PASS (5 new tests, plus all existing tests still passing).

- [ ] **Step 5: Add photo helpers**

In `src/lib/photos.ts`, append:

```ts
export async function uploadCarPhoto(file: File): Promise<string> {
  const blob = await resizeImage(file, 1200)
  const path = `${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from('car-photos')
    .upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  return path
}

export async function deleteCarPhoto(path: string): Promise<void> {
  await supabase.storage.from('car-photos').remove([path])
}
```

- [ ] **Step 6: Add i18n strings**

In `src/lib/i18n/pt.json`, add a new top-level `cars` section (alongside `nav`, `home`, etc.):

```json
"cars": {
  "section_title": "Carros dos Convidados",
  "add": "Adicionar carro",
  "edit": "Editar",
  "delete": "Excluir",
  "save": "Salvar",
  "cancel": "Cancelar",
  "rental_company": "Locadora",
  "location": "Local",
  "pickup_date": "Retirada",
  "dropoff_date": "Devolução",
  "brand": "Marca",
  "color": "Cor",
  "seats": "Assentos",
  "photo": "Foto (opcional)",
  "empty": "Nenhum carro cadastrado ainda.",
  "added_by": "Adicionado por"
}
```

In `src/lib/i18n/en.json`, mirror it:

```json
"cars": {
  "section_title": "Guest Cars",
  "add": "Add car",
  "edit": "Edit",
  "delete": "Delete",
  "save": "Save",
  "cancel": "Cancel",
  "rental_company": "Rental company",
  "location": "Location",
  "pickup_date": "Pick-up",
  "dropoff_date": "Drop-off",
  "brand": "Brand",
  "color": "Color",
  "seats": "Seats",
  "photo": "Photo (optional)",
  "empty": "No cars added yet.",
  "added_by": "Added by"
}
```

- [ ] **Step 7: Verify**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test && npm run build
```

Expected: all tests pass; build compiles (i18n key parity enforced at compile time via `typeof pt`).

- [ ] **Step 8: Commit**

```bash
git add src/lib/photos.ts src/lib/car-form.ts src/lib/car-form.test.ts src/lib/i18n/
git commit -m "feat: add car photo helpers, form validation, and cars i18n strings"
```

---

### Task 3: InfoPage children slot + CarCard

**Files:**
- Modify: `src/components/InfoPage.tsx`
- Create: `src/components/CarCard.tsx`

**Interfaces:**
- Consumes: `CarWithCreator` type from Task 1; `publicUrl('car-photos', path)` from `src/lib/photos.ts`; `AvatarCircle` (existing); i18n `cars.*` from Task 2
- Produces: `<InfoPage slug fallbackTitle>{children}</InfoPage>` — children render after the markdown content
- Produces: `<CarCard car={CarWithCreator} onEdit={() => void} onDelete={() => void} />`

- [ ] **Step 1: Add children slot to InfoPage**

Replace `src/components/InfoPage.tsx` with:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n/context'
import { ProtectedRoute } from './ProtectedRoute'
import { MarkdownRenderer } from './MarkdownRenderer'
import { PhotoGallery } from './PhotoGallery'
import type { InfoPage as InfoPageType } from '@/types/database'

type Props = { slug: string; fallbackTitle: string; children?: React.ReactNode }

function InfoPageContent({ slug, fallbackTitle, children }: Props) {
  const { t } = useI18n()
  const [page, setPage] = useState<InfoPageType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('info_pages').select('*').eq('slug', slug).single()
      .then(({ data }) => { setPage(data); setLoading(false) })
  }, [slug])

  if (loading) return <p className="text-gray-400">{t.common.loading}</p>

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{page?.title ?? fallbackTitle}</h1>
      {(slug === 'house' || slug === 'cars') && <PhotoGallery section={slug} />}
      {page?.content
        ? <MarkdownRenderer content={page.content} />
        : <p className="text-gray-400">{t.common.no_data}</p>
      }
      {children}
    </div>
  )
}

export function InfoPage(props: Props) {
  return <ProtectedRoute><InfoPageContent {...props} /></ProtectedRoute>
}
```

(Only change: `children?: React.ReactNode` added to `Props`, destructured, and rendered at the end of the div. `house`/`schedule`/`explore` pages don't pass children, so they render exactly as before.)

- [ ] **Step 2: Create CarCard**

Create `src/components/CarCard.tsx`:

```tsx
'use client'
import { useI18n } from '@/lib/i18n/context'
import { AvatarCircle } from './AvatarCircle'
import { publicUrl } from '@/lib/photos'
import type { CarWithCreator } from '@/types/database'

type Props = {
  car: CarWithCreator
  onEdit: () => void
  onDelete: () => void
}

export function CarCard({ car, onEdit, onDelete }: Props) {
  const { t, lang } = useI18n()

  function fmt(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(
      lang === 'pt' ? 'pt-BR' : 'en-US',
      { day: '2-digit', month: '2-digit', year: 'numeric' }
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      {car.photo_path && (
        <img src={publicUrl('car-photos', car.photo_path)} alt={`${car.brand} ${car.color}`}
          className="w-full aspect-[4/3] object-cover rounded-xl mb-3" />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-gray-900">{car.brand} — {car.color}</p>
          <p className="text-sm text-gray-600 mt-0.5">{car.rental_company} • {car.location}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {fmt(car.pickup_date)} → {fmt(car.dropoff_date)}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">{t.cars.seats}: {car.seats}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <AvatarCircle name={car.profiles.name} color={car.profiles.avatar_color}
            avatarUrl={car.profiles.avatar_url} size="sm" />
          <span className="text-xs text-gray-400">{t.cars.added_by} {car.profiles.name}</span>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={onEdit}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            {t.cars.edit}
          </button>
          <button onClick={onDelete}
            className="px-3 py-1.5 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50">
            {t.cars.delete}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm run build
```

Expected: build passes (CarCard isn't wired into any page yet, but must compile standalone).

- [ ] **Step 4: Commit**

```bash
git add src/components/InfoPage.tsx src/components/CarCard.tsx
git commit -m "feat: add InfoPage children slot and CarCard display component"
```

---

### Task 4: CarsSection (form + list + CRUD) wired into /cars

**Files:**
- Create: `src/components/CarsSection.tsx`
- Modify: `src/app/cars/page.tsx`

**Interfaces:**
- Consumes: `CarWithCreator`, `Car` types; `uploadCarPhoto`, `deleteCarPhoto` from `src/lib/photos.ts`; `CarFormValue`, `isCarFormValid` from `src/lib/car-form.ts`; `CarCard` from Task 3; `useAuth()` (existing, gives `profile`); i18n `cars.*`, `common.confirm_delete`, `profile.invalid_file`, `profile.uploading`

- [ ] **Step 1: Create CarsSection**

Create `src/components/CarsSection.tsx`:

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n/context'
import { supabase } from '@/lib/supabase'
import { uploadCarPhoto, deleteCarPhoto } from '@/lib/photos'
import { isCarFormValid, type CarFormValue } from '@/lib/car-form'
import { CarCard } from './CarCard'
import type { CarWithCreator } from '@/types/database'

const EMPTY: CarFormValue = {
  rental_company: '', location: '', pickup_date: '', dropoff_date: '', brand: '', color: '', seats: '',
}

export function CarsSection() {
  const { t } = useI18n()
  const { profile } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [cars, setCars] = useState<CarWithCreator[]>([])
  const [form, setForm] = useState<CarFormValue | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [existingPhotoPath, setExistingPhotoPath] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const { data } = await supabase.from('cars').select('*, profiles(*)').order('created_at')
    setCars((data as CarWithCreator[]) ?? [])
  }

  useEffect(() => { load() }, [])

  function startCreate() {
    setEditingId(null)
    setExistingPhotoPath(null)
    setPhotoFile(null)
    setError('')
    setForm({ ...EMPTY })
  }

  function startEdit(car: CarWithCreator) {
    setEditingId(car.id)
    setExistingPhotoPath(car.photo_path)
    setPhotoFile(null)
    setError('')
    setForm({
      rental_company: car.rental_company,
      location: car.location,
      pickup_date: car.pickup_date,
      dropoff_date: car.dropoff_date,
      brand: car.brand,
      color: car.color,
      seats: String(car.seats),
    })
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setPhotoFile(e.target.files?.[0] ?? null)
  }

  async function save() {
    if (!form || !isCarFormValid(form) || !profile) return
    setSaving(true)
    setError('')
    try {
      let photoPath = existingPhotoPath
      if (photoFile) {
        if (existingPhotoPath) await deleteCarPhoto(existingPhotoPath)
        photoPath = await uploadCarPhoto(photoFile)
      }
      const row = {
        rental_company: form.rental_company,
        location: form.location,
        pickup_date: form.pickup_date,
        dropoff_date: form.dropoff_date,
        brand: form.brand,
        color: form.color,
        seats: Number(form.seats),
        photo_path: photoPath,
      }
      if (editingId) {
        await supabase.from('cars').update(row).eq('id', editingId)
      } else {
        await supabase.from('cars').insert({ ...row, created_by: profile.id })
      }
      setForm(null)
      setEditingId(null)
      if (fileRef.current) fileRef.current.value = ''
      load()
    } catch {
      setError(t.profile.invalid_file)
    }
    setSaving(false)
  }

  async function remove(car: CarWithCreator) {
    if (!confirm(t.common.confirm_delete)) return
    if (car.photo_path) await deleteCarPhoto(car.photo_path)
    await supabase.from('cars').delete().eq('id', car.id)
    load()
  }

  function field(key: keyof CarFormValue, label: string, type = 'text') {
    return (
      <div key={key}>
        <label className="block text-xs text-gray-500 mb-1">{label}</label>
        <input type={type} value={form?.[key] ?? ''}
          onChange={e => setForm(f => ({ ...f!, [key]: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
      </div>
    )
  }

  return (
    <div className="mt-8 pt-8 border-t border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{t.cars.section_title}</h2>

      {!form && (
        <button onClick={startCreate}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 mb-4">
          + {t.cars.add}
        </button>
      )}

      {form && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3 mb-4">
          {field('rental_company', t.cars.rental_company)}
          {field('location', t.cars.location)}
          <div className="grid grid-cols-2 gap-3">
            {field('pickup_date', t.cars.pickup_date, 'date')}
            {field('dropoff_date', t.cars.dropoff_date, 'date')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field('brand', t.cars.brand)}
            {field('color', t.cars.color)}
          </div>
          {field('seats', t.cars.seats, 'number')}
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t.cars.photo}</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile}
              className="text-sm text-gray-600" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving || !isCarFormValid(form)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
              {saving ? t.profile.uploading : t.cars.save}
            </button>
            <button onClick={() => { setForm(null); setEditingId(null) }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
              {t.cars.cancel}
            </button>
          </div>
        </div>
      )}

      {cars.length === 0 && !form && (
        <p className="text-gray-400 text-sm">{t.cars.empty}</p>
      )}

      <div className="space-y-3">
        {cars.map(car => (
          <CarCard key={car.id} car={car} onEdit={() => startEdit(car)} onDelete={() => remove(car)} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire into the Cars page**

Replace `src/app/cars/page.tsx`:

```tsx
import { InfoPage } from '@/components/InfoPage'
import { CarsSection } from '@/components/CarsSection'

export default function CarsPage() {
  return (
    <InfoPage slug="cars" fallbackTitle="Carros">
      <CarsSection />
    </InfoPage>
  )
}
```

- [ ] **Step 3: Verify**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test && npm run build
```

Expected: all tests pass; build compiles all routes including `/cars`.

- [ ] **Step 4: Manual end-to-end** (skip if no browser available; note as concern instead)

1. Visit `/cars` — existing admin content/gallery unchanged, new "Carros dos Convidados" section below with "+ Adicionar carro"
2. Create a car entry with a photo — appears as a card with photo, dates formatted, seats, your avatar+name
3. Log in as a different guest — confirm you can Edit and Delete that same entry (not just your own)
4. Delete a car with a photo — confirm it disappears from the list

- [ ] **Step 5: Commit and deploy**

```bash
git add src/components/CarsSection.tsx src/app/cars/page.tsx
git commit -m "feat: guest car rental CRUD section on cars page"
git push origin main   # auto-deploys via GitHub Actions
```

---

## Self-Review

**Spec coverage:** data model + open RLS + car-photos bucket → Task 1; photo upload/delete helpers + form validation + i18n → Task 2; InfoPage children slot (keeps house/schedule/explore untouched) + display card → Task 3; full CRUD section, wired below existing content, any guest can edit/delete any entry, photo optional, required-field validation, delete removes storage photo non-blocking → Task 4. No gaps against the spec's sections 2–6.

**Type consistency:** `CarFormValue.seats` is a string (controlled input) end-to-end — `isCarFormValid` and `CarsSection.save()` both treat it as string, converting via `Number(form.seats)` only at save time into the DB row (`seats: number`). `CarWithCreator` matches the Supabase join shape used identically to the existing `ActivityWithSignups` pattern. `publicUrl`, `uploadCarPhoto`, `deleteCarPhoto` signatures match between Task 2's definition and Task 3/4's usage.
