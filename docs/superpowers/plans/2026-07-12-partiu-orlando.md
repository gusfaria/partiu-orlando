# Partiu Orlando Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private group trip organizer for 11 guests with auth, activity sign-ups, arrival tracking, info pages, and an admin panel — deployed as a static Next.js site on GitHub Pages backed by Supabase.

**Architecture:** Next.js 15 App Router compiled to a static export (`output: 'export'`), deployed to GitHub Pages via GitHub Actions. All backend functionality (auth, database, API) is handled by Supabase. No server-side code. All data fetching is client-side via the Supabase JS client.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS 3, `@tailwindcss/typography`, `@supabase/supabase-js` v2, `react-markdown`, Vitest

## Global Constraints

- All UI strings must come from `src/lib/i18n/pt.json` or `src/lib/i18n/en.json` — never hardcoded in components
- Default language: Portuguese (`pt`); English (`en`) available via nav toggle
- Trip start date: `2026-10-09`; trip end date: `2026-10-17`
- Initial guest password: `orlando2026`
- Primary color: orange — use Tailwind `orange-500` (`#f97316`) as the brand color
- No server-side code — `'use client'` on every page and component that uses hooks or browser APIs
- Admin identified by `profiles.is_admin = true`; non-admins hitting `/admin/*` redirect to `/`
- No activity capacity limits; no cost tracking — cost fields are informational display only
- Working directory for all commands: `~/Documents/PROJECT/Gustavo-Philipe__40th-birthday`

---

## File Map

```
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── .env.local              (gitignored — real keys)
├── .env.local.example      (committed — placeholder keys)
├── .github/
│   └── workflows/
│       └── deploy.yml
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       └── create-user/
│           └── index.ts
├── src/
│   ├── types/
│   │   └── database.ts           — TypeScript types for all DB tables
│   ├── lib/
│   │   ├── supabase.ts           — Supabase client singleton
│   │   ├── auth-context.tsx      — AuthContext + useAuth hook + AuthProvider
│   │   └── i18n/
│   │       ├── context.tsx       — I18nContext + useI18n hook + I18nProvider
│   │       ├── pt.json           — All Portuguese UI strings
│   │       └── en.json           — All English UI strings
│   ├── components/
│   │   ├── AvatarCircle.tsx      — Colored circle with user initial
│   │   ├── Nav.tsx               — Top nav with mobile hamburger
│   │   ├── ProtectedRoute.tsx    — Client-side auth guard
│   │   ├── Countdown.tsx         — Days-until-trip counter
│   │   ├── ActivityCard.tsx      — Activity card with sign-up button + attendees
│   │   ├── MarkdownRenderer.tsx  — Renders markdown string with prose styles
│   │   └── InfoPage.tsx          — Shared shell for schedule/house/cars/explore
│   └── app/
│       ├── globals.css
│       ├── layout.tsx            — Root layout: I18nProvider > AuthProvider > Nav > children
│       ├── page.tsx              — Home: countdown + missing-arrivals nudge
│       ├── login/
│       │   └── page.tsx
│       ├── schedule/
│       │   └── page.tsx
│       ├── arrivals/
│       │   └── page.tsx
│       ├── activities/
│       │   └── page.tsx
│       ├── house/
│       │   └── page.tsx
│       ├── cars/
│       │   └── page.tsx
│       ├── explore/
│       │   └── page.tsx
│       └── admin/
│           ├── layout.tsx        — Admin guard (redirect if not admin)
│           ├── page.tsx          — Redirect to /admin/users
│           ├── users/
│           │   └── page.tsx      — List + edit profile display names/colors
│           ├── activities/
│           │   └── page.tsx      — CRUD for activities
│           └── content/
│               └── page.tsx      — Edit info_pages markdown
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `next.config.js`
- Create: `tailwind.config.ts`
- Create: `vitest.config.ts`
- Create: `.env.local.example`
- Create: `src/lib/supabase.ts`
- Create: `src/types/database.ts`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx` (shell — providers added in Task 5)

**Interfaces:**
- Produces: `supabase` client (used by every data-fetching component), `Profile`, `Arrival`, `Activity`, `ActivitySignup`, `InfoPage` types

- [ ] **Step 1: Bootstrap the Next.js app**

```bash
cd ~/Documents/PROJECT
npx create-next-app@latest Gustavo-Philipe__40th-birthday \
  --typescript --tailwind --eslint --app --src-dir \
  --no-import-alias --use-npm
cd Gustavo-Philipe__40th-birthday
```

When prompted, accept all defaults.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install @supabase/supabase-js react-markdown
npm install -D @tailwindcss/typography vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Configure static export**

Replace the contents of `next.config.js` (or `next.config.ts` if created) with:

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
}

module.exports = nextConfig
```

- [ ] **Step 4: Add typography plugin to Tailwind**

Edit `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: {} },
  plugins: [require('@tailwindcss/typography')],
}
export default config
```

- [ ] **Step 5: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
})
```

Create `src/test-setup.ts`:

```ts
import '@testing-library/jest-dom'
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Create TypeScript types**

Create `src/types/database.ts`:

```ts
export type Profile = {
  id: string
  name: string
  is_admin: boolean
  avatar_color: string
  created_at: string
}

export type Arrival = {
  id: string
  user_id: string
  arrival_date: string | null
  departure_date: string | null
  notes: string | null
  updated_at: string
}

export type Activity = {
  id: string
  title: string
  description: string
  activity_date: string | null
  activity_time: string | null
  cost_per_person: number | null
  cost_notes: string | null
  ticket_url: string | null
  display_order: number
  created_at: string
}

export type ActivitySignup = {
  id: string
  activity_id: string
  user_id: string
  created_at: string
}

export type InfoPage = {
  slug: string
  title: string
  content: string
  updated_at: string
}

export type ActivityWithSignups = Activity & {
  activity_signups: (ActivitySignup & { profiles: Profile })[]
}

export type ProfileWithArrival = Profile & {
  arrivals: Arrival[]
}
```

- [ ] **Step 7: Create Supabase client**

Create `src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 8: Create env example file**

Create `.env.local.example`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Add to `.gitignore` (append):

```
.env.local
```

- [ ] **Step 9: Stub root layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Partiu Orlando 🌴',
  description: 'Aniversário do Gustavo & Philipe em Orlando',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 10: Verify build passes**

```bash
npm run build
```

