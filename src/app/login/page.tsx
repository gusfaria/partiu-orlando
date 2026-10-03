'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n/context'
import { BrandButton } from '@/components/brand/BrandButton'
import { Crest } from '@/components/brand/Crest'
import { CARD_CLASS, FIELD_LABEL_CLASS, INPUT_CLASS } from '@/components/brand/styles'

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
    <div className="fixed inset-0 bg-navy flex items-center justify-center px-4 py-8 overflow-y-auto">
      <div aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_0%,#2a3b56_0%,transparent_60%)]" />
      <div className="relative w-full max-w-sm">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
            className="font-ticket text-xs text-cream/60 hover:text-cream border border-cream/30 rounded px-2 py-1"
          >
            {lang === 'pt' ? 'EN' : 'PT'}
          </button>
        </div>

        <div className="mb-8"><Crest tagline="A FAMILY ADVENTURE · EST. 2026" /></div>

        <div className={CARD_CLASS}>
          <p className="font-ticket text-[10px] uppercase tracking-widest text-navy/70 px-4 py-2 border-b border-dashed border-navy/20">
            {t.login.title}
          </p>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label htmlFor="login-email" className={FIELD_LABEL_CLASS}>{t.login.email}</label>
              <input id="login-email"
                type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="login-password" className={FIELD_LABEL_CLASS}>{t.login.password}</label>
              <input id="login-password"
                type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                className={INPUT_CLASS}
              />
            </div>
            {error && <p className="text-red-700 text-sm font-medium">{error}</p>}
            <BrandButton type="submit" disabled={loading} className="w-full">
              {loading ? '...' : t.login.submit}
            </BrandButton>
          </form>
        </div>
      </div>
    </div>
  )
}
