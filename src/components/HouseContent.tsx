'use client'
import { useI18n } from '@/lib/i18n/context'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { PhotoCarousel } from '@/components/PhotoCarousel'
import { HouseMap } from '@/components/HouseMap'
import { PageHeader } from '@/components/brand/PageHeader'
import { parseHouseSegments } from '@/lib/house-segments'
import { HOUSE_CONTENT } from '@/lib/house-content'

function HouseContentInner() {
  const { lang, t } = useI18n()
  const { title, markdown } = HOUSE_CONTENT[lang]
  const segments = parseHouseSegments(markdown)

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader eyebrow={t.house.eyebrow} title={title} />
      {segments.map((seg, idx) => {
        if (seg.type === 'map') return <div key={idx} className="my-6"><HouseMap /></div>
        if (seg.type === 'photos') return <div key={idx} className="my-6"><PhotoCarousel section="house" /></div>
        return <MarkdownRenderer key={idx} content={seg.text} />
      })}
    </div>
  )
}

export function HouseContent() {
  return <ProtectedRoute><HouseContentInner /></ProtectedRoute>
}
