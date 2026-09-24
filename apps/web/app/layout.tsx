'use client'

import type { ReactNode } from 'react'
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import { Toaster } from '@repo/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { cn } from '@/lib/utils'
import { AuthInitializer } from '@/modules/auth/presentation/auth-initializer/AuthInitializer'

import './globals.css'

const queryClient = new QueryClient()

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '700'],
  display: 'swap',
})

const fontDisplay = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '700'],
  display: 'swap',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang='en'>
      <body
        id='body'
        className={cn(
          'm-0 flex min-h-screen max-w-[100vw] flex-col overflow-x-hidden',
          fontSans.variable,
          fontMono.variable,
          fontDisplay.variable,
          fontSans.className,
        )}
      >
        <QueryClientProvider client={queryClient}>
          <AuthInitializer>
            {/*
              Toaster must mount before children: it subscribes its listener
              in a useEffect, and sibling effects fire in render order. A
              page's own mount-time effect calling toast() (e.g. the login
              page's session-expired message) would otherwise dispatch
              before Toaster is listening, and the toast would silently
              never appear.
            */}
            <Toaster />
            {children}
          </AuthInitializer>
        </QueryClientProvider>
      </body>
    </html>
  )
}
