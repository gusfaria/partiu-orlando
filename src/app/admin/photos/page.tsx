'use client'
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { supabase } from '@/lib/supabase'
import { uploadSitePhoto, listSitePhotos, deleteSitePhoto, publicUrl } from '@/lib/photos'
import type { SitePhoto } from '@/types/database'

const SECTIONS = ['house', 'cars', 'hero'] as const

export default function AdminPhotosPage() {
  const { t } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)
  const [section, setSection] = useState<SitePhoto['section']>('house')
  const [photos, setPhotos] = useState<SitePhoto[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const labels: Record<SitePhoto['section'], string> = {
    house: t.admin.photos_house, cars: t.admin.photos_cars, hero: t.admin.photos_hero,
  }

  async function load() { setPhotos(await listSitePhotos(section)) }
  useEffect(() => { load() }, [section])

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setBusy(true); setError('')
    try {
      for (const file of files) await uploadSitePhoto(section, file)
    } catch {
      setError(t.profile.invalid_file)
    }
    if (fileRef.current) fileRef.current.value = ''
    setBusy(false)
    load()
  }

  async function saveCaption(photo: SitePhoto, caption: string) {
    await supabase.from('site_photos').update({ caption: caption || null }).eq('id', photo.id)
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= photos.length) return
    const a = photos[index], b = photos[target]
    await supabase.from('site_photos').update({ display_order: target }).eq('id', a.id)
    await supabase.from('site_photos').update({ display_order: index }).eq('id', b.id)
    load()
  }

  async function remove(photo: SitePhoto) {
    if (!confirm(t.common.confirm_delete)) return
    await deleteSitePhoto(photo)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {SECTIONS.map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              section === s ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {labels[s]}
          </button>
        ))}
      </div>

      {section === 'hero' && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
          {t.admin.photos_hero_note}
        </p>
      )}

      <button onClick={() => fileRef.current?.click()} disabled={busy}
        className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
        {busy ? t.profile.uploading : `+ ${t.admin.photos_upload}`}
      </button>
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFiles} className="hidden" />
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {photos.map((p, i) => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 space-y-2">
            <img src={publicUrl('photos', p.storage_path)} alt=""
              className="w-full aspect-[4/3] object-cover rounded-lg" />
            <input defaultValue={p.caption ?? ''} placeholder={t.admin.photos_caption}
              onBlur={e => saveCaption(p, e.target.value)}
              className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400" />
            <div className="flex justify-between">
              <div className="flex gap-1">
                <button onClick={() => move(i, -1)} disabled={i === 0}
                  className="px-2 py-0.5 border border-gray-200 rounded text-xs disabled:opacity-30">↑</button>
                <button onClick={() => move(i, 1)} disabled={i === photos.length - 1}
                  className="px-2 py-0.5 border border-gray-200 rounded text-xs disabled:opacity-30">↓</button>
              </div>
              <button onClick={() => remove(p)}
                className="px-2 py-0.5 border border-red-200 text-red-600 rounded text-xs hover:bg-red-50">✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
