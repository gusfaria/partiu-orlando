'use client'
import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { supabase } from '@/lib/supabase'
import { AvatarCircle } from '@/components/AvatarCircle'
import type { Profile } from '@/types/database'

const AVATAR_COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6',
                       '#ec4899','#14b8a6','#f97316','#06b6d4','#84cc16','#a855f7']

export default function AdminUsersPage() {
  const { t } = useI18n()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('name')
    setProfiles(data ?? [])
  }

  useEffect(() => { load() }, [])

  function startEdit(p: Profile) {
    setEditingId(p.id)
    setEditName(p.name)
    setEditColor(p.avatar_color)
  }

  async function saveEdit(id: string) {
    setSaving(true)
    await supabase.from('profiles').update({ name: editName, avatar_color: editColor }).eq('id', id)
    setSaving(false)
    setEditingId(null)
    load()
  }

  return (
    <div className="space-y-3">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        {t.admin.user_creation_note}
      </div>
      {profiles.map(p => (
        <div key={p.id} className="bg-white rounded-2xl border border-navy/10 shadow-[0_4px_0_rgba(26,37,54,0.08)] p-4">
          {editingId === p.id ? (
            <div className="space-y-3">
              <input value={editName} onChange={e => setEditName(e.target.value)}
                placeholder={t.admin.name}
                className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map(c => (
                  <button key={c} onClick={() => setEditColor(c)}
                    className={`w-7 h-7 rounded-full border-2 ${editColor === c ? 'border-gray-900' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => saveEdit(p.id)} disabled={saving}
                  className="px-4 py-2 bg-gold text-navy rounded-lg text-sm font-medium hover:brightness-105 disabled:opacity-50">
                  {saving ? '...' : t.admin.save}
                </button>
                <button onClick={() => setEditingId(null)}
                  className="px-4 py-2 bg-navy/5 text-navy/70 rounded-lg text-sm hover:bg-navy/10">
                  {t.admin.cancel}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AvatarCircle name={p.name} color={p.avatar_color} avatarUrl={p.avatar_url} />
                <div>
                  <p className="font-semibold text-navy">{p.name}</p>
                  {p.is_admin && <p className="text-xs text-navy">admin</p>}
                </div>
              </div>
              <button onClick={() => startEdit(p)}
                className="px-3 py-1.5 border border-navy/15 rounded-lg text-sm text-navy/70 hover:bg-navy/5">
                {t.admin.edit}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
