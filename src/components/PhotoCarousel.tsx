'use client'
import { useEffect, useState } from 'react'
import { listSitePhotos, publicUrl } from '@/lib/photos'
import type { SitePhoto } from '@/types/database'

type Props = { section: SitePhoto['section'] }

export function PhotoCarousel({ section }: Props) {
  const [photos, setPhotos] = useState<SitePhoto[]>([])
  const [i, setI] = useState(0)
  const [touchX, setTouchX] = useState<number | null>(null)

  useEffect(() => { listSitePhotos(section).then(ps => { setPhotos(ps); setI(0) }) }, [section])

  if (photos.length === 0) return null

  const go = (n: number) => setI(prev => (prev + n + photos.length) % photos.length)
  const photo = photos[i]
  const url = publicUrl('photos', photo.storage_path)

  return (
    <div>
      <div className="relative"
        onTouchStart={e => setTouchX(e.touches[0].clientX)}
        onTouchEnd={e => {
          if (touchX === null) return
          const dx = e.changedTouches[0].clientX - touchX
          if (dx > 40) go(-1)
          else if (dx < -40) go(1)
          setTouchX(null)
        }}>
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          <img src={url} alt={photo.caption ?? `foto ${i + 1}`}
            className="w-full h-64 md:h-80 object-cover rounded-2xl border border-navy/10" />
        </a>
        {photos.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gold text-navy text-xl font-bold shadow-[0_2px_0_rgba(26,37,54,0.25)] hover:brightness-105 flex items-center justify-center">‹</button>
            <button type="button" onClick={() => go(1)} aria-label="próximo"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gold text-navy text-xl font-bold shadow-[0_2px_0_rgba(26,37,54,0.25)] hover:brightness-105 flex items-center justify-center">›</button>
          </>
        )}
      </div>
      {photo.caption && <p className="text-xs text-navy/60 mt-1 font-ticket text-center">{photo.caption}</p>}
      {photos.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {photos.map((p, n) => (
            <button key={p.id} type="button" onClick={() => setI(n)} aria-label={`foto ${n + 1}`}
              className={`h-2.5 rounded-full transition-all ${n === i ? 'w-5 bg-gold ring-1 ring-navy/30' : 'w-2.5 bg-navy/25 hover:bg-navy/40'}`} />
          ))}
        </div>
      )}
    </div>
  )
}
