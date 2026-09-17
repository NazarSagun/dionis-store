'use client'

import { Button } from '@/ui'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export const EmptyState = () => {
  const { push } = useRouter()
  return (
    <div className='flex flex-col items-center justify-center gap-4 rounded-[15px] bg-[#2b2b2b86] px-0 py-8 text-foreground'>
      <Image alt='Shopping cart' width={48} height={48} src='/icons/shopping-cart-green.svg' />
      <h3 className='text-2xl font-bold'>Your cart is empty</h3>
      <h5 className='text-[#a9a9a9cb]'>You didn't add any item in your cart yet. Browse the website to find amazing deals!</h5>
      <Button onClick={() => push('/')}>Discover games</Button>
    </div>
  )
}
