'use client'

import { Button } from '@/ui'
import Image from 'next/image'
import classes from './EmptyState.module.css'
import { useRouter } from 'next/navigation'

export const EmptyState = () => {
  const { push } = useRouter()
  return (
    <div className={classes.emptyState}>
      <Image alt='Shopping cart' width={48} height={48} src='/icons/shopping-cart-green.svg' />
      <h3>Your cart is empty</h3>
      <h5>You didn't add any item in your cart yet. Browse the website to find amazing deals!</h5>
      <Button onClick={() => push('/')}>Discover games</Button>
    </div>
  )
}
