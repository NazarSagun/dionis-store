import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { Footer } from '@/components/molecules/footer'
import { Navigation } from '@/components/molecules/header'
import { ThemeProvider } from '@/providers/theme/ThemeProvider'

import './globals.scss'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dionis App',
  description: 'Secret application',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body id="body" className={inter.className}>
        <ThemeProvider>
          <Navigation />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
