'use client'

import type { ReactNode } from 'react'

import { Footer } from '@/components/footer'
import { CartNavigation, useCartStep, useSetCartStep } from '@/modules/cart'

export default function ShopLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const currentStep = useCartStep()
  const setStep = useSetCartStep()

  return (
    <>
      <CartNavigation onStepClick={setStep} activeStep={currentStep} />
      <main className='flex-1'>{children}</main>
      <Footer />
    </>
  )
}
