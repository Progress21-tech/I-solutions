'use client'

import { useLanguage } from '@/components/LanguageProvider'
import { supportedLanguages, LanguageCode } from '@/lib/languages'

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { language, setLanguage, copy } = useLanguage()

  return (
    <label className={`inline-flex items-center gap-2 text-sm font-medium text-slate-700 ${className}`}>
      <span className="sr-only">{copy.language}</span>
      <span aria-hidden="true">🌐</span>
      <select
        aria-label={copy.language}
        value={language}
        onChange={(event) => setLanguage(event.target.value as LanguageCode)}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
      >
        {Object.entries(supportedLanguages).map(([code, details]) => (
          <option key={code} value={code}>{details.name}</option>
        ))}
      </select>
    </label>
  )
}
