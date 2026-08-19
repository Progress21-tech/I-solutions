'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { defaultLanguage, LanguageCode, uiCopy } from '@/lib/languages'

type LanguageContextValue = {
  language: LanguageCode
  setLanguage: (language: LanguageCode) => void
  copy: typeof uiCopy[LanguageCode]
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(defaultLanguage)

  useEffect(() => {
    const saved = window.localStorage.getItem('udpr-language') as LanguageCode | null
    if (saved && saved in uiCopy) setLanguageState(saved)
  }, [])

  const setLanguage = (nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage)
    window.localStorage.setItem('udpr-language', nextLanguage)
    document.documentElement.lang = nextLanguage === 'pcm' ? 'en-NG' : nextLanguage
  }

  return <LanguageContext.Provider value={{ language, setLanguage, copy: uiCopy[language] }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
