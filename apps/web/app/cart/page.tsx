'use client'

import { Dialog, DialogContent, toast } from '@repo/ui'
import { AuthForm, FormVariant, UserData, useAuthStore } from '@/features/auth'
import { useLogin, useRegister } from '@repo/dionis-api/src/dionis/default/default'
import { ShoppingCart, Payment, useCartStore } from '@/features/cart'
import { useState } from 'react'

const Page = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [formVariant, setFormVariant] = useState(FormVariant.LOGIN)
  const login = useAuthStore((state) => state.login)
  const currentStep = useCartStore((state) => state.currentStep)
  const setStep = useCartStore((state) => state.setStep)

  const { mutate, isPending } = useLogin({
    mutation: {
      onSuccess: (data) => {
        login(data.user?.accessToken as string, data.user?.name as string)
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
        login(data.user?.accessToken as string, data.user?.name as string)
        setStep(2)
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
        {currentStep === 1 && <ShoppingCart />}
        {currentStep === 2 && <Payment />}
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
