'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n/context'
import { supabase } from '@/lib/supabase'
import { isArrivalEventFormValid, type ArrivalEventFormValue } from '@/lib/arrival-event'
import { AvatarCircle } from './AvatarCircle'
import { ArrivalEventCard } from './ArrivalEventCard'
import { ProtectedRoute } from './ProtectedRoute'
import type { ArrivalEventWithPeople, Profile } from '@/types/database'

const EMPTY: ArrivalEventFormValue = {
  description: '', transportation: '', arrival_date: '', arrival_time: '',
  departure_date: '', departure_time: '', personIds: [],
}

function ArrivalEventsContent() {
  const { t } = useI18n()
  const { profile } = useAuth()
  const [events, setEvents] = useState<ArrivalEventWithPeople[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [form, setForm] = useState<ArrivalEventFormValue | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const { data } = await supabase
      .from('arrival_events')
      .select('*, arrival_event_people(*, profiles(*))')
      .order('created_at')
    setEvents((data as ArrivalEventWithPeople[]) ?? [])
  }

  useEffect(() => {
    load()
    supabase.from('profiles').select('*').order('name').then(({ data }) => setProfiles(data ?? []))
  }, [])

  function startCreate() {
    setEditingId(null)
    setForm({ ...EMPTY })
  }

  function startEdit(event: ArrivalEventWithPeople) {
    setEditingId(event.id)
    setForm({
      description: event.description,
      transportation: event.transportation,
      arrival_date: event.arrival_date ?? '',
      arrival_time: event.arrival_time?.slice(0, 5) ?? '',
      departure_date: event.departure_date ?? '',
      departure_time: event.departure_time?.slice(0, 5) ?? '',
      personIds: event.arrival_event_people.map(p => p.user_id),
    })
  }

  function togglePerson(id: string) {
    setForm(f => {
      if (!f) return f
      const has = f.personIds.includes(id)
      return { ...f, personIds: has ? f.personIds.filter(x => x !== id) : [...f.personIds, id] }
    })
  }

  async function save() {
    if (!form || !isArrivalEventFormValid(form) || !profile) return
    setSaving(true)
    setError('')
    const row = {
      description: form.description,
      transportation: form.transportation,
      arrival_date: form.arrival_date || null,
      arrival_time: form.arrival_time || null,
      departure_date: form.departure_date || null,
      departure_time: form.departure_time || null,
    }
    let eventId = editingId
    if (editingId) {
      const { error: updateError } = await supabase.from('arrival_events').update(row).eq('id', editingId)
      if (updateError) {
        setError(t.common.error)
        setSaving(false)
        return
      }
      const { error: deleteError } = await supabase.from('arrival_event_people').delete().eq('event_id', editingId)
      if (deleteError) {
        setError(t.common.error)
        setSaving(false)
        return
      }
    } else {
      const { data, error: insertError } = await supabase.from('arrival_events')
        .insert({ ...row, created_by: profile.id }).select('id').single()
      if (insertError) {
        setError(t.common.error)
        setSaving(false)
        return
      }
      eventId = data?.id ?? null
    }
    if (eventId) {
      const { error: peopleError } = await supabase.from('arrival_event_people')
        .insert(form.personIds.map(user_id => ({ event_id: eventId, user_id })))
      if (peopleError) {
        setError(t.common.error)
        setSaving(false)
        return
      }
    }
    setSaving(false)
    setForm(null)
    setEditingId(null)
    load()
  }

  async function remove(event: ArrivalEventWithPeople) {
    if (!confirm(t.common.confirm_delete)) return
    // arrival_event_people rows cascade-delete with the event
    await supabase.from('arrival_events').delete().eq('id', event.id)
    load()
  }

  function textField(key: 'description', label: string) {
    return (
      <div>
        <label className="block text-xs text-gray-500 mb-1">{label}</label>
        <input type="text" value={form?.[key] ?? ''}
          onChange={e => setForm(f => ({ ...f!, [key]: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
      </div>
    )
  }

  function dateTimeField(dateKey: 'arrival_date' | 'departure_date', timeKey: 'arrival_time' | 'departure_time',
    dateLabel: string, timeLabel: string) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">{dateLabel}</label>
          <input type="date" value={form?.[dateKey] ?? ''}
            onChange={e => setForm(f => ({ ...f!, [dateKey]: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{timeLabel}</label>
          <input type="time" value={form?.[timeKey] ?? ''}
            onChange={e => setForm(f => ({ ...f!, [timeKey]: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.arrivals.title}</h1>

      {!form && (
        <button onClick={startCreate}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 mb-4">
          + {t.arrivals.add}
        </button>
      )}

      {form && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t.arrivals.people}</label>
            <div className="flex flex-wrap gap-2">
              {profiles.map(p => {
                const selected = form.personIds.includes(p.id)
                return (
                  <button key={p.id} type="button" onClick={() => togglePerson(p.id)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-sm transition-colors ${
                      selected ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>
                    <AvatarCircle name={p.name} color={p.avatar_color} avatarUrl={p.avatar_url} size="sm" />
                    {p.name}
                  </button>
                )
              })}
            </div>
          </div>

          {textField('description', t.arrivals.description)}

          <div>
            <label className="block text-xs text-gray-500 mb-1">{t.arrivals.transportation}</label>
            <select value={form.transportation}
              onChange={e => setForm(f => ({ ...f!, transportation: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
              <option value="">—</option>
              <option value="Carro">{t.arrivals.transport_car}</option>
              <option value="Trem">{t.arrivals.transport_train}</option>
              <option value="Avião">{t.arrivals.transport_plane}</option>
            </select>
          </div>

          {dateTimeField('arrival_date', 'arrival_time', t.arrivals.arrival_date, t.arrivals.arrival_time)}
          {dateTimeField('departure_date', 'departure_time', t.arrivals.departure_date, t.arrivals.departure_time)}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving || !isArrivalEventFormValid(form)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
              {saving ? '...' : t.arrivals.save}
            </button>
            <button onClick={() => { setForm(null); setEditingId(null) }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
              {t.arrivals.cancel}
            </button>
          </div>
        </div>
      )}

      {events.length === 0 && !form && (
        <p className="text-gray-400 text-sm">{t.arrivals.empty}</p>
      )}

      <div className="space-y-3">
        {events.map(event => (
          <ArrivalEventCard key={event.id} event={event}
            onEdit={() => startEdit(event)} onDelete={() => remove(event)} />
        ))}
      </div>
    </div>
  )
}

export function ArrivalEventsSection() {
  return <ProtectedRoute><ArrivalEventsContent /></ProtectedRoute>
}
