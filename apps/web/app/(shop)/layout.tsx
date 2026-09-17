'use client'

import type { ReactNode } from 'react'

import { Footer, MainNavigation } from '@/components'

export default function ShopLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <>
      <MainNavigation />
      <main className='flex-1 bg-[image:var(--light-background-color)] dark:bg-[image:var(--dark-background-color)]'>
        {children}
      </main>
      <Footer />
    </>
  )
}
