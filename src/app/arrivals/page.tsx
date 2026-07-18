'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n/context'
import { supabase } from '@/lib/supabase'
import { AvatarCircle } from '@/components/AvatarCircle'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import type { Profile, Arrival } from '@/types/database'

type Row = Profile & { arrival: Arrival | null }

type EditState = {
  arrival_date: string
  departure_date: string
  notes: string
}

function ArrivalsPage() {
  const { t, lang } = useI18n()
  const { profile: me } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ arrival_date: '', departure_date: '', notes: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data: profiles } = await supabase.from('profiles').select('*').order('name')
    const { data: arrivals } = await supabase.from('arrivals').select('*')
    if (!profiles) return
    setRows(profiles.map(p => ({
      ...p,
      arrival: arrivals?.find(a => a.user_id === p.id) ?? null,
    })))
  }

  useEffect(() => { load() }, [])

  function startEdit(row: Row) {
    setEditingId(row.id)
    setEditState({
      arrival_date:   row.arrival?.arrival_date   ?? '',
      departure_date: row.arrival?.departure_date ?? '',
      notes:          row.arrival?.notes          ?? '',
    })
  }

  async function saveEdit(userId: string) {
    setSaving(true)
    await supabase.from('arrivals').upsert({
      user_id:        userId,
      arrival_date:   editState.arrival_date   || null,
      departure_date: editState.departure_date || null,
      notes:          editState.notes          || null,
      updated_at:     new Date().toISOString(),
    }, { onConflict: 'user_id' })
    setSaving(false)
    setEditingId(null)
    load()
  }

  function fmt(dateStr: string | null) {
    if (!dateStr) return t.arrivals.not_filled
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(
      lang === 'pt' ? 'pt-BR' : 'en-US',
      { day: '2-digit', month: '2-digit', year: 'numeric' }
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.arrivals.title}</h1>
      <div className="space-y-3">
        {rows.map(row => (
          <div key={row.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            {editingId === row.id ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-2">
                  <AvatarCircle name={row.name} color={row.avatar_color} />
                  <span className="font-semibold text-gray-900">{row.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t.arrivals.arrival}</label>
                    <input type="date" value={editState.arrival_date}
                      onChange={e => setEditState(s => ({ ...s, arrival_date: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t.arrivals.departure}</label>
                    <input type="date" value={editState.departure_date}
                      onChange={e => setEditState(s => ({ ...s, departure_date: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t.arrivals.notes}</label>
                  <input type="text" value={editState.notes}
                    onChange={e => setEditState(s => ({ ...s, notes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(row.id)} disabled={saving}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
                    {saving ? '...' : t.arrivals.save}
                  </button>
                  <button onClick={() => setEditingId(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                    {t.arrivals.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <AvatarCircle name={row.name} color={row.avatar_color} />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{row.name}</p>
                    <p className="text-sm text-gray-500">
                      {fmt(row.arrival?.arrival_date ?? null)} → {fmt(row.arrival?.departure_date ?? null)}
                    </p>
                    {row.arrival?.notes && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{row.arrival.notes}</p>
                    )}
                  </div>
                </div>
                {me?.id === row.id && (
                  <button onClick={() => startEdit(row)}
                    className="shrink-0 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    {t.arrivals.edit}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Arrivals() {
  return <ProtectedRoute><ArrivalsPage /></ProtectedRoute>
}
