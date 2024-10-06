'use client'

import { useGlobalState } from '@/providers/store/GlobalStateContext'
import { Footer, CartNavigation } from '@/ui/molecules'

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const {
    dispatch,
    state: { cart },
  } = useGlobalState()

  return (
    <>
      <CartNavigation onStepClick={dispatch} activeStep={cart.currentStep} />
      <main>{children}</main>
      <Footer />
    </>
  )
}