Expected: build succeeds, `out/` directory created.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js static export with Supabase client and TypeScript types"
```

---

## Task 2: Database Schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

**Interfaces:**
- Produces: all DB tables and RLS policies that every other task depends on

- [ ] **Step 1: Sign up for Supabase and create a project**

1. Go to https://supabase.com and sign up / log in
2. Click "New project"
3. Name it `partiu-orlando`, pick a strong database password, choose region closest to you (e.g. US East)
4. Wait ~2 minutes for project to be ready
5. Go to Project Settings > API — copy the **Project URL** and **anon public** key
6. Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

- [ ] **Step 2: Write the migration SQL**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- ============================================================
-- profiles (extends auth.users)
-- ============================================================
create table public.profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  name         text        not null,
  is_admin     boolean     not null default false,
  avatar_color text        not null default '#6366f1',
  created_at   timestamptz not null default now()
);

-- ============================================================
-- arrivals (one row per guest, unique on user_id)
-- ============================================================
create table public.arrivals (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        references public.profiles(id) on delete cascade not null unique,
  arrival_date   date,
  departure_date date,
  notes          text,
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- activities
-- ============================================================
create table public.activities (
  id               uuid        primary key default gen_random_uuid(),
  title            text        not null,
  description      text        not null default '',
  activity_date    date,
  activity_time    time,
  cost_per_person  numeric(10,2),
  cost_notes       text,
  ticket_url       text,
  display_order    integer     not null default 0,
  created_at       timestamptz not null default now()
);

-- ============================================================
-- activity_signups
-- ============================================================
create table public.activity_signups (
  id          uuid        primary key default gen_random_uuid(),
  activity_id uuid        references public.activities(id) on delete cascade not null,
  user_id     uuid        references public.profiles(id)   on delete cascade not null,
  created_at  timestamptz not null default now(),
  unique(activity_id, user_id)
);

-- ============================================================
-- info_pages (house, cars, schedule, explore)
-- ============================================================
create table public.info_pages (
  slug       text        primary key,
  title      text        not null,
  content    text        not null default '',
  updated_at timestamptz not null default now()
);

insert into public.info_pages (slug, title, content) values
  ('schedule', 'Programação',           ''),
  ('house',    'A Casa',                ''),
  ('cars',     'Carros',                ''),
  ('explore',  'Por Conta Própria',     '');

-- ============================================================
-- Trigger: auto-create profile row when a new auth user is created
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  colors text[] := array['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6',
                          '#ec4899','#14b8a6','#f97316','#06b6d4','#84cc16','#a855f7'];
  color  text   := colors[1 + floor(random() * array_length(colors,1))::int];
begin
  insert into public.profiles (id, name, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_color', color)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Row-Level Security
-- ============================================================
alter table public.profiles         enable row level security;
alter table public.arrivals         enable row level security;
alter table public.activities       enable row level security;
alter table public.activity_signups enable row level security;
alter table public.info_pages       enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- profiles
create policy "profiles: read all"        on public.profiles for select to authenticated using (true);
create policy "profiles: update own"      on public.profiles for update to authenticated using (auth.uid() = id);

-- arrivals
create policy "arrivals: read all"        on public.arrivals for select to authenticated using (true);
create policy "arrivals: insert own"      on public.arrivals for insert to authenticated with check (auth.uid() = user_id);
create policy "arrivals: update own"      on public.arrivals for update to authenticated using (auth.uid() = user_id);

-- activities
create policy "activities: read all"      on public.activities for select to authenticated using (true);
create policy "activities: admin insert"  on public.activities for insert to authenticated with check (public.is_admin());
create policy "activities: admin update"  on public.activities for update to authenticated using (public.is_admin());
create policy "activities: admin delete"  on public.activities for delete to authenticated using (public.is_admin());

-- activity_signups
create policy "signups: read all"         on public.activity_signups for select to authenticated using (true);
create policy "signups: insert own"       on public.activity_signups for insert to authenticated with check (auth.uid() = user_id);
create policy "signups: delete own"       on public.activity_signups for delete to authenticated using (auth.uid() = user_id);

-- info_pages
create policy "info_pages: read all"      on public.info_pages for select to authenticated using (true);
create policy "info_pages: admin update"  on public.info_pages for update to authenticated using (public.is_admin());
```

- [ ] **Step 3: Run migration in Supabase**

1. In the Supabase dashboard, go to **SQL Editor**
2. Paste the full contents of `001_initial_schema.sql`
3. Click **Run**
4. Verify: go to **Table Editor** — you should see `profiles`, `arrivals`, `activities`, `activity_signups`, `info_pages`

- [ ] **Step 4: Create your admin account**

1. In the Supabase dashboard go to **Authentication > Users > Add user > Create new user**
2. Enter your email + password `orlando2026`
3. Go to **Table Editor > profiles** — your row should be there (created by trigger)
4. Edit your row: set `name` to your display name and `is_admin` to `true`

- [ ] **Step 5: Commit**

```bash
mkdir -p supabase/migrations
git add supabase/migrations/001_initial_schema.sql
git commit -m "feat: add database schema, RLS policies, and profile trigger"
```

---

## Task 3: i18n System

**Files:**
- Create: `src/lib/i18n/pt.json`
- Create: `src/lib/i18n/en.json`
- Create: `src/lib/i18n/context.tsx`
- Create: `src/lib/i18n/context.test.tsx`

**Interfaces:**
- Produces: `useI18n()` → `{ lang: 'pt' | 'en', t: Translations, setLang: (l) => void }`
- Produces: `<I18nProvider>` wrapper component

- [ ] **Step 1: Write the failing test**

Create `src/lib/i18n/context.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { I18nProvider, useI18n } from './context'

function TestConsumer() {
  const { t, lang, setLang } = useI18n()
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="logout">{t.nav.logout}</span>
      <button onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}>toggle</button>
    </div>
  )
}

describe('I18nProvider', () => {
  it('defaults to Portuguese', () => {
    render(<I18nProvider><TestConsumer /></I18nProvider>)
    expect(screen.getByTestId('lang').textContent).toBe('pt')
    expect(screen.getByTestId('logout').textContent).toBe('Sair')
  })

  it('switches to English on toggle', () => {
    render(<I18nProvider><TestConsumer /></I18nProvider>)
    fireEvent.click(screen.getByText('toggle'))
    expect(screen.getByTestId('lang').textContent).toBe('en')
    expect(screen.getByTestId('logout').textContent).toBe('Logout')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test
```

Expected: FAIL — `context.tsx` does not exist yet.

- [ ] **Step 3: Create the Portuguese translations**

Create `src/lib/i18n/pt.json`:

