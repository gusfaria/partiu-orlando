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
