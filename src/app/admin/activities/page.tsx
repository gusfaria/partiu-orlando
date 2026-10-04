'use client'
import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { supabase } from '@/lib/supabase'
import { BrandButton } from '@/components/brand/BrandButton'
import { FIELD_LABEL_CLASS, INPUT_CLASS } from '@/components/brand/styles'
import type { Activity } from '@/types/database'

type ActivityForm = Omit<Activity, 'id' | 'created_at'>

const EMPTY: ActivityForm = {
  title: '', description: '', activity_date: null, activity_time: null,
  cost_per_person: null, cost_notes: null, ticket_url: null, display_order: 0,
}

export default function AdminActivitiesPage() {
  const { t } = useI18n()
  const [activities, setActivities] = useState<Activity[]>([])
  const [form, setForm] = useState<ActivityForm | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('activities').select('*').order('display_order')
    setActivities(data ?? [])
  }

  useEffect(() => { load() }, [])

  function startCreate() { setEditingId(null); setForm({ ...EMPTY }) }

  function startEdit(a: Activity) {
    setEditingId(a.id)
    const { id: _id, created_at: _created, ...rest } = a
    setForm(rest)
  }

  async function save() {
    if (!form) return
    setSaving(true)
    if (editingId) {
      await supabase.from('activities').update(form).eq('id', editingId)
    } else {
      await supabase.from('activities').insert(form)
    }
    setSaving(false)
    setForm(null)
    setEditingId(null)
    load()
  }

  async function remove(id: string) {
    if (!confirm(t.common.confirm_delete)) return
    await supabase.from('activities').delete().eq('id', id)
    load()
  }

  function textField(key: keyof ActivityForm, label: string, type = 'text') {
    return (
      <div key={key}>
        <label className={FIELD_LABEL_CLASS}>{label}</label>
        <input type={type} value={String(form?.[key] ?? '')}
          onChange={e => setForm(f => ({ ...f!, [key]: e.target.value === '' ? null : e.target.value }))}
          className={INPUT_CLASS} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!form && (
        <BrandButton onClick={startCreate}>
          + {t.admin.create_activity}
        </BrandButton>
      )}

      {form && (
        <div className="bg-white rounded-2xl border border-navy/10 shadow-[0_4px_0_rgba(26,37,54,0.08)] p-5 space-y-3">
          <h3 className="font-semibold text-navy">{editingId ? t.admin.edit : t.admin.create_activity}</h3>
          {textField('title', t.admin.activity_title)}
          <div>
            <label className={FIELD_LABEL_CLASS}>{t.admin.description}</label>
            <textarea value={form.description ?? ''} rows={6}
              onChange={e => setForm(f => ({ ...f!, description: e.target.value }))}
              className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold resize-none" />
            <p className="mt-1 text-xs text-navy/70">{t.admin.description_hint}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {textField('activity_date', t.admin.activity_date, 'date')}
            {textField('activity_time', t.admin.activity_time, 'time')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {textField('cost_per_person', t.admin.cost_per_person, 'number')}
            <div>
              <label className={FIELD_LABEL_CLASS}>{t.admin.display_order}</label>
              <input type="number" value={form.display_order}
                onChange={e => setForm(f => ({ ...f!, display_order: Number(e.target.value) || 0 }))}
                className={INPUT_CLASS} />
            </div>
          </div>
          {textField('cost_notes', t.admin.cost_notes)}
          {textField('ticket_url', t.admin.ticket_url, 'url')}
          <div className="flex gap-2 pt-2">
            <BrandButton onClick={save} disabled={saving || !form.title}>
              {saving ? '...' : t.admin.save}
            </BrandButton>
            <BrandButton variant="secondary" onClick={() => { setForm(null); setEditingId(null) }}>
              {t.admin.cancel}
            </BrandButton>
          </div>
        </div>
      )}

      {activities.map(a => (
        <div key={a.id} className="bg-white rounded-2xl border border-navy/10 shadow-[0_4px_0_rgba(26,37,54,0.08)] p-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-navy">{a.title}</p>
            <p className="text-sm text-navy/50">
              {a.activity_date ?? '—'} {a.activity_time ? `• ${a.activity_time.slice(0, 5)}` : ''}
            </p>
            {a.cost_per_person != null && (
              <p className="text-sm text-navy/50">$ {Number(a.cost_per_person).toFixed(2)}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <BrandButton variant="quiet" onClick={() => startEdit(a)}>
              {t.admin.edit}
            </BrandButton>
            <BrandButton variant="danger-quiet" onClick={() => remove(a.id)}>
              {t.admin.delete}
            </BrandButton>
          </div>
        </div>
      ))}
    </div>
  )
}
