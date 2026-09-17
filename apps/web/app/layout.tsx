'use client'

import type { ReactNode } from 'react'
import { Barlow } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@repo/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { AuthInitializer } from '@/features/auth'
import { cn } from '@/lib/utils'

import './globals.css'

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
  children: ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        id='body'
        className={cn('m-0 flex min-h-screen max-w-[100vw] flex-col overflow-x-hidden', fontSans.className)}
      >
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute='class' defaultTheme='dark' enableSystem={false}>
            <AuthInitializer>
              {children}
              <Toaster />
            </AuthInitializer>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
