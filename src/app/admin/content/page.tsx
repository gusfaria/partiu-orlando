'use client'
import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { supabase } from '@/lib/supabase'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import type { InfoPage } from '@/types/database'

const SLUGS = ['schedule', 'house', 'cars', 'explore'] as const

export default function AdminContentPage() {
  const { t } = useI18n()
  const [pages, setPages] = useState<InfoPage[]>([])
  const [activeSlug, setActiveSlug] = useState<string>('schedule')
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    supabase.from('info_pages').select('*').then(({ data }) => setPages(data ?? []))
  }, [])

  useEffect(() => {
    const active = pages.find(p => p.slug === activeSlug)
    setDraft(active?.content ?? '')
    setSaved(false)
    setPreview(false)
  }, [activeSlug, pages])

  async function saveContent() {
    setSaving(true)
    await supabase.from('info_pages')
      .update({ content: draft, updated_at: new Date().toISOString() })
      .eq('slug', activeSlug)
    setPages(ps => ps.map(p => p.slug === activeSlug ? { ...p, content: draft } : p))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {SLUGS.map(slug => (
          <button key={slug} onClick={() => setActiveSlug(slug)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              activeSlug === slug ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {pages.find(p => p.slug === slug)?.title ?? slug}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Markdown</p>
        <button onClick={() => setPreview(v => !v)}
          className="text-sm text-orange-500 hover:underline">
          {preview ? t.admin.edit_content : 'Preview'}
        </button>
      </div>

      {preview ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 min-h-[300px]">
          <MarkdownRenderer content={draft} />
        </div>
      ) : (
        <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={20}
          placeholder="Escreva em Markdown..."
          className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 resize-y" />
      )}

      <div className="flex items-center gap-3">
        <button onClick={saveContent} disabled={saving}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
          {saving ? '...' : t.admin.save}
        </button>
        {saved && <span className="text-sm text-green-600">{t.common.saved}</span>}
      </div>
    </div>
  )
}