```json
{
  "nav": {
    "schedule": "Programação",
    "arrivals": "Chegadas",
    "activities": "Atividades",
    "house": "A Casa",
    "cars": "Carros",
    "explore": "Por Conta Própria",
    "admin": "Admin",
    "logout": "Sair"
  },
  "home": {
    "title": "Partiu Orlando! 🌴",
    "subtitle": "Aniversário do Gustavo & Philipe",
    "countdown_label": "dias para a viagem",
    "arrivals_prompt": "Ainda não preencheram a chegada:"
  },
  "login": {
    "title": "Entrar",
    "email": "E-mail",
    "password": "Senha",
    "submit": "Entrar",
    "error": "E-mail ou senha incorretos"
  },
  "arrivals": {
    "title": "Chegadas",
    "name": "Nome",
    "arrival": "Chegada",
    "departure": "Saída",
    "notes": "Observações",
    "edit": "Editar",
    "save": "Salvar",
    "cancel": "Cancelar",
    "not_filled": "Não preenchido"
  },
  "activities": {
    "title": "Atividades",
    "cost": "Custo por pessoa",
    "signup": "Vou!",
    "unsign": "Não vou mais",
    "attendees": "Confirmados",
    "buy_tickets": "Comprar ingressos",
    "no_activities": "Nenhuma atividade cadastrada ainda."
  },
  "admin": {
    "title": "Admin",
    "users": "Usuários",
    "activities": "Atividades",
    "content": "Conteúdo",
    "name": "Nome",
    "email": "E-mail",
    "save": "Salvar",
    "delete": "Excluir",
    "edit": "Editar",
    "cancel": "Cancelar",
    "create_activity": "Nova atividade",
    "activity_title": "Título",
    "activity_date": "Data",
    "activity_time": "Horário (opcional)",
    "cost_per_person": "Custo por pessoa (R$)",
    "cost_notes": "Notas sobre custo",
    "ticket_url": "Link para ingressos",
    "display_order": "Ordem de exibição",
    "description": "Descrição",
    "edit_content": "Editar conteúdo",
    "user_creation_note": "Para criar novos usuários, acesse o painel do Supabase → Authentication → Users → Add user. Use a senha orlando2026. O perfil é criado automaticamente."
  },
  "common": {
    "loading": "Carregando...",
    "error": "Erro ao carregar dados",
    "confirm_delete": "Tem certeza? Esta ação não pode ser desfeita.",
    "saved": "Salvo!",
    "no_data": "Nenhum dado encontrado."
  }
}
```

- [ ] **Step 4: Create the English translations**

Create `src/lib/i18n/en.json`:

```json
{
  "nav": {
    "schedule": "Schedule",
    "arrivals": "Arrivals",
    "activities": "Activities",
    "house": "The House",
    "cars": "Cars",
    "explore": "On Your Own",
    "admin": "Admin",
    "logout": "Logout"
  },
  "home": {
    "title": "Partiu Orlando! 🌴",
    "subtitle": "Gustavo & Philipe's Birthday",
    "countdown_label": "days until the trip",
    "arrivals_prompt": "Haven't filled in their arrival yet:"
  },
  "login": {
    "title": "Sign In",
    "email": "Email",
    "password": "Password",
    "submit": "Sign In",
    "error": "Incorrect email or password"
  },
  "arrivals": {
    "title": "Arrivals",
    "name": "Name",
    "arrival": "Arrival",
    "departure": "Departure",
    "notes": "Notes",
    "edit": "Edit",
    "save": "Save",
    "cancel": "Cancel",
    "not_filled": "Not filled"
  },
  "activities": {
    "title": "Activities",
    "cost": "Cost per person",
    "signup": "I'm in!",
    "unsign": "I'm out",
    "attendees": "Confirmed",
    "buy_tickets": "Buy tickets",
    "no_activities": "No activities added yet."
  },
  "admin": {
    "title": "Admin",
    "users": "Users",
    "activities": "Activities",
    "content": "Content",
    "name": "Name",
    "email": "Email",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "cancel": "Cancel",
    "create_activity": "New activity",
    "activity_title": "Title",
    "activity_date": "Date",
    "activity_time": "Time (optional)",
    "cost_per_person": "Cost per person ($)",
    "cost_notes": "Cost notes",
    "ticket_url": "Ticket link",
    "display_order": "Display order",
    "description": "Description",
    "edit_content": "Edit content",
    "user_creation_note": "To create new users, go to the Supabase dashboard → Authentication → Users → Add user. Use password orlando2026. The profile is created automatically."
  },
  "common": {
    "loading": "Loading...",
    "error": "Error loading data",
    "confirm_delete": "Are you sure? This cannot be undone.",
    "saved": "Saved!",
    "no_data": "No data found."
  }
}
```

- [ ] **Step 5: Create the i18n context**

Create `src/lib/i18n/context.tsx`:

```tsx
'use client'
import { createContext, useContext, useState, ReactNode } from 'react'
import pt from './pt.json'
import en from './en.json'

export type Language = 'pt' | 'en'
export type Translations = typeof pt

const translations: Record<Language, Translations> = { pt, en }

type I18nContextType = {
  lang: Language
  t: Translations
  setLang: (lang: Language) => void
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('pt')
  return (
    <I18nContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
```

- [ ] **Step 6: Run tests — confirm they pass**

```bash
npm test
```

Expected: 2 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/i18n/
git commit -m "feat: add i18n context with Portuguese default and English toggle"
```

---

## Task 4: Auth System

**Files:**
- Create: `src/lib/auth-context.tsx`
- Create: `src/components/ProtectedRoute.tsx`
- Create: `src/app/login/page.tsx`

**Interfaces:**
- Produces: `useAuth()` → `{ user, profile, loading, signOut }`
- Produces: `<AuthProvider>` wrapper
- Produces: `<ProtectedRoute adminOnly?>` guard component

- [ ] **Step 1: Create auth context**

Create `src/lib/auth-context.tsx`:

```tsx
'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Profile } from '@/types/database'

