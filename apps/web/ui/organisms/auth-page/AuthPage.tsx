'use client'

import { AuthForm, UserData } from '@/ui'

import { LeftContentBlock } from './components'

import classes from './AuthPage.module.css'

interface AuthPageProps {
  variant: 'login' | 'signup'
  onSubmitForm: (userData: UserData) => void
  isFormLoading: boolean
}

export const AuthPage = ({ variant, onSubmitForm, isFormLoading }: AuthPageProps) => {
  const authTitle = variant === 'login' ? 'Login to' : 'Create'
  const authPrivacyText = variant === 'login' ? 'logging into' : 'creating'
  return (
    <section className={classes.container}>
      <LeftContentBlock variant={variant} />
      <AuthForm
        isLoading={isFormLoading}
        onSubmitForm={onSubmitForm}
        title={`${authTitle} your Dionis account`}
        privacyText={`By ${authPrivacyText} an account, you agree to our terms and privacy policy.`}
        variant={variant}
      />
    </section>
  )
}
