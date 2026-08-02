'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n/context'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { PhotoCarousel } from '@/components/PhotoCarousel'
import { splitOnFirstHr } from '@/lib/markdown-split'
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
  const { before, after } = splitOnFirstHr(content)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold font-display text-navy mb-6">{page?.title ?? 'A Casa'}</h1>
      {content
        ? <MarkdownRenderer content={before} />
        : <p className="text-navy/50">{t.common.no_data}</p>}
      <div className="my-6"><PhotoCarousel section="house" /></div>
      {after && <MarkdownRenderer content={after} />}
    </div>
  )
}

export function HouseContent() {
  return <ProtectedRoute><HouseContentInner /></ProtectedRoute>
}
