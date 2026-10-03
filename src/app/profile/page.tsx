'use client'
import { useRef, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n/context'
import { supabase } from '@/lib/supabase'
import { uploadAvatar } from '@/lib/photos'
import { AvatarCircle } from '@/components/AvatarCircle'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { BrandButton } from '@/components/brand/BrandButton'
import { PageHeader } from '@/components/brand/PageHeader'
import { CARD_CLASS, DIVIDER_CLASS, FIELD_LABEL_CLASS, META_LABEL_CLASS } from '@/components/brand/styles'
import { mrzLine } from '@/lib/passport'

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
      <PageHeader eyebrow={t.profile.eyebrow} title={t.profile.title} />
      <div className={CARD_CLASS}>
        <div className="flex items-center justify-between bg-navy px-4 py-2 font-ticket text-[10px] uppercase tracking-widest text-gold">
          <span>{t.profile.passport_title}</span>
          <span aria-hidden="true" className="text-base">🏰</span>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-end gap-4">
            <AvatarCircle name={name || profile.name} color={color} avatarUrl={avatarUrl} size="portrait" />
            <div className="min-w-0">
              <p className={META_LABEL_CLASS}>{t.profile.traveler}</p>
              <p className="truncate font-display text-xl font-bold text-navy">{name || profile.name}</p>
              <BrandButton variant="quiet" onClick={() => fileRef.current?.click()} disabled={busy} className="mt-1">
                {busy ? t.profile.uploading : t.profile.upload}
              </BrandButton>
              <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
              {error && <p className="text-red-700 text-xs mt-1">{error}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="profile-name" className={FIELD_LABEL_CLASS}>{t.profile.name}</label>
            <input id="profile-name" value={name} onChange={e => setName(e.target.value)}
              className="w-full border-0 border-b-[1.5px] border-navy/35 bg-transparent px-0 py-1.5 text-base font-semibold text-navy focus:outline-none focus:border-gold focus:ring-0" />
          </div>

          <div>
            <p className={FIELD_LABEL_CLASS}>{t.profile.color}</p>
            <div className="mt-1 flex flex-wrap gap-2.5">
              {AVATAR_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  aria-label={c} aria-pressed={color === c}
                  className={`w-7 h-7 rounded-full ${color === c ? 'ring-2 ring-navy ring-offset-2' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <BrandButton onClick={save} disabled={busy}>{t.profile.save}</BrandButton>
            {saved && <span className="text-sm text-green-700">{t.profile.saved}</span>}
          </div>
        </div>

        <p aria-hidden="true"
          className={`overflow-hidden whitespace-nowrap px-4 py-2 font-ticket text-[10px] tracking-wider text-navy/40 ${DIVIDER_CLASS}`}>
          {mrzLine(name || profile.name)}
        </p>
      </div>
    </div>
  )
}

export default function Profile() {
  return <ProtectedRoute><ProfilePage /></ProtectedRoute>
}
