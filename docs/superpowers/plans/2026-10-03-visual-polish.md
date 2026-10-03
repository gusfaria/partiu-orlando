# Visual Polish ("Crest & Passport") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle every page of Partiu Orlando with the approved "Crest & Passport" polish (boarding-pass home, ticket cards, passport profile) without changing any data, behavior, or existing copy.

**Architecture:** First a small shared kit in `src/components/brand/` (PageHeader, BrandButton variants, FilterChip, TicketBand, TicketLegs, SplitFlap, BoardingPass, Crest, NavyCard), a few literal class-string constants, and small pure helpers in `src/lib/` (date parts, flap stepping, MRZ line, activity meta). Each page task then swaps its markup onto the kit. No queries, routes, or state logic change.

**Tech Stack:** Next.js 16 (static export, client components), React 19, Tailwind CSS v4 (`@theme` tokens in `globals.css`, no config file), `@tailwindcss/typography`, Vitest 4 + Testing Library (jsdom). Run `nvm use 22` before npm commands.

**Spec:** `docs/superpowers/specs/2026-10-03-visual-polish-design.md`. Approved mockups are in `.superpowers/brainstorm/32124-1791066726/content/` (`current-plus-c.html`, `pass-and-schedule.html`, `inner-pages-v2.html`, `activities-top-stub.html`, option A).

## Global Constraints

- Presentation only: no changes to Supabase queries, inserts/updates/deletes, routes, RLS, `ProtectedRoute`, or state logic.
- Do not modify `src/components/Nav.tsx`, the 🏰 emoji, fonts (Fredoka `font-display`, Space Mono `font-ticket`, Inter body), or the color tokens in `src/app/globals.css` `@theme`.
- Keep all existing copy. The only new strings are the i18n keys added in Task 1, each in both `pt.json` and `en.json`.
- Tailwind classes must be literal strings. Use lookup `Record`s, never build class names dynamically (e.g. no `` `bg-${x}` ``).
- On white/cream, gold is never used for text (it fails AA). Gold text appears only on navy. Small gray text uses at least `text-navy/70`.
- Every interactive element keeps a visible focus style (`focus-visible:ring-2 focus-visible:ring-gold`).
- Work on branch `feat/visual-polish` off `main`. Commit after every task. End each commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Verification commands: `npm test` (vitest run), `npm run lint`, `npm run build`.

## Review Focus

1. **EN countdown prefix is empty** (`en.json` `home.countdown_prefix` is `""`): the boarding-pass stub must not render an empty line. Covered in Task 4 (BoardingPass test).
2. **Activity with no date, no time, or no cost:** the band shows "—" for the date and the meta has no stray " · ". Covered in Task 2 (`activityMeta` + TicketBand tests).
3. **Arrival with only one side filled, or with no transportation:** the empty leg shows "—", never "undefined"/"Invalid Date", and no "🧳" appears when transportation is empty. Covered in Task 2 (TicketLegs test) and Task 8.
4. **Long text on a 320px phone** (long names, descriptions, car locations, a long MRZ name): no horizontal page scroll. Use `min-w-0`/`truncate` where noted and check by hand in Task 12.
5. **SplitFlap edge cases** (reduced motion, a single code, unmount mid-flip, non-letter characters): static or immediate, with no runaway timers. Covered in Task 3 tests.

---

### Task 1: i18n keys, shared class constants, PageHeader, BrandButton variants, FilterChip

**Files:**
- Modify: `src/lib/i18n/pt.json`, `src/lib/i18n/en.json`
- Create: `src/lib/i18n/parity.test.ts`
- Create: `src/components/brand/styles.ts`
- Create: `src/components/brand/PageHeader.tsx`
- Create: `src/components/brand/FilterChip.tsx`
- Modify: `src/components/brand/BrandButton.tsx`
- Modify: `src/components/brand/brand.test.tsx`

**Interfaces:**
- Produces (i18n): `t.home.boarding_pass`, `t.home.outbound`, `t.home.inbound`, `t.home.outbound_date`, `t.home.inbound_date`, `t.home.destination_city`, `t.itinerary.eyebrow`, `t.arrivals.eyebrow`, `t.activities.eyebrow`, `t.house.eyebrow`, `t.cars.eyebrow`, `t.profile.eyebrow`, `t.profile.passport_title`, `t.profile.traveler`, `t.admin.eyebrow`.
- Produces: `CARD_CLASS`, `META_LABEL_CLASS`, `FIELD_LABEL_CLASS`, `INPUT_CLASS`, `DIVIDER_CLASS` (strings) from `@/components/brand/styles`.
- Produces: `PageHeader({ title: string; eyebrow?: string })`.
- Produces: `BrandButton` with `variant?: 'primary' | 'secondary' | 'quiet' | 'danger-quiet'` (default `'primary'`), spreading native button props.
- Produces: `FilterChip({ label: string; active: boolean; dotClass?: string; onClick: () => void })`.

- [ ] **Step 1: Create the branch**

```bash
git checkout -b feat/visual-polish
```

- [ ] **Step 2: Write the i18n parity test**

Create `src/lib/i18n/parity.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import pt from './pt.json'
import en from './en.json'

function keys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`])
}

describe('i18n', () => {
  it('pt and en have exactly the same keys', () => {
    expect(keys(en).sort()).toEqual(keys(pt).sort())
  })

  it('has the visual-polish keys', () => {
    for (const k of ['home.boarding_pass', 'itinerary.eyebrow', 'house.eyebrow', 'profile.traveler', 'admin.eyebrow']) {
      expect(keys(pt)).toContain(k)
    }
  })
})
```

- [ ] **Step 3: Run it to verify the second test fails**

Run: `npx vitest run src/lib/i18n/parity.test.ts`
Expected: the first test PASSES (keys are in parity today), and "has the visual-polish keys" FAILS.

- [ ] **Step 4: Add the keys to both JSON files**

Run this script from the repo root. It deep-merges and rewrites both files with 2-space indent and a trailing newline:

```bash
node -e '
const fs = require("fs")
const add = {
  pt: {
    home: { boarding_pass: "Cartão de embarque", outbound: "Ida", inbound: "Volta",
            outbound_date: "9 out", inbound_date: "18 out", destination_city: "Orlando" },
    itinerary: { eyebrow: "Out 2026 · 9 → 18" },
    arrivals: { eyebrow: "Quem chega quando" },
    activities: { eyebrow: "Parques & passeios" },
    house: { eyebrow: "Nosso lar em Kissimmee" },
    cars: { eyebrow: "Frota da família" },
    profile: { eyebrow: "Passaporte", passport_title: "Passaporte · Partiu Orlando", traveler: "Viajante" },
    admin: { eyebrow: "Bastidores" },
  },
  en: {
    home: { boarding_pass: "Boarding pass", outbound: "Out", inbound: "Back",
            outbound_date: "Oct 9", inbound_date: "Oct 18", destination_city: "Orlando" },
    itinerary: { eyebrow: "Oct 2026 · 9 → 18" },
    arrivals: { eyebrow: "Who lands when" },
    activities: { eyebrow: "Parks & outings" },
    house: { eyebrow: "Our home in Kissimmee" },
    cars: { eyebrow: "The family fleet" },
    profile: { eyebrow: "Passport", passport_title: "Passport · Partiu Orlando", traveler: "Traveler" },
    admin: { eyebrow: "Backstage" },
  },
}
for (const lang of ["pt", "en"]) {
  const file = `src/lib/i18n/${lang}.json`
  const json = JSON.parse(fs.readFileSync(file, "utf8"))
  for (const [section, entries] of Object.entries(add[lang])) json[section] = { ...(json[section] ?? {}), ...entries }
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n")
}'
```

- [ ] **Step 5: Run the parity test**

Run: `npx vitest run src/lib/i18n/parity.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Write failing tests for PageHeader, FilterChip and BrandButton variants**

Add to `src/components/brand/brand.test.tsx`. Keep the existing tests for now; Task 5 removes the retired ones. Add the imports at the top and this `describe` block at the bottom:

```tsx
import { fireEvent } from '@testing-library/react'
import { PageHeader } from './PageHeader'
import { FilterChip } from './FilterChip'
```

```tsx
describe('visual polish kit', () => {
  it('PageHeader renders title as h1 and the optional eyebrow', () => {
    render(<PageHeader eyebrow="Parques & passeios" title="Atividades" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Atividades' })).toBeInTheDocument()
    expect(screen.getByText('Parques & passeios')).toBeInTheDocument()
  })

  it('PageHeader without eyebrow renders only the title', () => {
    const { container } = render(<PageHeader title="Admin" />)
    expect(container.querySelectorAll('p')).toHaveLength(0)
  })

  it('FilterChip exposes pressed state and fires onClick', () => {
    const onClick = vi.fn()
    render(<FilterChip label="Chegadas" active dotClass="bg-teal" onClick={onClick} />)
    const btn = screen.getByRole('button', { name: 'Chegadas' })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    expect(btn.className).toContain('bg-navy')
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('FilterChip idle has no navy fill', () => {
    render(<FilterChip label="Tudo" active={false} onClick={() => {}} />)
    const btn = screen.getByRole('button', { name: 'Tudo' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    expect(btn.className).not.toContain('bg-navy ')
  })

  it('BrandButton primary is navy with gold text', () => {
    render(<BrandButton>Vou!</BrandButton>)
    expect(screen.getByRole('button', { name: 'Vou!' }).className).toContain('bg-navy text-gold')
  })

  it('BrandButton quiet and danger-quiet render as text links', () => {
    render(<><BrandButton variant="quiet">Editar</BrandButton><BrandButton variant="danger-quiet">Excluir</BrandButton></>)
    expect(screen.getByRole('button', { name: 'Editar' }).className).toContain('font-ticket')
    expect(screen.getByRole('button', { name: 'Excluir' }).className).toContain('text-[#B4361A]')
  })
})
```

