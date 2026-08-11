'use client'
import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { supabase } from '@/lib/supabase'
import type { CalendarMarker } from '@/types/database'

type MarkerForm = Omit<CalendarMarker, 'id' | 'created_at'>

const DEFAULT_EMOJI = '📌'
const EMOJI_QUICK = ['📌', '🏠', '🔑', '🧳', '🏖️', '🎉', '🍽️', '🏊', '🎂', '✨', '🚗']

const EMPTY: MarkerForm = { label: '', emoji: DEFAULT_EMOJI, event_date: '', event_time: null, display_order: 0 }

export default function AdminMarkersPage() {
  const { t } = useI18n()
  const [markers, setMarkers] = useState<CalendarMarker[]>([])
  const [form, setForm] = useState<MarkerForm | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('calendar_markers').select('*').order('event_date')
    setMarkers(data ?? [])
  }

  useEffect(() => { load() }, [])

  function startCreate() { setEditingId(null); setForm({ ...EMPTY }) }

  function startEdit(m: CalendarMarker) {
    setEditingId(m.id)
    const { id: _id, created_at: _created, ...rest } = m
    setForm(rest)
  }

  async function save() {
    if (!form) return
    const row = { ...form, emoji: form.emoji.trim() || DEFAULT_EMOJI }
    setSaving(true)
    if (editingId) {
      await supabase.from('calendar_markers').update(row).eq('id', editingId)
    } else {
      await supabase.from('calendar_markers').insert(row)
    }
    setSaving(false)
    setForm(null)
    setEditingId(null)
    load()
  }

  async function remove(id: string) {
    if (!confirm(t.common.confirm_delete)) return
    await supabase.from('calendar_markers').delete().eq('id', id)
    load()
  }

  return (
    <div className="space-y-4">
      {!form && (
        <button onClick={startCreate}
          className="px-4 py-2 bg-gold text-navy rounded-lg text-sm font-medium hover:brightness-105">
          + {t.admin.create_marker}
        </button>
      )}

      {form && (
        <div className="bg-white rounded-2xl border border-navy/10 shadow-[0_4px_0_rgba(26,37,54,0.08)] p-5 space-y-3">
          <h3 className="font-semibold text-navy">{editingId ? t.admin.edit : t.admin.create_marker}</h3>

          <div>
            <label className="block text-xs text-navy/50 mb-1">{t.admin.marker_label}</label>
            <input type="text" value={form.label}
              onChange={e => setForm(f => ({ ...f!, label: e.target.value }))}
              className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
          </div>

          <div>
            <label className="block text-xs text-navy/50 mb-1">{t.admin.marker_emoji}</label>
            <div className="flex items-center gap-2">
              <input type="text" value={form.emoji} maxLength={4}
                onChange={e => setForm(f => ({ ...f!, emoji: e.target.value }))}
                className="w-16 text-center text-xl border border-navy/20 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold" />
              <div className="flex flex-wrap gap-1">
                {EMOJI_QUICK.map(em => (
                  <button key={em} type="button" onClick={() => setForm(f => ({ ...f!, emoji: em }))}
                    className={`w-8 h-8 rounded-lg text-lg border ${
                      form.emoji === em ? 'border-gold bg-gold/10' : 'border-navy/15 hover:bg-navy/5'
                    }`}>
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-navy/50 mb-1">{t.admin.activity_date}</label>
              <input type="date" value={form.event_date}
                onChange={e => setForm(f => ({ ...f!, event_date: e.target.value }))}
                className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
            </div>
            <div>
              <label className="block text-xs text-navy/50 mb-1">{t.admin.display_order}</label>
              <input type="number" value={form.display_order}
                onChange={e => setForm(f => ({ ...f!, display_order: Number(e.target.value) || 0 }))}
                className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-navy select-none">
              <input type="checkbox" checked={form.event_time === null}
                onChange={e => setForm(f => ({ ...f!, event_time: e.target.checked ? null : '12:00' }))}
                className="w-4 h-4 accent-gold" />
              {t.admin.marker_full_day}
            </label>
            {form.event_time !== null && (
              <div>
                <label className="block text-xs text-navy/50 mb-1">{t.admin.activity_time}</label>
                <input type="time" value={form.event_time}
                  onChange={e => setForm(f => ({ ...f!, event_time: e.target.value || null }))}
                  className="border border-navy/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving || !form.label || !form.event_date}
              className="px-4 py-2 bg-gold text-navy rounded-lg text-sm font-medium hover:brightness-105 disabled:opacity-50">
              {saving ? '...' : t.admin.save}
            </button>
            <button onClick={() => { setForm(null); setEditingId(null) }}
              className="px-4 py-2 bg-navy/5 text-navy/70 rounded-lg text-sm hover:bg-navy/10">
              {t.admin.cancel}
            </button>
          </div>
        </div>
      )}

      {markers.map(m => (
        <div key={m.id} className="bg-white rounded-2xl border border-navy/10 shadow-[0_4px_0_rgba(26,37,54,0.08)] p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl shrink-0">{m.emoji}</span>
            <div className="min-w-0">
              <p className="font-semibold text-navy truncate">{m.label}</p>
              <p className="text-sm text-navy/50">
                {m.event_date}
                {m.event_time ? ` • ${m.event_time.slice(0, 5)}` : ` • ${t.admin.marker_full_day}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => startEdit(m)}
              className="px-3 py-1.5 border border-navy/15 rounded-lg text-sm text-navy/70 hover:bg-navy/5">
              {t.admin.edit}
            </button>
            <button onClick={() => remove(m.id)}
              className="px-3 py-1.5 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50">
              {t.admin.delete}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
