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
  ]

  const linkClass = (href: string) =>
    `text-sm transition-colors ${
      pathname === href || (href !== '/' && pathname.startsWith(href))
        ? 'text-gold font-semibold'
        : 'text-cream/70 hover:text-cream'
    }`

  return (
    <nav className="bg-navy border-b-4 border-gold sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="font-display font-bold text-cream text-lg whitespace-nowrap">
          🏰 Partiu Orlando
        </Link>

        <div className="hidden md:flex items-center gap-5">
          {links.map(l => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>{l.label}</Link>
          ))}
          {profile.is_admin && (
            <Link href="/admin" className={linkClass('/admin')}>{t.nav.admin}</Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
            className="font-ticket text-xs text-cream/60 hover:text-cream border border-cream/30 rounded px-2 py-1"
          >
            {lang === 'pt' ? 'EN' : 'PT'}
          </button>
          <Link href="/profile" title={t.nav.profile}>
            <AvatarCircle name={profile.name} color={profile.avatar_color} avatarUrl={profile.avatar_url} />
          </Link>
          <button
            onClick={signOut}
            className="hidden md:block text-sm text-cream/60 hover:text-cream"
          >
            {t.nav.logout}
          </button>
          <button
            className="md:hidden p-1"
            onClick={() => setOpen(o => !o)}
            aria-label="menu"
          >
            <svg className="w-5 h-5 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-cream/10 px-4 py-3 flex flex-col gap-3 bg-navy">
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
          <button onClick={signOut} className="text-sm text-cream/60 text-left pt-1 border-t border-cream/10">
            {t.nav.logout}
          </button>
        </div>
      )}
    </nav>
  )
}
