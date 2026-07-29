# Small-World Visual System Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a reusable "it's a small world" cut-paper design system (color tokens, fonts, brand components) and apply it to the three flagship surfaces — login, nav, and home.

**Architecture:** Tailwind v4 `@theme` tokens + `next/font` self-hosted fonts define the palette/type globally. A small kit of presentational components in `src/components/brand/` (TicketCard, ScallopedBadge, BrandButton, SunburstBg) implements the cut-paper look with inline SVG + CSS only. Login, Nav, and Home are restyled to use them. All other pages keep current styling (transitional).

**Tech Stack:** Next.js 16 (static export), Tailwind CSS v4, `next/font/google` (Fredoka, Space Mono, Inter), React 19, Vitest + React Testing Library. No new dependencies.

## Global Constraints

- Palette (exact): cream `#FFF9EF`, navy `#1A2536`, gold `#E5A93C`, coral `#E76F51`, teal `#52A098`, pink `#E8A5A5`
- Fonts: Fredoka (display), Space Mono (ticket labels), Inter (body) — via `next/font/google`, self-hosted at build (no runtime CDN)
- Base = cream page background; navy is "chrome" (nav/hero/headings/footer). NOT full-dark.
- Gold replaces orange as the primary accent on the three flagship surfaces only
- Decorative SVG layers must be `aria-hidden` + `pointer-events-none`
- No behavior/logic/i18n-key changes — purely presentational
- Static export only; existing test suite must stay green; `npm run build` must pass
- Dynamic Tailwind class names (e.g. `bg-${x}`) are forbidden — map to literal classes so the JIT extractor sees them
- Node: `nvm use 22` before any npm command
- Working directory: `/Users/gusfaria/Documents/PROJECTS/Gustavo-Philipe__40-anos`

---

## File Map

```
src/app/globals.css              — modify: @theme tokens, font vars, remove CNA defaults
src/app/layout.tsx               — modify: load 3 next/font families, set body vars
src/components/brand/TicketCard.tsx        — new
src/components/brand/ScallopedBadge.tsx    — new
src/components/brand/BrandButton.tsx       — new
src/components/brand/SunburstBg.tsx        — new
src/components/brand/brand.test.tsx        — new (render smoke tests)
src/app/login/page.tsx           — modify: restyle with badge + ticket card
src/components/Nav.tsx            — modify: navy/gold chrome
src/components/Countdown.tsx      — modify: ticket-stub countdown, gold
src/app/page.tsx                 — modify: hero badge + cut-paper cards
```

---

### Task 1: Design tokens, fonts, and globals cleanup

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces Tailwind utilities: `bg-cream/navy/gold/coral/teal/pink`, `text-*` same, `border-*` same; `font-display`, `font-ticket`, `font-body`
- Produces body defaults: cream background, navy text, Inter body font

- [ ] **Step 1: Replace globals.css**

Replace the entire contents of `src/app/globals.css` with:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --color-cream: #FFF9EF;
  --color-navy: #1A2536;
  --color-gold: #E5A93C;
  --color-coral: #E76F51;
  --color-teal: #52A098;
  --color-pink: #E8A5A5;

  --font-display: var(--font-fredoka);
  --font-ticket: var(--font-space-mono);
  --font-body: var(--font-inter);
}

body {
  background-color: var(--color-cream);
  color: var(--color-navy);
  font-family: var(--font-inter), system-ui, sans-serif;
}
```

(This removes the leftover create-next-app `:root` vars, the `prefers-color-scheme: dark` block, and the `Arial` body font.)

- [ ] **Step 2: Load fonts and set body vars in layout.tsx**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from 'next'
import { Fredoka, Space_Mono, Inter } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/lib/i18n/context'
import { AuthProvider } from '@/lib/auth-context'
import { Nav } from '@/components/Nav'

const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-fredoka' })
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-space-mono' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Partiu Orlando 🌴',
  description: 'Aniversário do Gustavo & Philipe em Orlando',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className={`${fredoka.variable} ${spaceMono.variable} ${inter.variable} min-h-screen`}>
        <I18nProvider>
          <AuthProvider>
            <Nav />
            <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Verify build + tests**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test && npm run build
```

