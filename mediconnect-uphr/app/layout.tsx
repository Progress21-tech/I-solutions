import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from '@/components/LanguageProvider'

export const metadata: Metadata = {
  title: 'Materna AI — Continuity of Care for Maternal & Chronic Patients',
  description: 'An AI-Powered Continuity-of-Care Platform closing the loop between hospital visits and daily life for mothers and chronic disease patients in Nigeria.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-NG">
      <body className="antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
