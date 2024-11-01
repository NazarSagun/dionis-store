'use client'

import { Barlow } from 'next/font/google'

import { GlobalStateProvider } from '@/providers/store/GlobalStateContext'
import { ThemeStateProvider } from '@/providers/theme/ThemeContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import './globals.css'
import { Toaster } from '@/ui'

const queryClient = new QueryClient()

const fontSans = Barlow({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['200', '400', '500', '600'],
  display: 'swap',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body id='body' style={{ margin: '0 !important' }} className={fontSans.className}>
        <QueryClientProvider client={queryClient}>
          <GlobalStateProvider>
            <ThemeStateProvider>
              {children}
              <Toaster />
            </ThemeStateProvider>
          </GlobalStateProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
