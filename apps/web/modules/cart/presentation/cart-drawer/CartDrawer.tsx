'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLogin, useRegister } from '@repo/dionis-api/src/dionis/default/default'
import { Dialog, DialogContent, toast } from '@repo/ui'

import { useAuthLogin } from '@/modules/auth/core/facade'
import { AuthForm, FormVariant, UserData } from '@/modules/auth/presentation/auth-form/AuthForm'

import { useCartDrawerOpen, useCloseCartDrawer, useSetCartStep } from '../../core/facade'
import { ShoppingCart } from '../shopping-cart/ShoppingCart'

export const CartDrawer = () => {
  const isOpen = useCartDrawerOpen()
  const closeDrawer = useCloseCartDrawer()
  const setStep = useSetCartStep()
  const login = useAuthLogin()
  const { push } = useRouter()

  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [formVariant, setFormVariant] = useState(FormVariant.LOGIN)

  const { mutate, isPending } = useLogin({
    mutation: {
      onSuccess: (data) => {
        login(data.user?.accessToken as string, data.user?.name as string)
        setIsAuthOpen(false)
      },
      onError: (error) => {
        toast({ variant: 'destructive', title: error.response?.data.message + ' Please try again.' })
      },
    },
  })

  const { mutate: mutateRegister, isPending: isRegisterPending } = useRegister({
    mutation: {
      onSuccess: (data) => {
        login(data.user?.accessToken as string, data.user?.name as string)
        setStep(2)
        setIsAuthOpen(false)
        closeDrawer()
        push('/cart')
      },
      onError: (error) => {
        toast({ variant: 'destructive', title: error.response?.data.message + ' Please try again.' })
      },
    },
  })

  const submitHandler = (formData: UserData) => {
    if (formVariant === FormVariant.LOGIN) {
      mutate({ data: { email: formData.email, password: formData.password } })
    } else {
      mutateRegister({ data: { email: formData.email, password: formData.password, name: formData.name } })
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
      <div data-testid='cart-drawer-backdrop' className='fixed inset-0 z-40 bg-background/80' onClick={closeDrawer} />
      <div
        data-testid='cart-drawer'
        className='fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-lg border-t border-ink bg-background'
      >
        <button
          type='button'
          data-testid='cart-drawer-close'
          aria-label='Close cart'
          onClick={closeDrawer}
          className='absolute right-6 top-6 font-mono text-sm text-muted-foreground hover:text-foreground'
        >
          Close
        </button>
        <ShoppingCart />
      </div>
      <DialogContent className='sm:max-w-[425px]'>
        <AuthForm
          isLoading={isPending || isRegisterPending}
          onSubmitForm={submitHandler}
          variant={FormVariant.LOGIN}
          onVariantChange={setFormVariant}
        />
      </DialogContent>
    </Dialog>
  )
}