- [ ] **Step 7: Run to verify they fail**

Run: `npx vitest run src/components/brand/brand.test.tsx`
Expected: FAIL. Cannot resolve `./PageHeader` / `./FilterChip`.

- [ ] **Step 8: Implement `styles.ts`, `PageHeader`, `FilterChip`, and the `BrandButton` variants**

Create `src/components/brand/styles.ts`:

```ts
// Shared literal class strings (Tailwind must see full class names).
export const CARD_CLASS =
  'relative overflow-hidden bg-white rounded-2xl border border-navy/10 shadow-[0_4px_0_rgba(26,37,54,0.06)]'
export const META_LABEL_CLASS = 'font-ticket text-[10px] uppercase tracking-widest text-navy/70'
export const FIELD_LABEL_CLASS = 'block font-ticket text-[10px] uppercase tracking-widest text-navy/70 mb-1'
export const INPUT_CLASS =
  'w-full bg-white border border-navy/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold'
export const DIVIDER_CLASS = 'border-t border-dashed border-navy/20'
```

Create `src/components/brand/PageHeader.tsx`:

```tsx
type Props = { title: string; eyebrow?: string }

// Mono eyebrow over a Fredoka title, with a gold rule running to the right.
export function PageHeader({ title, eyebrow }: Props) {
  return (
    <header className="mb-6">
      {eyebrow && (
        <p className="font-ticket text-[10px] uppercase tracking-[0.25em] text-navy/70">{eyebrow}</p>
      )}
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-navy">{title}</h1>
        <span aria-hidden="true" className="flex-1 h-0.5 rounded-full bg-gold translate-y-0.5" />
      </div>
    </header>
  )
}
```

Create `src/components/brand/FilterChip.tsx`:

```tsx
type Props = { label: string; active: boolean; dotClass?: string; onClick: () => void }

export function FilterChip({ label, active, dotClass, onClick }: Props) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-ticket text-[11px] uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
        active ? 'bg-navy text-gold border-navy' : 'bg-transparent text-navy border-navy/25 hover:border-navy/50'
      }`}>
      {dotClass && <span aria-hidden="true" className={`w-2 h-2 rounded-full ${dotClass}`} />}
      {label}
    </button>
  )
}
```

Replace `src/components/brand/BrandButton.tsx`:

```tsx
type Variant = 'primary' | 'secondary' | 'quiet' | 'danger-quiet'

const VARIANT: Record<Variant, string> = {
  primary: 'font-display font-semibold rounded-full px-4 py-2 text-sm bg-navy text-gold shadow-[0_3px_0_var(--color-gold)] hover:brightness-125 active:translate-y-0.5 active:shadow-[0_1px_0_var(--color-gold)] disabled:active:translate-y-0',
  secondary: 'font-display font-semibold rounded-full px-4 py-2 text-sm bg-white text-navy border-[1.5px] border-navy hover:bg-navy/5',
  quiet: 'font-ticket text-[11px] uppercase tracking-wider text-navy/70 underline decoration-navy/30 underline-offset-4 hover:text-navy hover:decoration-navy py-1',
  'danger-quiet': 'font-ticket text-[11px] uppercase tracking-wider text-[#B4361A] underline decoration-[#B4361A]/40 underline-offset-4 hover:decoration-[#B4361A] py-1',
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }

