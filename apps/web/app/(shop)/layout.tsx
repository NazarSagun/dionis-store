'use client'

import type { ReactNode } from 'react'

import { Footer } from '@/components/footer'
import { MainNavigation } from '@/components/main-navigation'

export default function ShopLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <>
      <MainNavigation />
      <main className='flex-1 bg-[image:var(--light-background-color)]'>{children}</main>
      <Footer />
    </>
  )
}
