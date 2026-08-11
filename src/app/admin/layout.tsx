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
    { href: '/admin/markers',    label: t.admin.markers },
    { href: '/admin/content',    label: t.admin.content },
    { href: '/admin/photos',     label: t.admin.photos },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-navy mb-4">{t.admin.title}</h1>
      <div className="flex gap-2 border-b border-navy/15 mb-6">
        {tabs.map(tab => (
          <Link key={tab.href} href={tab.href}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              pathname.startsWith(tab.href)
                ? 'border-gold text-navy'
                : 'border-transparent text-navy/60 hover:text-navy'
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
