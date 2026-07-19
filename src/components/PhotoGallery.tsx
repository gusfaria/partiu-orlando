'use client'
import { useEffect, useState } from 'react'
import { listSitePhotos, publicUrl } from '@/lib/photos'
import type { SitePhoto } from '@/types/database'

type Props = { section: SitePhoto['section'] }

export function PhotoGallery({ section }: Props) {
  const [photos, setPhotos] = useState<SitePhoto[]>([])

  useEffect(() => { listSitePhotos(section).then(setPhotos) }, [section])

  if (photos.length === 0) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
      {photos.map(p => {
        const url = publicUrl('photos', p.storage_path)
        return (
          <a key={p.id} href={url} target="_blank" rel="noopener noreferrer" className="block group">
            <img src={url} alt={p.caption ?? ''} loading="lazy"
              className="w-full aspect-[4/3] object-cover rounded-xl group-hover:opacity-90 transition-opacity" />
            {p.caption && <p className="text-xs text-gray-500 mt-1">{p.caption}</p>}
          </a>
        )
      })}
    </div>
  )
}
