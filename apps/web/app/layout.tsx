'use client'

import type { ReactNode } from 'react'
import { Press_Start_2P, Space_Mono } from 'next/font/google'
import { Toaster } from '@repo/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { AuthInitializer } from '@/features/auth'
import { cn } from '@/lib/utils'

import './globals.css'

const queryClient = new QueryClient()

const fontMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '700'],
  display: 'swap',
})

const fontDisplay = Press_Start_2P({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400'],
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
          fontMono.variable,
          fontDisplay.variable,
          fontMono.className,
        )}
      >
        <QueryClientProvider client={queryClient}>
          <AuthInitializer>
            {children}
            <Toaster />
          </AuthInitializer>
        </QueryClientProvider>
      </body>
    </html>
  )
}
