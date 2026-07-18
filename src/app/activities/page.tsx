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
    const mySignup = activity.activity_signups.find(s => s.user_id === profile.id)
    if (mySignup) {
      await supabase.from('activity_signups').delete().eq('id', mySignup.id)
    } else {
      await supabase.from('activity_signups').insert({ activity_id: activity.id, user_id: profile.id })
    }
    load()
  }

  async function setPlusGuests(activity: ActivityWithSignups, count: number) {
    if (!profile) return
    const mySignup = activity.activity_signups.find(s => s.user_id === profile.id)
    if (!mySignup) return
    await supabase.from('activity_signups').update({ plus_guests: count }).eq('id', mySignup.id)
    load()
  }

  if (loading) return <p className="text-gray-400">{t.common.loading}</p>

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.activities.title}</h1>
      {activities.length === 0 ? (
        <p className="text-gray-400">{t.activities.no_activities}</p>
      ) : (
        <div className="space-y-4">
          {activities.map(a => {
            const mySignup = a.activity_signups.find(s => s.user_id === profile?.id)
            return (
              <ActivityCard
                key={a.id}
                activity={a}
                isSignedUp={!!mySignup}
                myPlusGuests={mySignup?.plus_guests ?? 0}
                onToggle={() => toggleSignup(a)}
                onPlusGuests={count => setPlusGuests(a, count)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Activities() {
  return <ProtectedRoute><ActivitiesPage /></ProtectedRoute>
}
