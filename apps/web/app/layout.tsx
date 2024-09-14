'use client'

import { Poppins } from 'next/font/google'

import { GlobalStateProvider } from '@/providers/store/GlobalStateContext'
import { ThemeStateProvider } from '@/providers/theme/ThemeContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import './globals.css'
import { cn } from '@/lib/utils'
import { Footer, Navigation } from '@/ui/molecules'
import { Toaster } from '@/ui/molecules/toast/toaster'

const queryClient = new QueryClient()

const fontSans = Poppins({
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
    <html
      lang='en'
      suppressHydrationWarning
    >
      <body
        id='body'
        style={{ margin: '0 !important' }}
        className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}
      >
        <QueryClientProvider client={queryClient}>
          <GlobalStateProvider>
            <ThemeStateProvider>
              <Navigation isCart={true} />
              <main>{children}</main>
              <Footer />
              <Toaster />
            </ThemeStateProvider>
          </GlobalStateProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
