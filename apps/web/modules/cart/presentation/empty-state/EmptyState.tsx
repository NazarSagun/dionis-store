'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui'

export const EmptyState = () => {
  const { push } = useRouter()
  return (
    <div className='flex flex-col items-center justify-center gap-4 rounded-md border-2 border-ink bg-panel-alt px-0 py-8 text-foreground'>
      <Image alt='Shopping cart' width={48} height={48} src='/icons/shopping-cart-green.svg' />
      <h3 className='font-display text-lg text-neon-magenta'>Your cart is empty</h3>
      <h5 className='font-mono text-muted-foreground'>
        You didn't add any item in your cart yet. Browse the website to find amazing deals!
      </h5>
      <Button onClick={() => push('/')}>Discover games</Button>
    </div>
  )
}
