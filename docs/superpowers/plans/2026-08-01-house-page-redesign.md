# House Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Give `/house` its own layout — title → key info (address/dates/rooms) → compact swipeable photo carousel → the rest of the content — by splitting the existing markdown on the first `---` and rendering a new dependency-free carousel.

**Architecture:** A pure `splitOnFirstHr` helper divides the house markdown at its first horizontal rule. A new `PhotoCarousel` (index-based, reuses `listSitePhotos`/`publicUrl`) replaces the grid for house. A new `HouseContent` component composes title → top markdown → carousel → bottom markdown, and `house/page.tsx` renders it instead of the shared `InfoPage`. Cars/Explore keep `InfoPage` unchanged.

**Tech Stack:** Next.js 16 static export, Tailwind v4, existing brand tokens/components, Vitest. No new dependencies.

## Global Constraints

- Presentational/layout feature — no schema changes, no new admin fields, no i18n key changes (reuse `t.common.loading` / `t.common.no_data`).
- Carousel: one photo at a time, `h-64` mobile / `md:h-80`, `object-cover`, `rounded-2xl border border-navy/10`; gold prev/next arrows + gold/navy dots; swipe on touch; tap opens full-size in a new tab; renders nothing when the section has no photos.
- Split on the first line equal to `---` (trimmed). No `---` → all content is the "before" part, empty "after".
- Reuse existing helpers `listSitePhotos(section)` and `publicUrl('photos', path)`; do not add a new data layer.
- No dynamic Tailwind class names. Existing tests stay green; `npm run build` passes after each task.
- Node: `export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22` before any npm command (Node 22 required; older Node makes vitest error spuriously). Working dir: `/Users/gusfaria/Documents/PROJECTS/Gustavo-Philipe__40-anos`. Branch `feat/small-world-rollout`. Do NOT push.

---

### Task 1: `splitOnFirstHr` helper (TDD)

**Files:**
- Create: `src/lib/markdown-split.ts`, `src/lib/markdown-split.test.ts`

**Interfaces:**
- Produces: `splitOnFirstHr(markdown: string): { before: string; after: string }`

- [ ] **Step 1: Write the failing test**

Create `src/lib/markdown-split.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { splitOnFirstHr } from './markdown-split'

describe('splitOnFirstHr', () => {
  it('splits on the first --- line', () => {
    expect(splitOnFirstHr('# A\ntop\n---\nbottom')).toEqual({ before: '# A\ntop', after: 'bottom' })
  })
  it('returns the whole string as before when no --- exists', () => {
    expect(splitOnFirstHr('# A\njust content')).toEqual({ before: '# A\njust content', after: '' })
  })
  it('splits on the FIRST --- only (keeps later --- in after)', () => {
    expect(splitOnFirstHr('a\n---\nb\n---\nc')).toEqual({ before: 'a', after: 'b\n---\nc' })
  })
  it('trims surrounding whitespace on both parts', () => {
    expect(splitOnFirstHr('  top  \n---\n  bottom  ')).toEqual({ before: 'top', after: 'bottom' })
  })
  it('handles empty input', () => {
    expect(splitOnFirstHr('')).toEqual({ before: '', after: '' })
  })
})
```

