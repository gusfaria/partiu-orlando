# Photos & Home Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add guest avatars, admin-managed photo galleries (house/cars), a hero image, and a home page dashboard with trip facts and a personal checklist.

**Architecture:** Supabase Storage (two public-read buckets: `avatars` guest-writable in own folder, `photos` admin-writable) with client-side canvas resizing before upload. A `site_photos` table drives galleries and hero. `AvatarCircle` gains an `avatarUrl` prop consumed app-wide.

**Tech Stack:** Existing stack only — Next.js 16 static export, Supabase JS v2, Tailwind v4, Vitest. No new dependencies.

## Global Constraints

- All UI strings in `src/lib/i18n/pt.json` / `en.json` — never hardcoded
- No server-side code; `'use client'` on components using hooks/browser APIs
- Resize limits: avatars max 400px, gallery/hero max 1600px, JPEG quality 0.85
- Reject non-image files and files > 20 MB before resizing
- `site_photos.section` values: exactly `house`, `cars`, `hero`
- Insert `site_photos` row only after storage upload succeeds
- Node: `nvm use 22` before any npm command
- Working directory: `/Users/gusfaria/Documents/PROJECTS/Gustavo-Philipe__40-anos`

---

## File Map

```
supabase/migrations/004_photos.sql       — new: schema + buckets + RLS
src/types/database.ts                    — modify: SitePhoto type, avatar_url on Profile
src/lib/image-resize.ts                  — new: scaledDimensions + resizeImage
src/lib/image-resize.test.ts             — new
src/lib/photos.ts                        — new: storage helpers
src/lib/i18n/pt.json, en.json            — modify: profile/checklist/facts/admin strings
src/components/AvatarCircle.tsx          — modify: avatarUrl prop
src/components/PhotoGallery.tsx          — new
src/components/InfoPage.tsx              — modify: gallery slot
src/components/Nav.tsx                   — modify: avatar links to /profile
src/app/profile/page.tsx                 — new
src/app/page.tsx                         — modify: dashboard
src/lib/checklist.ts                     — new: checklist logic (testable)
src/lib/checklist.test.ts                — new
src/app/admin/photos/page.tsx            — new
src/app/admin/layout.tsx                 — modify: Fotos tab
```

---

### Task 1: Migration — schema, buckets, storage RLS

**Files:**
- Create: `supabase/migrations/004_photos.sql`
- Modify: `src/types/database.ts`

**Interfaces:**
- Produces: `site_photos` table, `profiles.avatar_url`, buckets `avatars` + `photos`
- Produces types: `SitePhoto = { id, section, storage_path, caption, display_order, created_at }`, `Profile.avatar_url: string | null`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/004_photos.sql`:

```sql
-- avatar on profiles
alter table public.profiles add column avatar_url text;

-- site photos (galleries + hero)
create table public.site_photos (
  id            uuid        primary key default gen_random_uuid(),
  section       text        not null check (section in ('house','cars','hero')),
  storage_path  text        not null,
  caption       text,
  display_order integer     not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.site_photos enable row level security;

create policy "site_photos: read all"     on public.site_photos for select to authenticated using (true);
create policy "site_photos: admin insert" on public.site_photos for insert to authenticated with check (public.is_admin());
create policy "site_photos: admin update" on public.site_photos for update to authenticated using (public.is_admin());
create policy "site_photos: admin delete" on public.site_photos for delete to authenticated using (public.is_admin());

-- storage buckets
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('photos',  'photos',  true);

-- avatars bucket: public read; users write only in their own folder
create policy "avatars read"   on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- photos bucket: public read; admin write
create policy "photos read"   on storage.objects for select using (bucket_id = 'photos');
create policy "photos insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.is_admin());
create policy "photos update" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and public.is_admin());
create policy "photos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.is_admin());
```

- [ ] **Step 2: Run it in Supabase**

Dashboard → SQL Editor → New query → paste → Run. Expected: "Success. No rows returned."
Verify: Table Editor shows `site_photos`; Storage shows `avatars` and `photos` buckets.

- [ ] **Step 3: Update types**

In `src/types/database.ts`, add `avatar_url: string | null` to `Profile` after `avatar_color`, and append:

```ts
export type SitePhoto = {
  id: string
  section: 'house' | 'cars' | 'hero'
  storage_path: string
  caption: string | null
  display_order: number
  created_at: string
}
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/004_photos.sql src/types/database.ts
git commit -m "feat: add site_photos schema, avatar_url, and storage buckets with RLS"
```

---

### Task 2: Image helpers + i18n strings

**Files:**
- Create: `src/lib/image-resize.ts`, `src/lib/image-resize.test.ts`, `src/lib/photos.ts`
- Modify: `src/lib/i18n/pt.json`, `src/lib/i18n/en.json`

**Interfaces:**
- Produces: `scaledDimensions(w, h, maxDim): {width, height}`; `resizeImage(file: File, maxDim: number): Promise<Blob>` (throws `Error('invalid-file')` for non-images/oversized)
- Produces: `publicUrl(bucket, path): string`; `uploadAvatar(userId, file): Promise<string>` (returns public URL); `uploadSitePhoto(section, file): Promise<void>`; `listSitePhotos(section): Promise<SitePhoto[]>`; `deleteSitePhoto(photo: SitePhoto): Promise<void>`
- Produces i18n keys: `profile.*`, `home.checklist_*`, `home.facts_*`, `admin.photos*`

- [ ] **Step 1: Write failing test**

Create `src/lib/image-resize.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { scaledDimensions } from './image-resize'