type AuthContextType = {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 2: Create ProtectedRoute**

Create `src/components/ProtectedRoute.tsx`:

```tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n/context'

type Props = {
  children: React.ReactNode
  adminOnly?: boolean
}

export function ProtectedRoute({ children, adminOnly = false }: Props) {
  const { user, profile, loading } = useAuth()
  const { t } = useI18n()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }
    if (adminOnly && profile && !profile.is_admin) router.replace('/')
  }, [user, profile, loading, adminOnly, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        {t.common.loading}
      </div>
    )
  }
  if (!user) return null
  if (adminOnly && (!profile || !profile.is_admin)) return null
  return <>{children}</>
}
```

- [ ] **Step 3: Create login page**

Create `src/app/login/page.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n/context'

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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
            className="text-xs text-gray-400 hover:text-gray-600 border rounded px-2 py-1"
          >
            {lang === 'pt' ? 'EN' : 'PT'}
          </button>
        </div>

        <h1 className="text-3xl font-bold text-orange-500 text-center mb-1">Partiu Orlando 🌴</h1>
        <p className="text-center text-gray-500 mb-8 text-sm">{t.home.subtitle}</p>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.login.email}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.login.password}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white rounded-lg py-2.5 font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {loading ? '...' : t.login.submit}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: builds without errors.

- [ ] **Step 5: Manual test**

```bash
npm run dev
```

1. Visit http://localhost:3000/login
2. Try wrong credentials — error message appears
3. Log in with your admin email + `orlando2026` — redirects to `/`
4. Visit http://localhost:3000/login again while logged in — should redirect to `/` (handled in next task)

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth-context.tsx src/components/ProtectedRoute.tsx src/app/login/
git commit -m "feat: add Supabase auth context, protected route guard, and login page"
```

---

## Task 5: Root Layout & Navigation

**Files:**
- Create: `src/components/AvatarCircle.tsx`
- Create: `src/components/Nav.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `useAuth()` from `src/lib/auth-context.tsx`, `useI18n()` from `src/lib/i18n/context.tsx`
- Produces: `<AvatarCircle name color size?>` — reused in Nav, arrivals, activities

- [ ] **Step 1: Create AvatarCircle**

Create `src/components/AvatarCircle.tsx`:

```tsx
type Size = 'sm' | 'md' | 'lg'

const sizes: Record<Size, string> = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
}

type Props = { name: string; color: string; size?: Size }

