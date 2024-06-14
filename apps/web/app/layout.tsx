'use client'

import { Inter as FontSans } from 'next/font/google'

import { Footer } from '@/components/molecules/footer'
import { Navigation } from '@/components/molecules/header'
import { GlobalStateProvider } from '@/providers/store/GlobalStateContext'
import { ThemeStateProvider } from '@/providers/theme/ThemeContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import './globals.css'
import { cn } from '@/lib/utils'

const queryClient = new QueryClient()

const fontSans = FontSans({ subsets: ['latin'], variable: '--font-sans', weight: ['400', '500', '600'] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang='en'
      suppressHydrationWarning
    >
      <body
        id='body'
        className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}
      >
        <GlobalStateProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeStateProvider>
              <Navigation />
              <main>{children}</main>
              <Footer />
            </ThemeStateProvider>
          </QueryClientProvider>
        </GlobalStateProvider>
      </body>
    </html>
  )
}
