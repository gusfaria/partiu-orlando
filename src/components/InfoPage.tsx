'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n/context'
import { ProtectedRoute } from './ProtectedRoute'
import { MarkdownRenderer } from './MarkdownRenderer'
import { PhotoGallery } from './PhotoGallery'
import { PageHeader } from './brand/PageHeader'
import type { InfoPage as InfoPageType } from '@/types/database'

type Props = { slug: string; fallbackTitle: string; children?: React.ReactNode }

function InfoPageContent({ slug, fallbackTitle, children }: Props) {
  const { t } = useI18n()
  const [page, setPage] = useState<InfoPageType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('info_pages').select('*').eq('slug', slug).single()
      .then(({ data }) => { setPage(data); setLoading(false) })
  }, [slug])

  if (loading) return <p className="text-navy/50">{t.common.loading}</p>

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader eyebrow={slug === 'cars' ? t.cars.eyebrow : undefined} title={page?.title ?? fallbackTitle} />
      {slug === 'cars' && <PhotoGallery section={slug} />}
      {page?.content
        ? <MarkdownRenderer content={page.content} />
        : <p className="text-navy/50">{t.common.no_data}</p>
      }
      {children}
    </div>
  )
}

export function InfoPage(props: Props) {
  return <ProtectedRoute><InfoPageContent {...props} /></ProtectedRoute>
}
