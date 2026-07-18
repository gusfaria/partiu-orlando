'use client'
import { createContext, useContext, useState, ReactNode } from 'react'
import pt from './pt.json'
import en from './en.json'

export type Language = 'pt' | 'en'
export type Translations = typeof pt

const translations: Record<Language, Translations> = { pt, en }

type I18nContextType = {
  lang: Language
  t: Translations
  setLang: (lang: Language) => void
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('pt')
  return (
    <I18nContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
