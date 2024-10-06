'use client'

import { AuthForm, FormVariant, UserData } from '@/ui'

import { LeftContentBlock } from './components'

import classes from './AuthPage.module.css'

interface AuthPageProps {
  variant: FormVariant
  onSubmitForm: (userData: UserData) => void
  isFormLoading: boolean
}

export const AuthPage = ({ variant, onSubmitForm, isFormLoading }: AuthPageProps) => {
  return (
    <section className={classes.container}>
      <LeftContentBlock variant={variant} />
      <AuthForm isLoading={isFormLoading} onSubmitForm={onSubmitForm} variant={variant} />
    </section>
  )
}
