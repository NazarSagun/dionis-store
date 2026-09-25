'use client'

import type { ReactNode } from 'react'
import localFont from 'next/font/local'
import { Toaster } from '@repo/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { cn } from '@/lib/utils'
import { AuthInitializer } from '@/modules/auth/presentation/auth-initializer/AuthInitializer'

import './globals.css'

const queryClient = new QueryClient()

// Self-hosted: next/font/google downloads at build time, and next@14.2.13
// fails when Google returns a font URL without a file extension.
const fontSans = localFont({
  src: './fonts/Inter-Variable.woff2',
  variable: '--font-sans',
  weight: '100 900',
  display: 'swap',
})

const fontMono = localFont({
  src: './fonts/JetBrainsMono-Variable.woff2',
  variable: '--font-mono',
  weight: '100 800',
  display: 'swap',
})

const fontDisplay = localFont({
  src: './fonts/SpaceGrotesk-Variable.woff2',
  variable: '--font-display',
  weight: '300 700',
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
