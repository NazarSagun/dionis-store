'use client'

import { Barlow } from 'next/font/google'
import { ThemeProvider } from 'next-themes'

import { GlobalStateProvider } from '@/providers/store/GlobalStateContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import './globals.css'
import { Toaster } from '@/ui'
import { cn } from '@/lib/utils'

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
      <body id='body' className={cn('m-0 flex min-h-screen max-w-[100vw] flex-col overflow-x-hidden', fontSans.className)}>
        <QueryClientProvider client={queryClient}>
          <GlobalStateProvider>
            <ThemeProvider attribute='class' defaultTheme='dark' enableSystem={false}>
              {children}
              <Toaster />
            </ThemeProvider>
          </GlobalStateProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