- [ ] **Step 2: Run test — expect FAIL** (`splitOnFirstHr` not found)

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test
```

- [ ] **Step 3: Implement**

Create `src/lib/markdown-split.ts`:

```ts
export function splitOnFirstHr(markdown: string): { before: string; after: string } {
  const lines = markdown.split('\n')
  const idx = lines.findIndex(l => l.trim() === '---')
  if (idx === -1) return { before: markdown.trim(), after: '' }
  return {
    before: lines.slice(0, idx).join('\n').trim(),
    after: lines.slice(idx + 1).join('\n').trim(),
  }
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test
```

Expected: the 5 new tests pass, plus the existing suite (46) still green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/markdown-split.ts src/lib/markdown-split.test.ts
git commit -m "feat: add splitOnFirstHr markdown helper"
```

---

### Task 2: `PhotoCarousel` component

**Files:**
- Create: `src/components/PhotoCarousel.tsx`

**Interfaces:**
- Consumes: `listSitePhotos(section)`, `publicUrl('photos', path)`, `SitePhoto` type
- Produces: `<PhotoCarousel section="house" | "cars" | "hero" />`

- [ ] **Step 1: Create the carousel**

Create `src/components/PhotoCarousel.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { listSitePhotos, publicUrl } from '@/lib/photos'
import type { SitePhoto } from '@/types/database'

type Props = { section: SitePhoto['section'] }

export function PhotoCarousel({ section }: Props) {
  const [photos, setPhotos] = useState<SitePhoto[]>([])
  const [i, setI] = useState(0)
  const [touchX, setTouchX] = useState<number | null>(null)

  useEffect(() => { listSitePhotos(section).then(ps => { setPhotos(ps); setI(0) }) }, [section])

  if (photos.length === 0) return null

  const go = (n: number) => setI(prev => (prev + n + photos.length) % photos.length)
  const photo = photos[i]
  const url = publicUrl('photos', photo.storage_path)

  return (
    <div>
      <div className="relative"
        onTouchStart={e => setTouchX(e.touches[0].clientX)}
        onTouchEnd={e => {
          if (touchX === null) return
          const dx = e.changedTouches[0].clientX - touchX
          if (dx > 40) go(-1)
          else if (dx < -40) go(1)
          setTouchX(null)
        }}>
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          <img src={url} alt={photo.caption ?? ''}
            className="w-full h-64 md:h-80 object-cover rounded-2xl border border-navy/10" />
        </a>
        {photos.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gold text-navy text-xl font-bold shadow-[0_2px_0_rgba(26,37,54,0.25)] hover:brightness-105 flex items-center justify-center">‹</button>
            <button type="button" onClick={() => go(1)} aria-label="próximo"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gold text-navy text-xl font-bold shadow-[0_2px_0_rgba(26,37,54,0.25)] hover:brightness-105 flex items-center justify-center">›</button>
          </>
        )}
      </div>
      {photo.caption && <p className="text-xs text-navy/60 mt-1 font-ticket text-center">{photo.caption}</p>}
      {photos.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {photos.map((p, n) => (
            <button key={p.id} type="button" onClick={() => setI(n)} aria-label={`foto ${n + 1}`}
              className={`w-2 h-2 rounded-full transition-colors ${n === i ? 'bg-gold' : 'bg-navy/20 hover:bg-navy/40'}`} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm run build
```

Expected: compiles (component not yet wired into a page, but must typecheck).

- [ ] **Step 3: Commit**

```bash
git add src/components/PhotoCarousel.tsx
git commit -m "feat: add dependency-free PhotoCarousel component"
```

---

### Task 3: `HouseContent` + wire into /house

**Files:**
- Create: `src/components/HouseContent.tsx`
- Modify: `src/app/house/page.tsx`

**Interfaces:**
- Consumes: `splitOnFirstHr` (Task 1), `PhotoCarousel` (Task 2), `MarkdownRenderer`, `ProtectedRoute`, `supabase`, `useI18n`, `InfoPage` DB type

- [ ] **Step 1: Create HouseContent**

Create `src/components/HouseContent.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n/context'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { PhotoCarousel } from '@/components/PhotoCarousel'
import { splitOnFirstHr } from '@/lib/markdown-split'
import type { InfoPage as InfoPageType } from '@/types/database'

function HouseContentInner() {
  const { t } = useI18n()
  const [page, setPage] = useState<InfoPageType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('info_pages').select('*').eq('slug', 'house').single()
      .then(({ data }) => { setPage(data); setLoading(false) })
  }, [])

  if (loading) return <p className="text-navy/50">{t.common.loading}</p>

  const content = page?.content ?? ''
  const { before, after } = splitOnFirstHr(content)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold font-display text-navy mb-6">{page?.title ?? 'A Casa'}</h1>
      {content
        ? <MarkdownRenderer content={before} />
        : <p className="text-navy/50">{t.common.no_data}</p>}
      <div className="my-6"><PhotoCarousel section="house" /></div>
      {after && <MarkdownRenderer content={after} />}
    </div>
  )
}

export function HouseContent() {
  return <ProtectedRoute><HouseContentInner /></ProtectedRoute>
}
```

- [ ] **Step 2: Wire the house page**

Replace `src/app/house/page.tsx`:

```tsx
import { HouseContent } from '@/components/HouseContent'

export default function HousePage() {
  return <HouseContent />
}
```

- [ ] **Step 3: Verify tests + build**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test && npm run build
```

Expected: all tests pass; build compiles `/house`. Cars/Explore still use `InfoPage` (unchanged), so they still show the grid gallery.

- [ ] **Step 4: Manual check** (skip if no browser; note as concern)

`/house` shows title → address/dates/rooms → carousel (arrows on desktop, swipe on mobile, dots, tap opens full-size) → resort blurb. `/cars` and `/explore` unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/components/HouseContent.tsx src/app/house/page.tsx
git commit -m "feat: house page with key info on top and photo carousel"
```

---

## Post-implementation content step (controller, not a subagent)

After Task 3 is reviewed and merged into the working tree, the controller inserts a `---` divider into the live `house` info_page content (via the Supabase REST API with the admin session, the same method used to seed it) between the facts section (`## 🏠 Sobre a casa`) and the resort blurb (`## ℹ️ Sobre o Solara Resort`), so the carousel lands between them. The code already works without it (no `---` → content renders above an empty-or-photo carousel at the bottom), so this is a content nicety, not a code dependency.

---

## Self-Review

**Spec coverage:** split-on-`---` → Task 1 (`splitOnFirstHr`, tested); carousel (compact height, arrows, dots, swipe, tap-to-newtab, nothing-when-empty) → Task 2 (`PhotoCarousel`); house layout (title → before → carousel → after), own component replacing InfoPage, cars/explore untouched → Task 3; content `---` insertion → the controller post-step. Edge cases (no photos, no content, single photo, no `---`) are handled: carousel returns null with 0 photos and hides arrows/dots with 1; no content shows `no_data`; no `---` puts everything in `before`.

**Type consistency:** `splitOnFirstHr(markdown: string): { before: string; after: string }` is defined in Task 1 and consumed identically in Task 3. `PhotoCarousel`'s `section` prop is `SitePhoto['section']` (Task 2), passed `"house"` in Task 3. `listSitePhotos`/`publicUrl` signatures match their existing definitions in `src/lib/photos.ts`. No i18n keys added; `t.common.loading`/`t.common.no_data` already exist.