describe('scaledDimensions', () => {
  it('keeps small images unchanged', () => {
    expect(scaledDimensions(300, 200, 400)).toEqual({ width: 300, height: 200 })
  })
  it('scales down landscape by width', () => {
    expect(scaledDimensions(3200, 1600, 1600)).toEqual({ width: 1600, height: 800 })
  })
  it('scales down portrait by height', () => {
    expect(scaledDimensions(1000, 4000, 400)).toEqual({ width: 100, height: 400 })
  })
  it('rounds to integers', () => {
    expect(scaledDimensions(1001, 333, 400)).toEqual({ width: 400, height: 133 })
  })
})
```

- [ ] **Step 2: Run — expect FAIL** (`scaledDimensions` not found): `npm test`

- [ ] **Step 3: Implement**

Create `src/lib/image-resize.ts`:

```ts
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024

export function scaledDimensions(width: number, height: number, maxDim: number) {
  if (width <= maxDim && height <= maxDim) return { width, height }
  const scale = maxDim / Math.max(width, height)
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

export async function resizeImage(file: File, maxDim: number): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.size > MAX_UPLOAD_BYTES) {
    throw new Error('invalid-file')
  }
  const bitmap = await createImageBitmap(file)
  const { width, height } = scaledDimensions(bitmap.width, bitmap.height, maxDim)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height)
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('invalid-file'))), 'image/jpeg', 0.85)
  )
}
```

- [ ] **Step 4: Run — expect PASS**: `npm test`

- [ ] **Step 5: Create storage helpers**

Create `src/lib/photos.ts`:

```ts
import { supabase } from './supabase'
import { resizeImage } from './image-resize'
import type { SitePhoto } from '@/types/database'

export function publicUrl(bucket: string, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const blob = await resizeImage(file, 400)
  const path = `${userId}/avatar.jpg`
  const { error } = await supabase.storage.from('avatars')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
  if (error) throw error
  // cache-bust because the path is reused on every re-upload
  const url = `${publicUrl('avatars', path)}?v=${Date.now()}`
  const { error: dbError } = await supabase.from('profiles')
    .update({ avatar_url: url }).eq('id', userId)
  if (dbError) throw dbError
  return url
}

