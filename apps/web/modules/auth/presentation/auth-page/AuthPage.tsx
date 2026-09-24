'use client'

import { AuthForm, FormVariant, UserData } from '../auth-form/AuthForm'

import { LeftContentBlock } from './left-content-block/LeftContentBlock'

interface AuthPageProps {
  variant: FormVariant
  onSubmitForm: (userData: UserData) => void
  isFormLoading: boolean
}

export const AuthPage = ({ variant, onSubmitForm, isFormLoading }: AuthPageProps) => {
  const switchHref = variant === FormVariant.LOGIN ? '/signup' : '/login'

  return (
    <section className='flex items-center justify-center gap-[10vw] px-20'>
      <LeftContentBlock variant={variant} />
      <AuthForm isLoading={isFormLoading} onSubmitForm={onSubmitForm} variant={variant} switchHref={switchHref} />
    </section>
  )
}
