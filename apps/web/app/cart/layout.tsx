'use client'

import type { ReactNode } from 'react'

import { Footer } from '@/components'
import { CartNavigation, useCartStore } from '@/features/cart'

export default function ShopLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const currentStep = useCartStore((state) => state.currentStep)
  const setStep = useCartStore((state) => state.setStep)

  return (
    <>
      <CartNavigation onStepClick={setStep} activeStep={currentStep} />
      <main className='flex-1'>{children}</main>
      <Footer />
    </>
  )
}
