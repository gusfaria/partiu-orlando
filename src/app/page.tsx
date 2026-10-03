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
