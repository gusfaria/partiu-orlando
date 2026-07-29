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
        <Link href="/house" className="inline-block font-display text-sm text-navy underline decoration-gold decoration-2 underline-offset-2 font-semibold mt-2">
          {t.dashboard.facts_house_link}
        </Link>
      </TicketCard>

      {todo.length > 0 && (
        <TicketCard label={t.dashboard.checklist_title} accent="gold">
          <div className="space-y-1.5">
            {todo.map(item => (
              <Link key={item.key} href={item.href}
                className="block text-sm text-navy/80 hover:underline hover:decoration-gold">
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
