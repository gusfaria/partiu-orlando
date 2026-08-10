'use client'
import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { AvatarCircle } from '@/components/AvatarCircle'
import type { Profile } from '@/types/database'

const AVATAR_COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6',
                       '#ec4899','#14b8a6','#f97316','#06b6d4','#84cc16','#a855f7']

export default function AdminUsersPage() {
  const { t } = useI18n()
  const { profile: me } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('name')
    setProfiles(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function toggleAdmin(p: Profile) {
    const next = !p.is_admin
    setTogglingId(p.id)
    // optimistic
    setProfiles(prev => prev.map(x => x.id === p.id ? { ...x, is_admin: next } : x))
    const { error } = await supabase.from('profiles').update({ is_admin: next }).eq('id', p.id)
    if (error) {
      // revert on failure
      setProfiles(prev => prev.map(x => x.id === p.id ? { ...x, is_admin: p.is_admin } : x))
    }
    setTogglingId(null)
  }

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
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <AvatarCircle name={p.name} color={p.avatar_color} avatarUrl={p.avatar_url} />
                <div className="min-w-0">
                  <p className="font-semibold text-navy truncate">
                    {p.name}
                    {p.id === me?.id && <span className="ml-1 text-xs font-normal text-navy/50">({t.admin.you})</span>}
                  </p>
                  {p.email && <p className="text-xs text-navy/60 truncate">{p.email}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {(() => {
                  const isSelf = p.id === me?.id
                  const lockSelf = isSelf && p.is_admin  // can't remove your own admin
                  const disabled = lockSelf || togglingId === p.id
                  return (
                    <label className="flex items-center gap-1.5 select-none" title={lockSelf ? t.admin.you : undefined}>
                      <span className="text-xs text-navy/60">{t.admin.admin_role}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={p.is_admin}
                        disabled={disabled}
                        onClick={() => toggleAdmin(p)}
                        className={`relative w-10 h-6 rounded-full transition-colors ${p.is_admin ? 'bg-gold' : 'bg-navy/15'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${p.is_admin ? 'translate-x-4' : ''}`} />
                      </button>
                    </label>
                  )
                })()}
                <button onClick={() => startEdit(p)}
                  className="px-3 py-1.5 border border-navy/15 rounded-lg text-sm text-navy/70 hover:bg-navy/5">
                  {t.admin.edit}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