export function BrandButton({ variant = 'primary', className = '', children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${VARIANT[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 9: Run the tests**

Run: `npx vitest run src/components/brand src/lib/i18n`
Expected: all PASS, including the pre-existing `BrandButton forwards clicks and type`.

- [ ] **Step 10: Commit**

```bash
git add src/lib/i18n src/components/brand
git commit -m "feat(brand): polish kit — PageHeader, FilterChip, button variants, new i18n keys

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Ticket parts — date helpers, activityMeta, TicketBand, TicketLegs

**Files:**
- Create: `src/lib/ticket-date.ts`, `src/lib/ticket-date.test.ts`
- Create: `src/components/brand/TicketBand.tsx`
- Create: `src/components/brand/TicketLegs.tsx`
- Modify: `src/components/brand/brand.test.tsx`

**Interfaces:**
- Consumes: `META_LABEL_CLASS` from Task 1.
- Produces: `ticketDateParts(date: string, locale: string): { weekday: string; day: string; month: string }`, where `date` is `'YYYY-MM-DD'` and locale is `'pt-BR' | 'en-US'`.
- Produces: `shortDate(date: string, locale: string): string`, e.g. `'09 out'` / `'09 Oct'`.
- Produces: `activityMeta(time: string | null, cost: number | null): string`, e.g. `'09:00 · $ 159.00'`, or `''` when both are null.
- Produces: `TicketBand({ date: string | null; locale: string; meta?: string })`.
- Produces: `type Leg = { label: string; value: string | null; sub?: string | null }` and `TicketLegs({ legs: Leg[] })`.

- [ ] **Step 1: Write failing tests for the helpers**

Create `src/lib/ticket-date.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { ticketDateParts, shortDate, activityMeta } from './ticket-date'

describe('ticketDateParts', () => {
  it('pt-BR: uppercase weekday/month without dots', () => {
    expect(ticketDateParts('2026-10-10', 'pt-BR')).toEqual({ weekday: 'SÁB', day: '10', month: 'OUT' })
  })
  it('en-US', () => {
    expect(ticketDateParts('2026-10-10', 'en-US')).toEqual({ weekday: 'SAT', day: '10', month: 'OCT' })
  })
})

describe('shortDate', () => {
  it('pt-BR → "09 out"', () => expect(shortDate('2026-10-09', 'pt-BR')).toBe('09 out'))
  it('en-US → "09 Oct"', () => expect(shortDate('2026-10-09', 'en-US')).toBe('09 Oct'))
})

describe('activityMeta', () => {
  it('time and cost', () => expect(activityMeta('09:00:00', 159)).toBe('09:00 · $ 159.00'))
  it('only cost', () => expect(activityMeta(null, 0)).toBe('$ 0.00'))
  it('only time', () => expect(activityMeta('14:30:00', null)).toBe('14:30'))
  it('neither → empty string', () => expect(activityMeta(null, null)).toBe(''))
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/lib/ticket-date.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/lib/ticket-date.ts`**

```ts
export type TicketDateParts = { weekday: string; day: string; month: string }

function partsOf(date: string, locale: string, opts: Intl.DateTimeFormatOptions) {
  const parts = new Intl.DateTimeFormat(locale, opts).formatToParts(new Date(date + 'T00:00:00'))
  return (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? ''
}

const stripDot = (s: string) => s.replace('.', '')

// "2026-10-10" → { weekday: 'SÁB', day: '10', month: 'OUT' } for a ticket stub.
export function ticketDateParts(date: string, locale: string): TicketDateParts {
  const get = partsOf(date, locale, { weekday: 'short', day: 'numeric', month: 'short' })
  return {
    weekday: stripDot(get('weekday')).toUpperCase(),
    day: get('day'),
    month: stripDot(get('month')).toUpperCase(),
  }
}

// "2026-10-09" → "09 out" / "09 Oct"
export function shortDate(date: string, locale: string): string {
  const get = partsOf(date, locale, { day: '2-digit', month: 'short' })
  return `${get('day')} ${stripDot(get('month'))}`
}

// Right side of an activity's ticket band: "09:00 · $ 159.00"
export function activityMeta(time: string | null, cost: number | null): string {
  return [
    time ? time.slice(0, 5) : null,
    cost != null ? `$ ${Number(cost).toFixed(2)}` : null,
  ].filter(Boolean).join(' · ')
}
```

- [ ] **Step 4: Run the helper tests**

Run: `npx vitest run src/lib/ticket-date.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Write failing component tests**

Add to `src/components/brand/brand.test.tsx` (imports at the top, block at the bottom):

```tsx
import { TicketBand } from './TicketBand'
import { TicketLegs } from './TicketLegs'
```

```tsx
describe('ticket parts', () => {
  it('TicketBand shows date parts and meta', () => {
    render(<TicketBand date="2026-10-10" locale="pt-BR" meta="09:00 · $ 159.00" />)
    expect(screen.getByText('SÁB')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('OUT')).toBeInTheDocument()
    expect(screen.getByText('09:00 · $ 159.00')).toBeInTheDocument()
  })

  it('TicketBand without a date shows a dash and no meta element when meta is empty', () => {
    const { container } = render(<TicketBand date={null} locale="pt-BR" meta="" />)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(container.textContent).not.toContain('·')
  })

  it('TicketLegs renders one column per leg and a dash for empty values', () => {
    const { container } = render(<TicketLegs legs={[
      { label: '↓ Chegada', value: '09 out', sub: '14:30' },
      { label: '↑ Saída', value: null, sub: '22:10' },
    ]} />)
    expect((container.firstChild as HTMLElement).className).toContain('grid-cols-2')
    expect(screen.getByText('09 out')).toBeInTheDocument()
    expect(screen.getByText('14:30')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByText('22:10')).not.toBeInTheDocument()
  })

  it('TicketLegs supports three legs', () => {
    const { container } = render(<TicketLegs legs={[
      { label: 'Retirada', value: '09 out' }, { label: 'Devolução', value: '18 out' }, { label: 'Assentos', value: '7' },
    ]} />)
    expect((container.firstChild as HTMLElement).className).toContain('grid-cols-3')
  })
})
```

- [ ] **Step 6: Run to verify they fail**

Run: `npx vitest run src/components/brand/brand.test.tsx`
Expected: FAIL, cannot resolve `./TicketBand`.

- [ ] **Step 7: Implement `TicketBand` and `TicketLegs`**

Create `src/components/brand/TicketBand.tsx`:

```tsx
import { ticketDateParts } from '@/lib/ticket-date'

type Props = { date: string | null; locale: string; meta?: string }

// Navy header strip of a ticket card. Ends in a dashed tear line with cream
// notches; the parent card must be `relative overflow-hidden` on a cream page.
export function TicketBand({ date, locale, meta }: Props) {
  const parts = date ? ticketDateParts(date, locale) : null
  return (
    <div className="relative flex items-center justify-between gap-3 bg-navy px-4 py-2.5 text-cream border-b-2 border-dashed border-cream/40">
      {parts ? (
        <span className="flex items-baseline gap-2">
          <span className="font-ticket text-[10px] tracking-widest">{parts.weekday}</span>
          <span className="font-display text-2xl font-bold leading-none text-gold">{parts.day}</span>
          <span className="font-ticket text-[10px] tracking-widest">{parts.month}</span>
        </span>
      ) : (
        <span className="font-ticket text-sm">—</span>
      )}
      {meta && <span className="font-ticket text-[11px] tracking-wider text-right">{meta}</span>}
      <span aria-hidden="true" className="absolute -left-2 -bottom-2 w-4 h-4 rounded-full bg-cream" />
      <span aria-hidden="true" className="absolute -right-2 -bottom-2 w-4 h-4 rounded-full bg-cream" />
    </div>
  )
}
```

Create `src/components/brand/TicketLegs.tsx`:

```tsx
import { META_LABEL_CLASS } from './styles'

export type Leg = { label: string; value: string | null; sub?: string | null }

const COLS: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' }

// Equal cells split by dashed dividers, like the legs of a boarding pass.
export function TicketLegs({ legs }: { legs: Leg[] }) {
  return (
    <div className={`grid ${COLS[legs.length] ?? 'grid-cols-3'} border-t border-dashed border-navy/20 divide-x divide-dashed divide-navy/20`}>
      {legs.map(leg => (
        <div key={leg.label} className="min-w-0 px-4 py-2.5">
          <p className={META_LABEL_CLASS}>{leg.label}</p>
          {leg.value ? (
            <>
              <p className="truncate font-display text-lg font-semibold leading-tight text-navy">{leg.value}</p>
              {leg.sub && <p className="font-ticket text-[11px] text-navy/70">{leg.sub}</p>}
            </>
          ) : (
            <p className="font-display text-lg leading-tight text-navy/30">—</p>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 8: Run all brand + helper tests**

Run: `npx vitest run src/components/brand src/lib/ticket-date.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/ticket-date.ts src/lib/ticket-date.test.ts src/components/brand
git commit -m "feat(brand): ticket band, ticket legs and date helpers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: SplitFlap (flip-board airport codes)

**Files:**
- Create: `src/lib/flap.ts`, `src/lib/flap.test.ts`
- Create: `src/lib/trip-origins.ts`
- Create: `src/components/brand/SplitFlap.tsx`, `src/components/brand/SplitFlap.test.tsx`

**Interfaces:**
- Produces: `nextLetter(c: string): string`, `advanceTowards(current: string, target: string, elapsedMs: number): string`, and `FLAP_TICK_MS = 45`, `FLAP_STAGGER_MS = 120`.
- Produces: `TRIP_ORIGINS: string[] = ['GIG', 'JFK', 'LAX']`, `TRIP_DESTINATION = 'MCO'`.
- Produces: `SplitFlap({ codes: string[]; intervalMs?: number /* 3200 */; tone?: 'dark' | 'gold' })`. The root is `aria-hidden`, so the caller provides screen-reader text.

- [ ] **Step 1: Write failing tests for the pure stepping logic**

Create `src/lib/flap.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { nextLetter, advanceTowards, FLAP_STAGGER_MS } from './flap'

describe('nextLetter', () => {
  it('advances A→B and wraps Z→A', () => {
    expect(nextLetter('A')).toBe('B')
    expect(nextLetter('Z')).toBe('A')
  })
  it('non-letters restart at A', () => expect(nextLetter('3')).toBe('A'))
})

describe('advanceTowards', () => {
  it('only the first letter moves before the stagger delay', () => {
    expect(advanceTowards('GIG', 'JFK', 0)).toBe('HIG')
  })
  it('all letters move once their stagger has passed', () => {
    expect(advanceTowards('GIG', 'JFK', 2 * FLAP_STAGGER_MS)).toBe('HJH')
  })
  it('letters already at target stay put', () => {
    expect(advanceTowards('JFG', 'JFK', 1000)).toBe('JFH')
  })
  it('non-letter target characters are set immediately', () => {
    expect(advanceTowards('ABC', 'A-C', 1000)).toBe('A-C')
  })
  it('length mismatch jumps straight to target', () => {
    expect(advanceTowards('GIG', 'MCOX', 0)).toBe('MCOX')
  })
  it('converges to the target', () => {
    let cur = 'GIG'
    for (let i = 0; i < 40; i++) cur = advanceTowards(cur, 'LAX', 1000)
    expect(cur).toBe('LAX')
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/lib/flap.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/lib/flap.ts` and `src/lib/trip-origins.ts`**

```ts
// src/lib/flap.ts
export const FLAP_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const FLAP_TICK_MS = 45
export const FLAP_STAGGER_MS = 120

export function nextLetter(c: string): string {
  const i = FLAP_ALPHABET.indexOf(c)
  return i === -1 ? FLAP_ALPHABET[0] : FLAP_ALPHABET[(i + 1) % FLAP_ALPHABET.length]
}

// One tick of a split-flap board: each letter i starts flipping after
// i * FLAP_STAGGER_MS and steps one letter per tick until it matches.
export function advanceTowards(current: string, target: string, elapsedMs: number): string {
  if (current.length !== target.length) return target
  return [...current].map((c, i) => {
    const t = target[i]
    if (c === t) return c
    if (!FLAP_ALPHABET.includes(t)) return t
    return elapsedMs >= i * FLAP_STAGGER_MS ? nextLetter(c) : c
  }).join('')
}
```

```ts
// src/lib/trip-origins.ts
// Airports guests fly in from, cycled on the home boarding pass. Edit by hand.
export const TRIP_ORIGINS: string[] = ['GIG', 'JFK', 'LAX']
export const TRIP_DESTINATION = 'MCO'
```

- [ ] **Step 4: Run the pure tests**

Run: `npx vitest run src/lib/flap.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Write failing component tests**

Create `src/components/brand/SplitFlap.test.tsx`:

```tsx
import { render, act } from '@testing-library/react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { SplitFlap } from './SplitFlap'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] })
})
afterEach(() => {
  vi.useRealTimers()
  // jsdom has no matchMedia; remove any mock a test installed
  delete (window as { matchMedia?: unknown }).matchMedia
})

describe('SplitFlap', () => {
  it('starts on the first code', () => {
    const { container } = render(<SplitFlap codes={['GIG', 'JFK', 'LAX']} />)
    expect(container.textContent).toBe('GIG')
  })

  it('flips to the next code after the interval', () => {
    const { container } = render(<SplitFlap codes={['GIG', 'JFK', 'LAX']} />)
    act(() => { vi.advanceTimersByTime(3200 + 2000) })
    expect(container.textContent).toBe('JFK')
  })

  it('with reduced motion it never animates', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia
    const { container } = render(<SplitFlap codes={['GIG', 'JFK', 'LAX']} />)
    act(() => { vi.advanceTimersByTime(20000) })
    expect(container.textContent).toBe('GIG')
  })

  it('a single code is static', () => {
    const { container } = render(<SplitFlap codes={['MCO']} tone="gold" />)
    act(() => { vi.advanceTimersByTime(20000) })
    expect(container.textContent).toBe('MCO')
  })

  it('is hidden from assistive tech and stops its timers on unmount', () => {
    const { container, unmount } = render(<SplitFlap codes={['GIG', 'JFK']} />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
    act(() => { vi.advanceTimersByTime(3300) })
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
```

- [ ] **Step 6: Run to verify they fail**

Run: `npx vitest run src/components/brand/SplitFlap.test.tsx`
Expected: FAIL, cannot resolve `./SplitFlap`.

- [ ] **Step 7: Implement `src/components/brand/SplitFlap.tsx`**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { advanceTowards, FLAP_TICK_MS } from '@/lib/flap'

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const TILE = {
  dark: 'bg-navy text-cream',
  gold: 'bg-gold text-navy',
} as const

type Props = { codes: string[]; intervalMs?: number; tone?: keyof typeof TILE }

// Airport departures-board letters. Decorative: callers supply sr-only text.
export function SplitFlap({ codes, intervalMs = 3200, tone = 'dark' }: Props) {
  const [letters, setLetters] = useState(codes[0] ?? '')

  useEffect(() => {
    if (codes.length < 2 || prefersReducedMotion()) return
    let idx = 0
    let flip: ReturnType<typeof setInterval> | undefined
    const cycle = setInterval(() => {
      idx = (idx + 1) % codes.length
      const target = codes[idx]
      const start = Date.now()
      clearInterval(flip)
      flip = setInterval(() => {
        setLetters(prev => advanceTowards(prev, target, Date.now() - start))
      }, FLAP_TICK_MS)
    }, intervalMs)
    return () => { clearInterval(cycle); clearInterval(flip) }
  }, [codes, intervalMs])

  return (
    <span aria-hidden="true" className="inline-flex gap-0.5">
      {[...letters].map((c, i) => (
        <span key={i}
          className={`relative grid place-items-center w-5 h-[30px] rounded font-ticket text-[19px] font-bold ${TILE[tone]}`}>
          {c}
          <span className="absolute inset-x-0 top-1/2 h-px bg-black/40" />
        </span>
      ))}
    </span>
  )
}
```

Note: `codes` must be referentially stable (a module constant or a literal created outside render), or the effect restarts every render. `TRIP_ORIGINS` is a module constant. For the static destination, pass a module-level constant (see Task 4).

- [ ] **Step 8: Run the tests**

Run: `npx vitest run src/components/brand/SplitFlap.test.tsx src/lib/flap.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/flap.ts src/lib/flap.test.ts src/lib/trip-origins.ts src/components/brand/SplitFlap.tsx src/components/brand/SplitFlap.test.tsx
git commit -m "feat(brand): split-flap airport board

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Home — Crest, NavyCard, BoardingPass

**Files:**
- Create: `src/components/brand/Crest.tsx`, `src/components/brand/NavyCard.tsx`, `src/components/brand/BoardingPass.tsx`, `src/components/brand/BoardingPass.test.tsx`
- Modify: `src/app/page.tsx` (full replacement below)
- Modify: `src/components/Countdown.tsx` (remove the now-unused `Countdown` component; keep `daysUntilTrip`)

**Interfaces:**
- Consumes: `SplitFlap`, `TRIP_ORIGINS`, `TRIP_DESTINATION` (Task 3); `daysUntilTrip(now: Date): number` from `@/components/Countdown`; i18n keys (Task 1).
- Produces: `Crest({ tagline?: string })`, which renders an `h1` "Partiu Orlando".
- Produces: `NavyCard({ label: string; children: React.ReactNode })`.
- Produces: `BoardingPass()` (no props).

- [ ] **Step 1: Write failing BoardingPass tests**

Create `src/components/brand/BoardingPass.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { I18nProvider, useI18n } from '@/lib/i18n/context'
import { BoardingPass } from './BoardingPass'

function WithToggle() {
  const { setLang } = useI18n()
  return <><button onClick={() => setLang('en')}>en</button><BoardingPass /></>
}

describe('BoardingPass', () => {
  it('shows labels, destination and countdown (pt)', () => {
    render(<I18nProvider><BoardingPass /></I18nProvider>)
    expect(screen.getByText('Cartão de embarque')).toBeInTheDocument()
    expect(screen.getByText('Orlando')).toBeInTheDocument()
    expect(screen.getByText('faltam')).toBeInTheDocument()
    expect(screen.getByText('dias para a viagem')).toBeInTheDocument()
    expect(screen.getByText('GIG, JFK, LAX → MCO')).toHaveClass('sr-only')
  })

  it('renders no empty prefix line in English (countdown_prefix is "")', () => {
    const { container } = render(<I18nProvider><WithToggle /></I18nProvider>)
    fireEvent.click(screen.getByText('en'))
    expect(screen.getByText('Boarding pass')).toBeInTheDocument()
    const stub = container.querySelector('[data-stub]') as HTMLElement
    expect(stub.querySelectorAll('p')).toHaveLength(2) // days + label only
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/components/brand/BoardingPass.test.tsx`
Expected: FAIL, cannot resolve `./BoardingPass`.

- [ ] **Step 3: Implement `Crest`, `NavyCard`, `BoardingPass`**

Create `src/components/brand/Crest.tsx`:

```tsx
type Props = { tagline?: string }

// Gold-ringed 🏰 seal + title + mono names rule. Used on home and login (on navy).
export function Crest({ tagline }: Props) {
  return (
    <div className="text-center">
      <div aria-hidden="true"
        className="mx-auto grid place-items-center w-[84px] h-[84px] rounded-full border-2 border-gold outline-1 outline-dashed outline-gold/50 -outline-offset-8 text-4xl">
        🏰
      </div>
      <h1 className="mt-3 font-display text-4xl font-bold leading-none text-cream">Partiu Orlando</h1>
      <p className="mt-2.5 flex items-center justify-center gap-2.5 font-ticket text-[10px] tracking-[0.3em] text-gold">
        <span aria-hidden="true" className="w-7 h-px bg-gold" />
        GUSTAVO · PHILIPE
        <span aria-hidden="true" className="w-7 h-px bg-gold" />
      </p>
      {tagline && <p className="mt-1.5 font-ticket text-[10px] tracking-widest text-cream/60">{tagline}</p>}
    </div>
  )
}
```

Create `src/components/brand/NavyCard.tsx`:

```tsx
type Props = { label: string; children: React.ReactNode }

// Outlined card for navy backgrounds: mono gold label + hairline, cream body.
export function NavyCard({ label, children }: Props) {
  return (
    <section className="rounded-2xl border border-gold/35 bg-white/[0.03] px-4 py-3">
      <h2 className="flex items-center gap-2 font-ticket text-[10px] uppercase tracking-widest text-gold">
        {label}
        <span aria-hidden="true" className="flex-1 h-px bg-gold/25" />
      </h2>
      <div className="mt-2 text-sm text-cream/85">{children}</div>
    </section>
  )
}
```

Create `src/components/brand/BoardingPass.tsx`:

```tsx
'use client'
import { useI18n } from '@/lib/i18n/context'
import { daysUntilTrip } from '@/components/Countdown'
import { TRIP_ORIGINS, TRIP_DESTINATION } from '@/lib/trip-origins'
import { SplitFlap } from './SplitFlap'

const DESTINATION = [TRIP_DESTINATION]
const LABEL = 'font-ticket text-[9px] uppercase tracking-widest text-navy/70'

export function BoardingPass() {
  const { t } = useI18n()
  const days = daysUntilTrip(new Date())

  return (
    <section className="relative flex overflow-hidden rounded-2xl bg-cream text-navy shadow-[0_6px_0_rgba(0,0,0,0.25)]">
      <div className="min-w-0 flex-1 p-4">
        <p className={LABEL}>{t.home.boarding_pass}</p>
        <p className="sr-only">{`${TRIP_ORIGINS.join(', ')} → ${TRIP_DESTINATION}`}</p>
        <div className="mt-1.5 flex items-start gap-2">
          <div>
            <SplitFlap codes={TRIP_ORIGINS} />
            <p aria-hidden="true" className="mt-0.5 h-3" />
          </div>
          <span aria-hidden="true" className="text-sm leading-[30px] text-navy/60">✈</span>
          <div>
            <SplitFlap codes={DESTINATION} tone="gold" />
            <p className="mt-0.5 font-ticket text-[9px] uppercase tracking-wider text-navy/70">{t.home.destination_city}</p>
          </div>
        </div>
        <div className="mt-2 flex gap-5">
          <div>
            <p className={LABEL}>{t.home.outbound}</p>
            <p className="text-sm font-semibold">{t.home.outbound_date}</p>
          </div>
          <div>
            <p className={LABEL}>{t.home.inbound}</p>
            <p className="text-sm font-semibold">{t.home.inbound_date}</p>
          </div>
        </div>
      </div>

      <div data-stub className="relative grid w-24 shrink-0 place-items-center border-l-2 border-dashed border-navy/40 bg-gold px-1 text-center">
        <div>
          {t.home.countdown_prefix && (
            <p className="font-ticket text-[9px] uppercase tracking-wider">{t.home.countdown_prefix}</p>
          )}
          <p className="font-display text-5xl font-bold leading-none">{days}</p>
          <p className="font-ticket text-[9px] uppercase leading-tight tracking-wider">{t.home.countdown_label}</p>
        </div>
        <span aria-hidden="true" className="absolute -left-2.5 -top-2.5 w-5 h-5 rounded-full bg-navy" />
        <span aria-hidden="true" className="absolute -left-2.5 -bottom-2.5 w-5 h-5 rounded-full bg-navy" />
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run the BoardingPass tests**

Run: `npx vitest run src/components/brand/BoardingPass.test.tsx`
Expected: PASS.

- [ ] **Step 5: Replace `src/app/page.tsx`**

Data loading is unchanged. Only the JSX and imports change:

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
import { AvatarCircle } from '@/components/AvatarCircle'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Crest } from '@/components/brand/Crest'
import { NavyCard } from '@/components/brand/NavyCard'
import { BoardingPass } from '@/components/brand/BoardingPass'
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
    <>
      {/* full-bleed navy backdrop with a soft top glow, home route only */}
      <div className="fixed inset-0 -z-10 bg-navy overflow-hidden">
        {hero && (
          <img src={publicUrl('photos', hero.storage_path)} alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-15" />
        )}
        <div aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_0%,#2a3b56_0%,transparent_60%)]" />
      </div>

      <div className="max-w-xl mx-auto space-y-4 pt-2">
        <Crest />
        <div className="pt-2"><BoardingPass /></div>

        <NavyCard label={t.dashboard.facts_title}>
          <p>🗓️ {t.dashboard.facts_dates}</p>
          <p className="mt-1">📍 {t.dashboard.facts_address}</p>
          <Link href="/house" className="inline-block mt-2 font-display text-sm font-semibold text-gold hover:underline">
            {t.dashboard.facts_house_link}
          </Link>
        </NavyCard>

        {todo.length > 0 && (
          <NavyCard label={t.dashboard.checklist_title}>
            <div className="space-y-1.5">
              {todo.map(item => (
                <Link key={item.key} href={item.href} className="flex items-center gap-2 hover:text-cream">
                  <span aria-hidden="true" className="w-3.5 h-3.5 rounded border-[1.5px] border-gold shrink-0" />
                  {checklistLabels[item.key]}
                </Link>
              ))}
            </div>
          </NavyCard>
        )}

        {missing.length > 0 && (
          <NavyCard label={t.home.arrivals_prompt}>
            <div className="flex flex-wrap gap-3">
              {missing.map(p => (
                <div key={p.id} className="flex items-center gap-2">
                  <span className="rounded-full ring-[1.5px] ring-gold">
                    <AvatarCircle name={p.name} color={p.avatar_color} avatarUrl={p.avatar_url} size="sm" />
                  </span>
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
          </NavyCard>
        )}
      </div>
    </>
  )
}

export default function Home() {
  return <ProtectedRoute><HomePage /></ProtectedRoute>
}
```

- [ ] **Step 6: Trim `src/components/Countdown.tsx` to the helper**

Replace the file with:

```ts
const TRIP_START = new Date('2026-10-09T00:00:00')

export function daysUntilTrip(now: Date): number {
  const diff = TRIP_START.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
```

Then run `grep -rn "Countdown }" src` and expect no hits apart from the test import of `daysUntilTrip`.

- [ ] **Step 7: Run the full suite and type-check**

Run: `npm test && npx tsc --noEmit`
Expected: all PASS, no type errors.

- [ ] **Step 8: Commit**

```bash
git add src/app/page.tsx src/components/Countdown.tsx src/components/brand
git commit -m "feat(home): castle crest, flip-board boarding pass, outlined navy cards

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Login + retire ScallopedBadge, SunburstBg, TicketCard

**Files:**
- Modify: `src/app/login/page.tsx`
- Delete: `src/components/brand/ScallopedBadge.tsx`, `src/components/brand/SunburstBg.tsx`, `src/components/brand/TicketCard.tsx`
- Modify: `src/components/brand/brand.test.tsx` (remove their tests and imports)

**Interfaces:**
- Consumes: `Crest`, `BrandButton`, `CARD_CLASS`, `FIELD_LABEL_CLASS`, `INPUT_CLASS`.

Deviation note: the spec says TicketCard "stays for login and admin". Admin never used it, and on login its cream notches clash with the navy page. Login now uses the plain `CARD_CLASS` surface instead, so TicketCard has no remaining users and is retired.

- [ ] **Step 1: Replace the return block of `src/app/login/page.tsx`**

Replace the imports of `ScallopedBadge`, `TicketCard` and `SunburstBg` with:

```tsx
import { BrandButton } from '@/components/brand/BrandButton'
import { Crest } from '@/components/brand/Crest'
import { CARD_CLASS, FIELD_LABEL_CLASS, INPUT_CLASS } from '@/components/brand/styles'
```

Then replace the JSX `return (...)`. The state and `handleSubmit` stay as they are:

```tsx
  return (
    <div className="fixed inset-0 bg-navy flex items-center justify-center px-4 py-8 overflow-y-auto">
      <div aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_0%,#2a3b56_0%,transparent_60%)]" />
      <div className="relative w-full max-w-sm">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
            className="font-ticket text-xs text-cream/60 hover:text-cream border border-cream/30 rounded px-2 py-1"
          >
            {lang === 'pt' ? 'EN' : 'PT'}
          </button>
        </div>

        <div className="mb-8"><Crest tagline="A FAMILY ADVENTURE · EST. 2026" /></div>

        <div className={CARD_CLASS}>
          <p className="font-ticket text-[10px] uppercase tracking-widest text-navy/70 px-4 py-2 border-b border-dashed border-navy/20">
            {t.login.title}
          </p>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label htmlFor="login-email" className={FIELD_LABEL_CLASS}>{t.login.email}</label>
              <input id="login-email"
                type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="login-password" className={FIELD_LABEL_CLASS}>{t.login.password}</label>
              <input id="login-password"
                type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                className={INPUT_CLASS}
              />
            </div>
            {error && <p className="text-red-700 text-sm font-medium">{error}</p>}
            <BrandButton type="submit" disabled={loading} className="w-full">
              {loading ? '...' : t.login.submit}
            </BrandButton>
          </form>
        </div>
      </div>
    </div>
  )
```

- [ ] **Step 2: Remove the retired components and their tests**

```bash
git rm src/components/brand/ScallopedBadge.tsx src/components/brand/SunburstBg.tsx src/components/brand/TicketCard.tsx
```

In `src/components/brand/brand.test.tsx`, delete the imports of `TicketCard`, `ScallopedBadge` and `SunburstBg`, and delete these three tests: `TicketCard renders its label and children`, `ScallopedBadge renders children` and `SunburstBg is decorative (aria-hidden)`.

- [ ] **Step 3: Verify nothing else imports them**

Run: `grep -rn "ScallopedBadge\|SunburstBg\|TicketCard" src`
Expected: no output.

- [ ] **Step 4: Run tests and type-check**

Run: `npm test && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A src/app/login src/components/brand
git commit -m "feat(login): crest + card surface; retire badge, sunburst, ticket card

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Programação — header + filter chips

**Files:**
- Modify: `src/components/ItineraryCalendar.tsx` (the `FILTER_STYLE` block and the `h1` + filter row)

**Interfaces:**
- Consumes: `PageHeader`, `FilterChip`, `t.itinerary.eyebrow`.

- [ ] **Step 1: Replace `FILTER_STYLE` with a dot lookup**

Replace the comment and `FILTER_STYLE` constant (lines ~16–25) with:

```tsx
// Each filter keeps its calendar color as a dot. Literal class names so Tailwind can see them.
const FILTER_DOT: Record<FilterType, string | undefined> = {
  all: undefined,
  arrival: 'bg-teal',
  departure: 'bg-coral',
  activity: 'bg-gold',
  marker: 'bg-pink',
}
```

- [ ] **Step 2: Replace the heading and filter buttons**

Add the imports:

```tsx
import { PageHeader } from './brand/PageHeader'
import { FilterChip } from './brand/FilterChip'
```

Replace:

```tsx
      <h1 className="text-2xl font-display font-bold text-navy mb-4">{t.itinerary.title}</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map(f => (
          <button key={f} onClick={() => { setFilter(f); setSelected(null) }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? FILTER_STYLE[f].active : FILTER_STYLE[f].idle
            }`}>
            {filterLabel[f]}
          </button>
        ))}
      </div>
```

with:

```tsx
      <PageHeader eyebrow={t.itinerary.eyebrow} title={t.itinerary.title} />

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map(f => (
          <FilterChip key={f} label={filterLabel[f]} active={filter === f} dotClass={FILTER_DOT[f]}
            onClick={() => { setFilter(f); setSelected(null) }} />
        ))}
      </div>
```

Leave the rest of the file (grid, phone stack, detail panel) unchanged.

- [ ] **Step 3: Verify**

Run: `npm test && npx tsc --noEmit && grep -n FILTER_STYLE src/components/ItineraryCalendar.tsx`
Expected: tests and tsc PASS. grep prints nothing.

- [ ] **Step 4: Commit**

```bash
git add src/components/ItineraryCalendar.tsx
git commit -m "feat(schedule): page header + mono filter chips

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Atividades — ticket band card

**Files:**
- Modify: `src/components/ActivityCard.tsx` (full replacement)
- Modify: `src/app/activities/page.tsx` (heading only)
- Create: `src/components/ActivityCard.test.tsx`

**Interfaces:**
- Consumes: `TicketBand`, `activityMeta`, `BrandButton`, `CARD_CLASS`, `META_LABEL_CLASS`, `DIVIDER_CLASS`, `PageHeader`.
- `ActivityCard` props are unchanged: `{ activity, isSignedUp, myPlusGuests, onToggle, onPlusGuests }`.

- [ ] **Step 1: Write failing tests**

Create `src/components/ActivityCard.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { I18nProvider } from '@/lib/i18n/context'
import { ActivityCard } from './ActivityCard'
import type { ActivityWithSignups } from '@/types/database'

function activity(over: Partial<ActivityWithSignups> = {}): ActivityWithSignups {
  return {
    id: 'a1', title: 'Magic Kingdom', description: 'Dia inteiro no parque.',
    activity_date: '2026-10-10', activity_time: '09:00:00', cost_per_person: 159, cost_notes: null,
    ticket_url: null, display_order: 1, created_at: '', activity_signups: [],
    ...over,
  } as ActivityWithSignups
}

function renderCard(a: ActivityWithSignups, signed = false) {
  const onToggle = vi.fn()
  render(<I18nProvider><ActivityCard activity={a} isSignedUp={signed} myPlusGuests={0}
    onToggle={onToggle} onPlusGuests={() => {}} /></I18nProvider>)
  return { onToggle }
}

describe('ActivityCard', () => {
  it('shows the ticket band with date and meta', () => {
    renderCard(activity())
    expect(screen.getByText('SÁB')).toBeInTheDocument()
    expect(screen.getByText('09:00 · $ 159.00')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Magic Kingdom' })).toBeInTheDocument()
  })

  it('no date and no cost: dash and no meta separator', () => {
    renderCard(activity({ activity_date: null, activity_time: null, cost_per_person: null }))
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByText(/·/)).not.toBeInTheDocument()
  })

  it('signup button toggles and swaps label', () => {
    const { onToggle } = renderCard(activity(), false)
    fireEvent.click(screen.getByRole('button', { name: 'Vou!' }))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('signed-up state shows "Não vou mais" and the companions stepper', () => {
    renderCard(activity(), true)
    expect(screen.getByRole('button', { name: 'Não vou mais' })).toBeInTheDocument()
    expect(screen.getByText(/acompanhantes/)).toBeInTheDocument()
  })
})
```

Before running, open `src/types/database.ts` and confirm that the `Activity` fields match the factory above. Adjust the factory to the real field names if any differ; the `as` cast covers optional extras.

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/components/ActivityCard.test.tsx`
Expected: FAIL, because "SÁB" and the meta text are not found (the old card has no band).

- [ ] **Step 3: Replace `src/components/ActivityCard.tsx`**

```tsx
'use client'
import { useI18n } from '@/lib/i18n/context'
import { activityMeta } from '@/lib/ticket-date'
import { AvatarCircle } from './AvatarCircle'
import { BrandButton } from './brand/BrandButton'
import { TicketBand } from './brand/TicketBand'
import { CARD_CLASS, DIVIDER_CLASS, META_LABEL_CLASS } from './brand/styles'
import type { ActivityWithSignups } from '@/types/database'

type Props = {
  activity: ActivityWithSignups
  isSignedUp: boolean
  myPlusGuests: number
  onToggle: () => void
  onPlusGuests: (count: number) => void
}

const STEP_BTN = 'grid place-items-center w-6 h-6 rounded-full bg-white border border-navy/15 font-bold text-navy/70 hover:bg-navy/5 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold'

export function ActivityCard({ activity, isSignedUp, myPlusGuests, onToggle, onPlusGuests }: Props) {
  const { t, lang } = useI18n()
  const locale = lang === 'pt' ? 'pt-BR' : 'en-US'
  const meta = activityMeta(activity.activity_time, activity.cost_per_person)
  const totalHeadcount = activity.activity_signups.reduce((sum, s) => sum + 1 + s.plus_guests, 0)

  return (
    <article className={CARD_CLASS}>
      <TicketBand date={activity.activity_date} locale={locale} meta={meta} />

      <div className="px-4 pt-3 pb-4">
        <h3 className="font-display text-lg font-bold leading-snug text-navy">{activity.title}</h3>
        {activity.description && (
          <p className="mt-1.5 text-sm leading-relaxed text-navy/70">{activity.description}</p>
        )}
        {activity.cost_notes && (
          <p className="mt-2 text-xs text-navy/70">
            <span className="font-medium">{t.activities.cost}:</span> {activity.cost_notes}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <BrandButton variant={isSignedUp ? 'secondary' : 'primary'} onClick={onToggle}>
            {isSignedUp ? t.activities.unsign : t.activities.signup}
          </BrandButton>
          {activity.ticket_url && (
            <a href={activity.ticket_url} target="_blank" rel="noopener noreferrer"
              className="font-ticket text-[11px] uppercase tracking-wider text-navy underline decoration-gold decoration-2 underline-offset-4">
              {t.activities.buy_tickets} →
            </a>
          )}
        </div>

        {isSignedUp && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-dashed border-gold bg-gold/10 px-3 py-1 text-sm text-navy">
            <span>+ {t.activities.plus_guests}</span>
            <button type="button" aria-label="−" className={STEP_BTN}
              onClick={() => onPlusGuests(Math.max(0, myPlusGuests - 1))} disabled={myPlusGuests === 0}>−</button>
            <span className="w-4 text-center font-semibold">{myPlusGuests}</span>
            <button type="button" aria-label="+" className={STEP_BTN}
              onClick={() => onPlusGuests(myPlusGuests + 1)}>+</button>
          </div>
        )}

        {activity.activity_signups.length > 0 && (
          <div className={`mt-3 pt-3 flex items-center gap-2 ${DIVIDER_CLASS}`}>
            <div className="flex -space-x-1.5">
              {activity.activity_signups.map(s => (
                <div key={s.id} className="relative rounded-full ring-2 ring-white">
                  <AvatarCircle name={s.profiles.name} color={s.profiles.avatar_color}
                    avatarUrl={s.profiles.avatar_url} size="sm" />
                  {s.plus_guests > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold leading-none text-navy">
                      +{s.plus_guests}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <span className={META_LABEL_CLASS}>{t.activities.attendees} · {totalHeadcount}</span>
          </div>
        )}
      </div>
    </article>
  )
}
```

- [ ] **Step 4: Update the page heading**

In `src/app/activities/page.tsx`, add `import { PageHeader } from '@/components/brand/PageHeader'` and replace
`<h1 className="text-2xl font-bold font-display text-navy mb-6">{t.activities.title}</h1>` with
`<PageHeader eyebrow={t.activities.eyebrow} title={t.activities.title} />`.

- [ ] **Step 5: Run tests**

Run: `npm test && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/ActivityCard.tsx src/components/ActivityCard.test.tsx src/app/activities/page.tsx
git commit -m "feat(activities): ticket-band activity cards

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Chegadas e Saídas — legs card + form

**Files:**
- Modify: `src/components/ArrivalEventCard.tsx` (full replacement)
- Modify: `src/components/ArrivalEventsSection.tsx` (heading, add button, form classes and buttons)
- Create: `src/components/ArrivalEventCard.test.tsx`

**Interfaces:**
- Consumes: `TicketLegs`, `shortDate`, `BrandButton`, `PageHeader`, `CARD_CLASS`, `META_LABEL_CLASS`, `DIVIDER_CLASS`, `FIELD_LABEL_CLASS`, `INPUT_CLASS`.
- `ArrivalEventCard` props are unchanged: `{ event, onEdit, onDelete }`.

- [ ] **Step 1: Write failing tests**

Create `src/components/ArrivalEventCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { I18nProvider } from '@/lib/i18n/context'
import { ArrivalEventCard } from './ArrivalEventCard'
import type { ArrivalEventWithPeople } from '@/types/database'

function ev(over: Partial<ArrivalEventWithPeople> = {}): ArrivalEventWithPeople {
  return {
    id: 'e1', description: 'Voo LATAM 8190', transportation: 'Avião',
    arrival_date: '2026-10-09', arrival_time: '14:30:00', departure_date: null, departure_time: null,
    created_by: 'u1', created_at: '',
    arrival_event_people: [{ id: 'p1', event_id: 'e1', user_id: 'u1',
      profiles: { id: 'u1', name: 'Gus', avatar_color: '#E76F51', avatar_url: null } }],
    ...over,
  } as unknown as ArrivalEventWithPeople
}

const renderCard = (e: ArrivalEventWithPeople) =>
  render(<I18nProvider><ArrivalEventCard event={e} onEdit={() => {}} onDelete={() => {}} /></I18nProvider>)

describe('ArrivalEventCard', () => {
  it('shows arrival leg with short date and time, dash for missing departure', () => {
    renderCard(ev())
    expect(screen.getByText('09 out')).toBeInTheDocument()
    expect(screen.getByText('14:30')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Voo LATAM 8190')).toBeInTheDocument()
  })

  it('no transportation → no suitcase fallback emoji', () => {
    const { container } = renderCard(ev({ transportation: '' }))
    expect(container.textContent).not.toContain('🧳')
  })

  it('edit/delete are present', () => {
    renderCard(ev())
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument()
  })
})
```

Before running, check `src/types/database.ts` and adjust the factory field names if they differ.

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/components/ArrivalEventCard.test.tsx`
Expected: FAIL, because "09 out" is not found (the old card prints `09/10/2026 14:30`).

- [ ] **Step 3: Replace `src/components/ArrivalEventCard.tsx`**

```tsx
'use client'
import { useI18n } from '@/lib/i18n/context'
import { transportEmoji } from '@/lib/arrival-event'
import { shortDate } from '@/lib/ticket-date'
import { AvatarCircle } from './AvatarCircle'
import { BrandButton } from './brand/BrandButton'
import { TicketLegs } from './brand/TicketLegs'
import { CARD_CLASS, DIVIDER_CLASS, META_LABEL_CLASS } from './brand/styles'
import type { ArrivalEventWithPeople } from '@/types/database'

type Props = {
  event: ArrivalEventWithPeople
  onEdit: () => void
  onDelete: () => void
}

export function ArrivalEventCard({ event, onEdit, onDelete }: Props) {
  const { t, lang } = useI18n()
  const locale = lang === 'pt' ? 'pt-BR' : 'en-US'
  const people = event.arrival_event_people.filter(p => p.profiles != null)

  return (
    <article className={CARD_CLASS}>
      <div className="px-4 py-3">
        {event.transportation && (
          <p className={META_LABEL_CLASS}>{transportEmoji(event.transportation)} {event.transportation}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <div className="flex -space-x-1.5">
            {people.map(p => (
              <span key={p.id} className="rounded-full ring-2 ring-white">
                <AvatarCircle name={p.profiles!.name} color={p.profiles!.avatar_color}
                  avatarUrl={p.profiles!.avatar_url} size="sm" />
              </span>
            ))}
          </div>
          <span className="min-w-0 font-display font-semibold text-navy">
            {people.map(p => p.profiles!.name).join(', ')}
          </span>
        </div>
        {event.description && <p className="mt-1.5 text-sm text-navy/80 break-words">{event.description}</p>}
      </div>

      <TicketLegs legs={[
        { label: `↓ ${t.arrivals.arrival}`,
          value: event.arrival_date ? shortDate(event.arrival_date, locale) : null,
          sub: event.arrival_time?.slice(0, 5) ?? null },
        { label: `↑ ${t.arrivals.departure}`,
          value: event.departure_date ? shortDate(event.departure_date, locale) : null,
          sub: event.departure_time?.slice(0, 5) ?? null },
      ]} />

      <div className={`flex justify-end gap-4 px-4 py-2 ${DIVIDER_CLASS}`}>
        <BrandButton variant="quiet" onClick={onEdit}>{t.arrivals.edit}</BrandButton>
        <BrandButton variant="danger-quiet" onClick={onDelete}>{t.arrivals.delete}</BrandButton>
      </div>
    </article>
  )
}
```

- [ ] **Step 4: Restyle `ArrivalEventsSection.tsx` (markup only)**

Add the imports:

```tsx
import { BrandButton } from './brand/BrandButton'
import { PageHeader } from './brand/PageHeader'
import { CARD_CLASS, FIELD_LABEL_CLASS, INPUT_CLASS } from './brand/styles'
```

Make these exact replacements inside the component's JSX:

| Find | Replace with |
|---|---|
| `<h1 className="text-2xl font-bold font-display text-navy mb-6">{t.arrivals.title}</h1>` | `<PageHeader eyebrow={t.arrivals.eyebrow} title={t.arrivals.title} />` |
| `<button onClick={startCreate}` + `className="px-4 py-2 bg-gold text-navy rounded-lg text-sm font-medium hover:brightness-105 mb-4">` … `</button>` | `<BrandButton onClick={startCreate} className="mb-4">+ {t.arrivals.add}</BrandButton>` |
| `className="bg-white rounded-2xl border border-navy/10 shadow-[0_4px_0_rgba(26,37,54,0.08)] p-5 space-y-3 mb-4"` | `` className={`${CARD_CLASS} p-5 space-y-3 mb-4`} `` |
| every `className="block text-xs text-navy/60 mb-1"` | `className={FIELD_LABEL_CLASS}` |
| every `className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"` | `className={INPUT_CLASS}` |
| the save `<button onClick={save} … className="px-4 py-2 bg-gold …">` | `<BrandButton onClick={save} disabled={saving \|\| !isArrivalEventFormValid(form)}>` (same children, closing `</BrandButton>`) |
| the cancel `<button onClick={() => { setForm(null); setEditingId(null) }} className="px-4 py-2 bg-navy/5 …">` | `<BrandButton variant="secondary" onClick={() => { setForm(null); setEditingId(null) }}>` (same children) |
| people toggle selected class `'border-gold bg-gold/10 text-navy'` | `'border-navy bg-navy text-gold'` |

`{error && …}` changes from `text-red-500` to `text-red-700` (for AA contrast). Change nothing else.

- [ ] **Step 5: Run tests**

Run: `npm test && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/ArrivalEventCard.tsx src/components/ArrivalEventCard.test.tsx src/components/ArrivalEventsSection.tsx
git commit -m "feat(arrivals): boarding-pass legs card + branded form

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Carros — spec-row card, form, InfoPage header

**Files:**
- Modify: `src/components/CarCard.tsx` (full replacement)
- Modify: `src/components/CarsSection.tsx` (form classes and buttons)
- Modify: `src/components/InfoPage.tsx` (heading)
- Create: `src/components/CarCard.test.tsx`

**Interfaces:**
- Consumes: `TicketLegs`, `shortDate`, `BrandButton`, `PageHeader`, class constants.
- `CarCard` props are unchanged: `{ car, onEdit, onDelete }`.

- [ ] **Step 1: Write failing tests**

Create `src/components/CarCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { I18nProvider } from '@/lib/i18n/context'
import { CarCard } from './CarCard'
import type { CarWithCreator } from '@/types/database'

const car = {
  id: 'c1', rental_company: 'Alamo', location: 'MCO Airport', pickup_date: '2026-10-09',
  dropoff_date: '2026-10-18', brand: 'Chevy Tahoe', color: 'Preto', seats: 7, photo_path: null,
  created_by: 'u1', created_at: '',
  profiles: { id: 'u1', name: 'Gus', avatar_color: '#E76F51', avatar_url: null },
} as unknown as CarWithCreator

describe('CarCard', () => {
  it('renders company/location label, title and the three legs', () => {
    render(<I18nProvider><CarCard car={car} onEdit={() => {}} onDelete={() => {}} /></I18nProvider>)
    expect(screen.getByText('Alamo · MCO Airport')).toBeInTheDocument()
    expect(screen.getByText('Chevy Tahoe — Preto')).toBeInTheDocument()
    expect(screen.getByText('09 out')).toBeInTheDocument()
    expect(screen.getByText('18 out')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('Adicionado por Gus')).toBeInTheDocument()
  })
})
```

Check `src/types/database.ts` and adjust the factory if needed.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/components/CarCard.test.tsx`
Expected: FAIL. The old card renders `Alamo • MCO Airport` and full dates.

- [ ] **Step 3: Replace `src/components/CarCard.tsx`**

```tsx
'use client'
import { useI18n } from '@/lib/i18n/context'
import { publicUrl } from '@/lib/photos'
import { shortDate } from '@/lib/ticket-date'
import { AvatarCircle } from './AvatarCircle'
import { BrandButton } from './brand/BrandButton'
import { TicketLegs } from './brand/TicketLegs'
import { CARD_CLASS, DIVIDER_CLASS, META_LABEL_CLASS } from './brand/styles'
import type { CarWithCreator } from '@/types/database'

type Props = {
  car: CarWithCreator
  onEdit: () => void
  onDelete: () => void
}

export function CarCard({ car, onEdit, onDelete }: Props) {
  const { t, lang } = useI18n()
  const locale = lang === 'pt' ? 'pt-BR' : 'en-US'

  return (
    <article className={CARD_CLASS}>
      {car.photo_path && (
        <img src={publicUrl('car-photos', car.photo_path)} alt={`${car.brand} ${car.color}`}
          className="w-full aspect-[4/3] object-cover" />
      )}
      <div className="px-4 py-3 min-w-0">
        <p className={`${META_LABEL_CLASS} truncate`}>{car.rental_company} · {car.location}</p>
        <p className="font-display text-lg font-bold text-navy">{car.brand} — {car.color}</p>
      </div>
      <TicketLegs legs={[
        { label: t.cars.pickup_date, value: shortDate(car.pickup_date, locale) },
        { label: t.cars.dropoff_date, value: shortDate(car.dropoff_date, locale) },
        { label: t.cars.seats, value: String(car.seats) },
      ]} />
      <div className={`flex items-center justify-between gap-3 px-4 py-2 ${DIVIDER_CLASS}`}>
        {car.profiles ? (
          <div className="flex min-w-0 items-center gap-2">
            <AvatarCircle name={car.profiles.name} color={car.profiles.avatar_color}
              avatarUrl={car.profiles.avatar_url} size="sm" />
            <span className={`${META_LABEL_CLASS} truncate`}>{t.cars.added_by} {car.profiles.name}</span>
          </div>
        ) : <span />}
        <div className="flex shrink-0 gap-4">
          <BrandButton variant="quiet" onClick={onEdit}>{t.cars.edit}</BrandButton>
          <BrandButton variant="danger-quiet" onClick={onDelete}>{t.cars.delete}</BrandButton>
        </div>
      </div>
    </article>
  )
}
```

- [ ] **Step 4: Restyle `CarsSection.tsx` (markup only)**

Add the imports:

```tsx
import { BrandButton } from './brand/BrandButton'
import { CARD_CLASS, FIELD_LABEL_CLASS, INPUT_CLASS } from './brand/styles'
```

| Find | Replace with |
|---|---|
| the add `<button onClick={startCreate} className="px-4 py-2 bg-gold … mb-4">+ {t.cars.add}</button>` | `<BrandButton onClick={startCreate} className="mb-4">+ {t.cars.add}</BrandButton>` |
| form container `className="bg-white rounded-2xl … p-5 space-y-3 mb-4"` | `` className={`${CARD_CLASS} p-5 space-y-3 mb-4`} `` |
| every `className="block text-xs text-navy/60 mb-1"` | `className={FIELD_LABEL_CLASS}` |
| every `className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"` | `className={INPUT_CLASS}` |
| save `<button onClick={save} … className="px-4 py-2 bg-gold …">` | `<BrandButton onClick={save} disabled={saving \|\| !isCarFormValid(form)}>` (same children) |
| cancel `<button … className="px-4 py-2 bg-navy/5 …">` | `<BrandButton variant="secondary" onClick={() => { setForm(null); setEditingId(null) }}>` (same children) |
| `text-red-500` (error) | `text-red-700` |

- [ ] **Step 5: InfoPage heading**

In `src/components/InfoPage.tsx`, add `import { PageHeader } from './brand/PageHeader'` and replace
`<h1 className="text-2xl font-bold font-display text-navy mb-6">{page?.title ?? fallbackTitle}</h1>` with:

```tsx
      <PageHeader eyebrow={slug === 'cars' ? t.cars.eyebrow : undefined} title={page?.title ?? fallbackTitle} />
```

- [ ] **Step 6: Run tests**

Run: `npm test && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/CarCard.tsx src/components/CarCard.test.tsx src/components/CarsSection.tsx src/components/InfoPage.tsx
git commit -m "feat(cars): spec-row car cards, branded form, page header

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: A Casa — header + branded prose

**Files:**
- Modify: `src/components/HouseContent.tsx` (heading)
- Modify: `src/components/MarkdownRenderer.tsx` (add `prose-brand`)
- Modify: `src/app/globals.css` (append the `.prose-brand` rules; do not touch `@theme`)

**Interfaces:**
- Consumes: `PageHeader`, `t.house.eyebrow`.

- [ ] **Step 1: Heading**

In `src/components/HouseContent.tsx`, change `const { lang } = useI18n()` to `const { lang, t } = useI18n()`, add `import { PageHeader } from '@/components/brand/PageHeader'`, and replace
`<h1 className="text-2xl font-bold font-display text-navy mb-6">{title}</h1>` with
`<PageHeader eyebrow={t.house.eyebrow} title={title} />`.

- [ ] **Step 2: Prose styling**

In `src/components/MarkdownRenderer.tsx`, change the wrapper's first line from `className="prose prose-gray max-w-none` to `className="prose prose-gray prose-brand max-w-none`.

Append to `src/app/globals.css`:

```css
/* Markdown pages (A Casa, Carros): gold bullets + short gold bar under headings */
.prose-brand {
  --tw-prose-bullets: var(--color-gold);
  --tw-prose-counters: var(--color-navy);
  --tw-prose-headings: var(--color-navy);
}
.prose-brand :where(h2, h3):not(:where(.not-prose *))::after {
  content: "";
  display: block;
  width: 2.5rem;
  height: 3px;
  margin-top: 0.35rem;
  border-radius: 9999px;
  background: var(--color-gold);
}
```

- [ ] **Step 3: Verify**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: PASS, and the build completes (this confirms the CSS compiles under Tailwind v4).

- [ ] **Step 4: Commit**

```bash
git add src/components/HouseContent.tsx src/components/MarkdownRenderer.tsx src/app/globals.css
git commit -m "feat(house): page header + gold-accented markdown prose

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Meu Perfil — passport page

**Files:**
- Create: `src/lib/passport.ts`, `src/lib/passport.test.ts`
- Modify: `src/components/AvatarCircle.tsx` (add the `portrait` size)
- Modify: `src/app/profile/page.tsx` (JSX only)

**Interfaces:**
- Produces: `mrzLine(name: string): string`, always 44 characters.
- Produces: `AvatarCircle` `size?: 'sm' | 'md' | 'lg' | 'portrait'`. Portrait is a 72×88 rounded rectangle.

- [ ] **Step 1: Write failing MRZ tests**

Create `src/lib/passport.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { mrzLine } from './passport'

describe('mrzLine', () => {
  it('uppercases and pads to 44 chars', () => {
    const line = mrzLine('Gustavo')
    expect(line.startsWith('P<BRAGUSTAVO<<ORLANDO<2026<')).toBe(true)
    expect(line).toHaveLength(44)
  })
  it('strips accents and turns spaces into <', () => {
    expect(mrzLine('José  Maria').startsWith('P<BRAJOSE<MARIA<<ORLANDO<2026')).toBe(true)
  })
  it('empty or emoji-only name still produces a valid line', () => {
    expect(mrzLine('').startsWith('P<BRA<<ORLANDO<2026')).toBe(true)
    expect(mrzLine('🎉')).toHaveLength(44)
  })
  it('very long names are truncated to 44', () => {
    expect(mrzLine('Pedro de Alcântara Francisco Antônio João Carlos')).toHaveLength(44)
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/lib/passport.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/lib/passport.ts`**

```ts
const MRZ_LENGTH = 44

// Decorative passport machine-readable line: P<BRA<NAME><<ORLANDO<2026<<<…
export function mrzLine(name: string): string {
  const clean = name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]+/g, '<')
    .replace(/^<+|<+$/g, '')
  return `P<BRA${clean}<<ORLANDO<2026`.padEnd(MRZ_LENGTH, '<').slice(0, MRZ_LENGTH)
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/lib/passport.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the portrait size to `AvatarCircle`**

Replace `src/components/AvatarCircle.tsx` with:

```tsx
type Size = 'sm' | 'md' | 'lg' | 'portrait'

const sizes: Record<Size, string> = {
  sm: 'w-7 h-7 text-xs rounded-full',
  md: 'w-9 h-9 text-sm rounded-full',
  lg: 'w-12 h-12 text-base rounded-full',
  portrait: 'w-[72px] h-[88px] text-2xl rounded-xl',
}

type Props = { name: string; color: string; avatarUrl?: string | null; size?: Size }

export function AvatarCircle({ name, color, avatarUrl, size = 'md' }: Props) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        title={name}
        className={`${sizes[size]} object-cover shrink-0 select-none`}
      />
    )
  }
  return (
    <div
      className={`${sizes[size]} flex items-center justify-center font-bold text-white shrink-0 select-none`}
      style={{ backgroundColor: color }}
      title={name}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
```

- [ ] **Step 6: Replace the JSX `return (...)` in `src/app/profile/page.tsx`**

Add the imports:

```tsx
import { BrandButton } from '@/components/brand/BrandButton'
import { PageHeader } from '@/components/brand/PageHeader'
import { CARD_CLASS, DIVIDER_CLASS, FIELD_LABEL_CLASS, META_LABEL_CLASS } from '@/components/brand/styles'
import { mrzLine } from '@/lib/passport'
```

The state, `onFile` and `save` stay unchanged. New return:

```tsx
  return (
    <div className="max-w-md mx-auto">
      <PageHeader eyebrow={t.profile.eyebrow} title={t.profile.title} />
      <div className={CARD_CLASS}>
        <div className="flex items-center justify-between bg-navy px-4 py-2 font-ticket text-[10px] uppercase tracking-widest text-gold">
          <span>{t.profile.passport_title}</span>
          <span aria-hidden="true" className="text-base">🏰</span>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-end gap-4">
            <AvatarCircle name={name || profile.name} color={color} avatarUrl={avatarUrl} size="portrait" />
            <div className="min-w-0">
              <p className={META_LABEL_CLASS}>{t.profile.traveler}</p>
              <p className="truncate font-display text-xl font-bold text-navy">{name || profile.name}</p>
              <BrandButton variant="quiet" onClick={() => fileRef.current?.click()} disabled={busy} className="mt-1">
                {busy ? t.profile.uploading : t.profile.upload}
              </BrandButton>
              <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
              {error && <p className="text-red-700 text-xs mt-1">{error}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="profile-name" className={FIELD_LABEL_CLASS}>{t.profile.name}</label>
            <input id="profile-name" value={name} onChange={e => setName(e.target.value)}
              className="w-full border-0 border-b-[1.5px] border-navy/35 bg-transparent px-0 py-1.5 text-base font-semibold text-navy focus:outline-none focus:border-gold focus:ring-0" />
          </div>

          <div>
            <p className={FIELD_LABEL_CLASS}>{t.profile.color}</p>
            <div className="mt-1 flex flex-wrap gap-2.5">
              {AVATAR_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  aria-label={c} aria-pressed={color === c}
                  className={`w-7 h-7 rounded-full ${color === c ? 'ring-2 ring-navy ring-offset-2' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <BrandButton onClick={save} disabled={busy}>{t.profile.save}</BrandButton>
            {saved && <span className="text-sm text-green-700">{t.profile.saved}</span>}
          </div>
        </div>

        <p aria-hidden="true"
          className={`overflow-hidden whitespace-nowrap px-4 py-2 font-ticket text-[10px] tracking-wider text-navy/40 ${DIVIDER_CLASS}`}>
          {mrzLine(name || profile.name)}
        </p>
      </div>
    </div>
  )
```

- [ ] **Step 7: Run tests**

Run: `npm test && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/passport.ts src/lib/passport.test.ts src/components/AvatarCircle.tsx src/app/profile/page.tsx
git commit -m "feat(profile): passport page with portrait and MRZ line

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Admin pages + final verification

**Files:**
- Modify: `src/app/admin/layout.tsx` (heading)
- Modify: `src/app/admin/users/page.tsx`, `src/app/admin/activities/page.tsx`, `src/app/admin/markers/page.tsx`, `src/app/admin/content/page.tsx`, `src/app/admin/photos/page.tsx` (buttons and labels)
- Modify: `.gitignore` (add `.superpowers/`)

**Interfaces:**
- Consumes: `PageHeader`, `BrandButton`, `FIELD_LABEL_CLASS`, `INPUT_CLASS`, `t.admin.eyebrow`.

- [ ] **Step 1: Admin layout heading**

In `src/app/admin/layout.tsx`, add `import { PageHeader } from '@/components/brand/PageHeader'` and replace
`<h1 className="text-2xl font-display font-bold text-navy mb-4">{t.admin.title}</h1>` with
`<PageHeader eyebrow={t.admin.eyebrow} title={t.admin.title} />`.

- [ ] **Step 2: Map admin buttons and labels**

In each of the five admin pages, add `import { BrandButton } from '@/components/brand/BrandButton'` and `import { FIELD_LABEL_CLASS, INPUT_CLASS } from '@/components/brand/styles'`, then apply these replacements. They match on the exact className strings; keep each button's `onClick`, `disabled`, `type` and children.

| `<button>` with className starting… | Becomes |
|---|---|
| `px-4 py-2 bg-gold text-navy rounded-lg text-sm font-medium hover:brightness-105` | `<BrandButton …>` (primary) |
| `px-4 py-2 bg-navy/5 text-navy/70 rounded-lg text-sm hover:bg-navy/10` | `<BrandButton variant="secondary" …>` |
| `px-3 py-1.5 border border-navy/15 rounded-lg text-sm text-navy/70 hover:bg-navy/5` | `<BrandButton variant="quiet" …>` |
| `px-3 py-1.5 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50` | `<BrandButton variant="danger-quiet" …>` |

| Other className | Becomes |
|---|---|
| `block text-xs text-navy/50 mb-1` (labels) | `{FIELD_LABEL_CLASS}` |
| `w-full border border-navy/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold` | `{INPUT_CLASS}` |

Leave these unchanged: the photo reorder/delete mini buttons (`↑ ↓ ✕`), the section tabs in `content`/`photos`, the admin toggle switch in `users`, the emoji picker buttons and the `resize-none`/`w-16` inputs.

Check: `grep -rn "bg-gold text-navy rounded-lg\|border-red-200 rounded-lg" src` must print nothing.

- [ ] **Step 3: Ignore brainstorm artifacts**

```bash
printf '\n# brainstorm mockups\n.superpowers/\n' >> .gitignore
```

- [ ] **Step 4: Full verification**

Run: `npm test && npm run lint && npx tsc --noEmit && npm run build`
Expected: all PASS, and the static export builds into `out/`.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin .gitignore
git commit -m "feat(admin): page header + branded buttons and labels; ignore .superpowers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Manual check on localhost (hand off to the user)**

Run `npm run dev` (with `nvm use 22`) and tell the user to log in and check each page at phone width (≈375px and 320px) and desktop width:
- `/`: the flip cycles GIG→JFK→LAX, MCO stays fixed, there is no horizontal scroll, and switching to EN shows no blank line in the stub.
- `/schedule`: chips toggle, dots match pill colors, and the desktop grid is unchanged.
- `/activities`: the band shows date/time/cost; Vou!/Não vou mais and the acompanhantes stepper work.
- `/arrivals`: legs, Editar/Excluir and the add/edit form still save.
- `/cars`: legs, the form and photo upload still work.
- `/house`: gold bullets and heading bars.
- `/profile`: photo upload, name/color save, and the MRZ line updates as you type.
- `/login` and `/admin/*`: crest, buttons and labels.

Do not merge or deploy until the user approves.
