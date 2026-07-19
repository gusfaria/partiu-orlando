'use client'
import { useRef, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n/context'
import { supabase } from '@/lib/supabase'
import { uploadAvatar } from '@/lib/photos'
import { AvatarCircle } from '@/components/AvatarCircle'
import { ProtectedRoute } from '@/components/ProtectedRoute'

const AVATAR_COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6',
                       '#ec4899','#14b8a6','#f97316','#06b6d4','#84cc16','#a855f7']

function ProfilePage() {
  const { t } = useI18n()
  const { profile, refreshProfile } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null)
  const [name, setName] = useState(profile?.name ?? '')
  const [color, setColor] = useState(profile?.avatar_color ?? AVATAR_COLORS[0])
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  if (!profile) return null

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setBusy(true); setError('')
    try {
      setAvatarUrl(await uploadAvatar(profile.id, file))
      await refreshProfile()
    } catch {
      setError(t.profile.invalid_file)
    }
    setBusy(false)
  }

  async function save() {
    setBusy(true)
    await supabase.from('profiles').update({ name, avatar_color: color }).eq('id', profile!.id)
    await refreshProfile()
    setBusy(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.profile.title}</h1>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-4">
          <AvatarCircle name={name || profile.name} color={color} avatarUrl={avatarUrl} size="lg" />
          <div>
            <button onClick={() => fileRef.current?.click()} disabled={busy}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
              {busy ? t.profile.uploading : t.profile.upload}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t.profile.name}</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <div>
          <p className="block text-xs text-gray-500 mb-2">{t.profile.color}</p>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 ${color === c ? 'border-gray-900' : 'border-transparent'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={busy}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
            {t.profile.save}
          </button>
          {saved && <span className="text-sm text-green-600">{t.profile.saved}</span>}
        </div>
      </div>
    </div>
  )
}

export default function Profile() {
  return <ProtectedRoute><ProfilePage /></ProtectedRoute>
}
