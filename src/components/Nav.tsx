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
            className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded px-2 py-1"
          >
            {lang === 'pt' ? 'EN' : 'PT'}
          </button>
          <Link href="/profile" title={t.nav.profile}>
            <AvatarCircle name={profile.name} color={profile.avatar_color} avatarUrl={profile.avatar_url} />
          </Link>
          <button
            onClick={signOut}
            className="hidden md:block text-sm text-gray-400 hover:text-gray-700"
          >
            {t.nav.logout}
          </button>
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