Expected: all existing tests pass; build succeeds. Fonts fetch at build time (network needed for the Google font files during build — this is standard `next/font` behavior).

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: add small-world color tokens and brand fonts, clean up globals"
```

---

### Task 2: Brand component kit

**Files:**
- Create: `src/components/brand/TicketCard.tsx`, `ScallopedBadge.tsx`, `BrandButton.tsx`, `SunburstBg.tsx`
- Create: `src/components/brand/brand.test.tsx`

**Interfaces:**
- Consumes: tokens/fonts from Task 1
- Produces:
  - `<TicketCard label?={string} accent?={'gold'|'coral'|'teal'|'pink'} className?={string}>children</TicketCard>`
  - `<ScallopedBadge className?={string}>children</ScallopedBadge>`
  - `<BrandButton variant?={'primary'|'secondary'} ...buttonProps>children</BrandButton>` (forwards native `<button>` props incl. `type`, `onClick`, `disabled`)
  - `<SunburstBg />` (fixed decorative layer)

- [ ] **Step 1: Write the render smoke tests**

Create `src/components/brand/brand.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TicketCard } from './TicketCard'
import { ScallopedBadge } from './ScallopedBadge'
import { BrandButton } from './BrandButton'
import { SunburstBg } from './SunburstBg'

describe('brand components', () => {
  it('TicketCard renders its label and children', () => {
    render(<TicketCard label="BOARDING PASS">hello</TicketCard>)
    expect(screen.getByText('BOARDING PASS')).toBeInTheDocument()
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('ScallopedBadge renders children', () => {
    render(<ScallopedBadge>PARTIU</ScallopedBadge>)
    expect(screen.getByText('PARTIU')).toBeInTheDocument()
  })

  it('BrandButton forwards clicks and type', () => {
    const onClick = vi.fn()
    render(<BrandButton type="submit" onClick={onClick}>Go</BrandButton>)
    const btn = screen.getByRole('button', { name: 'Go' })
    expect(btn).toHaveAttribute('type', 'submit')
    btn.click()
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('SunburstBg is decorative (aria-hidden)', () => {
    const { container } = render(<SunburstBg />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test
```

Expected: FAIL — the brand modules don't exist yet.

- [ ] **Step 3: Create TicketCard**

Create `src/components/brand/TicketCard.tsx`:

```tsx
type Accent = 'gold' | 'coral' | 'teal' | 'pink'

const DOT: Record<Accent, string> = {
  gold: 'bg-gold', coral: 'bg-coral', teal: 'bg-teal', pink: 'bg-pink',
}

type Props = {
  label?: string
  accent?: Accent
  className?: string
  children: React.ReactNode
}

export function TicketCard({ label, accent = 'gold', className = '', children }: Props) {
  return (
    <div className={`relative bg-white rounded-2xl border border-navy/10 shadow-[0_4px_0_rgba(26,37,54,0.08)] ${className}`}>
      {label && (
        <div className="font-ticket text-xs uppercase tracking-widest text-navy/60 px-4 py-2 border-b border-dashed border-navy/20 flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${DOT[accent]}`} />
          {label}
        </div>
      )}
      <div className="p-4">{children}</div>
      <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-cream" aria-hidden="true" />
      <span className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-cream" aria-hidden="true" />
    </div>
  )
}
```

- [ ] **Step 4: Create ScallopedBadge**

Create `src/components/brand/ScallopedBadge.tsx`:

```tsx
type Props = { className?: string; children: React.ReactNode }

// Arch/stamp badge: navy fill, thick cream border, inner dashed ring.
export function ScallopedBadge({ className = '', children }: Props) {
  return (
    <div className={`relative inline-block bg-navy text-cream rounded-[2.5rem] rounded-b-3xl border-4 border-cream shadow-[0_6px_0_rgba(26,37,54,0.25)] ${className}`}>
      <div className="m-2 rounded-[2rem] rounded-b-2xl border border-dashed border-cream/40 px-8 py-6 text-center">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create BrandButton**

Create `src/components/brand/BrandButton.tsx`:

```tsx
type Variant = 'primary' | 'secondary'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-gold text-navy hover:brightness-105 shadow-[0_4px_0_rgba(26,37,54,0.25)] active:translate-y-0.5 active:shadow-[0_2px_0_rgba(26,37,54,0.25)]',
  secondary: 'bg-transparent text-navy border-2 border-navy hover:bg-navy hover:text-cream',
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }

export function BrandButton({ variant = 'primary', className = '', children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`font-display font-semibold rounded-full px-5 py-2.5 transition-all disabled:opacity-50 disabled:active:translate-y-0 ${VARIANT[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 6: Create SunburstBg**

Create `src/components/brand/SunburstBg.tsx`:

```tsx
// Decorative cut-paper layer: gold sunburst, starbursts, palm silhouette.
// Absolutely positioned, non-interactive, hidden from a11y tree.
export function SunburstBg() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* gold sunburst, top-right */}
      <svg className="absolute -top-16 -right-16 w-64 h-64 opacity-20" viewBox="0 0 100 100">
        <g fill="var(--color-gold)">
          {Array.from({ length: 16 }).map((_, i) => (
            <rect key={i} x="49" y="0" width="2" height="50"
              transform={`rotate(${i * 22.5} 50 50)`} />
          ))}
          <circle cx="50" cy="50" r="8" />
        </g>
      </svg>
      {/* starbursts */}
      <svg className="absolute top-1/3 left-6 w-10 h-10 opacity-30" viewBox="0 0 24 24" fill="var(--color-pink)">
        <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
      </svg>
      <svg className="absolute bottom-24 right-10 w-8 h-8 opacity-30" viewBox="0 0 24 24" fill="var(--color-teal)">
        <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
      </svg>
      {/* palm silhouette, bottom-left */}
      <svg className="absolute -bottom-4 -left-4 w-40 h-40 opacity-15" viewBox="0 0 100 100" fill="var(--color-teal)">
        <path d="M50 100 C48 70 48 55 50 45 C52 55 52 70 50 100 Z" />
        <path d="M50 45 C40 30 25 28 15 34 C28 30 40 36 50 45 Z" />
        <path d="M50 45 C60 30 75 28 85 34 C72 30 60 36 50 45 Z" />
        <path d="M50 45 C42 28 42 15 48 6 C46 18 50 34 50 45 Z" />
      </svg>
    </div>
  )
}
```

- [ ] **Step 7: Run tests to confirm they pass**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test
```

Expected: PASS (4 new brand tests + existing suite).

- [ ] **Step 8: Verify build**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm run build
```

Expected: build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/components/brand/
git commit -m "feat: add cut-paper brand component kit (ticket, badge, button, sunburst)"
```

---

### Task 3: Restyle login + Nav

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/components/Nav.tsx`

**Interfaces:**
- Consumes: `ScallopedBadge`, `TicketCard`, `BrandButton`, `SunburstBg` from Task 2; tokens/fonts from Task 1
- No prop/behavior changes to either component (same auth flow, same i18n, same nav links/logic)

- [ ] **Step 1: Restyle the login page**

Replace `src/app/login/page.tsx` with:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n/context'
import { ScallopedBadge } from '@/components/brand/ScallopedBadge'
import { TicketCard } from '@/components/brand/TicketCard'
import { BrandButton } from '@/components/brand/BrandButton'
import { SunburstBg } from '@/components/brand/SunburstBg'

export default function LoginPage() {
  const { t, lang, setLang } = useI18n()
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(t.login.error)
      setLoading(false)
      return
    }
    router.replace('/')
  }

  return (
    <div className="fixed inset-0 bg-navy flex items-center justify-center px-4 overflow-hidden">
      <SunburstBg />
      <div className="relative w-full max-w-sm">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
            className="font-ticket text-xs text-cream/60 hover:text-cream border border-cream/30 rounded px-2 py-1"
          >
            {lang === 'pt' ? 'EN' : 'PT'}
          </button>
        </div>

        <div className="flex justify-center mb-6">
          <ScallopedBadge>
            <p className="font-display text-3xl font-bold text-gold leading-tight">PARTIU<br />ORLANDO</p>
            <p className="font-ticket text-cream text-lg mt-1">40 + 45</p>
            <p className="font-ticket text-cream/60 text-[10px] tracking-widest mt-1">A FAMILY ADVENTURE · EST. 2026</p>
          </ScallopedBadge>
        </div>

        <TicketCard label={t.login.title} accent="gold">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-ticket text-xs uppercase tracking-wide text-navy/60 mb-1">{t.login.email}</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
                className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block font-ticket text-xs uppercase tracking-wide text-navy/60 mb-1">{t.login.password}</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            {error && <p className="text-coral text-sm">{error}</p>}
            <BrandButton type="submit" disabled={loading} className="w-full">
              {loading ? '...' : t.login.submit}
            </BrandButton>
          </form>
        </TicketCard>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Restyle the Nav**

In `src/components/Nav.tsx`, change ONLY the presentational classes (keep all logic, links, state, i18n, and the `if (!profile) return null` guard). Apply these exact edits:

Replace the `<nav>` opening tag and logo:

```tsx
    <nav className="bg-navy border-b-4 border-gold sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="font-display font-bold text-cream text-lg whitespace-nowrap">
          🏰 Partiu Orlando
        </Link>
```

Replace the desktop `linkClass` helper's returned classes so active = gold, idle = cream:

```tsx
  const linkClass = (href: string) =>
    `text-sm transition-colors ${
      pathname === href || (href !== '/' && pathname.startsWith(href))
        ? 'text-gold font-semibold'
        : 'text-cream/70 hover:text-cream'
    }`
```

Replace the language toggle button classes:

```tsx
          <button
            onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
            className="font-ticket text-xs text-cream/60 hover:text-cream border border-cream/30 rounded px-2 py-1"
          >
            {lang === 'pt' ? 'EN' : 'PT'}
          </button>
```

Replace the desktop logout button classes:

```tsx
          <button
            onClick={signOut}
            className="hidden md:block text-sm text-cream/60 hover:text-cream"
          >
            {t.nav.logout}
          </button>
```

Replace the hamburger `svg` color class `text-gray-600` → `text-cream`, and the mobile dropdown container:

```tsx
        <div className="md:hidden border-t border-cream/10 px-4 py-3 flex flex-col gap-3 bg-navy">
```

and the mobile logout button classes:

```tsx
          <button onClick={signOut} className="text-sm text-cream/60 text-left pt-1 border-t border-cream/10">
            {t.nav.logout}
          </button>
```

(The `AvatarCircle` inside the nav is unchanged.)

- [ ] **Step 3: Verify tests + build**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test && npm run build
```

Expected: all tests pass; build succeeds; `/login` compiles.

- [ ] **Step 4: Manual check** (skip if no browser; note as concern)

Login page shows navy backdrop, floating decorations, the arch badge, and a ticket-stub form. Nav is navy with a gold underline, gold active link, cream text; mobile menu opens navy.

- [ ] **Step 5: Commit**

```bash
git add src/app/login/page.tsx src/components/Nav.tsx
git commit -m "feat: restyle login and nav with small-world brand system"
```

---

### Task 4: Restyle home + countdown, then deploy

**Files:**
- Modify: `src/components/Countdown.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `ScallopedBadge`, `TicketCard` from Task 2; tokens/fonts
- `daysUntilTrip` export and all home data logic unchanged

- [ ] **Step 1: Restyle the Countdown**

Replace `src/components/Countdown.tsx` with (keeping `daysUntilTrip` identical so its tests still pass):

```tsx
'use client'
import { useI18n } from '@/lib/i18n/context'

const TRIP_START = new Date('2026-10-09T00:00:00')

export function daysUntilTrip(now: Date): number {
  const diff = TRIP_START.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function Countdown() {
  const { t } = useI18n()
  const days = daysUntilTrip(new Date())

  return (
    <div className="text-center py-6">
      <div className="font-display text-8xl font-bold text-gold leading-none">{days}</div>
      <div className="font-ticket text-sm uppercase tracking-widest text-cream/70 mt-2">
        {t.home.countdown_label}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Restyle the home page**

Replace `src/app/page.tsx` with (data logic identical to current; only presentation changes — hero in a navy panel with the badge + countdown, the three info blocks become `TicketCard`s):

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
import { ScallopedBadge } from '@/components/brand/ScallopedBadge'
import { TicketCard } from '@/components/brand/TicketCard'
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
    <div className="max-w-xl mx-auto space-y-4">
      <div className="relative bg-navy rounded-3xl overflow-hidden px-6 pt-8 pb-6 text-center">
        {hero && (
          <img src={publicUrl('photos', hero.storage_path)} alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-25" />
        )}
        <div className="relative">
          <div className="flex justify-center mb-2">
            <ScallopedBadge>
              <p className="font-display text-2xl font-bold text-gold leading-tight">PARTIU ORLANDO</p>
              <p className="font-ticket text-cream text-base mt-1">40 + 45</p>
            </ScallopedBadge>
          </div>
          <Countdown />
        </div>
      </div>

      <TicketCard label={t.dashboard.facts_title} accent="teal">
        <p className="text-sm text-navy/80">🗓️ {t.dashboard.facts_dates}</p>
        <p className="text-sm text-navy/80 mt-1">📍 {t.dashboard.facts_address}</p>
        <Link href="/house" className="inline-block font-display text-sm text-gold hover:brightness-110 font-semibold mt-2">
          {t.dashboard.facts_house_link}
        </Link>
      </TicketCard>

      {todo.length > 0 && (
        <TicketCard label={t.dashboard.checklist_title} accent="gold">
          <div className="space-y-1.5">
            {todo.map(item => (
              <Link key={item.key} href={item.href}
                className="block text-sm text-navy/80 hover:text-gold">
                {checklistLabels[item.key]}
              </Link>
            ))}
          </div>
        </TicketCard>
      )}

      {missing.length > 0 && (
        <TicketCard label={t.home.arrivals_prompt} accent="coral">
          <div className="flex flex-wrap gap-3">
            {missing.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <AvatarCircle name={p.name} color={p.avatar_color} avatarUrl={p.avatar_url} size="sm" />
                <span className="text-sm text-navy/80">{p.name}</span>
              </div>
            ))}
          </div>
        </TicketCard>
      )}
    </div>
  )
}

export default function Home() {
  return <ProtectedRoute><HomePage /></ProtectedRoute>
}
```

- [ ] **Step 3: Verify tests + build**

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npm test && npm run build
```

Expected: all tests pass (incl. the unchanged `daysUntilTrip` tests) and build succeeds with all routes.

- [ ] **Step 4: Manual end-to-end** (skip if no browser; note as concern)

Home shows a navy hero panel with the arch badge + gold ticket countdown, then teal/gold/coral ticket-stub cards for facts, checklist, and the arrivals nudge. Other pages still render (with the new navy nav on top).

- [ ] **Step 5: Commit and deploy**

```bash
git add src/components/Countdown.tsx src/app/page.tsx
git commit -m "feat: restyle home with small-world hero, countdown, and ticket cards"
git push origin main   # auto-deploys via GitHub Actions
```

---

## Self-Review

**Spec coverage:** tokens + fonts + globals cleanup → Task 1; the four brand components (TicketCard, ScallopedBadge, BrandButton, SunburstBg) → Task 2; login + Nav restyle → Task 3; home hero + ticket countdown + cut-paper cards → Task 4. Cream-base/navy-chrome, gold-replaces-orange, decorative layers aria-hidden, no logic/i18n change, static-export safe — all honored. Out-of-scope pages and future PRD sections correctly untouched.

**Type consistency:** `TicketCard` props (`label?`, `accent?: 'gold'|'coral'|'teal'|'pink'`, `className?`, `children`) are used identically in login and home. `BrandButton` spreads native button props so `type="submit"`/`disabled` work in the login form. `ScallopedBadge` (`className?`, `children`) used in login + home. `SunburstBg` (no props) used in login. `daysUntilTrip` signature unchanged, so `Countdown.test.ts` stays green. Tailwind accent classes are literal (`bg-gold`/`bg-coral`/`bg-teal`/`bg-pink` via the `DOT` record) so the JIT extractor sees them — no dynamic class names.
```
