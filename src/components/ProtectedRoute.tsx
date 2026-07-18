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
