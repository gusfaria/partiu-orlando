import type { Metadata } from 'next'
import { Fredoka, Space_Mono, Inter } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/lib/i18n/context'
import { AuthProvider } from '@/lib/auth-context'
import { Nav } from '@/components/Nav'

const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-fredoka' })
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-space-mono' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Partiu Orlando 🌴',
  description: 'Aniversário do Gustavo & Philipe em Orlando',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className={`${fredoka.variable} ${spaceMono.variable} ${inter.variable} min-h-screen`}>
        <I18nProvider>
          <AuthProvider>
            <Nav />
            <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
