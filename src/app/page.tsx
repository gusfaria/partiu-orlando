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