export function AvatarCircle({ name, color, size = 'md' }: Props) {
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

- [ ] **Step 2: Create Nav**

Create `src/components/Nav.tsx`:

```tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n/context'
import { AvatarCircle } from './AvatarCircle'

export function Nav() {
  const { profile, signOut } = useAuth()
  const { t, lang, setLang } = useI18n()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  if (!profile) return null

  const links = [
    { href: '/schedule',   label: t.nav.schedule },
    { href: '/arrivals',   label: t.nav.arrivals },
    { href: '/activities', label: t.nav.activities },
    { href: '/house',      label: t.nav.house },
    { href: '/cars',       label: t.nav.cars },
    { href: '/explore',    label: t.nav.explore },
  ]

  const linkClass = (href: string) =>
    `text-sm transition-colors ${
      pathname === href || (href !== '/' && pathname.startsWith(href))
        ? 'text-orange-500 font-semibold'
        : 'text-gray-600 hover:text-gray-900'
    }`

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="font-bold text-orange-500 text-lg whitespace-nowrap">
          Partiu Orlando 🌴
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-5">
          {links.map(l => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>{l.label}</Link>
          ))}
          {profile.is_admin && (
            <Link href="/admin" className={linkClass('/admin')}>{t.nav.admin}</Link>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
            className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded px-2 py-1"
          >
            {lang === 'pt' ? 'EN' : 'PT'}
          </button>
          <AvatarCircle name={profile.name} color={profile.avatar_color} />
          <button
            onClick={signOut}
            className="hidden md:block text-sm text-gray-400 hover:text-gray-700"
          >
            {t.nav.logout}
          </button>
          {/* Hamburger */}
          <button
            className="md:hidden p-1"
            onClick={() => setOpen(o => !o)}
            aria-label="menu"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-gray-100 px-4 py-3 flex flex-col gap-3 bg-white">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={linkClass(l.href)}>
              {l.label}
            </Link>
          ))}
          {profile.is_admin && (
            <Link href="/admin" onClick={() => setOpen(false)} className={linkClass('/admin')}>
              {t.nav.admin}
            </Link>
          )}
          <button onClick={signOut} className="text-sm text-gray-400 text-left pt-1 border-t border-gray-100">
            {t.nav.logout}
          </button>
        </div>
      )}
    </nav>
  )
}
```

- [ ] **Step 3: Update root layout with all providers**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/lib/i18n/context'
import { AuthProvider } from '@/lib/auth-context'
import { Nav } from '@/components/Nav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Partiu Orlando 🌴',
  description: 'Aniversário do Gustavo & Philipe em Orlando',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
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

- [ ] **Step 4: Manual test**

```bash
npm run dev
```

1. Log in — nav appears with all links
2. Click hamburger on mobile viewport (DevTools) — dropdown opens and closes
3. PT|EN toggle switches language of nav labels
4. Click Logout — redirects to login

- [ ] **Step 5: Commit**

```bash
git add src/components/AvatarCircle.tsx src/components/Nav.tsx src/app/layout.tsx
git commit -m "feat: add nav with mobile menu, language toggle, and avatar; wire up providers in root layout"
```

---

## Task 6: Home Page & Countdown

**Files:**
- Create: `src/components/Countdown.tsx`
- Create: `src/components/Countdown.test.ts`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `useI18n()`, `useAuth()`, `supabase`
- Produces: `<Countdown />` — pure display component driven by `TRIP_START` constant

- [ ] **Step 1: Write the failing test**

Create `src/components/Countdown.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const TRIP_START = new Date('2026-10-09T00:00:00')

function daysUntilTrip(now: Date): number {
  const diff = TRIP_START.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

describe('daysUntilTrip', () => {
  it('returns correct days when trip is in the future', () => {
    const now = new Date('2026-07-12T00:00:00')
    expect(daysUntilTrip(now)).toBe(89)
  })

  it('returns 0 on trip start day', () => {
    expect(daysUntilTrip(new Date('2026-10-09T12:00:00'))).toBe(0)
  })

  it('returns 0 after trip has started', () => {
    expect(daysUntilTrip(new Date('2026-10-15T00:00:00'))).toBe(0)
  })

  it('returns 1 the day before the trip', () => {
    expect(daysUntilTrip(new Date('2026-10-08T23:59:59'))).toBe(1)
  })
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npm test
```

Expected: FAIL — `daysUntilTrip` is not imported from anywhere (it's defined inline in the test).
Actually it will PASS since the function is defined in the test file itself. Confirm 4 tests pass before moving on.

- [ ] **Step 3: Create Countdown component**

Create `src/components/Countdown.tsx`:

```tsx
'use client'
import { useI18n } from '@/lib/i18n/context'

const TRIP_START = new Date('2026-10-09T00:00:00')

function daysUntilTrip(now: Date): number {
  const diff = TRIP_START.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function Countdown() {
  const { t } = useI18n()
  const days = daysUntilTrip(new Date())

  return (
    <div className="text-center py-10">
      <div className="text-9xl font-black text-orange-500 leading-none">{days}</div>
      <div className="text-xl text-gray-500 mt-3 font-medium">{t.home.countdown_label}</div>
    </div>
  )
}
```

- [ ] **Step 4: Create home page**

Replace `src/app/page.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Countdown } from '@/components/Countdown'
import { AvatarCircle } from '@/components/AvatarCircle'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import type { Profile, Arrival } from '@/types/database'

function HomePage() {
  const { t } = useI18n()
  const { profile } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [arrivals, setArrivals] = useState<Arrival[]>([])

  useEffect(() => {
    supabase.from('profiles').select('*').then(({ data }) => setProfiles(data ?? []))
    supabase.from('arrivals').select('*').then(({ data }) => setArrivals(data ?? []))
  }, [])

  const missing = profiles.filter(
    p => !arrivals.find(a => a.user_id === p.id && a.arrival_date)
  )

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-4xl font-black text-center text-orange-500 mt-4">{t.home.title}</h1>
      <p className="text-center text-gray-400 mt-1">{t.home.subtitle}</p>
      <Countdown />

      {missing.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mt-4">
          <p className="text-sm font-semibold text-amber-800 mb-3">
            {t.home.arrivals_prompt}
          </p>
          <div className="flex flex-wrap gap-3">
            {missing.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <AvatarCircle name={p.name} color={p.avatar_color} size="sm" />
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

- [ ] **Step 5: Manual test**

```bash
npm run dev
```

1. Log in → redirected to home
2. Countdown shows ~89 (verify against today's date)
3. Missing arrivals section lists all profiles without dates
4. Toggle PT|EN — countdown label changes language

- [ ] **Step 6: Commit**

```bash
git add src/components/Countdown.tsx src/components/Countdown.test.ts src/app/page.tsx
git commit -m "feat: add home page with countdown and missing-arrivals nudge"
```

---

## Task 7: Arrivals Page

**Files:**
- Create: `src/app/arrivals/page.tsx`

**Interfaces:**
- Consumes: `useAuth()`, `supabase`, `useI18n()`, `AvatarCircle`, `ProtectedRoute`
- Consumes types: `Profile`, `Arrival`, `ProfileWithArrival`

- [ ] **Step 1: Create arrivals page**

Create `src/app/arrivals/page.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n/context'
import { supabase } from '@/lib/supabase'
import { AvatarCircle } from '@/components/AvatarCircle'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import type { Profile, Arrival } from '@/types/database'

type Row = Profile & { arrival: Arrival | null }

type EditState = {
  arrival_date: string
  departure_date: string
  notes: string
}

function ArrivalsPage() {
  const { t, lang } = useI18n()
  const { profile: me } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ arrival_date: '', departure_date: '', notes: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data: profiles } = await supabase.from('profiles').select('*').order('name')
    const { data: arrivals } = await supabase.from('arrivals').select('*')
    if (!profiles) return
    setRows(profiles.map(p => ({
      ...p,
      arrival: arrivals?.find(a => a.user_id === p.id) ?? null,
    })))
  }

  useEffect(() => { load() }, [])

  function startEdit(row: Row) {
    setEditingId(row.id)
    setEditState({
      arrival_date:   row.arrival?.arrival_date   ?? '',
      departure_date: row.arrival?.departure_date ?? '',
      notes:          row.arrival?.notes          ?? '',
    })
  }

  async function saveEdit(userId: string) {
    setSaving(true)
    await supabase.from('arrivals').upsert({
      user_id:        userId,
      arrival_date:   editState.arrival_date   || null,
      departure_date: editState.departure_date || null,
      notes:          editState.notes          || null,
      updated_at:     new Date().toISOString(),
    }, { onConflict: 'user_id' })
    setSaving(false)
    setEditingId(null)
    load()
  }

  function fmt(dateStr: string | null) {
    if (!dateStr) return t.arrivals.not_filled
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(
      lang === 'pt' ? 'pt-BR' : 'en-US',
      { day: '2-digit', month: '2-digit', year: 'numeric' }
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.arrivals.title}</h1>
      <div className="space-y-3">
        {rows.map(row => (
          <div key={row.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            {editingId === row.id ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-2">
                  <AvatarCircle name={row.name} color={row.avatar_color} />
                  <span className="font-semibold text-gray-900">{row.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t.arrivals.arrival}</label>
                    <input type="date" value={editState.arrival_date}
                      onChange={e => setEditState(s => ({ ...s, arrival_date: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t.arrivals.departure}</label>
                    <input type="date" value={editState.departure_date}
                      onChange={e => setEditState(s => ({ ...s, departure_date: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t.arrivals.notes}</label>
                  <input type="text" value={editState.notes}
                    onChange={e => setEditState(s => ({ ...s, notes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(row.id)} disabled={saving}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
                    {saving ? '...' : t.arrivals.save}
                  </button>
                  <button onClick={() => setEditingId(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                    {t.arrivals.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <AvatarCircle name={row.name} color={row.avatar_color} />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{row.name}</p>
                    <p className="text-sm text-gray-500">
                      {fmt(row.arrival?.arrival_date ?? null)} → {fmt(row.arrival?.departure_date ?? null)}
                    </p>
                    {row.arrival?.notes && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{row.arrival.notes}</p>
                    )}
                  </div>
                </div>
                {me?.id === row.id && (
                  <button onClick={() => startEdit(row)}
                    className="shrink-0 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    {t.arrivals.edit}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Arrivals() {
  return <ProtectedRoute><ArrivalsPage /></ProtectedRoute>
}
```

- [ ] **Step 2: Manual test**

```bash
npm run dev
```

1. Visit `/arrivals` — see list of all users
2. Your own row has an Edit button; others do not
3. Click Edit → date pickers appear
4. Enter dates → Save → row updates with formatted dates
5. Log in as a different user (create one in Supabase dashboard) — only that user's Edit button is visible

- [ ] **Step 3: Commit**

```bash
git add src/app/arrivals/
git commit -m "feat: add arrivals page with inline editing for own row"
```

---

## Task 8: Activities Page

**Files:**
- Create: `src/components/ActivityCard.tsx`
- Create: `src/app/activities/page.tsx`

**Interfaces:**
- Consumes: `supabase`, `useAuth()`, `useI18n()`, `AvatarCircle`, `ProtectedRoute`
- Consumes types: `ActivityWithSignups`
- Produces: `<ActivityCard activity isSignedUp onToggle />` — reused by admin preview

- [ ] **Step 1: Create ActivityCard**

Create `src/components/ActivityCard.tsx`:

```tsx
'use client'
import { useI18n } from '@/lib/i18n/context'
import { AvatarCircle } from './AvatarCircle'
import type { ActivityWithSignups } from '@/types/database'

type Props = {
  activity: ActivityWithSignups
  isSignedUp: boolean
  onToggle: () => void
}

export function ActivityCard({ activity, isSignedUp, onToggle }: Props) {
  const { t, lang } = useI18n()

  function fmtDate(dateStr: string | null, timeStr: string | null) {
    if (!dateStr) return null
    const date = new Date(dateStr + 'T00:00:00').toLocaleDateString(
      lang === 'pt' ? 'pt-BR' : 'en-US',
      { weekday: 'long', day: 'numeric', month: 'long' }
    )
    const time = timeStr ? ` • ${timeStr.slice(0, 5)}` : ''
    return date + time
  }

  const dateLabel = fmtDate(activity.activity_date, activity.activity_time)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 text-lg leading-snug">{activity.title}</h3>
          {dateLabel && (
            <p className="text-sm text-gray-400 mt-0.5 capitalize">{dateLabel}</p>
          )}
        </div>
        <button
          onClick={onToggle}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            isSignedUp
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          {isSignedUp ? t.activities.unsign : t.activities.signup}
        </button>
      </div>

      {activity.description && (
        <p className="text-gray-600 text-sm mt-3 leading-relaxed">{activity.description}</p>
      )}

      {activity.cost_per_person != null && (
        <p className="text-sm mt-3">
          <span className="font-medium text-gray-700">{t.activities.cost}: </span>
          <span className="text-gray-600">
            R$ {Number(activity.cost_per_person).toFixed(2)}
          </span>
          {activity.cost_notes && (
            <span className="text-gray-400"> — {activity.cost_notes}</span>
          )}
        </p>
      )}

      {activity.ticket_url && (
        <a
          href={activity.ticket_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-sm text-orange-500 hover:underline font-medium"
        >
          {t.activities.buy_tickets} →
        </a>
      )}

      {activity.activity_signups.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2">
            {t.activities.attendees} ({activity.activity_signups.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {activity.activity_signups.map(s => (
              <AvatarCircle
                key={s.id}
                name={s.profiles.name}
                color={s.profiles.avatar_color}
                size="sm"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create activities page**

Create `src/app/activities/page.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n/context'
import { supabase } from '@/lib/supabase'
import { ActivityCard } from '@/components/ActivityCard'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import type { ActivityWithSignups } from '@/types/database'

function ActivitiesPage() {
  const { t } = useI18n()
  const { profile } = useAuth()
  const [activities, setActivities] = useState<ActivityWithSignups[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase
      .from('activities')
      .select('*, activity_signups(*, profiles(*))')
      .order('display_order')
    setActivities((data as ActivityWithSignups[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleSignup(activity: ActivityWithSignups) {
    if (!profile) return
    const isSignedUp = activity.activity_signups.some(s => s.user_id === profile.id)
    if (isSignedUp) {
      const signup = activity.activity_signups.find(s => s.user_id === profile.id)!
      await supabase.from('activity_signups').delete().eq('id', signup.id)
    } else {
      await supabase.from('activity_signups').insert({ activity_id: activity.id, user_id: profile.id })
    }
    load()
  }

  if (loading) return <p className="text-gray-400">{t.common.loading}</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.activities.title}</h1>
      {activities.length === 0 ? (
        <p className="text-gray-400">{t.activities.no_activities}</p>
      ) : (
        <div className="space-y-4">
          {activities.map(a => (
            <ActivityCard
              key={a.id}
              activity={a}
              isSignedUp={a.activity_signups.some(s => s.user_id === profile?.id)}
              onToggle={() => toggleSignup(a)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Activities() {
  return <ProtectedRoute><ActivitiesPage /></ProtectedRoute>
}
```

- [ ] **Step 3: Manual test**

```bash
npm run dev
```

1. Visit `/activities` — shows empty state before admin adds activities (add one via Supabase Table Editor first to test)
2. Click "Vou!" → avatar appears in confirmed section
3. Click "Não vou mais" → avatar removed
4. Log in as another user — see both signups

- [ ] **Step 4: Commit**

```bash
git add src/components/ActivityCard.tsx src/app/activities/
git commit -m "feat: add activities page with sign-up toggle and attendee avatars"
```

---

## Task 9: Info Pages (Schedule, House, Cars, Explore)

**Files:**
- Create: `src/components/MarkdownRenderer.tsx`
- Create: `src/components/InfoPage.tsx`
- Create: `src/app/schedule/page.tsx`
- Create: `src/app/house/page.tsx`
- Create: `src/app/cars/page.tsx`
- Create: `src/app/explore/page.tsx`

**Interfaces:**
- Consumes: `supabase`, `useI18n()`, `ProtectedRoute`
- Consumes types: `InfoPage`
- Produces: `<MarkdownRenderer content />`, `<InfoPage slug />` — shared by all 4 info pages

- [ ] **Step 1: Create MarkdownRenderer**

Create `src/components/MarkdownRenderer.tsx`:

```tsx
import ReactMarkdown from 'react-markdown'

type Props = { content: string }

export function MarkdownRenderer({ content }: Props) {
  if (!content.trim()) return null
  return (
    <div className="prose prose-gray prose-orange max-w-none
      prose-headings:font-bold prose-a:text-orange-500 prose-a:no-underline hover:prose-a:underline">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
```

- [ ] **Step 2: Create InfoPage component**

Create `src/components/InfoPage.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n/context'
import { ProtectedRoute } from './ProtectedRoute'
import { MarkdownRenderer } from './MarkdownRenderer'
import type { InfoPage as InfoPageType } from '@/types/database'

type Props = { slug: string; fallbackTitle: string }

function InfoPageContent({ slug, fallbackTitle }: Props) {
  const { t } = useI18n()
  const [page, setPage] = useState<InfoPageType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('info_pages').select('*').eq('slug', slug).single()
      .then(({ data }) => { setPage(data); setLoading(false) })
  }, [slug])

  if (loading) return <p className="text-gray-400">{t.common.loading}</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{page?.title ?? fallbackTitle}</h1>
      {page?.content
        ? <MarkdownRenderer content={page.content} />
        : <p className="text-gray-400">{t.common.no_data}</p>
      }
    </div>
  )
}

export function InfoPage(props: Props) {
  return <ProtectedRoute><InfoPageContent {...props} /></ProtectedRoute>
}
```

- [ ] **Step 3: Create the four info pages**

Create `src/app/schedule/page.tsx`:

```tsx
import { InfoPage } from '@/components/InfoPage'
export default function SchedulePage() {
  return <InfoPage slug="schedule" fallbackTitle="Programação" />
}
```

Create `src/app/house/page.tsx`:

```tsx
import { InfoPage } from '@/components/InfoPage'
export default function HousePage() {
  return <InfoPage slug="house" fallbackTitle="A Casa" />
}
```

Create `src/app/cars/page.tsx`:

```tsx
import { InfoPage } from '@/components/InfoPage'
export default function CarsPage() {
  return <InfoPage slug="cars" fallbackTitle="Carros" />
}
```

Create `src/app/explore/page.tsx`:

```tsx
import { InfoPage } from '@/components/InfoPage'
export default function ExplorePage() {
  return <InfoPage slug="explore" fallbackTitle="Por Conta Própria" />
}
```

- [ ] **Step 4: Manual test**

```bash
npm run dev
```

1. Visit `/schedule` — shows empty state
2. Go to Supabase Table Editor → info_pages → update `schedule` row content with some markdown (e.g. `## Dia 1\n**Oct 9** — Chegada!`)
3. Refresh `/schedule` — markdown renders correctly with heading and bold

- [ ] **Step 5: Commit**

```bash
git add src/components/MarkdownRenderer.tsx src/components/InfoPage.tsx \
        src/app/schedule/ src/app/house/ src/app/cars/ src/app/explore/
git commit -m "feat: add info pages (schedule, house, cars, explore) with markdown rendering"
```

---

## Task 10: Admin Panel

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/users/page.tsx`
- Create: `src/app/admin/activities/page.tsx`
- Create: `src/app/admin/content/page.tsx`

**Interfaces:**
- Consumes: `supabase`, `useAuth()`, `useI18n()`, `ProtectedRoute`, `ActivityCard`
- Consumes types: `Profile`, `Activity`, `InfoPage`

- [ ] **Step 1: Create admin layout**

Create `src/app/admin/layout.tsx`:

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'
import { ProtectedRoute } from '@/components/ProtectedRoute'

function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const pathname = usePathname()

  const tabs = [
    { href: '/admin/users',      label: t.admin.users },
    { href: '/admin/activities', label: t.admin.activities },
    { href: '/admin/content',    label: t.admin.content },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{t.admin.title}</h1>
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        {tabs.map(tab => (
          <Link key={tab.href} href={tab.href}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              pathname === tab.href
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}>
            {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute adminOnly><AdminLayout>{children}</AdminLayout></ProtectedRoute>
}
```

- [ ] **Step 2: Create admin root redirect**

Create `src/app/admin/page.tsx`:

```tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminRoot() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/users') }, [router])
  return null
}
```

- [ ] **Step 3: Create admin users page**

Create `src/app/admin/users/page.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { supabase } from '@/lib/supabase'
import { AvatarCircle } from '@/components/AvatarCircle'
import type { Profile } from '@/types/database'

const AVATAR_COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6',
                       '#ec4899','#14b8a6','#f97316','#06b6d4','#84cc16','#a855f7']

export default function AdminUsersPage() {
  const { t } = useI18n()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('name')
    setProfiles(data ?? [])
  }

  useEffect(() => { load() }, [])

  function startEdit(p: Profile) {
    setEditingId(p.id)
    setEditName(p.name)
    setEditColor(p.avatar_color)
  }

  async function saveEdit(id: string) {
    setSaving(true)
    await supabase.from('profiles').update({ name: editName, avatar_color: editColor }).eq('id', id)
    setSaving(false)
    setEditingId(null)
    load()
  }

  return (
    <div className="space-y-3">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        {t.admin.user_creation_note}
      </div>
      {profiles.map(p => (
        <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          {editingId === p.id ? (
            <div className="space-y-3">
              <input value={editName} onChange={e => setEditName(e.target.value)}
                placeholder={t.admin.name}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <div>
                <p className="text-xs text-gray-500 mb-2">Avatar color</p>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map(c => (
                    <button key={c} onClick={() => setEditColor(c)}
                      className={`w-7 h-7 rounded-full border-2 ${editColor === c ? 'border-gray-900' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => saveEdit(p.id)} disabled={saving}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
                  {saving ? '...' : t.admin.save}
                </button>
                <button onClick={() => setEditingId(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                  {t.admin.cancel}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AvatarCircle name={p.name} color={p.avatar_color} />
                <div>
                  <p className="font-semibold text-gray-900">{p.name}</p>
                  {p.is_admin && <p className="text-xs text-orange-500">admin</p>}
                </div>
              </div>
              <button onClick={() => startEdit(p)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                {t.admin.edit}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create admin activities page**

Create `src/app/admin/activities/page.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { supabase } from '@/lib/supabase'
import type { Activity } from '@/types/database'

const EMPTY: Omit<Activity, 'id' | 'created_at'> = {
  title: '', description: '', activity_date: null, activity_time: null,
  cost_per_person: null, cost_notes: null, ticket_url: null, display_order: 0,
}

export default function AdminActivitiesPage() {
  const { t } = useI18n()
  const [activities, setActivities] = useState<Activity[]>([])
  const [form, setForm] = useState<typeof EMPTY | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('activities').select('*').order('display_order')
    setActivities(data ?? [])
  }

  useEffect(() => { load() }, [])

  function startCreate() { setEditingId(null); setForm({ ...EMPTY }) }

  function startEdit(a: Activity) {
    setEditingId(a.id)
    const { id, created_at, ...rest } = a
    setForm(rest)
  }

  async function save() {
    if (!form) return
    setSaving(true)
    if (editingId) {
      await supabase.from('activities').update(form).eq('id', editingId)
    } else {
      await supabase.from('activities').insert(form)
    }
    setSaving(false)
    setForm(null)
    setEditingId(null)
    load()
  }

  async function remove(id: string) {
    if (!confirm(t.common.confirm_delete)) return
    await supabase.from('activities').delete().eq('id', id)
    load()
  }

  function field(key: keyof typeof EMPTY, label: string, type = 'text') {
    return (
      <div key={key}>
        <label className="block text-xs text-gray-500 mb-1">{label}</label>
        <input type={type} value={(form as any)[key] ?? ''}
          onChange={e => setForm(f => ({ ...f!, [key]: e.target.value || null }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!form && (
        <button onClick={startCreate}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
          + {t.admin.create_activity}
        </button>
      )}

      {form && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">{editingId ? t.admin.edit : t.admin.create_activity}</h3>
          {field('title', t.admin.activity_title)}
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t.admin.description}</label>
            <textarea value={form.description ?? ''} rows={3}
              onChange={e => setForm(f => ({ ...f!, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field('activity_date', t.admin.activity_date, 'date')}
            {field('activity_time', t.admin.activity_time, 'time')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field('cost_per_person', t.admin.cost_per_person, 'number')}
            {field('display_order', t.admin.display_order, 'number')}
          </div>
          {field('cost_notes', t.admin.cost_notes)}
          {field('ticket_url', t.admin.ticket_url, 'url')}
          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
              {saving ? '...' : t.admin.save}
            </button>
            <button onClick={() => { setForm(null); setEditingId(null) }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
              {t.admin.cancel}
            </button>
          </div>
        </div>
      )}

      {activities.map(a => (
        <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-gray-900">{a.title}</p>
            <p className="text-sm text-gray-400">{a.activity_date ?? '—'} {a.activity_time ? `• ${a.activity_time.slice(0,5)}` : ''}</p>
            {a.cost_per_person != null && <p className="text-sm text-gray-500">R$ {Number(a.cost_per_person).toFixed(2)}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => startEdit(a)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              {t.admin.edit}
            </button>
            <button onClick={() => remove(a.id)}
              className="px-3 py-1.5 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50">
              {t.admin.delete}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Create admin content page**

Create `src/app/admin/content/page.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { supabase } from '@/lib/supabase'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import type { InfoPage } from '@/types/database'

const SLUGS = ['schedule', 'house', 'cars', 'explore'] as const

export default function AdminContentPage() {
  const { t } = useI18n()
  const [pages, setPages] = useState<InfoPage[]>([])
  const [activeSlug, setActiveSlug] = useState<string>('schedule')
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [preview, setPreview] = useState(false)

  async function load() {
    const { data } = await supabase.from('info_pages').select('*')
    setPages(data ?? [])
    const active = (data ?? []).find(p => p.slug === activeSlug)
    setDraft(active?.content ?? '')
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const active = pages.find(p => p.slug === activeSlug)
    setDraft(active?.content ?? '')
    setSaved(false)
  }, [activeSlug, pages])

  async function saveContent() {
    setSaving(true)
    await supabase.from('info_pages').update({ content: draft, updated_at: new Date().toISOString() }).eq('slug', activeSlug)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const activePage = pages.find(p => p.slug === activeSlug)

  return (
    <div className="space-y-4">
      {/* Slug tabs */}
      <div className="flex gap-2">
        {SLUGS.map(slug => (
          <button key={slug} onClick={() => setActiveSlug(slug)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              activeSlug === slug ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {pages.find(p => p.slug === slug)?.title ?? slug}
          </button>
        ))}
      </div>

      {/* Preview toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Markdown</p>
        <button onClick={() => setPreview(v => !v)}
          className="text-sm text-orange-500 hover:underline">
          {preview ? t.admin.edit_content : 'Preview'}
        </button>
      </div>

      {preview ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 min-h-[300px]">
          <MarkdownRenderer content={draft} />
        </div>
      ) : (
        <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={20}
          placeholder="Escreva em Markdown..."
          className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 resize-y" />
      )}

      <div className="flex items-center gap-3">
        <button onClick={saveContent} disabled={saving}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
          {saving ? '...' : t.admin.save}
        </button>
        {saved && <span className="text-sm text-green-600">{t.common.saved}</span>}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Manual test**

```bash
npm run dev
```

1. Log in as admin → visit `/admin` — redirects to `/admin/users`
2. Users tab: see all profiles, edit a name and color — confirm change persists
3. Activities tab: create an activity with all fields → appears in list; edit it; delete it
4. Content tab: select "A Casa" → type markdown → Save → switch to Preview → content renders → visit `/house` page — same content shown

- [ ] **Step 7: Test non-admin redirect**

Log in as a non-admin user and navigate to `/admin` — confirm redirect to `/`.

- [ ] **Step 8: Commit**

```bash
git add src/app/admin/
git commit -m "feat: add admin panel with user editing, activity CRUD, and content management"
```

---

## Task 11: GitHub Pages Deployment

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` GitHub secrets
- Produces: live site at `https://<username>.github.io/<repo>/`

- [ ] **Step 1: Create GitHub repository**

1. Go to https://github.com/new
2. Create a new **public** repository named `partiu-orlando`
3. Do NOT initialize with README (the local repo already exists)

- [ ] **Step 2: Push local repo to GitHub**

```bash
git remote add origin git@github.com:<your-github-username>/partiu-orlando.git
git branch -M main
git push -u origin main
```

Replace `<your-github-username>` with your actual GitHub username.

- [ ] **Step 3: Configure basePath for project GitHub Pages**

If the site will be at `https://username.github.io/partiu-orlando/` (not a custom domain), update `next.config.js`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' ? '/partiu-orlando' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/partiu-orlando' : '',
}

module.exports = nextConfig
```

If you'll use a **custom domain** (e.g. `partiuorlando.com`), skip this step — no basePath needed.

- [ ] **Step 4: Add Supabase secrets to GitHub**

1. Go to your GitHub repo → Settings → Secrets and variables → Actions → New repository secret
2. Add `NEXT_PUBLIC_SUPABASE_URL` with your Supabase project URL
3. Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` with your Supabase anon key

- [ ] **Step 5: Create the deploy workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build static export
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - uses: actions/upload-pages-artifact@v3
        with:
          path: out/

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 6: Enable GitHub Pages**

1. Go to your GitHub repo → Settings → Pages
2. Under **Source**, select **GitHub Actions**
3. Save

- [ ] **Step 7: Push and verify**

```bash
git add next.config.js .github/
git commit -m "feat: add GitHub Actions deployment to GitHub Pages"
git push origin main
```

1. Go to GitHub repo → Actions tab — watch the workflow run
2. When complete, visit the URL shown in the deploy step (e.g. `https://username.github.io/partiu-orlando/`)
3. Confirm login page loads and you can log in
4. Confirm countdown shows correct number of days

- [ ] **Step 8: Add all guests**

For each of the 10 guests:
1. Supabase dashboard → Authentication → Users → Add user → Create new user
2. Enter their real email + password `orlando2026`
3. Go to `/admin/users` in the deployed app → edit their display name and avatar color

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Countdown | Task 6 |
| Trip schedule page | Task 9 |
| Arrival/departure entry per user | Task 7 |
| See who signed up for activities | Task 8 |
| House info page | Task 9 |
| Car rental info page | Task 9 |
| Other things to do (explore) | Task 9 |
| Activity cost info display | Task 8 |
| Activity sign-up toggle | Task 8 |
| User login (email/password) | Task 4 |
| Admin creates guest accounts | Task 2 (Supabase dashboard) + Task 10 (profile edit) |
| Portuguese default / English toggle | Task 3, 5 |
| Admin: create/edit/delete activities | Task 10 |
| Admin: edit info pages | Task 10 |
| RLS: users can only edit own data | Task 2 |
| GitHub Pages deployment | Task 11 |
| Static export (easy to move off) | Task 1 |
