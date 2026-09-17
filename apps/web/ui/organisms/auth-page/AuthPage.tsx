'use client'

import { AuthForm, FormVariant, UserData } from '@/ui'

import { LeftContentBlock } from './components'

interface AuthPageProps {
  variant: FormVariant
  onSubmitForm: (userData: UserData) => void
  isFormLoading: boolean
}

export const AuthPage = ({ variant, onSubmitForm, isFormLoading }: AuthPageProps) => {
  return (
    <section className='flex items-center justify-center gap-[10vw] px-20'>
      <LeftContentBlock variant={variant} />
      <AuthForm isLoading={isFormLoading} onSubmitForm={onSubmitForm} variant={variant} />
    </section>
  )
}
