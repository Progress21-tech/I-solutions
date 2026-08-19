import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from '@/components/LanguageProvider'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export const metadata: Metadata = {
  title: "UPHR - Unified Patient Health Record",
  description: "Your health record, anywhere in the world",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-NG">
      <body>
        <LanguageProvider>
          <div className="fixed right-4 top-4 z-50"><LanguageSwitcher /></div>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
