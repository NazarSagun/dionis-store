'use client'

import type { ReactNode } from 'react'

import { Footer } from '@/components/footer/Footer'
import { useCartStep } from '@/modules/cart/core/facade'
import { CartNavigation } from '@/modules/cart/presentation/cart-navigation/CartNavigation'

export default function ShopLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const currentStep = useCartStep()

  return (
    <>
      <CartNavigation activeStep={currentStep} />
      <main className='flex-1'>{children}</main>
      <Footer />
    </>
  )
}
