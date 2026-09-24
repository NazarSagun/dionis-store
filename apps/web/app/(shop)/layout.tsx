'use client'

import type { ReactNode } from 'react'

import { Footer } from '@/components/footer/Footer'
import { MainNavigation } from '@/components/main-navigation/MainNavigation'
import { CartDrawer } from '@/modules/cart/presentation/cart-drawer/CartDrawer'

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
      <CartDrawer />
    </>
  )
}
