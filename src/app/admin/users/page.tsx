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
        <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          {editingId === p.id ? (
            <div className="space-y-3">
              <input value={editName} onChange={e => setEditName(e.target.value)}
                placeholder={t.admin.name}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map(c => (
                  <button key={c} onClick={() => setEditColor(c)}
                    className={`w-7 h-7 rounded-full border-2 ${editColor === c ? 'border-gray-900' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => saveEdit(p.id)} disabled={saving}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
                  {saving ? '...' : t.admin.save}
                </button>
                <button onClick={() => setEditingId(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                  {t.admin.cancel}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AvatarCircle name={p.name} color={p.avatar_color} />
                <div>
                  <p className="font-semibold text-gray-900">{p.name}</p>
                  {p.is_admin && <p className="text-xs text-orange-500">admin</p>}
                </div>
              </div>
              <button onClick={() => startEdit(p)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                {t.admin.edit}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
