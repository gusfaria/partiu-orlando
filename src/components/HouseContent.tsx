'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n/context'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { PhotoCarousel } from '@/components/PhotoCarousel'
import { HouseMap } from '@/components/HouseMap'
import { parseHouseSegments } from '@/lib/house-segments'
import type { InfoPage as InfoPageType } from '@/types/database'

function HouseContentInner() {
  const { t } = useI18n()
  const [page, setPage] = useState<InfoPageType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('info_pages').select('*').eq('slug', 'house').single()
      .then(({ data }) => { setPage(data); setLoading(false) })
  }, [])

  if (loading) return <p className="text-navy/50">{t.common.loading}</p>

  const content = page?.content ?? ''
  const segments = parseHouseSegments(content)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold font-display text-navy mb-6">{page?.title ?? 'A Casa'}</h1>
      {content
        ? segments.map((seg, idx) => {
            if (seg.type === 'map') return <div key={idx} className="my-6"><HouseMap /></div>
            if (seg.type === 'photos') return <div key={idx} className="my-6"><PhotoCarousel section="house" /></div>
            return <MarkdownRenderer key={idx} content={seg.text} />
          })
        : <p className="text-navy/50">{t.common.no_data}</p>}
    </div>
  )
}

export function HouseContent() {
  return <ProtectedRoute><HouseContentInner /></ProtectedRoute>
}