export async function uploadSitePhoto(section: SitePhoto['section'], file: File): Promise<void> {
  const blob = await resizeImage(file, 1600)
  const path = `${section}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from('photos')
    .upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  const { error: dbError } = await supabase.from('site_photos')
    .insert({ section, storage_path: path })
  if (dbError) throw dbError
}

export async function listSitePhotos(section: SitePhoto['section']): Promise<SitePhoto[]> {
  const { data } = await supabase.from('site_photos')
    .select('*').eq('section', section).order('display_order')
  return data ?? []
}

export async function deleteSitePhoto(photo: SitePhoto): Promise<void> {
  await supabase.storage.from('photos').remove([photo.storage_path])
  await supabase.from('site_photos').delete().eq('id', photo.id)
}
```

- [ ] **Step 6: Add i18n strings**

In `src/lib/i18n/pt.json` add to `nav`: `"profile": "Meu Perfil"`. Add new top-level sections:

```json
"profile": {
  "title": "Meu Perfil",
  "photo": "Foto",
  "upload": "Enviar foto",
  "uploading": "Enviando...",
  "name": "Nome",
  "color": "Cor do avatar",
  "save": "Salvar",
  "saved": "Salvo!",
  "invalid_file": "Arquivo inválido — use uma imagem de até 20 MB"
},
"dashboard": {
  "facts_title": "Informações da viagem",
  "facts_dates": "9 a 18 de outubro de 2026",
  "facts_address": "Solara Resort — 8923 Coconut Breeze Dr, Kissimmee, FL",
  "facts_house_link": "Ver detalhes da casa →",
  "checklist_title": "Falta pouco!",
  "checklist_photo": "📸 Adicione sua foto",
  "checklist_arrival": "✈️ Preencha suas datas de chegada"
}
```

And to the existing `admin` section:

```json
"photos": "Fotos",
"photos_house": "Casa",
"photos_cars": "Carros",
"photos_hero": "Capa",
"photos_upload": "Enviar fotos",
"photos_caption": "Legenda",
"photos_hero_note": "Apenas a primeira foto aparece na página inicial."
```

Mirror all of it in `en.json`:

```json
"profile": {
  "title": "My Profile",
  "photo": "Photo",
  "upload": "Upload photo",
  "uploading": "Uploading...",
  "name": "Name",
  "color": "Avatar color",
  "save": "Save",
  "saved": "Saved!",
  "invalid_file": "Invalid file — use an image up to 20 MB"
},
"dashboard": {
  "facts_title": "Trip info",
  "facts_dates": "October 9–18, 2026",
  "facts_address": "Solara Resort — 8923 Coconut Breeze Dr, Kissimmee, FL",
  "facts_house_link": "See house details →",
  "checklist_title": "Almost there!",
  "checklist_photo": "📸 Add your photo",
  "checklist_arrival": "✈️ Fill in your arrival dates"
},
(admin) "photos": "Photos", "photos_house": "House", "photos_cars": "Cars", "photos_hero": "Cover",
"photos_upload": "Upload photos", "photos_caption": "Caption",
"photos_hero_note": "Only the first photo appears on the home page."
```

- [ ] **Step 7: Verify**: `npm test` (all pass) and `npm run build` (compiles)

- [ ] **Step 8: Commit**

```bash
git add src/lib/image-resize.ts src/lib/image-resize.test.ts src/lib/photos.ts src/lib/i18n/
git commit -m "feat: add image resize + storage helpers and photo i18n strings"
```

---

### Task 3: Avatar photos — AvatarCircle, Nav link, profile page

**Files:**
- Modify: `src/components/AvatarCircle.tsx`, `src/components/Nav.tsx`
- Create: `src/app/profile/page.tsx`

**Interfaces:**
- Consumes: `uploadAvatar(userId, file)` from Task 2; `useAuth()`; `useI18n()`
- Produces: `AvatarCircle` props `{ name, color, avatarUrl?: string | null, size? }`

- [ ] **Step 1: Extend AvatarCircle**

Replace `src/components/AvatarCircle.tsx`:

```tsx
type Size = 'sm' | 'md' | 'lg'

const sizes: Record<Size, string> = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
}

type Props = { name: string; color: string; avatarUrl?: string | null; size?: Size }

export function AvatarCircle({ name, color, avatarUrl, size = 'md' }: Props) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        title={name}
        className={`${sizes[size]} rounded-full object-cover shrink-0 select-none`}
      />
    )
  }
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0 select-none`}
      style={{ backgroundColor: color }}
      title={name}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
```

Then pass `avatarUrl` at every call site (all have a `Profile` in hand):
- `Nav.tsx`: `<AvatarCircle name={profile.name} color={profile.avatar_color} avatarUrl={profile.avatar_url} />`
- `src/app/page.tsx` (missing list): `avatarUrl={p.avatar_url}`
- `src/app/arrivals/page.tsx` (both usages): `avatarUrl={row.avatar_url}`
- `src/components/ActivityCard.tsx`: `avatarUrl={s.profiles.avatar_url}`
- `src/app/admin/users/page.tsx`: `avatarUrl={p.avatar_url}`

- [ ] **Step 2: Nav — avatar links to /profile**

In `src/components/Nav.tsx`, wrap the avatar in a link:

```tsx
<Link href="/profile" title={t.nav.profile}>
  <AvatarCircle name={profile.name} color={profile.avatar_color} avatarUrl={profile.avatar_url} />
