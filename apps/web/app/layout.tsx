import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import localFont from 'next/font/local'

import { cn } from '@/lib/utils'

import './globals.css'

import { Providers } from './providers'

export const metadata: Metadata = {
  title: { default: 'Dionis Store', template: '%s | Dionis Store' },
  description: 'Dionis Store is a marketplace for digital and physical games, with daily deals and platform filters.',
}

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
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
