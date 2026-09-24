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
    <section className='flex flex-col items-center justify-center gap-8 px-4 py-12 sm:px-8 lg:flex-row lg:gap-[10vw] lg:px-20 lg:py-0'>
      <div className='hidden lg:block'>
        <LeftContentBlock variant={variant} />
      </div>
      <AuthForm isLoading={isFormLoading} onSubmitForm={onSubmitForm} variant={variant} switchHref={switchHref} />
    </section>
  )
}