</Link>
```

- [ ] **Step 3: Profile page**

Create `src/app/profile/page.tsx`:

```tsx
'use client'
import { useRef, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n/context'
import { supabase } from '@/lib/supabase'
import { uploadAvatar } from '@/lib/photos'
import { AvatarCircle } from '@/components/AvatarCircle'
import { ProtectedRoute } from '@/components/ProtectedRoute'

const AVATAR_COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6',
                       '#ec4899','#14b8a6','#f97316','#06b6d4','#84cc16','#a855f7']

function ProfilePage() {
  const { t } = useI18n()
  const { profile } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null)
  const [name, setName] = useState(profile?.name ?? '')
  const [color, setColor] = useState(profile?.avatar_color ?? AVATAR_COLORS[0])
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  if (!profile) return null

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setBusy(true); setError('')
    try {
      setAvatarUrl(await uploadAvatar(profile.id, file))
    } catch {
      setError(t.profile.invalid_file)
    }
    setBusy(false)
  }

  async function save() {
    setBusy(true)
    await supabase.from('profiles').update({ name, avatar_color: color }).eq('id', profile!.id)
    setBusy(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.profile.title}</h1>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-4">
          <AvatarCircle name={name || profile.name} color={color} avatarUrl={avatarUrl} size="lg" />
          <div>
            <button onClick={() => fileRef.current?.click()} disabled={busy}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
              {busy ? t.profile.uploading : t.profile.upload}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t.profile.name}</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <div>
          <p className="block text-xs text-gray-500 mb-2">{t.profile.color}</p>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 ${color === c ? 'border-gray-900' : 'border-transparent'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={busy}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
            {t.profile.save}
          </button>
          {saved && <span className="text-sm text-green-600">{t.profile.saved}</span>}
        </div>
      </div>
    </div>
  )
}

export default function Profile() {
  return <ProtectedRoute><ProfilePage /></ProtectedRoute>
}
```

- [ ] **Step 4: Verify**: `npm run build` — `/profile` appears in routes. Manual: upload a photo, see it in the nav instantly after reload.

- [ ] **Step 5: Commit**

```bash
git add src/components/AvatarCircle.tsx src/components/Nav.tsx src/app/profile/ \
        src/app/page.tsx src/app/arrivals/page.tsx src/components/ActivityCard.tsx src/app/admin/users/page.tsx
git commit -m "feat: add guest avatar photos with profile page"
```

---

### Task 4: PhotoGallery + InfoPage integration

**Files:**
- Create: `src/components/PhotoGallery.tsx`
- Modify: `src/components/InfoPage.tsx`

**Interfaces:**
- Consumes: `listSitePhotos(section)`, `publicUrl('photos', path)` from Task 2
- Produces: `<PhotoGallery section="house" | "cars" | "hero" />` — renders nothing when section has no photos

- [ ] **Step 1: Create PhotoGallery**

Create `src/components/PhotoGallery.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { listSitePhotos, publicUrl } from '@/lib/photos'
import type { SitePhoto } from '@/types/database'

type Props = { section: SitePhoto['section'] }

