'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n/context'
import { ScallopedBadge } from '@/components/brand/ScallopedBadge'
import { TicketCard } from '@/components/brand/TicketCard'
import { BrandButton } from '@/components/brand/BrandButton'
import { SunburstBg } from '@/components/brand/SunburstBg'

export default function LoginPage() {
  const { t, lang, setLang } = useI18n()
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(t.login.error)
      setLoading(false)
      return
    }
    router.replace('/')
  }

  return (
    <div className="fixed inset-0 bg-navy flex items-center justify-center px-4 overflow-hidden">
      <SunburstBg />
      <div className="relative w-full max-w-sm">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
            className="font-ticket text-xs text-cream/60 hover:text-cream border border-cream/30 rounded px-2 py-1"
          >
            {lang === 'pt' ? 'EN' : 'PT'}
          </button>
        </div>

        <div className="flex justify-center mb-6">
          <ScallopedBadge>
            <p className="font-display text-3xl font-bold text-gold leading-tight">PARTIU<br />ORLANDO</p>
            <p className="font-ticket text-cream text-lg mt-1">40 + 45</p>
            <p className="font-ticket text-cream/60 text-[10px] tracking-widest mt-1">A FAMILY ADVENTURE · EST. 2026</p>
          </ScallopedBadge>
        </div>

        <TicketCard label={t.login.title} accent="gold">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-ticket text-xs uppercase tracking-wide text-navy/60 mb-1">{t.login.email}</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
                className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block font-ticket text-xs uppercase tracking-wide text-navy/60 mb-1">{t.login.password}</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            {error && <p className="text-coral text-sm">{error}</p>}
            <BrandButton type="submit" disabled={loading} className="w-full">
              {loading ? '...' : t.login.submit}
            </BrandButton>
          </form>
        </TicketCard>
      </div>
    </div>
  )
}
