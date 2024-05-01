import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { Footer } from '@/components/molecules/footer'
import { Navigation } from '@/components/molecules/header'
import { GlobalStateProvider } from '@/providers/store/GlobalStateContext'

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
    <html lang='en'>
      <body
        id='body'
        className={inter.className}
      >
        <GlobalStateProvider>
          <Navigation />
          <main>{children}</main>
          <Footer />
        </GlobalStateProvider>
      </body>
    </html>
  )
}
