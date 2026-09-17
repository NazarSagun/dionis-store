'use client'

import { useGlobalState } from '@/providers/store/GlobalStateContext'
import { AuthForm, Dialog, DialogContent, FormVariant, toast, UserData } from '@/ui'
import { useLogin, useRegister } from '@repo/dionis-api/src/dionis/default/default'
import { AuthActionType, CartActionType } from '@/providers/store/actions'
import { ShoppingCart } from './components/(step-1)/shopping-cart'
import { useState } from 'react'
import { Payment } from './components'

const Page = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [formVariant, setFormVariant] = useState(FormVariant.LOGIN)
  const {
    dispatch,
    state: { cart },
  } = useGlobalState()

  const { mutate, isPending } = useLogin({
    mutation: {
      onSuccess: (data) => {
        dispatch({ type: AuthActionType.AUTHENTICATE, payload: data.user?.accessToken as string })
        setIsOpen(false)
      },
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: error.response?.data.message + ' Please try again.',
        })
      },
    },
  })

  const { mutate: mutateRegister, isPending: isRegisterPending } = useRegister({
    mutation: {
      onSuccess: (data) => {
        dispatch({ type: AuthActionType.AUTHENTICATE, payload: data.user?.accessToken as string })
        dispatch({ type: CartActionType.SET_STEP, payload: { step: 2 } })
        setIsOpen(false)
      },
      onError: (error) => {
        console.error('Error:', error.response?.data.message)
        toast({
          variant: 'destructive',
          title: error.response?.data.message + ' Please try again.',
        })
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

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        console.log(open)
        setIsOpen(open)
      }}
    >
      <div>
        {cart.currentStep === 1 && <ShoppingCart />}
        {cart.currentStep === 2 && <Payment />}
      </div>
      <DialogContent className='sm:max-w-[425px]'>
        <AuthForm
          isLoading={isPending || isRegisterPending}
          onSubmitForm={submitHandler}
          variant={FormVariant.LOGIN}
          onVariantChange={(variant) => setFormVariant(variant)}
        />
      </DialogContent>
    </Dialog>
  )
}

export default Page