export function PhotoGallery({ section }: Props) {
  const [photos, setPhotos] = useState<SitePhoto[]>([])

  useEffect(() => { listSitePhotos(section).then(setPhotos) }, [section])

  if (photos.length === 0) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
      {photos.map(p => {
        const url = publicUrl('photos', p.storage_path)
        return (
          <a key={p.id} href={url} target="_blank" rel="noopener noreferrer" className="block group">
            <img src={url} alt={p.caption ?? ''} loading="lazy"
              className="w-full aspect-[4/3] object-cover rounded-xl group-hover:opacity-90 transition-opacity" />
            {p.caption && <p className="text-xs text-gray-500 mt-1">{p.caption}</p>}
          </a>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Wire into InfoPage**

In `src/components/InfoPage.tsx`, import `PhotoGallery` and render it between the `<h1>` and the markdown, only for slugs that have galleries:

```tsx
import { PhotoGallery } from './PhotoGallery'
// inside InfoPageContent's return, after the <h1>:
{(slug === 'house' || slug === 'cars') && <PhotoGallery section={slug} />}
```

- [ ] **Step 3: Verify**: `npm run build` passes. (Gallery shows nothing until admin uploads photos in Task 6 — correct per spec.)

- [ ] **Step 4: Commit**

```bash
git add src/components/PhotoGallery.tsx src/components/InfoPage.tsx
git commit -m "feat: add photo galleries to house and cars pages"
```

---

### Task 5: Home dashboard

**Files:**
- Create: `src/lib/checklist.ts`, `src/lib/checklist.test.ts`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `listSitePhotos('hero')`, `publicUrl`, existing `Countdown`, i18n `dashboard.*` keys
- Produces: `checklistItems(profile, arrival): ChecklistItem[]` where `ChecklistItem = { key: 'photo' | 'arrival', href: string }`

- [ ] **Step 1: Write failing test**

Create `src/lib/checklist.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { checklistItems } from './checklist'
import type { Profile, Arrival } from '@/types/database'

const profile = (avatar_url: string | null): Profile =>
  ({ id: 'u1', name: 'Ana', is_admin: false, avatar_color: '#fff', avatar_url, created_at: '' })
const arrival = (arrival_date: string | null): Arrival =>
  ({ id: 'a1', user_id: 'u1', arrival_date, departure_date: null, notes: null, updated_at: '' })

describe('checklistItems', () => {
  it('lists both when nothing done', () => {
    expect(checklistItems(profile(null), null).map(i => i.key)).toEqual(['photo', 'arrival'])
  })
  it('omits photo when avatar set', () => {
    expect(checklistItems(profile('http://x/a.jpg'), null).map(i => i.key)).toEqual(['arrival'])
  })
  it('omits arrival when date set', () => {
    expect(checklistItems(profile(null), arrival('2026-10-09')).map(i => i.key)).toEqual(['photo'])
  })
  it('empty when all done', () => {
    expect(checklistItems(profile('http://x/a.jpg'), arrival('2026-10-09'))).toEqual([])
  })
  it('arrival row without date still counts as missing', () => {
    expect(checklistItems(profile('http://x/a.jpg'), arrival(null)).map(i => i.key)).toEqual(['arrival'])
  })
})
```

- [ ] **Step 2: Run — expect FAIL**: `npm test`

- [ ] **Step 3: Implement**

Create `src/lib/checklist.ts`:

```ts
import type { Profile, Arrival } from '@/types/database'

export type ChecklistItem = { key: 'photo' | 'arrival'; href: string }

export function checklistItems(profile: Profile, arrival: Arrival | null): ChecklistItem[] {
  const items: ChecklistItem[] = []
  if (!profile.avatar_url) items.push({ key: 'photo', href: '/profile' })
  if (!arrival?.arrival_date) items.push({ key: 'arrival', href: '/arrivals' })
  return items
}
```

- [ ] **Step 4: Run — expect PASS**: `npm test`

- [ ] **Step 5: Rebuild home page**

Replace the `HomePage` component body in `src/app/page.tsx` (keep imports/export wrapper style):

```tsx
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { listSitePhotos, publicUrl } from '@/lib/photos'
import { checklistItems } from '@/lib/checklist'
import { Countdown } from '@/components/Countdown'
import { AvatarCircle } from '@/components/AvatarCircle'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import type { Profile, Arrival, SitePhoto } from '@/types/database'

function HomePage() {
  const { t } = useI18n()
  const { profile } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [arrivals, setArrivals] = useState<Arrival[]>([])
  const [hero, setHero] = useState<SitePhoto | null>(null)

  useEffect(() => {
    supabase.from('profiles').select('*').then(({ data }) => setProfiles(data ?? []))
    supabase.from('arrivals').select('*').then(({ data }) => setArrivals(data ?? []))
    listSitePhotos('hero').then(ps => setHero(ps[0] ?? null))
  }, [])

  const missing = profiles.filter(
    p => !arrivals.find(a => a.user_id === p.id && a.arrival_date)
  )
  const myArrival = profile ? arrivals.find(a => a.user_id === profile.id) ?? null : null
  const todo = profile ? checklistItems(profile, myArrival) : []
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

- [ ] **Step 6: Verify**: `npm test` (all pass) + `npm run build` + manual check of dashboard layout

- [ ] **Step 7: Commit**

```bash
git add src/lib/checklist.ts src/lib/checklist.test.ts src/app/page.tsx
git commit -m "feat: home dashboard with hero, trip facts, and personal checklist"
```

---

### Task 6: Admin Fotos tab

**Files:**
- Create: `src/app/admin/photos/page.tsx`
- Modify: `src/app/admin/layout.tsx`

**Interfaces:**
- Consumes: `uploadSitePhoto`, `listSitePhotos`, `deleteSitePhoto`, `publicUrl` from Task 2; i18n `admin.photos*`

- [ ] **Step 1: Add tab**

In `src/app/admin/layout.tsx`, add to the `tabs` array:

```tsx
{ href: '/admin/photos', label: t.admin.photos },
```

- [ ] **Step 2: Create admin photos page**

Create `src/app/admin/photos/page.tsx`:

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { supabase } from '@/lib/supabase'
import { uploadSitePhoto, listSitePhotos, deleteSitePhoto, publicUrl } from '@/lib/photos'
import type { SitePhoto } from '@/types/database'

const SECTIONS = ['house', 'cars', 'hero'] as const

export default function AdminPhotosPage() {
  const { t } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)
  const [section, setSection] = useState<SitePhoto['section']>('house')
  const [photos, setPhotos] = useState<SitePhoto[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const labels: Record<SitePhoto['section'], string> = {
    house: t.admin.photos_house, cars: t.admin.photos_cars, hero: t.admin.photos_hero,
  }

  async function load() { setPhotos(await listSitePhotos(section)) }
  useEffect(() => { load() }, [section])

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setBusy(true); setError('')
    try {
      for (const file of files) await uploadSitePhoto(section, file)
    } catch {
      setError(t.profile.invalid_file)
    }
    if (fileRef.current) fileRef.current.value = ''
    setBusy(false)
    load()
  }

  async function saveCaption(photo: SitePhoto, caption: string) {
    await supabase.from('site_photos').update({ caption: caption || null }).eq('id', photo.id)
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= photos.length) return
    const a = photos[index], b = photos[target]
    await supabase.from('site_photos').update({ display_order: target }).eq('id', a.id)
    await supabase.from('site_photos').update({ display_order: index }).eq('id', b.id)
    load()
  }

  async function remove(photo: SitePhoto) {
    if (!confirm(t.common.confirm_delete)) return
    await deleteSitePhoto(photo)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {SECTIONS.map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              section === s ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {labels[s]}
          </button>
        ))}
      </div>

      {section === 'hero' && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
          {t.admin.photos_hero_note}
        </p>
      )}

      <button onClick={() => fileRef.current?.click()} disabled={busy}
        className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
        {busy ? t.profile.uploading : `+ ${t.admin.photos_upload}`}
      </button>
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFiles} className="hidden" />
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {photos.map((p, i) => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 space-y-2">
            <img src={publicUrl('photos', p.storage_path)} alt=""
              className="w-full aspect-[4/3] object-cover rounded-lg" />
            <input defaultValue={p.caption ?? ''} placeholder={t.admin.photos_caption}
              onBlur={e => saveCaption(p, e.target.value)}
              className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400" />
            <div className="flex justify-between">
              <div className="flex gap-1">
                <button onClick={() => move(i, -1)} disabled={i === 0}
                  className="px-2 py-0.5 border border-gray-200 rounded text-xs disabled:opacity-30">↑</button>
                <button onClick={() => move(i, 1)} disabled={i === photos.length - 1}
                  className="px-2 py-0.5 border border-gray-200 rounded text-xs disabled:opacity-30">↓</button>
              </div>
              <button onClick={() => remove(p)}
                className="px-2 py-0.5 border border-red-200 text-red-600 rounded text-xs hover:bg-red-50">✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify**: `npm run build` (all routes incl. `/admin/photos`) + `npm test`

- [ ] **Step 4: Manual end-to-end**

1. `/admin/photos` → upload 2 house photos → visit `/house`, grid shows both
2. Upload hero photo → home shows it above the title
3. As a non-admin (or logged out), verify Supabase rejects direct upload to `photos` bucket
4. Reorder + caption + delete photos, confirm gallery reflects changes

- [ ] **Step 5: Commit and deploy**

```bash
git add src/app/admin/photos/ src/app/admin/layout.tsx
git commit -m "feat: admin photos tab for galleries and hero image"
git push origin main   # auto-deploys via GitHub Actions
```

---

## Self-Review

**Spec coverage:** storage/buckets/RLS → Task 1; resize + helpers + errors → Task 2; avatars & profile & AvatarCircle everywhere → Task 3; galleries on house/cars → Task 4; hero + facts + checklist + social nudge kept → Task 5; admin Fotos tab (upload/caption/reorder/delete/hero note) → Task 6. Testing section: unit tests (resize math, checklist) in Tasks 2 & 5; manual RLS/mobile checks in Task 6. No gaps.

**Type consistency:** `SitePhoto['section']` union used everywhere; `checklistItems(profile, arrival)` matches call site; `uploadAvatar` returns string URL consumed by profile page. Consistent.
