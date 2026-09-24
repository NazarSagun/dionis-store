'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useCartStep } from '@/modules/cart/core/facade'
import { GameActivation } from '@/modules/cart/presentation/game-activation/GameActivation'
import { Payment } from '@/modules/cart/presentation/payment/Payment'

const Page = () => {
  const currentStep = useCartStep()
  const { replace } = useRouter()

  useEffect(() => {
    // Shopping Cart (step 1) is a drawer over whatever page opened it, not a
    // route of its own. Landing here without having gone through it first -
    // a bookmark, a refresh - sends the shopper back to pick up from there.
    if (currentStep === 1) replace('/')
  }, [currentStep, replace])

  if (currentStep === 2) return <Payment />
  if (currentStep === 3) return <GameActivation />
  return null
}

export default Page
